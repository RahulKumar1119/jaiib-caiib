/**
 * Error handling utilities for JAIIB-CAIIB Exam Prep Portal
 */

import { HTTP_STATUS, ERROR_CODES } from './constants';

/**
 * Base custom error class
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public errorCode: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error - 400 Bad Request
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, message, details);
  }
}

/**
 * Authentication error - 401 Unauthorized
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', details?: unknown) {
    super(HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED, message, details);
  }
}

/**
 * Authorization error - 403 Forbidden
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied', details?: unknown) {
    super(HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN, message, details);
  }
}

/**
 * Not found error - 404 Not Found
 */
export class NotFoundError extends AppError {
  constructor(resource: string, details?: unknown) {
    super(HTTP_STATUS.NOT_FOUND, ERROR_CODES.QUESTION_NOT_FOUND, `${resource} not found`, details);
  }
}

/**
 * Conflict error - 409 Conflict
 */
export class ConflictError extends AppError {
  constructor(message: string, details?: unknown) {
    super(HTTP_STATUS.CONFLICT, ERROR_CODES.VALIDATION_ERROR, message, details);
  }
}

/**
 * Internal server error - 500 Internal Server Error
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error', details?: unknown) {
    super(HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.INTERNAL_ERROR, message, details);
  }
}

/**
 * Service unavailable error - 503 Service Unavailable
 */
export class ServiceUnavailableError extends AppError {
  constructor(service: string, details?: unknown) {
    super(
      HTTP_STATUS.SERVICE_UNAVAILABLE,
      ERROR_CODES.BEDROCK_ERROR,
      `${service} service temporarily unavailable`,
      details
    );
  }
}

/**
 * Database error
 */
export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', details?: unknown) {
    super(HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.DATABASE_ERROR, message, details);
  }
}

/**
 * Formats an error response
 * @param error - The error to format
 * @returns Formatted error response
 */
export function formatErrorResponse(error: unknown): {
  statusCode: number;
  body: string;
} {
  let statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let errorCode: string = ERROR_CODES.INTERNAL_ERROR;
  let message = 'An unexpected error occurred';
  let details: unknown;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    errorCode = error.errorCode;
    message = error.message;
    details = error.details;
  } else if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }

  const response: any = {
    success: false,
    error: message,
    errorCode,
  };

  if (details) {
    response.details = details;
  }

  return {
    statusCode,
    body: JSON.stringify(response),
  };
}

/**
 * Formats a success response
 * @param data - The data to include in the response
 * @param statusCode - The HTTP status code (default: 200)
 * @param message - Optional success message
 * @returns Formatted success response
 */
export function formatSuccessResponse(
  data?: unknown,
  statusCode: number = HTTP_STATUS.OK,
  message?: string
): {
  statusCode: number;
  body: string;
} {
  const response: any = {
    success: true,
  };

  if (message) {
    response.message = message;
  }

  if (data) {
    response.data = data;
  }

  return {
    statusCode,
    body: JSON.stringify(response),
  };
}

/**
 * Wraps an async function with error handling
 * @param fn - The async function to wrap
 * @returns A wrapped function that handles errors
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(fn: T): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error('Error in wrapped function:', error);
      throw error;
    }
  }) as T;
}

/**
 * Validates that an error is an AppError
 * @param error - The error to check
 * @returns True if the error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Gets the HTTP status code for an error
 * @param error - The error
 * @returns The HTTP status code
 */
export function getErrorStatusCode(error: unknown): number {
  if (error instanceof AppError) {
    return error.statusCode;
  }
  return HTTP_STATUS.INTERNAL_SERVER_ERROR;
}

/**
 * Gets the error code for an error
 * @param error - The error
 * @returns The error code
 */
export function getErrorCode(error: unknown): string {
  if (error instanceof AppError) {
    return error.errorCode;
  }
  return ERROR_CODES.INTERNAL_ERROR;
}

/**
 * Creates a validation error response
 * @param field - The field that failed validation
 * @param message - The validation error message
 * @returns Formatted validation error response
 */
export function createValidationErrorResponse(field: string, message: string): {
  statusCode: number;
  body: string;
} {
  return formatErrorResponse(
    new ValidationError(message, {
      field,
    })
  );
}

/**
 * Creates an authentication error response
 * @param message - The error message
 * @returns Formatted authentication error response
 */
export function createAuthenticationErrorResponse(message: string = 'Invalid credentials'): {
  statusCode: number;
  body: string;
} {
  return formatErrorResponse(new AuthenticationError(message));
}

/**
 * Creates an authorization error response
 * @param message - The error message
 * @returns Formatted authorization error response
 */
export function createAuthorizationErrorResponse(message: string = 'Access denied'): {
  statusCode: number;
  body: string;
} {
  return formatErrorResponse(new AuthorizationError(message));
}

/**
 * Creates a not found error response
 * @param resource - The resource that was not found
 * @returns Formatted not found error response
 */
export function createNotFoundErrorResponse(resource: string): {
  statusCode: number;
  body: string;
} {
  return formatErrorResponse(new NotFoundError(resource));
}

/**
 * Creates a service unavailable error response
 * @param service - The service that is unavailable
 * @returns Formatted service unavailable error response
 */
export function createServiceUnavailableErrorResponse(service: string): {
  statusCode: number;
  body: string;
} {
  return formatErrorResponse(new ServiceUnavailableError(service));
}
