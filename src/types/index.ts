/**
 * Core type definitions for the Fermentation Data Platform backend
 */

/**
 * Represents a time-series data point from a fermentation run
 */
export interface TimeSeriesDataPoint {
  time_stamp: number;
  parameter: string;
  process_value: number;
  units: string;
}

/**
 * Represents raw CSV row before transformation
 */
export interface RawCSVRow {
  'Time Stamp': string;
  'Parameter': string;
  'Process value': string;
  'Units': string;
}

/**
 * Represents a fermentation run with metadata
 */
export interface FermentationRun {
  run_id: string;
  client_name: string;
  created_at?: string;
}

/**
 * Represents a fermentation run with its time-series data
 */
export interface FermentationRunWithData extends FermentationRun {
  data: TimeSeriesDataPoint[];
}

/**
 * Parsed filename information
 */
export interface ParsedFilename {
  clientName: string;
  runId: string;
}

/**
 * File validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * API Response wrapper for success responses
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data?: T;
  message?: string;
}

/**
 * API Response wrapper for error responses
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  code: string;
  details?: Record<string, unknown>;
}

/**
 * API Response type (can be success or error)
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Upload endpoint response
 */
export interface UploadResponse {
  success: boolean;
  runId?: string;
  clientName?: string;
  recordsInserted?: number;
  message?: string;
  error?: string;
  code?: string;
}

/**
 * Pump selection types
 */
export type PumpSelection = 'Glucose' | 'Glycerol' | 'Base' | 'Acid';

/**
 * Parameter mapping configuration
 */
export interface ParameterMapping {
  pump1: PumpSelection;
  pump2: PumpSelection;
}

/**
 * CSV parsing options
 */
export interface CSVParsingOptions {
  skipRows?: number;
  headerRow?: number;
}

/**
 * Database operation result
 */
export interface DatabaseOperationResult {
  success: boolean;
  rowsAffected?: number;
  error?: string;
}

/**
 * Configuration for application
 */
export interface AppConfig {
  supabaseUrl: string;
  supabaseKey: string;
  supabaseServiceKey?: string;
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  host: string;
  maxFileSize: number;
  allowedFileTypes: string[];
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Error codes for API responses
 */
export enum ErrorCode {
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  INVALID_FILENAME = 'INVALID_FILENAME',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  DUPLICATE_RUN_ID = 'DUPLICATE_RUN_ID',
  INVALID_CSV_FORMAT = 'INVALID_CSV_FORMAT',
  MISSING_PARAMETERS = 'MISSING_PARAMETERS',
  DATABASE_ERROR = 'DATABASE_ERROR',
  RUN_NOT_FOUND = 'RUN_NOT_FOUND',
  INVALID_REQUEST = 'INVALID_REQUEST',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}
