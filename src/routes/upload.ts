/**
 * Upload endpoint handler
 * POST /api/upload
 */

import { Request, Response, Router } from 'express';
import multer from 'multer';
import { parseAndTransformCSV, validateCSVStructure as validateCSVStructureRaw } from '../utils/csv-parser.js';
import {
  validateFile,
  validatePumpSelections,
  parseFilename,
} from '../utils/validation.js';
import { insertRunData } from '../utils/db.js';
import { logger } from '../utils/logger.js';

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
    // Step 1: Validate file exists and format is correct
    const fileValidation = validateFile(req.file);
    if (!fileValidation.isValid) {
      logger.warn('File validation failed', { errors: fileValidation.errors });
      return res.status(400).json({
        success: false,
        error: fileValidation.errors[0],
        code: 'INVALID_FILE',
      });
    }

    // Step 2: Validate pump selections
    const { pump1, pump2 } = req.body;
    const pumpValidation = validatePumpSelections(pump1, pump2);
    if (!pumpValidation.isValid) {
      logger.warn('Pump validation failed', { errors: pumpValidation.errors });
      return res.status(400).json({
        success: false,
        error: pumpValidation.errors[0],
        code: 'MISSING_PARAMETERS',
      });
    }

    // Step 3: Parse filename to extract metadata
    const filenameData = parseFilename(req.file!.originalname);
    if (!filenameData) {
      logger.warn('Invalid filename format', { filename: req.file!.originalname });
      return res.status(400).json({
        success: false,
        error: 'Filename must match format: ClientXXX_RXXXXXX_Online_Report_BostonBioprocess.csv',
        code: 'INVALID_FILENAME',
      });
    }

    const { clientName, runId } = filenameData;
    logger.debug('Upload started', { clientName, runId, fileSize: req.file!.size });

    // Step 4: Get CSV content
    const csvContent = req.file!.buffer.toString('utf-8');

    // Step 5: Validate CSV structure (raw format validation)
    const csvValidation = validateCSVStructureRaw(csvContent);
    if (!csvValidation.isValid) {
      logger.warn('CSV structure validation failed', { errors: csvValidation.errors });
      return res.status(400).json({
        success: false,
        error: csvValidation.errors[0],
        code: 'INVALID_CSV_FORMAT',
      });
    }

    // Step 6: Parse and transform CSV data
    let records;
    try {
      records = parseAndTransformCSV(csvContent, pump1, pump2);
    } catch (parseError: any) {
      logger.warn('CSV parsing error', { error: parseError.message });
      return res.status(400).json({
        success: false,
        error: parseError.message || 'Failed to parse CSV file',
        code: 'INVALID_CSV_FORMAT',
      });
    }

    if (records.length === 0) {
      logger.warn('No valid data rows found in CSV');
      return res.status(400).json({
        success: false,
        error: 'No valid data rows found in CSV',
        code: 'INVALID_CSV_FORMAT',
      });
    }

    logger.info('CSV parsed successfully', { recordCount: records.length });

    // Step 7: Insert into database
    const dbResult = await insertRunData(runId, clientName, records);

    if (!dbResult.success) {
      logger.warn('Database insert failed', { error: dbResult.error, message: dbResult.message });
      const statusCode = dbResult.error === 'DUPLICATE_RUN_ID' ? 409 : 500;
      return res.status(statusCode).json({
        success: false,
        error: dbResult.message,
        code: dbResult.error,
      });
    }

    logger.info('Upload successful', { runId, clientName, recordsInserted: dbResult.recordsInserted });

    return res.status(200).json({
      success: true,
      runId,
      clientName,
      recordsInserted: dbResult.recordsInserted,
      message: dbResult.message,
    });
  } catch (error: any) {
    logger.error('Upload error', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An unexpected error occurred during upload',
      code: 'DATABASE_ERROR',
    });
  }
});

export default router;
