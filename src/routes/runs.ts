/**
 * Runs endpoints handler
 * GET /api/runs - List all runs
 * GET /api/runs/:runId - Get specific run data
 */

import express, { Request, Response, Router } from 'express';
import { getRunData, listRuns } from '../utils/db.js';
import { transformToPlotlyFormat } from '../utils/csv-parser.js';

const router = Router();

/**
 * GET /api/runs
 * List all runs with pagination
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await listRuns(limit, offset);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        code: 'DATABASE_ERROR',
      });
    }

    return res.status(200).json({
      success: true,
      runs: result.runs,
      total: result.total,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('List runs error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      code: 'DATABASE_ERROR',
    });
  }
});

/**
 * GET /api/runs/:runId
 * Get time-series data for a specific run
 */
router.get('/:runId', async (req: Request, res: Response) => {
  try {
    const { runId } = req.params;

    // Validate run ID format
    if (!runId || !/^R\d{6}$/.test(runId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid run ID format',
        code: 'INVALID_RUN_ID',
      });
    }

    const result = await getRunData(runId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: 'Run not found',
        code: result.error || 'RUN_NOT_FOUND',
      });
    }

    return res.status(200).json({
      success: true,
      runId: result.data?.runId,
      clientName: result.data?.clientName,
      createdAt: result.data?.createdAt,
      data: result.data?.data,
      chartData: transformToPlotlyFormat(result.data?.data || []),
    });
  } catch (error: any) {
    console.error('Get run error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      code: 'DATABASE_ERROR',
    });
  }
});

export default router;
