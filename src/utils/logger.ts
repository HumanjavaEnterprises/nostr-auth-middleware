/**
 * @fileoverview Logging utilities for the Nostr Auth Middleware
 * Provides a centralized logging system with file and console output
 * @module logger
 */

import winston from 'winston';

/**
 * Custom log format that includes timestamp and context
 * @param {{ level: string, message: string, timestamp: string, context: string }} info - Log information
 * @returns {string} Formatted log message
 * @example
 * // Output: "2024-02-02T12:30:00Z [AuthService] info: User authenticated"
 */
const logFormat = winston.format.printf(({ level, message, timestamp, context }) => {
  return `${timestamp} [${context}] ${level}: ${message}`;
});

/**
 * Creates a new Winston logger instance with the specified context
 * @param {string} context - The context/category for the logger (e.g., 'AuthService', 'APIKeyUtils')
 * @returns {winston.Logger} Configured Winston logger instance
 * @description
 * Creates a logger with the following features:
 * - Console output with colors for development
 * - File output for errors (error.log)
 * - File output for all logs (combined.log)
 * - Timestamps and context labels
 * - Configurable log level via LOG_LEVEL env var
 * @example
 * const logger = createLogger('AuthService');
 * logger.info('Starting authentication process');
 * logger.error('Authentication failed', { error: 'Invalid token' });
 */
export const createLogger = (context: string) => {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.colorize(),
      logFormat
    ),
    defaultMeta: { context },
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          logFormat
        )
      }),
      new winston.transports.File({ 
        filename: 'error.log', 
        level: 'error',
        format: winston.format.combine(
          winston.format.uncolorize(),
          logFormat
        )
      }),
      new winston.transports.File({ 
        filename: 'combined.log',
        format: winston.format.combine(
          winston.format.uncolorize(),
          logFormat
        )
      })
    ]
  });
};
