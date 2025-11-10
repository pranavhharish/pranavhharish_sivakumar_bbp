import Papa from 'papaparse';
import { TimeSeriesData, ParsedCSVData } from '@/types';

/**
 * Extract client name and run ID from filename
 * Expected format: ClientXXX_RXXXXXX_Online_Report_BostonBioprocess.csv
 * Client name can contain letters, numbers, and underscores
 */
export function parseFilename(filename: string): { clientName: string; runId: string } | null {
  // Allow client names with letters, numbers, and underscores; run ID must be R + 6 digits
  const regex = /^(Client[A-Za-z0-9_]*)_([Rr]\d{6})_Online_Report_BostonBioprocess\.csv$/;
  const match = filename.match(regex);

  if (!match) {
    return null;
  }

  return {
    clientName: match[1],
    runId: match[2].toUpperCase(), // Normalize run ID to uppercase
  };
}


/**
 * Parse CSV file and return structured data
 * Uses manual header detection to avoid PapaParse duplicate header warnings
 */
export function parseCSVFile(
  file: File,
  pump1Selection: string,
  pump2Selection: string
): Promise<ParsedCSVData> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: false,
      dynamicTyping: false,
      complete: (results) => {
        try {
          // Extract client name and run ID from filename
          const parsed = parseFilename(file.name);
          if (!parsed) {
            reject(new Error('Invalid filename format'));
            return;
          }

          const rows = results.data as any[];
          
          // Header is at row 3 (index 2) in the CSV format
          if (rows.length < 4) {
            reject(new Error('CSV file must contain header and at least one data row'));
            return;
          }

          const headerRow = rows[2];
          if (!headerRow) {
            reject(new Error('CSV file missing header row'));
            return;
          }

          // Find column indexes
          const columnIndexes = {
            timeStamp: headerRow.indexOf('Time Stamp'),
            parameter: headerRow.indexOf('Parameter'),
            processValue: headerRow.indexOf('Process value'),
            units: headerRow.indexOf('Units'),
          };

          if (
            columnIndexes.timeStamp === -1 ||
            columnIndexes.parameter === -1 ||
            columnIndexes.processValue === -1 ||
            columnIndexes.units === -1
          ) {
            reject(new Error('CSV must contain columns: Time Stamp, Parameter, Process value, Units'));
            return;
          }

          // Parse data rows (starting from row 4, index 3)
          const transformedData: TimeSeriesData[] = [];
          for (let i = 3; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;

            const timeStamp = parseFloat(row[columnIndexes.timeStamp]);
            let parameter = String(row[columnIndexes.parameter]).trim();
            const processValue = parseFloat(row[columnIndexes.processValue]);
            const units = String(row[columnIndexes.units]).trim();

            if (isNaN(timeStamp) || isNaN(processValue) || !parameter || !units) {
              continue;
            }

            // Replace pump names
            if (parameter === 'Pump1') parameter = pump1Selection;
            else if (parameter === 'Pump2') parameter = pump2Selection;

            transformedData.push({
              time_stamp: timeStamp,
              parameter,
              process_value: processValue,
              units,
            });
          }

          if (transformedData.length === 0) {
            reject(new Error('No valid data rows found in CSV'));
            return;
          }

          resolve({
            clientName: parsed.clientName,
            runId: parsed.runId,
            data: transformedData,
          });
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      },
    });
  });
}

/**
 * Validate file before parsing
 */
export function validateFile(file: File): {
  isValid: boolean;
  error?: string;
} {
  // Check file type
  if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
    return { isValid: false, error: 'Only CSV files are accepted' };
  }

  // Check file size (10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 10MB' };
  }

  // Check filename format
  if (!parseFilename(file.name)) {
    return {
      isValid: false,
      error:
        'Filename must match format: ClientXXX_RXXXXXX_Online_Report_BostonBioprocess.csv',
    };
  }

  return { isValid: true };
}
