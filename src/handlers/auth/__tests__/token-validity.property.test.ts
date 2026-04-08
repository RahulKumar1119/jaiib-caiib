/**
 * Property-Based Tests for Authentication Token Validity
 * Validates that JWT tokens are generated correctly and can be verified
 * 
 * Property 1: Authentication Token Validity
 * For any valid user credentials, a login should generate a valid JWT token that:
 * - Can be decoded without errors
 * - Contains all required claims (user_id, email, tenant_id, role)
 * - Has a valid expiration time in the future
 * - Can be verified with the correct secret
 * - Cannot be verified with an incorrect secret
 * - Expires after the specified duration
 */

import fc from 'fast-check';
import * as jwt from 'jsonwebtoken';
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { marshall } from '@aws-sdk/util-dynamodb';
import { login } from '../index';
import { APIGatewayProxyEvent } from 'aws-lambda';

// Constants
const JWT_SECRET = 'test-secret-key';
const HTTP_STATUS = { OK: 200 };

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

describe('Property: Authentication Token Validity', () => {
  beforeEach(() => {
    ddbMock.reset();
    jest.clearAllMocks();
  });

  /**
   * Property 1.1: Token can be decoded and contains all required claims
   * For any valid user, the generated token should contain user_id, email, tenant_id, and role
   */
  it('should generate tokens with all required claims', () => {
    fc.assert(
      fc.property(
        fc.record({
          user_id: fc.uuid(),
          email: fc.emailAddress(),
          full_name: fc.string({ minLength: 1, maxLength: 100 }),
          tenant_id: fc.string({ minLength: 1, maxLength: 50 }),
          role: fc.oneof(fc.constant('officer'), fc.constant('admin'), fc.constant('super_admin')),
          password: fc.string({ minLength: 8, maxLength: 50 }).filter(
            (p: string) => /[A-Z]/.test(p) && /[a-z]/.test(p) && /[0-9]/.test(p)
          ),
        }),
        async (user: any) => {
          const mockUser = {
            ...user,
            password_hash: `hashed_${user.password}`,
            session_token: null,
            session_expires_at: null,
            reset_token: null,
            reset_token_expires_at: null,
          };

          ddbMock.on(GetItemCommand).resolves({
            Item: marshall(mockUser),
          });

          ddbMock.on(UpdateItemCommand).resolves({});

          const event: Partial<APIGatewayProxyEvent> = {
            path: '/auth/login',
            httpMethod: 'POST',
            body: JSON.stringify({
              email: user.email,
              password: user.password,
            }),
          };

          const result = await login(event as APIGatewayProxyEvent);

          expect(result.statusCode).toBe(HTTP_STATUS.OK);
          const body = JSON.parse(result.body);
          expect(body.success).toBe(true);
          expect(body.token).toBeDefined();

          // Decode token and verify claims
          const decoded = jwt.verify(body.token, JWT_SECRET) as any;
          expect(decoded.user_id).toBe(user.user_id);
          expect(decoded.email).toBe(user.email);
          expect(decoded.tenant_id).toBe(user.tenant_id);
          expect(decoded.role).toBe(user.role);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 1.2: Token expiration is always in the future
   * For any valid user, the token expiration should be greater than the current time
   */
  it('should generate tokens with expiration in the future', () => {
    fc.assert(
      fc.property(
        fc.record({
          user_id: fc.uuid(),
          email: fc.emailAddress(),
          full_name: fc.string({ minLength: 1, maxLength: 100 }),
          tenant_id: fc.string({ minLength: 1, maxLength: 50 }),
          role: fc.oneof(fc.constant('officer'), fc.constant('admin'), fc.constant('super_admin')),
          password: fc.string({ minLength: 8, maxLength: 50 }).filter(
            (p: string) => /[A-Z]/.test(p) && /[a-z]/.test(p) && /[0-9]/.test(p)
          ),
        }),
        async (user: any) => {
          const mockUser = {
            ...user,
            password_hash: `hashed_${user.password}`,
            session_token: null,
            session_expires_at: null,
            reset_token: null,
            reset_token_expires_at: null,
          };

          ddbMock.on(GetItemCommand).resolves({
            Item: marshall(mockUser),
          });

          ddbMock.on(UpdateItemCommand).resolves({});

          const event: Partial<APIGatewayProxyEvent> = {
            path: '/auth/login',
            httpMethod: 'POST',
            body: JSON.stringify({
              email: user.email,
              password: user.password,
            }),
          };

          const beforeLogin = Math.floor(Date.now() / 1000);
          const result = await login(event as APIGatewayProxyEvent);
          const afterLogin = Math.floor(Date.now() / 1000);

          expect(result.statusCode).toBe(HTTP_STATUS.OK);
          const body = JSON.parse(result.body);

          // Decode token and verify expiration
          const decoded = jwt.verify(body.token, JWT_SECRET) as any;
          expect(decoded.exp).toBeGreaterThan(afterLogin);
          expect(decoded.iat).toBeGreaterThanOrEqual(beforeLogin);
          expect(decoded.iat).toBeLessThanOrEqual(afterLogin);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 1.3: Token can be verified with correct secret but not with incorrect secret
   * For any valid token, verification should succeed with the correct secret and fail with an incorrect secret
   */
  it('should verify tokens with correct secret and reject with incorrect secret', () => {
    fc.assert(
      fc.property(
        fc.record({
          user_id: fc.uuid(),
          email: fc.emailAddress(),
          full_name: fc.string({ minLength: 1, maxLength: 100 }),
          tenant_id: fc.string({ minLength: 1, maxLength: 50 }),
          role: fc.oneof(fc.constant('officer'), fc.constant('admin'), fc.constant('super_admin')),
          password: fc.string({ minLength: 8, maxLength: 50 }).filter(
            (p: string) => /[A-Z]/.test(p) && /[a-z]/.test(p) && /[0-9]/.test(p)
          ),
        }),
        async (user: any) => {
          const mockUser = {
            ...user,
            password_hash: `hashed_${user.password}`,
            session_token: null,
            session_expires_at: null,
            reset_token: null,
            reset_token_expires_at: null,
          };

          ddbMock.on(GetItemCommand).resolves({
            Item: marshall(mockUser),
          });

          ddbMock.on(UpdateItemCommand).resolves({});

          const event: Partial<APIGatewayProxyEvent> = {
            path: '/auth/login',
            httpMethod: 'POST',
            body: JSON.stringify({
              email: user.email,
              password: user.password,
            }),
          };

          const result = await login(event as APIGatewayProxyEvent);
          const body = JSON.parse(result.body);
          const token = body.token;

          // Verify with correct secret
          expect(() => {
            jwt.verify(token, JWT_SECRET);
          }).not.toThrow();

          // Verify with incorrect secret
          expect(() => {
            jwt.verify(token, 'incorrect-secret');
          }).toThrow();
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 1.4: Token expiration duration is consistent
   * For any valid user, the token expiration should be approximately 30 minutes from issuance
   */
  it('should generate tokens with consistent 30-minute expiration', () => {
    fc.assert(
      fc.property(
        fc.record({
          user_id: fc.uuid(),
          email: fc.emailAddress(),
          full_name: fc.string({ minLength: 1, maxLength: 100 }),
          tenant_id: fc.string({ minLength: 1, maxLength: 50 }),
          role: fc.oneof(fc.constant('officer'), fc.constant('admin'), fc.constant('super_admin')),
          password: fc.string({ minLength: 8, maxLength: 50 }).filter(
            (p: string) => /[A-Z]/.test(p) && /[a-z]/.test(p) && /[0-9]/.test(p)
          ),
        }),
        async (user: any) => {
          const mockUser = {
            ...user,
            password_hash: `hashed_${user.password}`,
            session_token: null,
            session_expires_at: null,
            reset_token: null,
            reset_token_expires_at: null,
          };

          ddbMock.on(GetItemCommand).resolves({
            Item: marshall(mockUser),
          });

          ddbMock.on(UpdateItemCommand).resolves({});

          const event: Partial<APIGatewayProxyEvent> = {
            path: '/auth/login',
            httpMethod: 'POST',
            body: JSON.stringify({
              email: user.email,
              password: user.password,
            }),
          };

          const result = await login(event as APIGatewayProxyEvent);
          const body = JSON.parse(result.body);

          // Verify expiration duration
          const decoded = jwt.verify(body.token, JWT_SECRET) as any;
          const expirationDuration = decoded.exp - decoded.iat;

          // Should be approximately 30 minutes (1800 seconds)
          // Allow 5 second tolerance for execution time
          expect(expirationDuration).toBeGreaterThanOrEqual(1795);
          expect(expirationDuration).toBeLessThanOrEqual(1805);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 1.5: Token structure is always valid JWT format
   * For any valid user, the generated token should be a valid JWT with three parts separated by dots
   */
  it('should generate tokens in valid JWT format', () => {
    fc.assert(
      fc.property(
        fc.record({
          user_id: fc.uuid(),
          email: fc.emailAddress(),
          full_name: fc.string({ minLength: 1, maxLength: 100 }),
          tenant_id: fc.string({ minLength: 1, maxLength: 50 }),
          role: fc.oneof(fc.constant('officer'), fc.constant('admin'), fc.constant('super_admin')),
          password: fc.string({ minLength: 8, maxLength: 50 }).filter(
            (p: string) => /[A-Z]/.test(p) && /[a-z]/.test(p) && /[0-9]/.test(p)
          ),
        }),
        async (user: any) => {
          const mockUser = {
            ...user,
            password_hash: `hashed_${user.password}`,
            session_token: null,
            session_expires_at: null,
            reset_token: null,
            reset_token_expires_at: null,
          };

          ddbMock.on(GetItemCommand).resolves({
            Item: marshall(mockUser),
          });

          ddbMock.on(UpdateItemCommand).resolves({});

          const event: Partial<APIGatewayProxyEvent> = {
            path: '/auth/login',
            httpMethod: 'POST',
            body: JSON.stringify({
              email: user.email,
              password: user.password,
            }),
          };

          const result = await login(event as APIGatewayProxyEvent);
          const body = JSON.parse(result.body);
          const token = body.token;

          // JWT should have three parts separated by dots
          const parts = token.split('.');
          expect(parts).toHaveLength(3);

          // Each part should be valid base64
          parts.forEach((part: string) => {
            expect(() => {
              Buffer.from(part, 'base64').toString('utf-8');
            }).not.toThrow();
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 1.6: Different users generate different tokens
   * For any two different users, the generated tokens should be different
   */
  it('should generate different tokens for different users', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.record({
            user_id: fc.uuid(),
            email: fc.emailAddress(),
            full_name: fc.string({ minLength: 1, maxLength: 100 }),
            tenant_id: fc.string({ minLength: 1, maxLength: 50 }),
            role: fc.oneof(fc.constant('officer'), fc.constant('admin'), fc.constant('super_admin')),
            password: fc.string({ minLength: 8, maxLength: 50 }).filter(
              (p: string) => /[A-Z]/.test(p) && /[a-z]/.test(p) && /[0-9]/.test(p)
            ),
          }),
          fc.record({
            user_id: fc.uuid(),
            email: fc.emailAddress(),
            full_name: fc.string({ minLength: 1, maxLength: 100 }),
            tenant_id: fc.string({ minLength: 1, maxLength: 50 }),
            role: fc.oneof(fc.constant('officer'), fc.constant('admin'), fc.constant('super_admin')),
            password: fc.string({ minLength: 8, maxLength: 50 }).filter(
              (p: string) => /[A-Z]/.test(p) && /[a-z]/.test(p) && /[0-9]/.test(p)
            ),
          })
        ).filter(([user1, user2]: any) => user1.user_id !== user2.user_id),
        async ([user1, user2]: any) => {
          const mockUser1 = {
            ...user1,
            password_hash: `hashed_${user1.password}`,
            session_token: null,
            session_expires_at: null,
            reset_token: null,
            reset_token_expires_at: null,
          };

          const mockUser2 = {
            ...user2,
            password_hash: `hashed_${user2.password}`,
            session_token: null,
            session_expires_at: null,
            reset_token: null,
            reset_token_expires_at: null,
          };

          // First login
          ddbMock.on(GetItemCommand).resolvesOnce({
            Item: marshall(mockUser1),
          });

          ddbMock.on(UpdateItemCommand).resolvesOnce({});

          const event1: Partial<APIGatewayProxyEvent> = {
            path: '/auth/login',
            httpMethod: 'POST',
            body: JSON.stringify({
              email: user1.email,
              password: user1.password,
            }),
          };

          const result1 = await login(event1 as APIGatewayProxyEvent);
          const body1 = JSON.parse(result1.body);
          const token1 = body1.token;

          // Second login
          ddbMock.on(GetItemCommand).resolvesOnce({
            Item: marshall(mockUser2),
          });

          ddbMock.on(UpdateItemCommand).resolvesOnce({});

          const event2: Partial<APIGatewayProxyEvent> = {
            path: '/auth/login',
            httpMethod: 'POST',
            body: JSON.stringify({
              email: user2.email,
              password: user2.password,
            }),
          };

          const result2 = await login(event2 as APIGatewayProxyEvent);
          const body2 = JSON.parse(result2.body);
          const token2 = body2.token;

          // Tokens should be different
          expect(token1).not.toBe(token2);

          // But both should be valid
          expect(() => jwt.verify(token1, JWT_SECRET)).not.toThrow();
          expect(() => jwt.verify(token2, JWT_SECRET)).not.toThrow();
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 1.7: Token claims are immutable after generation
   * For any valid token, the claims should not change after generation
   */
  it('should generate tokens with immutable claims', () => {
    fc.assert(
      fc.property(
        fc.record({
          user_id: fc.uuid(),
          email: fc.emailAddress(),
          full_name: fc.string({ minLength: 1, maxLength: 100 }),
          tenant_id: fc.string({ minLength: 1, maxLength: 50 }),
          role: fc.oneof(fc.constant('officer'), fc.constant('admin'), fc.constant('super_admin')),
          password: fc.string({ minLength: 8, maxLength: 50 }).filter(
            (p: string) => /[A-Z]/.test(p) && /[a-z]/.test(p) && /[0-9]/.test(p)
          ),
        }),
        async (user: any) => {
          const mockUser = {
            ...user,
            password_hash: `hashed_${user.password}`,
            session_token: null,
            session_expires_at: null,
            reset_token: null,
            reset_token_expires_at: null,
          };

          ddbMock.on(GetItemCommand).resolves({
            Item: marshall(mockUser),
          });

          ddbMock.on(UpdateItemCommand).resolves({});

          const event: Partial<APIGatewayProxyEvent> = {
            path: '/auth/login',
            httpMethod: 'POST',
            body: JSON.stringify({
              email: user.email,
              password: user.password,
            }),
          };

          const result = await login(event as APIGatewayProxyEvent);
          const body = JSON.parse(result.body);
          const token = body.token;

          // Decode multiple times and verify claims are the same
          const decoded1 = jwt.verify(token, JWT_SECRET) as any;
          const decoded2 = jwt.verify(token, JWT_SECRET) as any;

          expect(decoded1.user_id).toBe(decoded2.user_id);
          expect(decoded1.email).toBe(decoded2.email);
          expect(decoded1.tenant_id).toBe(decoded2.tenant_id);
          expect(decoded1.role).toBe(decoded2.role);
          expect(decoded1.iat).toBe(decoded2.iat);
          expect(decoded1.exp).toBe(decoded2.exp);
        }
      ),
      { numRuns: 50 }
    );
  });
});
