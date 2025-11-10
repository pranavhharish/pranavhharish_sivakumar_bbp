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
 * Validate CSV structure and data types
 */
export function validateCSVStructure(data: any[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data || data.length === 0) {
    errors.push('CSV file is empty');
    return { isValid: false, errors };
  }

  if (data.length < 1) {
    errors.push('CSV must contain at least one data row');
    return { isValid: false, errors };
  }

  // Check first row has required columns
  const firstRow = data[0];
  const requiredColumns = ['Time Stamp', 'Parameter', 'Process value', 'Units'];
  const hasAllColumns = requiredColumns.every(col => col in firstRow);

  if (!hasAllColumns) {
    errors.push(
      `Missing required columns. Expected: ${requiredColumns.join(', ')}`
    );
    return { isValid: false, errors };
  }

  // Validate data types in each row
  data.forEach((row, index) => {
    if (!row['Time Stamp'] || isNaN(parseFloat(row['Time Stamp']))) {
      errors.push(`Row ${index + 1}: Invalid Time Stamp value`);
    }
    if (!row['Process value'] || isNaN(parseFloat(row['Process value']))) {
      errors.push(`Row ${index + 1}: Invalid Process value`);
    }
    if (!row['Parameter'] || typeof row['Parameter'] !== 'string') {
      errors.push(`Row ${index + 1}: Invalid Parameter value`);
    }
    if (!row['Units'] || typeof row['Units'] !== 'string') {
      errors.push(`Row ${index + 1}: Invalid Units value`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Transform CSV data by replacing pump parameters with user selections
 */
export function transformCSVData(
  csvData: any[],
  pump1Selection: string,
  pump2Selection: string
): TimeSeriesData[] {
  return csvData.map(row => ({
    time_stamp: parseFloat(row['Time Stamp']),
    parameter: replacePumpNames(row['Parameter'], pump1Selection, pump2Selection),
    process_value: parseFloat(row['Process value']),
    units: row['Units'],
  }));
}

/**
 * Replace Pump1 and Pump2 with actual parameter names
 */
function replacePumpNames(
  parameter: string,
  pump1Selection: string,
  pump2Selection: string
): string {
  if (parameter === 'Pump1') {
    return pump1Selection;
  }
  if (parameter === 'Pump2') {
    return pump2Selection;
  }
  return parameter;
}

/**
 * Parse CSV file and return structured data
 */
export function parseCSVFile(
  file: File,
  pump1Selection: string,
  pump2Selection: string
): Promise<ParsedCSVData> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      transformHeader: (h) => h.trim(),
      complete: (results) => {
        try {
          // Extract client name and run ID from filename
          const parsed = parseFilename(file.name);
          if (!parsed) {
            reject(new Error('Invalid filename format'));
            return;
          }

          // Validate CSV structure
          const validation = validateCSVStructure(results.data);
          if (!validation.isValid) {
            reject(new Error(`CSV validation failed: ${validation.errors.join(', ')}`));
            return;
          }

          // Transform CSV data
          const transformedData = transformCSVData(
            results.data,
            pump1Selection,
            pump2Selection
          );

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
