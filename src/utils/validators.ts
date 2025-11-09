/**
 * Validation utilities for file uploads and form data
 */

import { ValidationResult, ErrorCode, PumpSelection } from '../types/index.js';
import { parseFilename } from './csv-parser.js';

/**
 * Validate uploaded file
 * @param file - File object from request
 * @param maxFileSize - Maximum allowed file size in bytes
 * @param allowedTypes - Allowed MIME types
 * @returns Validation result
 */
export function validateFile(
  file: Express.Multer.File | undefined,
  maxFileSize: number,
  allowedTypes: string[]
): {
  isValid: boolean;
  error?: string;
  code?: ErrorCode;
} {
  // Check if file exists
  if (!file) {
    return {
      isValid: false,
      error: 'Please select a file to upload',
      code: ErrorCode.INVALID_REQUEST,
    };
  }

  // Check file type
  if (!allowedTypes.includes(file.mimetype)) {
    return {
      isValid: false,
      error: 'Only CSV files are accepted',
      code: ErrorCode.INVALID_FILE_TYPE,
    };
  }

  // Check file size
  if (file.size > maxFileSize) {
    const maxSizeMB = (maxFileSize / 1024 / 1024).toFixed(2);
    return {
      isValid: false,
      error: `File size must be less than ${maxSizeMB}MB`,
      code: ErrorCode.FILE_TOO_LARGE,
    };
  }

  // Check filename format
  try {
    parseFilename(file.originalname);
  } catch {
    return {
      isValid: false,
      error:
        'Filename must match format: ClientXXX_RXXXXXX_Online_Report_BostonBioprocess.csv',
      code: ErrorCode.INVALID_FILENAME,
    };
  }

  return { isValid: true };
}

/**
 * Validate pump parameter selections
 * @param pump1 - Pump1 selection
 * @param pump2 - Pump2 selection
 * @returns Validation result
 */
export function validatePumpSelections(
  pump1?: string,
  pump2?: string
): {
  isValid: boolean;
  error?: string;
  code?: ErrorCode;
} {
  const validSelections: PumpSelection[] = ['Glucose', 'Glycerol', 'Base', 'Acid'];

  if (!pump1 || !validSelections.includes(pump1 as PumpSelection)) {
    return {
      isValid: false,
      error: 'Please select a valid Pump1 type (Glucose or Glycerol)',
      code: ErrorCode.MISSING_PARAMETERS,
    };
  }

  if (!pump2 || !validSelections.includes(pump2 as PumpSelection)) {
    return {
      isValid: false,
      error: 'Please select a valid Pump2 type (Base or Acid)',
      code: ErrorCode.MISSING_PARAMETERS,
    };
  }

  return { isValid: true };
}

/**
 * Validate run ID format
 * @param runId - Run ID to validate
 * @returns Validation result
 */
export function validateRunIdFormat(runId: string): boolean {
  const pattern = /^R\d{6}$/;
  return pattern.test(runId);
}

/**
 * Validate client name format
 * @param clientName - Client name to validate
 * @returns Validation result
 */
export function validateClientNameFormat(clientName: string): boolean {
  const pattern = /^Client[A-Z]+$/;
  return pattern.test(clientName);
}

/**
 * Sanitize string to prevent SQL injection
 * @param input - String to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[';\"\\]/g, '')
    .substring(0, 255); // Limit length
}

/**
 * Validate pagination parameters
 * @param limit - Items per page
 * @param offset - Starting position
 * @returns Validation result
 */
export function validatePaginationParams(
  limit?: unknown,
  offset?: unknown
): {
  isValid: boolean;
  limit: number;
  offset: number;
  error?: string;
} {
  let parsedLimit = 50;
  let parsedOffset = 0;

  if (limit !== undefined) {
    const parsedLimitNum = parseInt(String(limit), 10);
    if (isNaN(parsedLimitNum) || parsedLimitNum < 1 || parsedLimitNum > 500) {
      return {
        isValid: false,
        limit: 50,
        offset: 0,
        error: 'Limit must be between 1 and 500',
      };
    }
    parsedLimit = parsedLimitNum;
  }

  if (offset !== undefined) {
    const parsedOffsetNum = parseInt(String(offset), 10);
    if (isNaN(parsedOffsetNum) || parsedOffsetNum < 0) {
      return {
        isValid: false,
        limit: parsedLimit,
        offset: 0,
        error: 'Offset must be 0 or greater',
      };
    }
    parsedOffset = parsedOffsetNum;
  }

  return {
    isValid: true,
    limit: parsedLimit,
    offset: parsedOffset,
  };
}

/**
 * Validate numeric range
 * @param value - Value to validate
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @returns True if valid
 */
export function validateNumericRange(
  value: number,
  min: number = -Infinity,
  max: number = Infinity
): boolean {
  return !isNaN(value) && value >= min && value <= max;
}

/**
 * Validate email format (for future use)
 * @param email - Email to validate
 * @returns True if valid
 */
export function validateEmail(email: string): boolean {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}
