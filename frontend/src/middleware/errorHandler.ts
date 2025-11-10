/**
 * Error handling middleware
 */

import { Request, Response, NextFunction } from 'express';
import { isApiError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { ApiErrorResponse } from '../types/index.js';

/**
 * Express error handling middleware
 * Should be used as the last middleware in the application
 */
export function errorHandler(
  err: Error | unknown,
  _req: Request,
  res: Response<ApiErrorResponse>,
  _next: NextFunction
): void {
  logger.error('Unhandled error:', err);

  if (isApiError(err)) {
    // Handle API errors
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
      ...(err.details && { details: err.details }),
    });
    return;
  }

  if (err instanceof Error) {
    // Handle regular errors
    const statusCode = 500;
    res.status(statusCode).json({
      success: false,
      error: err.message || 'Internal Server Error',
      code: 'INTERNAL_ERROR',
    });
    return;
  }

  // Handle unknown errors
  res.status(500).json({
    success: false,
    error: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
  });
}

/**
 * Async route handler wrapper to catch Promise rejections
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
