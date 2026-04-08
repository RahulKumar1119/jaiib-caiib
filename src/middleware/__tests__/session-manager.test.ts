/**
 * Tests for Session Management Middleware
 * Validates token validation, session expiration, and token refresh
 */

import * as jwt from 'jsonwebtoken';
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { marshall } from '@aws-sdk/util-dynamodb';
import {
  validateToken,
  extractToken,
  validateSession,
  refreshToken,
  invalidateSession,
  isTokenExpiringSoon,
  getTokenTimeRemaining,
  authorizer,
  SessionContext,
} from '../session-manager';

// Mock AWS SDK
const ddbMock = mockClient(DynamoDBClient);

// Mock encryption module
jest.mock('/opt/nodejs/encryption', () => ({
  encryptData: jest.fn((data: string) => `encrypted_${data}`),
  decryptData: jest.fn((data: string) => data.replace('encrypted_', '')),
}));

// Mock error handling module
jest.mock('/opt/nodejs/error-handling', () => ({
  AuthenticationError: class AuthenticationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'AuthenticationError';
    }
  },
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

describe('Session Manager', () => {
  const JWT_SECRET = 'test-secret-key';
  const mockUser = {
    user_id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'user@example.com',
    full_name: 'Test User',
    password_hash: 'hashed_password',
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

  describe('validateToken', () => {
    it('should validate a valid token', async () => {
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

      const result = await validateToken(token);

      expect(result.user_id).toBe(mockUser.user_id);
      expect(result.email).toBe(mockUser.email);
      expect(result.tenant_id).toBe(mockUser.tenant_id);
      expect(result.role).toBe(mockUser.role);
      expect(result.token).toBe(token);
      expect(result.expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });

    it('should reject an expired token', async () => {
      const token = jwt.sign(
        {
          user_id: mockUser.user_id,
          email: mockUser.email,
          tenant_id: mockUser.tenant_id,
          role: mockUser.role,
        },
        JWT_SECRET,
        { expiresIn: '-1h' } // Expired
      );

      await expect(validateToken(token)).rejects.toThrow('Token has expired');
    });

    it('should reject an invalid token', async () => {
      await expect(validateToken('invalid-token')).rejects.toThrow('Invalid token');
    });

    it('should reject a token signed with wrong secret', async () => {
      const token = jwt.sign(
        {
          user_id: mockUser.user_id,
          email: mockUser.email,
          tenant_id: mockUser.tenant_id,
          role: mockUser.role,
        },
        'wrong-secret',
        { expiresIn: '30m' }
      );

      await expect(validateToken(token)).rejects.toThrow('Invalid token');
    });

    it('should return correct session context', async () => {
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

      const result = await validateToken(token);

      expect(result).toHaveProperty('user_id');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('tenant_id');
      expect(result).toHaveProperty('role');
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('expiresAt');
    });
  });

  describe('extractToken', () => {
    it('should extract token from valid authorization header', () => {
      const token = 'test-token-123';
      const authHeader = `Bearer ${token}`;

      const result = extractToken(authHeader);

      expect(result).toBe(token);
    });

    it('should reject missing authorization header', () => {
      expect(() => extractToken()).toThrow('Missing authorization header');
    });

    it('should reject invalid authorization header format', () => {
      expect(() => extractToken('InvalidFormat token')).toThrow('Missing authorization header');
    });

    it('should reject empty authorization header', () => {
      expect(() => extractToken('')).toThrow('Missing authorization header');
    });

    it('should handle case-sensitive Bearer prefix', () => {
      const token = 'test-token-123';
      const authHeader = `Bearer ${token}`;

      const result = extractToken(authHeader);

      expect(result).toBe(token);
    });
  });

  describe('validateSession', () => {
    it('should validate an active session', async () => {
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

      const userWithSession = {
        ...mockUser,
        session_token: `encrypted_${token}`,
        session_expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      };

      ddbMock.on(GetItemCommand).resolves({
        Item: marshall(userWithSession),
      });

      const result = await validateSession(mockUser.email, token);

      expect(result).toBe(true);
    });

    it('should reject session for non-existent user', async () => {
      ddbMock.on(GetItemCommand).resolves({});

      const result = await validateSession(mockUser.email, 'token');

      expect(result).toBe(false);
    });

    it('should reject session with no session token', async () => {
      ddbMock.on(GetItemCommand).resolves({
        Item: marshall(mockUser),
      });

      const result = await validateSession(mockUser.email, 'token');

      expect(result).toBe(false);
    });

    it('should reject session with mismatched token', async () => {
      const token = 'test-token';
      const userWithSession = {
        ...mockUser,
        session_token: 'encrypted_different-token',
        session_expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      };

      ddbMock.on(GetItemCommand).resolves({
        Item: marshall(userWithSession),
      });

      const result = await validateSession(mockUser.email, token);

      expect(result).toBe(false);
    });

    it('should reject expired session', async () => {
      const token = 'test-token';
      const userWithSession = {
        ...mockUser,
        session_token: `encrypted_${token}`,
        session_expires_at: new Date(Date.now() - 1000).toISOString(), // Expired
      };

      ddbMock.on(GetItemCommand).resolves({
        Item: marshall(userWithSession),
      });

      const result = await validateSession(mockUser.email, token);

      expect(result).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      ddbMock.on(GetItemCommand).rejects(new Error('Database error'));

      const result = await validateSession(mockUser.email, 'token');

      expect(result).toBe(false);
    });
  });

  describe('refreshToken', () => {
    it('should generate a new token', async () => {
      ddbMock.on(GetItemCommand).resolves({
        Item: marshall(mockUser),
      });

      ddbMock.on(UpdateItemCommand).resolves({});

      const newToken = await refreshToken(mockUser.email);

      expect(newToken).toBeDefined();
      expect(typeof newToken).toBe('string');

      // Verify new token is valid
      const decoded = jwt.verify(newToken, JWT_SECRET) as any;
      expect(decoded.user_id).toBe(mockUser.user_id);
      expect(decoded.email).toBe(mockUser.email);
    });

    it('should update session in database', async () => {
      ddbMock.on(GetItemCommand).resolves({
        Item: marshall(mockUser),
      });

      ddbMock.on(UpdateItemCommand).resolves({});

      await refreshToken(mockUser.email);

      const updateCall = ddbMock.commandCalls(UpdateItemCommand)[0];
      expect(updateCall.args[0].input.UpdateExpression).toContain('session_token');
      expect(updateCall.args[0].input.UpdateExpression).toContain('session_expires_at');
    });

    it('should reject refresh for non-existent user', async () => {
      ddbMock.on(GetItemCommand).resolves({});

      await expect(refreshToken(mockUser.email)).rejects.toThrow('User not found');
    });

    it('should handle database errors', async () => {
      ddbMock.on(GetItemCommand).rejects(new Error('Database error'));

      await expect(refreshToken(mockUser.email)).rejects.toThrow();
    });
  });

  describe('invalidateSession', () => {
    it('should clear session token', async () => {
      ddbMock.on(UpdateItemCommand).resolves({});

      await invalidateSession(mockUser.email);

      const updateCall = ddbMock.commandCalls(UpdateItemCommand)[0];
      expect(updateCall.args[0].input.UpdateExpression).toContain('session_token');
      expect(updateCall.args[0].input.UpdateExpression).toContain('session_expires_at');
    });

    it('should handle database errors', async () => {
      ddbMock.on(UpdateItemCommand).rejects(new Error('Database error'));

      await expect(invalidateSession(mockUser.email)).rejects.toThrow();
    });
  });

  describe('isTokenExpiringSoon', () => {
    it('should return true if token expires within 5 minutes', () => {
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = now + 4 * 60; // 4 minutes

      const result = isTokenExpiringSoon(expiresAt);

      expect(result).toBe(true);
    });

    it('should return false if token expires after 5 minutes', () => {
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = now + 10 * 60; // 10 minutes

      const result = isTokenExpiringSoon(expiresAt);

      expect(result).toBe(false);
    });

    it('should return false if token is already expired', () => {
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = now - 1000; // Already expired

      const result = isTokenExpiringSoon(expiresAt);

      expect(result).toBe(false);
    });

    it('should return true at exactly 5 minutes', () => {
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = now + 5 * 60; // Exactly 5 minutes

      const result = isTokenExpiringSoon(expiresAt);

      expect(result).toBe(true);
    });
  });

  describe('getTokenTimeRemaining', () => {
    it('should return correct time remaining', () => {
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = now + 600; // 10 minutes

      const result = getTokenTimeRemaining(expiresAt);

      expect(result).toBeGreaterThanOrEqual(599);
      expect(result).toBeLessThanOrEqual(600);
    });

    it('should return 0 for expired token', () => {
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = now - 1000;

      const result = getTokenTimeRemaining(expiresAt);

      expect(result).toBe(0);
    });

    it('should return positive value for valid token', () => {
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = now + 1800; // 30 minutes

      const result = getTokenTimeRemaining(expiresAt);

      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(1800);
    });
  });

  describe('authorizer', () => {
    it('should return allow policy for valid token', async () => {
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

      const userWithSession = {
        ...mockUser,
        session_token: `encrypted_${token}`,
        session_expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      };

      ddbMock.on(GetItemCommand).resolves({
        Item: marshall(userWithSession),
      });

      const event = {
        authorizationToken: `Bearer ${token}`,
        methodArn: 'arn:aws:execute-api:us-east-1:123456789012:abcdef/prod/GET/users',
      };

      const result = await authorizer(event);

      expect(result.principalId).toBe(mockUser.user_id);
      expect(result.policyDocument.Statement[0].Effect).toBe('Allow');
      expect(result.context.user_id).toBe(mockUser.user_id);
      expect(result.context.email).toBe(mockUser.email);
      expect(result.context.tenant_id).toBe(mockUser.tenant_id);
      expect(result.context.role).toBe(mockUser.role);
    });

    it('should return deny policy for invalid token', async () => {
      const event = {
        authorizationToken: 'Bearer invalid-token',
        methodArn: 'arn:aws:execute-api:us-east-1:123456789012:abcdef/prod/GET/users',
      };

      const result = await authorizer(event);

      expect(result.principalId).toBe('user');
      expect(result.policyDocument.Statement[0].Effect).toBe('Deny');
    });

    it('should return deny policy for missing authorization header', async () => {
      const event = {
        authorizationToken: '',
        methodArn: 'arn:aws:execute-api:us-east-1:123456789012:abcdef/prod/GET/users',
      };

      const result = await authorizer(event);

      expect(result.principalId).toBe('user');
      expect(result.policyDocument.Statement[0].Effect).toBe('Deny');
    });

    it('should return deny policy for invalid session', async () => {
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

      ddbMock.on(GetItemCommand).resolves({
        Item: marshall(mockUser), // No session token
      });

      const event = {
        authorizationToken: `Bearer ${token}`,
        methodArn: 'arn:aws:execute-api:us-east-1:123456789012:abcdef/prod/GET/users',
      };

      const result = await authorizer(event);

      expect(result.principalId).toBe('user');
      expect(result.policyDocument.Statement[0].Effect).toBe('Deny');
    });

    it('should include correct method ARN in policy', async () => {
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

      const userWithSession = {
        ...mockUser,
        session_token: `encrypted_${token}`,
        session_expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      };

      ddbMock.on(GetItemCommand).resolves({
        Item: marshall(userWithSession),
      });

      const methodArn = 'arn:aws:execute-api:us-east-1:123456789012:abcdef/prod/GET/users';
      const event = {
        authorizationToken: `Bearer ${token}`,
        methodArn,
      };

      const result = await authorizer(event);

      expect(result.policyDocument.Statement[0].Resource).toBe(methodArn);
    });
  });

  describe('Session Expiration', () => {
    it('should expire session after 30 minutes', async () => {
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

      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const expirationDuration = decoded.exp - decoded.iat;

      // Should be approximately 30 minutes (1800 seconds)
      expect(expirationDuration).toBeGreaterThanOrEqual(1795);
      expect(expirationDuration).toBeLessThanOrEqual(1805);
    });

    it('should invalidate session on logout', async () => {
      ddbMock.on(UpdateItemCommand).resolves({});

      await invalidateSession(mockUser.email);

      const updateCall = ddbMock.commandCalls(UpdateItemCommand)[0];
      const updateExpression = updateCall.args[0].input.UpdateExpression;

      expect(updateExpression).toContain('session_token');
      expect(updateExpression).toContain('session_expires_at');
    });
  });

  describe('Token Refresh', () => {
    it('should generate new token with updated expiration', async () => {
      ddbMock.on(GetItemCommand).resolves({
        Item: marshall(mockUser),
      });

      ddbMock.on(UpdateItemCommand).resolves({});

      const newToken = await refreshToken(mockUser.email);
      const decoded = jwt.verify(newToken, JWT_SECRET) as any;

      // New token should have fresh expiration
      const now = Math.floor(Date.now() / 1000);
      const expirationDuration = decoded.exp - decoded.iat;

      expect(expirationDuration).toBeGreaterThanOrEqual(1795);
      expect(expirationDuration).toBeLessThanOrEqual(1805);
    });

    it('should preserve user claims on refresh', async () => {
      ddbMock.on(GetItemCommand).resolves({
        Item: marshall(mockUser),
      });

      ddbMock.on(UpdateItemCommand).resolves({});

      const newToken = await refreshToken(mockUser.email);
      const decoded = jwt.verify(newToken, JWT_SECRET) as any;

      expect(decoded.user_id).toBe(mockUser.user_id);
      expect(decoded.email).toBe(mockUser.email);
      expect(decoded.tenant_id).toBe(mockUser.tenant_id);
      expect(decoded.role).toBe(mockUser.role);
    });
  });
});
