/**
 * Application configuration
 */

import dotenv from 'dotenv';
import { AppConfig } from '../types/index.js';

// Load environment variables
dotenv.config();

/**
 * Validate required environment variables
 */
function validateEnvironment(): void {
  const required = ['SUPABASE_URL', 'SUPABASE_KEY'];

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
}

/**
 * Parse environment variables into config object
 */
function parseConfig(): AppConfig {
  validateEnvironment();

  return {
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseKey: process.env.SUPABASE_KEY || '',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
    nodeEnv: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || 'localhost',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB default
    allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'text/csv').split(','),
    logLevel: (process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
  };
}

// Create singleton config instance
export const config: AppConfig = parseConfig();

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return config.nodeEnv === 'development';
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return config.nodeEnv === 'production';
}

/**
 * Check if running in test mode
 */
export function isTest(): boolean {
  return config.nodeEnv === 'test';
}

// Log configuration on startup (without sensitive keys)
if (isDevelopment()) {
  console.log('[Config] Application Configuration Loaded:', {
    nodeEnv: config.nodeEnv,
    port: config.port,
    host: config.host,
    maxFileSize: `${(config.maxFileSize / 1024 / 1024).toFixed(2)}MB`,
    allowedFileTypes: config.allowedFileTypes,
    logLevel: config.logLevel,
  });
}
