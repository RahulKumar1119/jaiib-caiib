/**
 * Logging utilities for JAIIB-CAIIB Exam Prep Portal
 * Provides structured logging with CloudWatch integration
 */

import { ENV_VARS } from './constants';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  requestId?: string;
  userId?: string;
  tenantId?: string;
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  duration?: number;
}

/**
 * Logger class for structured logging
 */
export class Logger {
  private context: LogContext = {};
  private logLevel: LogLevel;

  constructor(context?: LogContext) {
    this.context = context || {};
    this.logLevel = (ENV_VARS.LOG_LEVEL as LogLevel) || 'info';
  }

  /**
   * Sets the logging context
   */
  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Adds a value to the logging context
   */
  addContext(key: string, value: unknown): void {
    this.context[key] = value;
  }

  /**
   * Logs a debug message
   */
  debug(message: string, data?: unknown): void {
    this.log('debug', message, data);
  }

  /**
   * Logs an info message
   */
  info(message: string, data?: unknown): void {
    this.log('info', message, data);
  }

  /**
   * Logs a warning message
   */
  warn(message: string, data?: unknown): void {
    this.log('warn', message, data);
  }

  /**
   * Logs an error message
   */
  error(message: string, error?: Error | unknown, data?: unknown): void {
    const errorObj = this.formatError(error);
    const errorData: any = { error: errorObj };
    if (data) {
      Object.assign(errorData, data);
    }
    this.log('error', message, errorData);
  }

  /**
   * Logs a message with performance metrics
   */
  logPerformance(message: string, durationMs: number, data?: unknown): void {
    const entry: any = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      context: this.context,
      duration: durationMs,
    };

    if (data && typeof data === 'object') {
      Object.assign(entry, data);
    }

    console.log(JSON.stringify(entry));
  }

  /**
   * Creates a child logger with additional context
   */
  child(context: LogContext): Logger {
    const childLogger = new Logger({ ...this.context, ...context });
    return childLogger;
  }

  /**
   * Private method to log a message
   */
  private log(level: LogLevel, message: string, data?: unknown): void {
    // Check if this log level should be logged
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: any = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.context,
    };

    if (data) {
      if (data instanceof Error) {
        entry.error = this.formatError(data);
      } else if (typeof data === 'object') {
        Object.assign(entry, data);
      }
    }

    console.log(JSON.stringify(entry));
  }

  /**
   * Determines if a log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);

    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * Formats an error for logging
   */
  private formatError(error: unknown): LogEntry['error'] {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    if (typeof error === 'string') {
      return {
        name: 'Error',
        message: error,
      };
    }

    return {
      name: 'Unknown',
      message: String(error),
    };
  }
}

/**
 * Global logger instance
 */
let globalLogger: Logger | null = null;

/**
 * Gets or creates the global logger instance
 */
export function getLogger(context?: LogContext): Logger {
  if (!globalLogger) {
    globalLogger = new Logger(context);
  } else if (context) {
    globalLogger.setContext(context);
  }

  return globalLogger;
}

/**
 * Creates a new logger instance
 */
export function createLogger(context?: LogContext): Logger {
  return new Logger(context);
}

/**
 * Middleware for logging Lambda events
 */
export function logLambdaEvent(event: any, context: any): Logger {
  const logger = createLogger({
    requestId: context.awsRequestId,
    functionName: context.functionName,
    memoryLimitInMB: context.memoryLimitInMB,
  });

  logger.debug('Lambda event received', {
    event: JSON.stringify(event),
  });

  return logger;
}

/**
 * Middleware for logging Lambda response
 */
export function logLambdaResponse(
  logger: Logger,
  statusCode: number,
  duration: number,
  response?: any
): void {
  logger.logPerformance('Lambda response', duration, {
    statusCode,
    response: response ? JSON.stringify(response) : undefined,
  });
}

/**
 * Middleware for logging Lambda errors
 */
export function logLambdaError(logger: Logger, error: Error, duration: number): void {
  logger.error('Lambda error', error, {
    duration,
  });
}
