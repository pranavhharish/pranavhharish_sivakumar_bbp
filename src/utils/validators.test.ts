/**
 * Tests for validation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  validateFile,
  validatePumpSelections,
  validateRunIdFormat,
  validateClientNameFormat,
  validatePaginationParams,
  validateNumericRange,
} from './validators';

describe('validateFile', () => {
  const maxFileSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['text/csv'];

  it('should accept valid CSV file', () => {
    const file = {
      mimetype: 'text/csv',
      size: 1024 * 100, // 100KB
      originalname: 'ClientABC_R001001_Online_Report_BostonBioprocess.csv',
    } as Express.Multer.File;

    const result = validateFile(file, maxFileSize, allowedTypes);

    expect(result.isValid).toBe(true);
  });

  it('should reject non-CSV files', () => {
    const file = {
      mimetype: 'application/json',
      size: 1024 * 100,
      originalname: 'ClientABC_R001001_Online_Report_BostonBioprocess.json',
    } as Express.Multer.File;

    const result = validateFile(file, maxFileSize, allowedTypes);

    expect(result.isValid).toBe(false);
    expect(result.code).toBe('INVALID_FILE_TYPE');
  });

  it('should reject files exceeding size limit', () => {
    const file = {
      mimetype: 'text/csv',
      size: 11 * 1024 * 1024, // 11MB
      originalname: 'ClientABC_R001001_Online_Report_BostonBioprocess.csv',
    } as Express.Multer.File;

    const result = validateFile(file, maxFileSize, allowedTypes);

    expect(result.isValid).toBe(false);
    expect(result.code).toBe('FILE_TOO_LARGE');
  });

  it('should reject files with invalid filename format', () => {
    const file = {
      mimetype: 'text/csv',
      size: 1024 * 100,
      originalname: 'invalid_filename.csv',
    } as Express.Multer.File;

    const result = validateFile(file, maxFileSize, allowedTypes);

    expect(result.isValid).toBe(false);
    expect(result.code).toBe('INVALID_FILENAME');
  });

  it('should reject undefined file', () => {
    const result = validateFile(undefined, maxFileSize, allowedTypes);

    expect(result.isValid).toBe(false);
    expect(result.code).toBe('INVALID_REQUEST');
  });
});

describe('validatePumpSelections', () => {
  it('should accept valid selections', () => {
    const result = validatePumpSelections('Glucose', 'Base');
    expect(result.isValid).toBe(true);
  });

  it('should accept alternative selections', () => {
    const result = validatePumpSelections('Glycerol', 'Acid');
    expect(result.isValid).toBe(true);
  });

  it('should reject invalid Pump1 selection', () => {
    const result = validatePumpSelections('Invalid', 'Base');
    expect(result.isValid).toBe(false);
  });

  it('should reject invalid Pump2 selection', () => {
    const result = validatePumpSelections('Glucose', 'Invalid');
    expect(result.isValid).toBe(false);
  });

  it('should reject undefined selections', () => {
    const result = validatePumpSelections(undefined, 'Base');
    expect(result.isValid).toBe(false);
  });
});

describe('validateRunIdFormat', () => {
  it('should accept valid run IDs', () => {
    expect(validateRunIdFormat('R001001')).toBe(true);
    expect(validateRunIdFormat('R999999')).toBe(true);
    expect(validateRunIdFormat('R000000')).toBe(true);
  });

  it('should reject invalid run IDs', () => {
    expect(validateRunIdFormat('R00100')).toBe(false); // Too short
    expect(validateRunIdFormat('R0010001')).toBe(false); // Too long
    expect(validateRunIdFormat('001001')).toBe(false); // Missing R
    expect(validateRunIdFormat('r001001')).toBe(false); // Lowercase R
    expect(validateRunIdFormat('RABC001')).toBe(false); // Contains letters
  });
});

describe('validateClientNameFormat', () => {
  it('should accept valid client names', () => {
    expect(validateClientNameFormat('ClientABC')).toBe(true);
    expect(validateClientNameFormat('ClientDEF')).toBe(true);
    expect(validateClientNameFormat('ClientXYZ')).toBe(true);
  });

  it('should reject invalid client names', () => {
    expect(validateClientNameFormat('ABC')).toBe(false); // Missing Client prefix
    expect(validateClientNameFormat('Clientabc')).toBe(false); // Lowercase letters
    expect(validateClientNameFormat('Client123')).toBe(false); // Contains numbers
    expect(validateClientNameFormat('Client')).toBe(false); // No letters after Client
  });
});

describe('validatePaginationParams', () => {
  it('should accept valid pagination params', () => {
    const result = validatePaginationParams(10, 0);
    expect(result.isValid).toBe(true);
    expect(result.limit).toBe(10);
    expect(result.offset).toBe(0);
  });

  it('should use defaults when not provided', () => {
    const result = validatePaginationParams(undefined, undefined);
    expect(result.isValid).toBe(true);
    expect(result.limit).toBe(50); // Default
    expect(result.offset).toBe(0); // Default
  });

  it('should reject invalid limit', () => {
    const result = validatePaginationParams(0, 0);
    expect(result.isValid).toBe(false);
  });

  it('should reject limit exceeding max', () => {
    const result = validatePaginationParams(501, 0);
    expect(result.isValid).toBe(false);
  });

  it('should reject negative offset', () => {
    const result = validatePaginationParams(10, -1);
    expect(result.isValid).toBe(false);
  });
});

describe('validateNumericRange', () => {
  it('should accept values within range', () => {
    expect(validateNumericRange(5, 0, 10)).toBe(true);
    expect(validateNumericRange(0, 0, 10)).toBe(true);
    expect(validateNumericRange(10, 0, 10)).toBe(true);
  });

  it('should reject values outside range', () => {
    expect(validateNumericRange(-1, 0, 10)).toBe(false);
    expect(validateNumericRange(11, 0, 10)).toBe(false);
  });

  it('should handle unbounded ranges', () => {
    expect(validateNumericRange(999999, -Infinity, Infinity)).toBe(true);
    expect(validateNumericRange(-999999, -Infinity, Infinity)).toBe(true);
  });

  it('should reject NaN', () => {
    expect(validateNumericRange(NaN, 0, 10)).toBe(false);
  });
});
