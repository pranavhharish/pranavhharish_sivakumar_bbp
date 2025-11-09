/**
 * Database service for interacting with Supabase
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';
import {
  FermentationRun,
  TimeSeriesDataPoint,
  DatabaseOperationResult,
} from '../types/index.js';

/**
 * Database service class
 */
class DatabaseService {
  private client: SupabaseClient;

  constructor() {
    this.client = createClient(config.supabaseUrl, config.supabaseKey);
  }

  /**
   * Check if a run ID already exists
   * @param runId - Run ID to check
   * @returns True if run exists
   */
  async runExists(runId: string): Promise<boolean> {
    try {
      const { data, error } = await this.client
        .from('run_client')
        .select('run_id')
        .eq('run_id', runId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Not found is not an error
        return false;
      }

      if (error) {
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('[DB] Error checking if run exists:', error);
      throw error;
    }
  }

  /**
   * Insert a new run and its time-series data
   * @param run - Run metadata
   * @param timeSeriesData - Array of time-series data points
   * @returns Operation result
   */
  async insertRun(
    run: FermentationRun,
    timeSeriesData: TimeSeriesDataPoint[]
  ): Promise<DatabaseOperationResult> {
    try {
      // Check if run already exists
      const exists = await this.runExists(run.run_id);
      if (exists) {
        return {
          success: false,
          error: `Run ID ${run.run_id} already exists`,
        };
      }

      // Insert run metadata
      const { error: runError } = await this.client.from('run_client').insert([
        {
          run_id: run.run_id,
          client_name: run.client_name,
        },
      ]);

      if (runError) {
        console.error('[DB] Error inserting run:', runError);
        return {
          success: false,
          error: `Failed to insert run: ${runError.message}`,
        };
      }

      // Insert time-series data in batches
      const batchSize = 1000;
      let inserted = 0;

      for (let i = 0; i < timeSeriesData.length; i += batchSize) {
        const batch = timeSeriesData.slice(i, i + batchSize);
        const formattedBatch = batch.map((point) => ({
          run_id: run.run_id,
          time_stamp: point.time_stamp,
          parameter: point.parameter,
          process_value: point.process_value,
          units: point.units,
        }));

        const { error: dataError, count } = await this.client
          .from('run_time_series_data')
          .insert(formattedBatch);

        if (dataError) {
          // Rollback: delete the run we just inserted
          await this.client.from('run_client').delete().eq('run_id', run.run_id);

          console.error('[DB] Error inserting time-series data:', dataError);
          return {
            success: false,
            error: `Failed to insert time-series data: ${dataError.message}`,
          };
        }

        inserted += count || 0;
      }

      return {
        success: true,
        rowsAffected: inserted,
      };
    } catch (error) {
      console.error('[DB] Error in insertRun:', error);
      throw error;
    }
  }

  /**
   * Get a specific run with all its data
   * @param runId - Run ID
   * @returns Run with time-series data
   */
  async getRunWithData(runId: string): Promise<{
    run: FermentationRun | null;
    data: TimeSeriesDataPoint[];
    error?: string;
  }> {
    try {
      // Get run metadata
      const { data: runData, error: runError } = await this.client
        .from('run_client')
        .select('*')
        .eq('run_id', runId)
        .single();

      if (runError) {
        if (runError.code === 'PGRST116') {
          return {
            run: null,
            data: [],
            error: `Run ID ${runId} not found`,
          };
        }
        throw runError;
      }

      // Get time-series data
      const { data: timeSeriesData, error: dataError } = await this.client
        .from('run_time_series_data')
        .select('time_stamp, parameter, process_value, units')
        .eq('run_id', runId)
        .order('time_stamp', { ascending: true });

      if (dataError) {
        throw dataError;
      }

      return {
        run: runData as FermentationRun,
        data: (timeSeriesData || []) as TimeSeriesDataPoint[],
      };
    } catch (error) {
      console.error('[DB] Error getting run with data:', error);
      throw error;
    }
  }

  /**
   * List all runs with pagination
   * @param limit - Number of runs to return
   * @param offset - Number of runs to skip
   * @returns Array of runs and total count
   */
  async listRuns(
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    runs: FermentationRun[];
    total: number;
    error?: string;
  }> {
    try {
      // Get total count
      const { count, error: countError } = await this.client
        .from('run_client')
        .select('*', { count: 'exact' })
        .limit(1);

      if (countError) {
        throw countError;
      }

      // Get paginated runs
      const { data: runs, error: runsError } = await this.client
        .from('run_client')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (runsError) {
        throw runsError;
      }

      return {
        runs: (runs || []) as FermentationRun[],
        total: count || 0,
      };
    } catch (error) {
      console.error('[DB] Error listing runs:', error);
      throw error;
    }
  }

  /**
   * Delete a run and all its data
   * @param runId - Run ID to delete
   * @returns Operation result
   */
  async deleteRun(runId: string): Promise<DatabaseOperationResult> {
    try {
      // Supabase CASCADE delete will handle time-series data
      const { error } = await this.client
        .from('run_client')
        .delete()
        .eq('run_id', runId);

      if (error) {
        return {
          success: false,
          error: `Failed to delete run: ${error.message}`,
        };
      }

      return { success: true };
    } catch (error) {
      console.error('[DB] Error deleting run:', error);
      throw error;
    }
  }

  /**
   * Get run count
   * @returns Total number of runs
   */
  async getRunCount(): Promise<number> {
    try {
      const { count, error } = await this.client
        .from('run_client')
        .select('*', { count: 'exact' })
        .limit(1);

      if (error) {
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('[DB] Error getting run count:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const db = new DatabaseService();
