/**
 * Runs endpoints handler
 * GET /api/runs - List all runs
 * GET /api/runs/:runId - Get specific run data
 */

import { Request, Response, Router } from 'express';
import { getRunData, listRuns } from '../utils/db.js';
import { transformToPlotlyFormat } from '../utils/csv-parser.js';
import { logger } from '../utils/logger.js';
import { validateRunIdFormat } from '../utils/validators.js';

const router = Router();

/**
 * GET /api/runs
 * List all runs with pagination
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Parse and validate pagination parameters
    let limit = 50;
    let offset = 0;

    if (req.query.limit) {
      const parsedLimit = parseInt(req.query.limit as string, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        limit = Math.min(parsedLimit, 100); // Max 100
      }
    }

    if (req.query.offset) {
      const parsedOffset = parseInt(req.query.offset as string, 10);
      if (!isNaN(parsedOffset) && parsedOffset >= 0) {
        offset = parsedOffset;
      }
    }

    logger.debug('Listing runs', { limit, offset });
    const result = await listRuns(limit, offset);

    if (!result.success) {
      logger.warn('Failed to list runs', { error: result.error });
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to fetch runs',
        code: 'DATABASE_ERROR',
      });
    }

    return res.status(200).json({
      success: true,
      runs: result.runs || [],
      total: result.total || 0,
      limit,
      offset,
    });
  } catch (error: any) {
    logger.error('List runs error', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An unexpected error occurred',
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
    if (!runId || !validateRunIdFormat(runId)) {
      logger.warn('Invalid run ID format', { runId });
      return res.status(400).json({
        success: false,
        error: 'Invalid run ID format. Expected format: RXXXXXX (e.g., R001001)',
        code: 'INVALID_RUN_ID',
      });
    }

    logger.debug('Fetching run data', { runId });
    const result = await getRunData(runId);

    if (!result.success) {
      logger.warn('Run not found', { runId });
      return res.status(404).json({
        success: false,
        error: `Run ID ${runId} not found`,
        code: result.error || 'RUN_NOT_FOUND',
      });
    }

    // Transform data to Plotly format for frontend visualization
    const timeSeriesData = result.data?.data || [];
    const chartData = transformToPlotlyFormat(timeSeriesData);

    logger.info('Run data fetched successfully', {
      runId,
      recordCount: timeSeriesData.length,
    });

    return res.status(200).json({
      success: true,
      run_id: result.data?.run_id || result.data?.runId,
      client_name: result.data?.client_name || result.data?.clientName,
      created_at: result.data?.created_at || result.data?.createdAt,
      data: timeSeriesData,
    });
  } catch (error: any) {
    logger.error('Get run error', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An unexpected error occurred',
      code: 'DATABASE_ERROR',
    });
  }
});

export default router;
