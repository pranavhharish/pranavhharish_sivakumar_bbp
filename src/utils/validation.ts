/**
 * Validation utilities for file and form inputs
 */

export interface ValidationError {
  isValid: boolean;
  errors: string[];
}

export function validateFile(file: Express.Multer.File): ValidationError {
  const errors: string[] = [];

  if (!file) {
    errors.push('Please select a file to upload');
    return { isValid: false, errors };
  }

  if (file.mimetype !== 'text/csv' && !file.originalname.endsWith('.csv')) {
    errors.push('Only CSV files are accepted');
  }

  const MAX_FILE_SIZE = 10 * 1024 * 1024;
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

export function parseFilename(filename: string): { clientName: string; runId: string } | null {
  const match = filename.match(/^(Client[A-Z]+)_(R\d{6})_Online_Report_BostonBioprocess\.csv$/);

  if (!match) {
    return null;
  }

  return {
    clientName: match[1],
    runId: match[2],
  };
}

export function validateCSVStructure(rows: any[]): ValidationError {
  const errors: string[] = [];

  if (!rows || rows.length === 0) {
    errors.push('CSV file is empty');
    return { isValid: false, errors };
  }

  const firstRow = rows[0];
  const requiredColumns = ['Time Stamp', 'Parameter', 'Process value', 'Units'];

  requiredColumns.forEach((col) => {
    if (!(col in firstRow)) {
      errors.push(`Missing required column: ${col}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}
