/**
 * Tests for Authentication Lambda Handler
 * Validates login, logout, and password reset functionality
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as jwt from 'jsonwebtoken';
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { login, logout, requestPasswordReset, verifyResetToken, handler } from '../index';
import * as encryptionModule from '/opt/nodejs/encryption';
import { JWT_SECRET, HTTP_STATUS } from '/opt/nodejs/constants';

// Mock AWS SDK
const ddbMock = mockClient(DynamoDBClient);

// Mock encryption module
jest.mock('/opt/nodejs/encryption', () => ({
  encryptData: jest.fn((data) => `encrypted_${data}`),
  decryptData: jest.fn((data) => data.replace('encrypted_', '')),
  hashPassword: jest.fn(async (password) => `hashed_${password}`),
  verifyPassword: jest.fn(async (password, hash) => hash === `hashed_${password}`),
}));

// Mock validation module
jest.mock('/opt/nodejs/validation', () => ({
  validateEmail: jest.fn((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)),
  validatePassword: jest.fn((password) => password && password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password)),
  validateUUID: jest.fn((uuid) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid)),
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

describe('Authentication Handler', () => {
  const mockUser = {
    user_id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'user@example.com',
    full_name: 'Test User',
    password_hash: 'hashed_TestPassword123',
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

  describe('Login', () => {
    it('should successfully login with valid credentials', async () => {
      ddbMock.on(GetItemCommand).resolves({
        Item: marshall(mockUser),
      });

      ddbMock.on(UpdateItemCommand).resolves({});

      const event: Partial<APIGatewayProxyEvent> = {
        path: '/auth/login',
        httpMethod: 'POST',
        body: JSON.stringify({
          email: 'user@example.com',
          password: 'TestPassword123',
        }),
      };

      const result = await login(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(HTTP_STATUS.OK);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.token).toBeDefined();
      expect(body.user.email).toBe('user@example.com');
      expect(body.expiresIn).toBeDefined();
    });

    it('should reject invalid email format', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        path: '/auth/login',
        httpMethod: 'POST',
        body: JSON.stringify({
          email: 'invalid-email',
          password: 'TestPassword123',
        }),
      };

      const result = await login(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
    });

    it('should reject missing password', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        path: '/auth/login',
        httpMethod: 'POST',
        body: JSON.stringify({
          email: 'user@example.com',
        }),
      };

      const result = await login(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
    });

    it('should reject non-existent user', async () => {
      ddbMock.on(GetItemCommand).resolves({});

      const event: Partial<APIGatewayProxyEvent> = {
        path: '/auth/login',
        httpMethod: 'POST',
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'TestPassword123',
        }),
      };

      const result = await login(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(401);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
    });

    it('should reject invalid password', async () => {
      ddbMock.on(GetItemCommand).resolves({
        Item: marshall(mockUser),
      });

      // Mock verifyPassword to return false
      (encryptionModule.verifyPassword as jest.Mock).mockResolvedValueOnce(false);

      const event: Partial<APIGatewayProxyEvent> = {
        path: '/auth/login',
        httpMethod: 'POST',
        body: JSON.stringify({
          email: 'user@example.com',
          password: 'WrongPassword123',
        }),
      };

      const result = await login(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(401);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
    });

    it('should generate valid JWT token', async () => {
      ddbMock.on(GetItemCommand).resolves({
        Item: marshall(mockUser),
      });

      ddbMock.on(UpdateItemCommand).resolves({});

      const event: Partial<APIGatewayProxyEvent> = {
        path: '/auth/login',
        httpMethod: 'POST',
        body: JSON.stringify({
          email: 'user@example.com',
          password: 'TestPassword123',
        }),
      };

      const result = await login(event as APIGatewayProxyEvent);

      const body = JSON.parse(result.body);
      const decoded = jwt.verify(body.token, JWT_SECRET) as any;

      expect(decoded.user_id).toBe(mockUser.user_id);
      expect(decoded.email).toBe(mockUser.email);
      expect(decoded.tenant_id).toBe(mockUser.tenant_id);
      expect(decoded.role).toBe(mockUser.role);
    });

    it('should update last_login timestamp', async () => {
      ddbMock.on(GetItemCommand).resolves({
        Item: marshall(mockUser),
      });

      ddbMock.on(UpdateItemCommand).resolves({});

      const event: Partial<APIGatewayProxyEvent> = {
        path: '/auth/login',
        httpMethod: 'POST',
        body: JSON.stringify({
          email: 'user@example.com',
          password: 'TestPassword123',
        }),
      };

      await login(event as APIGatewayProxyEvent);

      const updateCall = ddbMock.commandCalls(UpdateItemCommand)[0];
      expect(updateCall.args[0].input.UpdateExpression).toContain('last_login');
    });
  });

  describe('Logout', () => {
    it('should successfully logout with valid token', async () => {
      const token = jwt.sign(
        {
          user_id: mockUser.user_id,
          email: mockUser.email,
          tenant_id: mockUser.tenant_id,
          role: mockUser.role,
        },
        JWT_SECRET,
        { expiresIn: '30m' }
      );

      ddbMock.on(UpdateItemCommand).resolves({});

      const event: Partial<APIGatewayProxyEvent> = {
        path: '/auth/logout',
        httpMethod: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const result = await logout(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(HTTP_STATUS.OK);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
    });

    it('should reject missing authorization header', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        path: '/auth/logout',
        httpMethod: 'POST',
        headers: {},
      };

      const result = await logout(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(401);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
    });

    it('should reject invalid token', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        path: '/auth/logout',
        httpMethod: 'POST',
        headers: {
          Authorization: 'Bearer invalid_token',
        },
      };

      const result = await logout(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(401);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
    });

    it('should clear session token on logout', async () => {
      const token = jwt.sign(
        {
          user_id: mockUser.user_id,
          email: mockUser.email,
          tenant_id: mockUser.tenant_id,
          role: mockUser.role,
        },
        JWT_SECRET,
        { expiresIn: '30m' }
      );

      ddbMock.on(UpdateItemCommand).resolves({});

      const event: Partial<APIGatewayProxyEvent> = {
        path: '/auth/logout',
        httpMethod: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      await logout(event as APIGatewayProxyEvent);

      const updateCall = ddbMock.commandCalls(UpdateItemCommand)[0];
      expect(updateCall.args[0].input.UpdateExpression).toContain('session_token');
    });
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
    });

    it('should reject expired reset token', async () => {
      const resetToken = jwt.sign(
        {
          user_id: mockUser.user_id,
          email: mockUser.email,
          type: 'password_reset',
        },
        JWT_SECRET,
        { expiresIn: '-1h' } // Expired token
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
  });

  describe('Main Handler', () => {
    it('should route login requests correctly', async () => {
      ddbMock.on(GetItemCommand).resolves({
        Item: marshall(mockUser),
      });

      ddbMock.on(UpdateItemCommand).resolves({});

      const event: Partial<APIGatewayProxyEvent> = {
        path: '/auth/login',
        httpMethod: 'POST',
        body: JSON.stringify({
          email: 'user@example.com',
          password: 'TestPassword123',
        }),
      };

      const result = await handler(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(HTTP_STATUS.OK);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
    });

    it('should route logout requests correctly', async () => {
      const token = jwt.sign(
        {
          user_id: mockUser.user_id,
          email: mockUser.email,
          tenant_id: mockUser.tenant_id,
          role: mockUser.role,
        },
        JWT_SECRET,
        { expiresIn: '30m' }
      );

      ddbMock.on(UpdateItemCommand).resolves({});

      const event: Partial<APIGatewayProxyEvent> = {
        path: '/auth/logout',
        httpMethod: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const result = await handler(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(HTTP_STATUS.OK);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
    });

    it('should return 404 for unknown endpoints', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        path: '/unknown',
        httpMethod: 'GET',
      };

      const result = await handler(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(404);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
    });
  });

  describe('Security', () => {
    it('should include security headers in responses', async () => {
      ddbMock.on(GetItemCommand).resolves({
        Item: marshall(mockUser),
      });

      ddbMock.on(UpdateItemCommand).resolves({});

      const event: Partial<APIGatewayProxyEvent> = {
        path: '/auth/login',
        httpMethod: 'POST',
        body: JSON.stringify({
          email: 'user@example.com',
          password: 'TestPassword123',
        }),
      };

      const result = await login(event as APIGatewayProxyEvent);

      expect(result.headers['X-Content-Type-Options']).toBe('nosniff');
      expect(result.headers['Content-Type']).toBe('application/json');
    });

    it('should not expose sensitive information in error messages', async () => {
      ddbMock.on(GetItemCommand).resolves({});

      const event: Partial<APIGatewayProxyEvent> = {
        path: '/auth/login',
        httpMethod: 'POST',
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'TestPassword123',
        }),
      };

      const result = await login(event as APIGatewayProxyEvent);

      const body = JSON.parse(result.body);
      expect(body.error).not.toContain('user');
      expect(body.error).not.toContain('database');
    });

    it('should hash passwords before storage', async () => {
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

      expect(encryptionModule.hashPassword).toHaveBeenCalledWith('NewPassword123');
    });
  });
});
