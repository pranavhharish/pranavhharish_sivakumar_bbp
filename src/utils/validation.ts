/**
 * Validation utilities for file and form inputs
 */

export interface ValidationError {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate uploaded file
 * @param file - File object from request
 * @returns Validation result with errors array
 */
export function validateFile(file: Express.Multer.File | undefined): ValidationError {
  const errors: string[] = [];

  if (!file) {
    errors.push('Please select a file to upload');
    return { isValid: false, errors };
  }

  if (file.mimetype !== 'text/csv' && !file.originalname.endsWith('.csv')) {
    errors.push('Only CSV files are accepted');
  }

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_FILE_SIZE) {
    errors.push('File size must be less than 10MB');
  }

  const filenameRegex = /^Client[A-Z]+_R\d{6}_Online_Report_BostonBioprocess\.csv$/;
  if (!filenameRegex.test(file.originalname)) {
    errors.push('Filename must match format: ClientXXX_RXXXXXX_Online_Report_BostonBioprocess.csv');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate pump parameter selections
 * @param pump1 - Selected pump1 type
 * @param pump2 - Selected pump2 type
 * @returns Validation result
 */
export function validatePumpSelections(pump1: string, pump2: string): ValidationError {
  const errors: string[] = [];
  const validPump1Options = ['Glucose', 'Glycerol'];
  const validPump2Options = ['Base', 'Acid'];

  if (!pump1 || !validPump1Options.includes(pump1)) {
    errors.push('Please select Pump1 type (Glucose or Glycerol)');
  }

  if (!pump2 || !validPump2Options.includes(pump2)) {
    errors.push('Please select Pump2 type (Base or Acid)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Parse filename to extract client name and run ID
 * @param filename - CSV filename to parse
 * @returns Parsed filename data or null if invalid format
 */
export function parseFilename(filename: string): { clientName: string; runId: string } | null {
  const match = filename.match(/^(Client[A-Z]+)_(R\d{6})_Online_Report_BostonBioprocess\.csv$/i);

  if (!match) {
    return null;
  }

  return {
    clientName: match[1],
    runId: match[2].toUpperCase(),
  };
}

/**
 * Validate CSV structure by checking required columns
 * CSV is expected to be parsed with Papa.parse using { header: true }
 * @param rows - Array of parsed CSV rows (objects with column headers as keys)
 * @returns Validation result
 */
export function validateCSVStructure(rows: any[]): ValidationError {
  const errors: string[] = [];

  if (!rows || rows.length === 0) {
    errors.push('CSV file is empty or contains no data rows');
    return { isValid: false, errors };
  }

  // Check first row has required columns
  const firstRow = rows[0];
  const requiredColumns = ['Time Stamp', 'Parameter', 'Process value', 'Units'];

  requiredColumns.forEach((col) => {
    if (!(col in firstRow)) {
      errors.push(`Missing required column: "${col}"`);
    }
  });

  // Validate that we have at least some valid data
  if (errors.length === 0) {
    // Check if first few rows have valid numeric values for time_stamp and process_value
    const sampleSize = Math.min(3, rows.length);
    for (let i = 0; i < sampleSize; i++) {
      const row = rows[i];

      if (row['Time Stamp'] && isNaN(parseFloat(row['Time Stamp']))) {
        errors.push(`Row ${i + 1}: "Time Stamp" must be numeric`);
        break;
      }

      if (row['Process value'] && isNaN(parseFloat(row['Process value']))) {
        errors.push(`Row ${i + 1}: "Process value" must be numeric`);
        break;
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
