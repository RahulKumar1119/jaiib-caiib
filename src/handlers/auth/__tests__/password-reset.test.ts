/**
 * Tests for Password Reset Functionality
 * Validates password reset token generation, verification, and password update
 */

import { APIGatewayProxyEvent } from 'aws-lambda';
import * as jwt from 'jsonwebtoken';
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { marshall } from '@aws-sdk/util-dynamodb';
import { requestPasswordReset, verifyResetToken } from '../index';

// Mock AWS SDK
const ddbMock = mockClient(DynamoDBClient);

// Mock encryption module
jest.mock('/opt/nodejs/encryption', () => ({
  encryptData: jest.fn((data: string) => `encrypted_${data}`),
  decryptData: jest.fn((data: string) => data.replace('encrypted_', '')),
  hashPassword: jest.fn(async (password: string) => `hashed_${password}`),
  verifyPassword: jest.fn(async (password: string, hash: string) => hash === `hashed_${password}`),
}));

// Mock validation module
jest.mock('/opt/nodejs/validation', () => ({
  validateEmail: jest.fn((email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)),
  validatePassword: jest.fn((password: string) => password && password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password)),
  validateUUID: jest.fn((uuid: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid)),
}));

// Mock error handling module
jest.mock('/opt/nodejs/error-handling', () => ({
  AuthenticationError: class AuthenticationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'AuthenticationError';
    }
  },
  ValidationError: class ValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ValidationError';
    }
  },
  DatabaseError: class DatabaseError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'DatabaseError';
    }
  },
  formatErrorResponse: jest.fn((error: any) => ({
    statusCode: error.name === 'ValidationError' ? 400 : error.name === 'AuthenticationError' ? 401 : 500,
    headers: { 'Content-Type': 'application/json', 'X-Content-Type-Options': 'nosniff' },
    body: JSON.stringify({ success: false, error: error.message }),
  })),
}));

// Mock logging module
jest.mock('/opt/nodejs/logging', () => ({
  Logger: class Logger {
    constructor(name: string) {}
    info = jest.fn();
    warn = jest.fn();
    error = jest.fn();
  },
}));

