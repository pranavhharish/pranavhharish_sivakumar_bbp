/**
 * Time series data point from the database
 */
export interface TimeSeriesData {
  time_stamp: number;
  parameter: string;
  process_value: number;
  units: string;
}

/**
 * Run metadata
 */
export interface RunData {
  run_id: string;
  client_name: string;
  created_at: string;
}

/**
 * Run with time series data
 */
export interface RunWithData extends RunData {
  data: TimeSeriesData[];
}

/**
 * API Response types
 */
export interface ApiResponse<T> {
  success: boolean;
  error?: string;
  code?: string;
  data?: T;
}

export interface UploadResponse {
  success: boolean;
  runId: string;
  clientName: string;
  recordsInserted: number;
  message?: string;
  error?: string;
  code?: string;
}

export interface RunsListResponse {
  success: boolean;
  runs: RunData[];
  total: number;
  limit?: number;
  offset?: number;
}

/**
 * Parsed CSV data
 */
export interface ParsedCSVData {
  clientName: string;
  runId: string;
  data: TimeSeriesData[];
}

/**
 * Toast notification types
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}
