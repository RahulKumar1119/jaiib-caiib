/**
 * Shared utilities layer for JAIIB-CAIIB Exam Prep Portal
 * Exports all utility functions and types
 */

// Export types
export * from './types';

// Export constants
export * from './constants';

// Export encryption utilities
export * from './encryption';

// Export validation utilities
export * from './validation';

// Export error handling utilities
export {
  AppError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  InternalServerError,
  ServiceUnavailableError,
  DatabaseError,
  formatErrorResponse,
  formatSuccessResponse,
  withErrorHandling,
  isAppError,
  getErrorStatusCode,
  getErrorCode,
  createValidationErrorResponse,
  createAuthenticationErrorResponse,
  createAuthorizationErrorResponse,
  createNotFoundErrorResponse,
  createServiceUnavailableErrorResponse,
} from './error-handling';

// Export logging utilities
export * from './logging';