describe('Password Reset Functionality', () => {
  const JWT_SECRET = 'test-secret-key';
  const HTTP_STATUS = { OK: 200 };

  const mockUser = {
    user_id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'user@example.com',
    full_name: 'Test User',
    password_hash: 'hashed_OldPassword123',
    tenant_id: 'tenant-123',
    role: 'officer',
    session_token: null,
    session_expires_at: null,
    reset_token: null,
    reset_token_expires_at: null,
  };

  beforeEach(() => {
    ddbMock.reset();
    jest.clearAllMocks();
  });

  describe('Request Password Reset', () => {
    it('should generate reset token for valid email', async () => {
      ddbMock.on(GetItemCommand).resolves({
        Item: marshall(mockUser),
      });

      ddbMock.on(UpdateItemCommand).resolves({});

      const event: Partial<APIGatewayProxyEvent> = {
        path: '/auth/reset-password',
        httpMethod: 'POST',
        body: JSON.stringify({
          email: 'user@example.com',
        }),
      };

      const result = await requestPasswordReset(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(HTTP_STATUS.OK);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.message).toContain('If the email exists');
    });

    it('should not reveal if user exists', async () => {
      ddbMock.on(GetItemCommand).resolves({});

      const event: Partial<APIGatewayProxyEvent> = {
        path: '/auth/reset-password',
        httpMethod: 'POST',
        body: JSON.stringify({
          email: 'nonexistent@example.com',
        }),
      };

      const result = await requestPasswordReset(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(HTTP_STATUS.OK);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.message).toContain('If the email exists');
    });

    it('should reject invalid email format', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        path: '/auth/reset-password',
        httpMethod: 'POST',
        body: JSON.stringify({
          email: 'invalid-email',
        }),
      };

      const result = await requestPasswordReset(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
    });

    it('should reject missing email', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        path: '/auth/reset-password',
        httpMethod: 'POST',
        body: JSON.stringify({}),
      };

      const result = await requestPasswordReset(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
    });

    it('should store encrypted reset token', async () => {
      ddbMock.on(GetItemCommand).resolves({
        Item: marshall(mockUser),
      });

      ddbMock.on(UpdateItemCommand).resolves({});

      const event: Partial<APIGatewayProxyEvent> = {
        path: '/auth/reset-password',
        httpMethod: 'POST',
        body: JSON.stringify({
          email: 'user@example.com',
        }),
      };

      await requestPasswordReset(event as APIGatewayProxyEvent);

      const updateCall = ddbMock.commandCalls(UpdateItemCommand)[0];
      expect(updateCall.args[0].input.UpdateExpression).toContain('reset_token');
      expect(updateCall.args[0].input.UpdateExpression).toContain('reset_token_expires_at');
    });

    it('should set reset token expiration to 24 hours', async () => {
      ddbMock.on(GetItemCommand).resolves({
        Item: marshall(mockUser),
      });

      ddbMock.on(UpdateItemCommand).resolves({});

      const event: Partial<APIGatewayProxyEvent> = {
        path: '/auth/reset-password',
        httpMethod: 'POST',
        body: JSON.stringify({
          email: 'user@example.com',
        }),
      };

      const beforeRequest = Date.now();
      await requestPasswordReset(event as APIGatewayProxyEvent);
      const afterRequest = Date.now();

      const updateCall = ddbMock.commandCalls(UpdateItemCommand)[0];
      const expiresAtValue = updateCall.args[0].input.ExpressionAttributeValues[':expires'];

      const expiresAt = new Date(expiresAtValue).getTime();
      const expectedExpiration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

      expect(expiresAt - beforeRequest).toBeGreaterThanOrEqual(expectedExpiration - 1000);
      expect(expiresAt - afterRequest).toBeLessThanOrEqual(expectedExpiration + 1000);
    });

    it('should include security headers in response', async () => {
      ddbMock.on(GetItemCommand).resolves({
        Item: marshall(mockUser),
      });

      ddbMock.on(UpdateItemCommand).resolves({});

      const event: Partial<APIGatewayProxyEvent> = {
        path: '/auth/reset-password',
        httpMethod: 'POST',
        body: JSON.stringify({
          email: 'user@example.com',
        }),
      };

      const result = await requestPasswordReset(event as APIGatewayProxyEvent);

      expect(result.headers['X-Content-Type-Options']).toBe('nosniff');
      expect(result.headers['Content-Type']).toBe('application/json');
    });
  });

  describe('Verify Reset Token', () => {
    it('should successfully reset password with valid token', async () => {
      const resetToken = jwt.sign(
        {
          user_id: mockUser.user_id,
          email: mockUser.email,
          type: 'password_reset',
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      const userWithResetToken = {
        ...mockUser,
        reset_token: `encrypted_${resetToken}`,
        reset_token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      ddbMock.on(GetItemCommand).resolves({
        Item: marshall(userWithResetToken),
      });

      ddbMock.on(UpdateItemCommand).resolves({});

      const event: Partial<APIGatewayProxyEvent> = {
        path: '/auth/verify-reset-token',
        httpMethod: 'POST',
        body: JSON.stringify({
          token: resetToken,
          newPassword: 'NewPassword123',
          confirmPassword: 'NewPassword123',
        }),
      };

      const result = await verifyResetToken(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(HTTP_STATUS.OK);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.message).toContain('Password reset successfully');
    });

    it('should reject invalid password format', async () => {
      const resetToken = jwt.sign(
        {
          user_id: mockUser.user_id,
          email: mockUser.email,
          type: 'password_reset',
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      const event: Partial<APIGatewayProxyEvent> = {
        path: '/auth/verify-reset-token',
        httpMethod: 'POST',
        body: JSON.stringify({
          token: resetToken,
          newPassword: 'weak',
          confirmPassword: 'weak',
        }),
      };

      const result = await verifyResetToken(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('Password must be at least 8 characters');
    });

    it('should reject mismatched passwords', async () => {
      const resetToken = jwt.sign(
        {
          user_id: mockUser.user_id,
          email: mockUser.email,
          type: 'password_reset',
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      const event: Partial<APIGatewayProxyEvent> = {
        path: '/auth/verify-reset-token',
        httpMethod: 'POST',
        body: JSON.stringify({
          token: resetToken,
          newPassword: 'NewPassword123',
          confirmPassword: 'DifferentPassword123',
        }),
      };

      const result = await verifyResetToken(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('Passwords do not match');
    });

    it('should reject expired reset token', async () => {
      const resetToken = jwt.sign(
        {
          user_id: mockUser.user_id,
          email: mockUser.email,
          type: 'password_reset',
        },
        JWT_SECRET,
        { expiresIn: '-1h' } // Expired
      );

      const event: Partial<APIGatewayProxyEvent> = {
        path: '/auth/verify-reset-token',
        httpMethod: 'POST',
        body: JSON.stringify({
          token: resetToken,
          newPassword: 'NewPassword123',
          confirmPassword: 'NewPassword123',
        }),
      };

      const result = await verifyResetToken(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(401);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('Invalid or expired reset token');
    });

    it('should reject invalid token type', async () => {
      const invalidToken = jwt.sign(
        {
          user_id: mockUser.user_id,
          email: mockUser.email,
          type: 'login', // Wrong type
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      const event: Partial<APIGatewayProxyEvent> = {
        path: '/auth/verify-reset-token',
        httpMethod: 'POST',
        body: JSON.stringify({
          token: invalidToken,
          newPassword: 'NewPassword123',
          confirmPassword: 'NewPassword123',
        }),
      };

      const result = await verifyResetToken(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(401);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
    });

    it('should reject token mismatch', async () => {
      const resetToken = jwt.sign(
        {
          user_id: mockUser.user_id,
          email: mockUser.email,
          type: 'password_reset',
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      const userWithDifferentToken = {
        ...mockUser,
        reset_token: 'encrypted_different-token',
        reset_token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      ddbMock.on(GetItemCommand).resolves({
        Item: marshall(userWithDifferentToken),
      });

      const event: Partial<APIGatewayProxyEvent> = {
        path: '/auth/verify-reset-token',
        httpMethod: 'POST',
        body: JSON.stringify({
          token: resetToken,
          newPassword: 'NewPassword123',
          confirmPassword: 'NewPassword123',
        }),
      };

      const result = await verifyResetToken(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(401);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
    });

    it('should update password hash on successful reset', async () => {
      const resetToken = jwt.sign(
        {
          user_id: mockUser.user_id,
          email: mockUser.email,
          type: 'password_reset',
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      const userWithResetToken = {
        ...mockUser,
        reset_token: `encrypted_${resetToken}`,
        reset_token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      ddbMock.on(GetItemCommand).resolves({
        Item: marshall(userWithResetToken),
      });

      ddbMock.on(UpdateItemCommand).resolves({});

      const event: Partial<APIGatewayProxyEvent> = {
        path: '/auth/verify-reset-token',
        httpMethod: 'POST',
        body: JSON.stringify({
          token: resetToken,
          newPassword: 'NewPassword123',
          confirmPassword: 'NewPassword123',
        }),
      };

      await verifyResetToken(event as APIGatewayProxyEvent);

      const updateCall = ddbMock.commandCalls(UpdateItemCommand)[0];
      expect(updateCall.args[0].input.UpdateExpression).toContain('password_hash');
    });

    it('should clear reset token after successful reset', async () => {
      const resetToken = jwt.sign(
        {
          user_id: mockUser.user_id,
          email: mockUser.email,
          type: 'password_reset',
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      const userWithResetToken = {
        ...mockUser,
        reset_token: `encrypted_${resetToken}`,
        reset_token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      ddbMock.on(GetItemCommand).resolves({
        Item: marshall(userWithResetToken),
      });

      ddbMock.on(UpdateItemCommand).resolves({});

      const event: Partial<APIGatewayProxyEvent> = {
        path: '/auth/verify-reset-token',
        httpMethod: 'POST',
        body: JSON.stringify({
          token: resetToken,
          newPassword: 'NewPassword123',
          confirmPassword: 'NewPassword123',
        }),
      };

      await verifyResetToken(event as APIGatewayProxyEvent);

      const updateCall = ddbMock.commandCalls(UpdateItemCommand)[0];
      expect(updateCall.args[0].input.UpdateExpression).toContain('reset_token');
      expect(updateCall.args[0].input.UpdateExpression).toContain('reset_token_expires_at');
    });

    it('should reject reset for non-existent user', async () => {
      const resetToken = jwt.sign(
        {
          user_id: mockUser.user_id,
          email: mockUser.email,
          type: 'password_reset',
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      ddbMock.on(GetItemCommand).resolves({});

      const event: Partial<APIGatewayProxyEvent> = {
        path: '/auth/verify-reset-token',
        httpMethod: 'POST',
        body: JSON.stringify({
          token: resetToken,
          newPassword: 'NewPassword123',
          confirmPassword: 'NewPassword123',
        }),
      };

      const result = await verifyResetToken(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(401);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
    });

    it('should reject reset when no reset token exists', async () => {
      const resetToken = jwt.sign(
        {
          user_id: mockUser.user_id,
          email: mockUser.email,
          type: 'password_reset',
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      ddbMock.on(GetItemCommand).resolves({
        Item: marshall(mockUser), // No reset token
      });

      const event: Partial<APIGatewayProxyEvent> = {
        path: '/auth/verify-reset-token',
        httpMethod: 'POST',
        body: JSON.stringify({
          token: resetToken,
          newPassword: 'NewPassword123',
          confirmPassword: 'NewPassword123',
        }),
      };

      const result = await verifyResetToken(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(401);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
    });

    it('should reject reset when token has expired in database', async () => {
      const resetToken = jwt.sign(
        {
          user_id: mockUser.user_id,
          email: mockUser.email,
          type: 'password_reset',
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      const userWithExpiredToken = {
        ...mockUser,
        reset_token: `encrypted_${resetToken}`,
        reset_token_expires_at: new Date(Date.now() - 1000).toISOString(), // Expired
      };

      ddbMock.on(GetItemCommand).resolves({
        Item: marshall(userWithExpiredToken),
      });

      const event: Partial<APIGatewayProxyEvent> = {
        path: '/auth/verify-reset-token',
        httpMethod: 'POST',
        body: JSON.stringify({
          token: resetToken,
          newPassword: 'NewPassword123',
          confirmPassword: 'NewPassword123',
        }),
      };

      const result = await verifyResetToken(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(401);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('expired');
    });
  });

  describe('Password Requirements', () => {
    it('should enforce minimum 8 character password', async () => {
      const resetToken = jwt.sign(
        {
          user_id: mockUser.user_id,
          email: mockUser.email,
          type: 'password_reset',
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      const event: Partial<APIGatewayProxyEvent> = {
        path: '/auth/verify-reset-token',
        httpMethod: 'POST',
        body: JSON.stringify({
          token: resetToken,
          newPassword: 'Pass1', // Too short
          confirmPassword: 'Pass1',
        }),
      };

      const result = await verifyResetToken(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
    });

    it('should require uppercase letter', async () => {
      const resetToken = jwt.sign(
        {
          user_id: mockUser.user_id,
          email: mockUser.email,
          type: 'password_reset',
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      const event: Partial<APIGatewayProxyEvent> = {
        path: '/auth/verify-reset-token',
        httpMethod: 'POST',
        body: JSON.stringify({
          token: resetToken,
          newPassword: 'password123', // No uppercase
          confirmPassword: 'password123',
        }),
      };

      const result = await verifyResetToken(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
    });

    it('should require lowercase letter', async () => {
      const resetToken = jwt.sign(
        {
          user_id: mockUser.user_id,
          email: mockUser.email,
          type: 'password_reset',
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      const event: Partial<APIGatewayProxyEvent> = {
        path: '/auth/verify-reset-token',
        httpMethod: 'POST',
        body: JSON.stringify({
          token: resetToken,
          newPassword: 'PASSWORD123', // No lowercase
          confirmPassword: 'PASSWORD123',
        }),
      };

      const result = await verifyResetToken(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
    });

    it('should require numeric digit', async () => {
      const resetToken = jwt.sign(
        {
          user_id: mockUser.user_id,
          email: mockUser.email,
          type: 'password_reset',
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      const event: Partial<APIGatewayProxyEvent> = {
        path: '/auth/verify-reset-token',
        httpMethod: 'POST',
        body: JSON.stringify({
          token: resetToken,
          newPassword: 'Password', // No digit
          confirmPassword: 'Password',
        }),
      };

      const result = await verifyResetToken(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
    });
  });

  describe('Security', () => {
    it('should not expose user existence in error messages', async () => {
      ddbMock.on(GetItemCommand).resolves({});

      const event: Partial<APIGatewayProxyEvent> = {
        path: '/auth/reset-password',
        httpMethod: 'POST',
        body: JSON.stringify({
          email: 'nonexistent@example.com',
        }),
      };

      const result = await requestPasswordReset(event as APIGatewayProxyEvent);

      const body = JSON.parse(result.body);
      expect(body.message).not.toContain('not found');
      expect(body.message).not.toContain('does not exist');
    });

    it('should hash new password before storage', async () => {
      const resetToken = jwt.sign(
        {
          user_id: mockUser.user_id,
          email: mockUser.email,
          type: 'password_reset',
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      const userWithResetToken = {
        ...mockUser,
        reset_token: `encrypted_${resetToken}`,
        reset_token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      ddbMock.on(GetItemCommand).resolves({
        Item: marshall(userWithResetToken),
      });

      ddbMock.on(UpdateItemCommand).resolves({});

      const event: Partial<APIGatewayProxyEvent> = {
        path: '/auth/verify-reset-token',
        httpMethod: 'POST',
        body: JSON.stringify({
          token: resetToken,
          newPassword: 'NewPassword123',
          confirmPassword: 'NewPassword123',
        }),
      };

      await verifyResetToken(event as APIGatewayProxyEvent);

      const updateCall = ddbMock.commandCalls(UpdateItemCommand)[0];
      const passwordHashValue = updateCall.args[0].input.ExpressionAttributeValues[':hash'];

      // Password should be hashed, not plain text
      expect(passwordHashValue).not.toBe('NewPassword123');
      expect(passwordHashValue).toContain('hashed_');
    });

    it('should include security headers in all responses', async () => {
      const resetToken = jwt.sign(
        {
          user_id: mockUser.user_id,
          email: mockUser.email,
          type: 'password_reset',
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      const userWithResetToken = {
        ...mockUser,
        reset_token: `encrypted_${resetToken}`,
        reset_token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      ddbMock.on(GetItemCommand).resolves({
        Item: marshall(userWithResetToken),
      });

      ddbMock.on(UpdateItemCommand).resolves({});

      const event: Partial<APIGatewayProxyEvent> = {
        path: '/auth/verify-reset-token',
        httpMethod: 'POST',
        body: JSON.stringify({
          token: resetToken,
          newPassword: 'NewPassword123',
          confirmPassword: 'NewPassword123',
        }),
      };

      const result = await verifyResetToken(event as APIGatewayProxyEvent);

      expect(result.headers['X-Content-Type-Options']).toBe('nosniff');
      expect(result.headers['Content-Type']).toBe('application/json');
    });
  });
});
