/**
 * Tests for error handling utilities
 */

import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  InternalServerError,
  ServiceUnavailableError,
  DatabaseError,
  formatErrorResponse,
  formatSuccessResponse,
  isAppError,
  getErrorStatusCode,
  getErrorCode,
  createValidationErrorResponse,
  createAuthenticationErrorResponse,
  createAuthorizationErrorResponse,
  createNotFoundErrorResponse,
  createServiceUnavailableErrorResponse,
} from '../error-handling';
import { HTTP_STATUS, ERROR_CODES } from '../constants';

describe('Error Handling Utilities', () => {
  describe('Custom Error Classes', () => {
    it('should create ValidationError with correct status code', () => {
      const error = new ValidationError('Invalid input');
      expect(error.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(error.errorCode).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(error.message).toBe('Invalid input');
    });

    it('should create AuthenticationError with correct status code', () => {
      const error = new AuthenticationError('Invalid credentials');
      expect(error.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(error.errorCode).toBe(ERROR_CODES.UNAUTHORIZED);
    });

    it('should create AuthorizationError with correct status code', () => {
      const error = new AuthorizationError('Access denied');
      expect(error.statusCode).toBe(HTTP_STATUS.FORBIDDEN);
      expect(error.errorCode).toBe(ERROR_CODES.FORBIDDEN);
    });

    it('should create NotFoundError with correct status code', () => {
      const error = new NotFoundError('User');
      expect(error.statusCode).toBe(HTTP_STATUS.NOT_FOUND);
      expect(error.message).toContain('User not found');
    });

    it('should create ConflictError with correct status code', () => {
      const error = new ConflictError('Email already exists');
      expect(error.statusCode).toBe(HTTP_STATUS.CONFLICT);
    });

    it('should create InternalServerError with correct status code', () => {
      const error = new InternalServerError('Database connection failed');
      expect(error.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(error.errorCode).toBe(ERROR_CODES.INTERNAL_ERROR);
    });

    it('should create ServiceUnavailableError with correct status code', () => {
      const error = new ServiceUnavailableError('Bedrock');
      expect(error.statusCode).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE);
      expect(error.message).toContain('Bedrock');
    });

    it('should create DatabaseError with correct status code', () => {
      const error = new DatabaseError('Query failed');
      expect(error.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(error.errorCode).toBe(ERROR_CODES.DATABASE_ERROR);
    });
  });

  describe('formatErrorResponse', () => {
    it('should format AppError correctly', () => {
      const error = new ValidationError('Invalid input', { field: 'email' });
      const response = formatErrorResponse(error);

      expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Invalid input');
      expect(body.errorCode).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(body.details).toEqual({ field: 'email' });
    });

    it('should format standard Error correctly', () => {
      const error = new Error('Something went wrong');
      const response = formatErrorResponse(error);

      expect(response.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Something went wrong');
    });

    it('should format string error correctly', () => {
      const response = formatErrorResponse('Error message');

      expect(response.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Error message');
    });

    it('should format unknown error correctly', () => {
      const response = formatErrorResponse(null);

      expect(response.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
    });
  });

  describe('formatSuccessResponse', () => {
    it('should format success response with data', () => {
      const data = { id: '123', name: 'Test' };
      const response = formatSuccessResponse(data);

      expect(response.statusCode).toBe(HTTP_STATUS.OK);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toEqual(data);
    });

    it('should format success response with custom status code', () => {
      const response = formatSuccessResponse({ id: '123' }, HTTP_STATUS.CREATED);

      expect(response.statusCode).toBe(HTTP_STATUS.CREATED);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
    });

    it('should format success response with message', () => {
      const response = formatSuccessResponse(undefined, HTTP_STATUS.OK, 'Operation successful');

      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.message).toBe('Operation successful');
    });

    it('should format success response without data', () => {
      const response = formatSuccessResponse();

      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toBeUndefined();
    });
  });

  describe('isAppError', () => {
    it('should return true for AppError instances', () => {
      const error = new ValidationError('Invalid');
      expect(isAppError(error)).toBe(true);
    });

    it('should return false for standard Error', () => {
      const error = new Error('Standard error');
      expect(isAppError(error)).toBe(false);
    });

    it('should return false for non-Error objects', () => {
      expect(isAppError('string')).toBe(false);
      expect(isAppError(null)).toBe(false);
      expect(isAppError({})).toBe(false);
    });
  });

  describe('getErrorStatusCode', () => {
    it('should return status code from AppError', () => {
      const error = new ValidationError('Invalid');
      expect(getErrorStatusCode(error)).toBe(HTTP_STATUS.BAD_REQUEST);
    });

    it('should return 500 for standard Error', () => {
      const error = new Error('Standard error');
      expect(getErrorStatusCode(error)).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    });

    it('should return 500 for unknown error', () => {
      expect(getErrorStatusCode('string')).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    });
  });

  describe('getErrorCode', () => {
    it('should return error code from AppError', () => {
      const error = new ValidationError('Invalid');
      expect(getErrorCode(error)).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should return INTERNAL_ERROR for standard Error', () => {
      const error = new Error('Standard error');
      expect(getErrorCode(error)).toBe(ERROR_CODES.INTERNAL_ERROR);
    });

    it('should return INTERNAL_ERROR for unknown error', () => {
      expect(getErrorCode('string')).toBe(ERROR_CODES.INTERNAL_ERROR);
    });
  });

  describe('Helper functions', () => {
    it('should create validation error response', () => {
      const response = createValidationErrorResponse('email', 'Invalid email format');

      expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.details.field).toBe('email');
    });

    it('should create authentication error response', () => {
      const response = createAuthenticationErrorResponse('Invalid credentials');

      expect(response.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
    });

    it('should create authorization error response', () => {
      const response = createAuthorizationErrorResponse('Access denied');

      expect(response.statusCode).toBe(HTTP_STATUS.FORBIDDEN);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
    });

    it('should create not found error response', () => {
      const response = createNotFoundErrorResponse('User');

      expect(response.statusCode).toBe(HTTP_STATUS.NOT_FOUND);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
    });

    it('should create service unavailable error response', () => {
      const response = createServiceUnavailableErrorResponse('Bedrock');

      expect(response.statusCode).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
    });
  });
});
