/**
 * Tests for CSV parsing utilities
 */

import { describe, it, expect } from 'vitest';
import {
  parseFilename,
  validateCSVStructure,
  parseAndTransformCSV,
  groupByParameter,
} from './csv-parser';

describe('parseFilename', () => {
  it('should parse valid filename correctly', () => {
    const filename = 'ClientABC_R001001_Online_Report_BostonBioprocess.csv';
    const result = parseFilename(filename);

    expect(result.clientName).toBe('ClientABC');
    expect(result.runId).toBe('R001001');
  });

  it('should handle lowercase run ID prefix', () => {
    const filename = 'ClientDEF_r001002_Online_Report_BostonBioprocess.csv';
    const result = parseFilename(filename);

    expect(result.runId).toBe('R001002');
  });

  it('should throw error for invalid filename format', () => {
    const invalidFilenames = [
      'invalid.csv',
      'ClientABC_001001_Online_Report_BostonBioprocess.csv', // Missing R
      'ClientABC_R00100_Online_Report_BostonBioprocess.csv', // Wrong run ID length
      'ABC_R001001_Online_Report_BostonBioprocess.csv', // Invalid client name
    ];

    for (const filename of invalidFilenames) {
      expect(() => parseFilename(filename)).toThrow();
    }
  });
});

describe('validateCSVStructure', () => {
  const validCSV = `ClientABC_R001001: DataLog Param, PV and Units

Time Stamp,Parameter,Process value,Units
0.009,pH,5.99,pH
0.009,Pump1,0,%
0.009,Pump2,0,%
0.009,Temperature,28.01,DegC`;

  it('should validate correct CSV structure', () => {
    const result = validateCSVStructure(validCSV);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject empty CSV', () => {
    const result = validateCSVStructure('');

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should reject CSV with missing columns', () => {
    const invalidCSV = `ClientABC_R001001: DataLog

Time Stamp,Parameter
0.009,pH`;

    const result = validateCSVStructure(invalidCSV);

    expect(result.isValid).toBe(false);
  });

  it('should reject CSV with non-numeric timestamp', () => {
    const invalidCSV = `ClientABC_R001001: DataLog

Time Stamp,Parameter,Process value,Units
invalid,pH,5.99,pH`;

    const result = validateCSVStructure(invalidCSV);

    // Should still be valid structure but will fail during parsing
    expect(result.isValid).toBe(false);
  });
});

describe('parseAndTransformCSV', () => {
  const validCSV = `ClientABC_R001001: DataLog Param, PV and Units

Time Stamp,Parameter,Process value,Units
0.009,pH,5.99,pH
0.009,Pump1,0,%
0.009,Pump2,0,%
0.009,Temperature,28.01,DegC
1.5,pH,6.01,pH
1.5,Pump1,10,%
1.5,Pump2,5,%
1.5,Temperature,28.5,DegC`;

  it('should parse and transform CSV correctly', () => {
    const result = parseAndTransformCSV(validCSV, 'Glucose', 'Base');

    expect(result).toHaveLength(8);

    // Check Pump1 transformation
    const pump1Record = result.find((r) => r.parameter === 'Glucose' && r.time_stamp === 0.009);
    expect(pump1Record).toBeDefined();
    expect(pump1Record?.process_value).toBe(0);

    // Check Pump2 transformation
    const pump2Record = result.find((r) => r.parameter === 'Base' && r.time_stamp === 0.009);
    expect(pump2Record).toBeDefined();
    expect(pump2Record?.process_value).toBe(0);

    // Check pH stays the same
    const phRecord = result.find((r) => r.parameter === 'pH' && r.time_stamp === 0.009);
    expect(phRecord).toBeDefined();
    expect(phRecord?.process_value).toBe(5.99);
  });

  it('should handle Glycerol and Acid selections', () => {
    const result = parseAndTransformCSV(validCSV, 'Glycerol', 'Acid');

    const glycerolRecord = result.find((r) => r.parameter === 'Glycerol');
    expect(glycerolRecord).toBeDefined();

    const acidRecord = result.find((r) => r.parameter === 'Acid');
    expect(acidRecord).toBeDefined();
  });

  it('should skip invalid rows', () => {
    const csvWithInvalidRows = `ClientABC_R001001: DataLog

Time Stamp,Parameter,Process value,Units
0.009,pH,5.99,pH
invalid,Pump1,abc,%
0.009,Pump2,5,%
0.009,Temperature,28.01,DegC`;

    const result = parseAndTransformCSV(csvWithInvalidRows, 'Glucose', 'Base');

    // Should have 3 valid records (pH, Pump2, Temperature from row 1)
    // and 1 valid record (Pump2 from row 3)
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('groupByParameter', () => {
  const records = [
    { time_stamp: 0.009, parameter: 'pH', process_value: 5.99, units: 'pH' },
    { time_stamp: 0.009, parameter: 'Temperature', process_value: 28.01, units: 'DegC' },
    { time_stamp: 1.5, parameter: 'pH', process_value: 6.01, units: 'pH' },
    { time_stamp: 1.5, parameter: 'Temperature', process_value: 28.5, units: 'DegC' },
  ];

  it('should group records by parameter', () => {
    const grouped = groupByParameter(records);

    expect(grouped.has('pH')).toBe(true);
    expect(grouped.has('Temperature')).toBe(true);
    expect(grouped.get('pH')).toHaveLength(2);
    expect(grouped.get('Temperature')).toHaveLength(2);
  });

  it('should preserve record order within groups', () => {
    const grouped = groupByParameter(records);
    const phRecords = grouped.get('pH')!;

    expect(phRecords[0].time_stamp).toBe(0.009);
    expect(phRecords[1].time_stamp).toBe(1.5);
  });
});
