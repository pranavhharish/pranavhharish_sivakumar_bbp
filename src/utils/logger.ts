/**
 * Logging utility for application
 */

import { config } from '../config/index.js';

/**
 * Log levels
 */
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * Get numeric log level from config
 */
function getCurrentLogLevel(): LogLevel {
  const levelMap: Record<string, LogLevel> = {
    debug: LogLevel.DEBUG,
    info: LogLevel.INFO,
    warn: LogLevel.WARN,
    error: LogLevel.ERROR,
  };

  return levelMap[config.logLevel] || LogLevel.INFO;
}

/**
 * Format log message with timestamp
 */
function formatLogMessage(level: string, message: string, data?: unknown): string {
  const timestamp = new Date().toISOString();
  let formatted = `[${timestamp}] [${level}] ${message}`;

  if (data !== undefined) {
    formatted += ` ${JSON.stringify(data)}`;
  }

  return formatted;
}

/**
 * Logger object with level-specific methods
 */
export const logger = {
  debug(message: string, data?: unknown): void {
    if (getCurrentLogLevel() <= LogLevel.DEBUG) {
      console.log(formatLogMessage('DEBUG', message, data));
    }
  },

  info(message: string, data?: unknown): void {
    if (getCurrentLogLevel() <= LogLevel.INFO) {
      console.log(formatLogMessage('INFO', message, data));
    }
  },

  warn(message: string, data?: unknown): void {
    if (getCurrentLogLevel() <= LogLevel.WARN) {
      console.warn(formatLogMessage('WARN', message, data));
    }
  },

  error(message: string, error?: Error | unknown, data?: unknown): void {
    if (getCurrentLogLevel() <= LogLevel.ERROR) {
      let fullMessage = formatLogMessage('ERROR', message);

      if (error instanceof Error) {
        fullMessage += ` | ${error.message}`;
        if (error.stack) {
          fullMessage += ` | Stack: ${error.stack}`;
        }
      } else if (error) {
        fullMessage += ` | ${JSON.stringify(error)}`;
      }

      if (data) {
        fullMessage += ` | Data: ${JSON.stringify(data)}`;
      }

      console.error(fullMessage);
    }
  },
};
