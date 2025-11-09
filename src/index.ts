/**
 * Main entry point for the backend API
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { config, isDevelopment } from './config/index.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import uploadRoutes from './routes/upload.js';
import runsRoutes from './routes/runs.js';

const app = express();

/**
 * Middleware Setup
 */

// CORS configuration
app.use(
  cors({
    origin: isDevelopment() ? '*' : process.env.FRONTEND_URL || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

/**
 * Request logging middleware
 */
app.use((req: Request, res: Response, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info(`${req.method} ${req.path}`, {
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    });
  });

  next();
});

/**
 * Health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * API Routes
 */
app.use('/api/upload', uploadRoutes);
app.use('/api/runs', runsRoutes);

/**
 * Root endpoint
 */
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    name: 'Fermentation Data Platform - Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      upload: 'POST /api/upload',
      listRuns: 'GET /api/runs',
      getRun: 'GET /api/runs/:runId',
    },
  });
});

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
    code: 'NOT_FOUND',
  });
});

/**
 * Error handling middleware (must be last)
 */
app.use(errorHandler);

/**
 * Start server
 */
const PORT = config.port;
const HOST = config.host;

const server = app.listen(PORT, HOST, () => {
  logger.info('Server started successfully', {
    host: HOST,
    port: PORT,
    env: config.nodeEnv,
    url: `http://${HOST}:${PORT}`,
  });
});

/**
 * Graceful shutdown
 */
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

/**
 * Unhandled error handlers
 */
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

export default app;
