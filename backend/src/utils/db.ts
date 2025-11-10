/**
 * Database operations for fermentation data
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';
import { TimeSeriesRecord } from './csv-parser.js';

// Initialize Supabase client
const supabase: SupabaseClient = createClient(config.supabaseUrl, config.supabaseKey);

export interface RunMetadata {
  run_id: string;
  client_name: string;
  created_at: string;
}

/**
 * Insert run metadata and time-series data into database
 * Uses transaction for atomicity
 */
export async function insertRunData(
  runId: string,
  clientName: string,
  records: TimeSeriesRecord[]
): Promise<{ success: boolean; message: string; recordsInserted?: number; error?: string }> {
  try {
    // Check if run already exists
    const { data: existingRun } = await supabase
      .from('run_client')
      .select('run_id')
      .eq('run_id', runId)
      .single();

    if (existingRun) {
      return {
        success: false,
        message: 'Run ID already exists',
        error: 'DUPLICATE_RUN_ID',
      };
    }

    // Insert run metadata
    const { error: runError } = await supabase.from('run_client').insert({
      run_id: runId,
      client_name: clientName,
    });

    if (runError) {
      throw new Error(`Failed to insert run: ${runError.message}`);
    }

    // Insert time-series data in batches
    const batchSize = 1000;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const { error: dataError } = await supabase
        .from('run_time_series_data')
        .insert(
          batch.map((r) => ({
            run_id: runId,
            time_stamp: r.time_stamp,
            parameter: r.parameter,
            process_value: r.process_value,
            units: r.units,
          }))
        );

      if (dataError) {
        // Rollback: delete run metadata
        await supabase.from('run_client').delete().eq('run_id', runId);
        throw new Error(`Failed to insert time-series data: ${dataError.message}`);
      }
    }

    return {
      success: true,
      message: 'File uploaded and processed successfully',
      recordsInserted: records.length,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
      error: 'DATABASE_ERROR',
    };
  }
}

/**
 * Fetch time-series data for a specific run
 */
export async function getRunData(
  runId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // Get run metadata
    const { data: run, error: runError } = await supabase
      .from('run_client')
      .select('*')
      .eq('run_id', runId)
      .single();

    if (runError || !run) {
      return {
        success: false,
        error: 'RUN_NOT_FOUND',
      };
    }

    // Get time-series data (fetch all records by setting high limit)
    // Supabase default limit is 1000, so we need to explicitly set a higher limit
    const { data: timeSeriesData, error: dataError } = await supabase
      .from('run_time_series_data')
      .select('*')
      .eq('run_id', runId)
      .order('time_stamp', { ascending: true })
      .limit(1000000); // Set very high limit to get all data

    if (dataError) {
      throw new Error(`Failed to fetch data: ${dataError.message}`);
    }

    return {
      success: true,
      data: {
        runId: run.run_id,
        clientName: run.client_name,
        createdAt: run.created_at,
        data: timeSeriesData || [],
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Fetch list of all runs with pagination
 */
export async function listRuns(
  limit: number = 50,
  offset: number = 0
): Promise<{ success: boolean; runs?: RunMetadata[]; total?: number; error?: string }> {
  try {
    // Get total count
    const { count, error: countError } = await supabase
      .from('run_client')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw new Error(`Failed to count runs: ${countError.message}`);
    }

    // Get paginated data
    const { data: runs, error: dataError } = await supabase
      .from('run_client')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (dataError) {
      throw new Error(`Failed to fetch runs: ${dataError.message}`);
    }

    return {
      success: true,
      runs: runs || [],
      total: count || 0,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}
