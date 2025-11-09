/**
 * Upload endpoint handler
 * POST /api/upload
 */

import express, { Request, Response, Router } from 'express';
import multer from 'multer';
import { parseAndTransformCSV } from '../utils/csv-parser.js';
import {
  validateFile,
  validatePumpSelections,
  parseFilename,
  validateCSVStructure,
} from '../utils/validation.js';
import { insertRunData } from '../utils/db.js';
import Papa from 'papaparse';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

/**
 * POST /api/upload
 * Upload CSV file with pump selections
 */
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    // Validate file
    const fileValidation = validateFile(req.file!);
    if (!fileValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: fileValidation.errors[0],
        code: 'INVALID_FILE',
      });
    }

    // Validate pump selections
    const { pump1, pump2 } = req.body;
    const pumpValidation = validatePumpSelections(pump1, pump2);
    if (!pumpValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: pumpValidation.errors[0],
        code: 'MISSING_PARAMETERS',
      });
    }

    // Parse filename to extract metadata
    const filenameData = parseFilename(req.file!.originalname);
    if (!filenameData) {
      return res.status(400).json({
        success: false,
        error: 'Invalid filename format',
        code: 'INVALID_FILENAME',
      });
    }

    const { clientName, runId } = filenameData;

    // Parse CSV
    const csvContent = req.file!.buffer.toString('utf-8');
    const csvData = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
    });

    // Validate CSV structure
    const csvValidation = validateCSVStructure(csvData.data as any[]);
    if (!csvValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: csvValidation.errors[0],
        code: 'INVALID_CSV_FORMAT',
      });
    }

    // Transform CSV data
    const records = parseAndTransformCSV(csvContent, pump1, pump2);

    if (records.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid data rows found in CSV',
        code: 'INVALID_CSV_FORMAT',
      });
    }

    // Insert into database
    const dbResult = await insertRunData(runId, clientName, records);

    if (!dbResult.success) {
      const statusCode = dbResult.error === 'DUPLICATE_RUN_ID' ? 409 : 500;
      return res.status(statusCode).json({
        success: false,
        error: dbResult.message,
        code: dbResult.error,
      });
    }

    return res.status(200).json({
      success: true,
      runId,
      clientName,
      recordsInserted: dbResult.recordsInserted,
      message: dbResult.message,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      code: 'DATABASE_ERROR',
    });
  }
});

export default router;
