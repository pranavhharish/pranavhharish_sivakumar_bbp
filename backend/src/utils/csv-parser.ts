/**
 * CSV parsing utilities for fermentation data
 */

import Papa from 'papaparse';

export interface TimeSeriesRecord {
  time_stamp: number;
  parameter: string;
  process_value: number;
  units: string;
}

/**
 * Parsed filename information
 */
export interface ParsedFilename {
  clientName: string;
  runId: string;
}

/**
 * CSV validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Parse CSV file content and transform parameter names
 */
export function parseAndTransformCSV(
  csvContent: string,
  pump1Selection: 'Glucose' | 'Glycerol',
  pump2Selection: 'Base' | 'Acid'
): TimeSeriesRecord[] {
  const results = Papa.parse(csvContent, {
    header: false,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  if (!results.data || results.data.length === 0) {
    return [];
  }

  const rows = results.data as any[];
  const headerRow = rows[2];

  if (!headerRow) {
    return [];
  }

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
    throw new Error('CSV missing required columns');
  }

  const records: TimeSeriesRecord[] = [];

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

    if (parameter === 'Pump1') parameter = pump1Selection;
    else if (parameter === 'Pump2') parameter = pump2Selection;

    records.push({
      time_stamp: timeStamp,
      parameter,
      process_value: processValue,
      units,
    });
  }

  return records;
}

export function groupByParameter(records: TimeSeriesRecord[]): Map<string, TimeSeriesRecord[]> {
  const grouped = new Map<string, TimeSeriesRecord[]>();
  records.forEach((record) => {
    if (!grouped.has(record.parameter)) {
      grouped.set(record.parameter, []);
    }
    grouped.get(record.parameter)!.push(record);
  });
  return grouped;
}

export function transformToPlotlyFormat(records: TimeSeriesRecord[]): any[] {
  const grouped = groupByParameter(records);
  const traces: any[] = [];

  const colorMap: Record<string, string> = {
    'pH': '#3B82F6',
    'Temperature': '#EF4444',
    'Glucose': '#F97316',
    'Glycerol': '#F97316',
    'Base': '#10B981',
    'Acid': '#10B981',
  };

  const yaxisMap: Record<string, string> = {
    'pH': 'y',
    'Temperature': 'y2',
    'Glucose': 'y',
    'Glycerol': 'y',
    'Base': 'y',
    'Acid': 'y',
  };

  grouped.forEach((records, parameter) => {
    const sortedRecords = records.sort((a, b) => a.time_stamp - b.time_stamp);
    const trace = {
      x: sortedRecords.map((r) => r.time_stamp),
      y: sortedRecords.map((r) => r.process_value),
      name: parameter,
      type: 'scatter',
      mode: 'lines+markers',
      line: { color: colorMap[parameter] || '#666' },
      hovertemplate: `<b>${parameter}</b><br>Time: %{x}<br>Value: %{y}<extra></extra>`,
      yaxis: yaxisMap[parameter] || 'y',
    };
    traces.push(trace);
  });

  return traces;
}

/**
 * Parse filename to extract client name and run ID
 * @param filename - CSV filename
 * @returns Parsed client name and run ID
 * @throws Error if filename format is invalid
 */
export function parseFilename(filename: string): ParsedFilename {
  // Pattern: ClientXXX_RXXXXXX_Online_Report_BostonBioprocess.csv
  const pattern = /^(Client[A-Z]+)_([Rr]\d{6})_Online_Report_BostonBioprocess\.csv$/;

  const match = filename.match(pattern);

  if (!match) {
    throw new Error(
      'Invalid filename format. Expected: ClientXXX_RXXXXXX_Online_Report_BostonBioprocess.csv'
    );
  }

  return {
    clientName: match[1],
    runId: match[2].toUpperCase(),
  };
}

/**
 * Validate CSV structure and content
 * @param csvContent - Raw CSV file content
 * @returns Validation result with errors if any
 */
export function validateCSVStructure(csvContent: string): ValidationResult {
  const errors: string[] = [];

  if (!csvContent || csvContent.trim().length === 0) {
    return {
      isValid: false,
      errors: ['CSV file is empty'],
    };
  }

  try {
    const results = Papa.parse(csvContent, {
      header: false,
      skipEmptyLines: false,
    });

    if (results.errors && results.errors.length > 0) {
      return {
        isValid: false,
        errors: results.errors.map((err: any) => err.message),
      };
    }

    if (!results.data || results.data.length === 0) {
      errors.push('CSV file contains no data');
      return { isValid: false, errors };
    }

    const rows = results.data as any[];

    // Check if we have at least header row (row 2) and one data row (row 3+)
    if (rows.length < 4) {
      errors.push('CSV file must contain header and at least one data row');
      return { isValid: false, errors };
    }

    const headerRow = rows[2];

    if (!headerRow) {
      errors.push('CSV file missing header row');
      return { isValid: false, errors };
    }

    // Validate that we have expected columns
    const requiredColumns = ['Time Stamp', 'Parameter', 'Process value', 'Units'];
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
      errors.push(`CSV must contain columns: ${requiredColumns.join(', ')}`);
      return { isValid: false, errors };
    }

    // Validate data types in sample rows
    for (let i = 3; i < Math.min(8, rows.length); i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const timeStampVal = row[columnIndexes.timeStamp];
      const processValueVal = row[columnIndexes.processValue];

      if (timeStampVal && isNaN(parseFloat(timeStampVal))) {
        errors.push(`Row ${i + 1}: Time Stamp must be numeric`);
      }

      if (processValueVal && isNaN(parseFloat(processValueVal))) {
        errors.push(`Row ${i + 1}: Process value must be numeric`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  } catch (error) {
    errors.push(`CSV parsing error: ${error instanceof Error ? error.message : String(error)}`);
    return { isValid: false, errors };
  }
}
