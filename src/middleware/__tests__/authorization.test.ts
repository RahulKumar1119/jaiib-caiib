/**
 * Unit Tests for Authorization Middleware
 * Tests tenant ID extraction, access validation, role-based permissions, and cross-tenant prevention
 */

import * as jwt from 'jsonwebtoken';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

// Mock error handling module
jest.mock('/opt/nodejs/error-handling', () => ({
  AuthenticationError: class AuthenticationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'AuthenticationError';
    }
  },
  AuthorizationError: class AuthorizationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'AuthorizationError';
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

// Mock constants module
jest.mock('/opt/nodejs/constants', () => ({
  ENV_VARS: {
    JWT_SECRET: 'test-secret-key',
    AWS_REGION: 'ap-south-1',
  },
  DYNAMODB_TABLES: {
    USERS: 'users',
  },
}));

// Import after mocking
import {
  extractTenantId,
  validateTenantAccess,
  checkRolePermission,
  hasActionPermission,
  authorizeRequest,
  validateRequestTenantId,
  UserRole,
  AuthorizationContext,
} from '../authorization';

// Mock DynamoDB
const dynamoDbMock = mockClient(DynamoDBClient);

// Define error classes for test assertions
class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

// Test constants
const JWT_SECRET = 'test-secret-key';
const TEST_TENANT_ID = 'tenant-123';
const TEST_USER_ID = 'user-456';
const TEST_EMAIL = 'officer@bank.com';

describe('Authorization Middleware', () => {
  beforeEach(() => {
    dynamoDbMock.reset();
    jest.clearAllMocks();
    // Set environment variables for tests
    process.env.JWT_SECRET = JWT_SECRET;
  });

  describe('extractTenantId', () => {
    it('should extract tenant_id from valid JWT token', () => {
      const token = jwt.sign(
        {
          user_id: TEST_USER_ID,
          email: TEST_EMAIL,
          tenant_id: TEST_TENANT_ID,
          role: 'officer',
        },
        JWT_SECRET,
        { expiresIn: '30m' }
      );

      const tenantId = extractTenantId(token);

      expect(tenantId).toBe(TEST_TENANT_ID);
    });

    it('should throw AuthenticationError if token is invalid', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => extractTenantId(invalidToken)).toThrow('Invalid token');
    });

    it('should throw AuthenticationError if tenant_id is missing from token', () => {
      const token = jwt.sign(
        {
          user_id: TEST_USER_ID,
          email: TEST_EMAIL,
          role: 'officer',
        },
        JWT_SECRET,
        { expiresIn: '30m' }
      );

      expect(() => extractTenantId(token)).toThrow('tenant_id not found in token');
    });

    it('should throw AuthenticationError if token is expired', () => {
      const token = jwt.sign(
        {
          user_id: TEST_USER_ID,
          email: TEST_EMAIL,
          tenant_id: TEST_TENANT_ID,
          role: 'officer',
        },
        JWT_SECRET,
        { expiresIn: '-1s' } // Expired token
      );

      expect(() => extractTenantId(token)).toThrow();
    });
  });

  describe('validateTenantAccess', () => {
    it('should return true if user exists in tenant and is active', async () => {
      const mockUser = {
        'tenant_id#user_id': `${TEST_TENANT_ID}#${TEST_USER_ID}`,
        tenant_id: TEST_TENANT_ID,
        user_id: TEST_USER_ID,
        email: TEST_EMAIL,
        status: 'active',
        role: 'officer',
      };

      dynamoDbMock.on(GetItemCommand).resolves({
        Item: marshall(mockUser),
      });

      const result = await validateTenantAccess(TEST_TENANT_ID, TEST_USER_ID);

      expect(result).toBe(true);
    });

    it('should return false if user does not exist in tenant', async () => {
      dynamoDbMock.on(GetItemCommand).resolves({
        Item: undefined,
      });

      const result = await validateTenantAccess(TEST_TENANT_ID, TEST_USER_ID);

      expect(result).toBe(false);
    });

    it('should return false if user status is not active', async () => {
      const mockUser = {
        'tenant_id#user_id': `${TEST_TENANT_ID}#${TEST_USER_ID}`,
        tenant_id: TEST_TENANT_ID,
        user_id: TEST_USER_ID,
        email: TEST_EMAIL,
        status: 'suspended',
        role: 'officer',
      };

      dynamoDbMock.on(GetItemCommand).resolves({
        Item: marshall(mockUser),
      });

      const result = await validateTenantAccess(TEST_TENANT_ID, TEST_USER_ID);

      expect(result).toBe(false);
    });

    it('should return false on database error', async () => {
      dynamoDbMock.on(GetItemCommand).rejects(new Error('Database error'));

      const result = await validateTenantAccess(TEST_TENANT_ID, TEST_USER_ID);

      expect(result).toBe(false);
    });
  });

  describe('checkRolePermission', () => {
    it('should return true if officer role has permission for officer action', () => {
      const result = checkRolePermission('officer', 'officer');
      expect(result).toBe(true);
    });

    it('should return true if admin role has permission for officer action', () => {
      const result = checkRolePermission('admin', 'officer');
      expect(result).toBe(true);
    });

    it('should return true if super_admin role has permission for any action', () => {
      const result = checkRolePermission('super_admin', 'admin');
      expect(result).toBe(true);
    });

    it('should return false if officer role does not have permission for admin action', () => {
      const result = checkRolePermission('officer', 'admin');
      expect(result).toBe(false);
    });

    it('should return false if officer role does not have permission for super_admin action', () => {
      const result = checkRolePermission('officer', 'super_admin');
      expect(result).toBe(false);
    });

    it('should return false if admin role does not have permission for super_admin action', () => {
      const result = checkRolePermission('admin', 'super_admin');
      expect(result).toBe(false);
    });
  });

  describe('hasActionPermission', () => {
    it('should return true if officer can create practice sets', () => {
      const result = hasActionPermission('officer', 'practice:create');
      expect(result).toBe(true);
    });

    it('should return true if admin can create questions', () => {
      const result = hasActionPermission('admin', 'questions:create');
      expect(result).toBe(true);
    });

    it('should return true if super_admin can manage users', () => {
      const result = hasActionPermission('super_admin', 'users:manage');
      expect(result).toBe(true);
    });

    it('should return false if officer cannot create questions', () => {
      const result = hasActionPermission('officer', 'questions:create');
      expect(result).toBe(false);
    });

    it('should return false if officer cannot manage users', () => {
      const result = hasActionPermission('officer', 'users:manage');
      expect(result).toBe(false);
    });

    it('should return false for unknown action', () => {
      const result = hasActionPermission('officer', 'unknown:action');
      expect(result).toBe(false);
    });
  });

  describe('authorizeRequest', () => {
    it('should authorize valid request with correct tenant_id', async () => {
      const token = jwt.sign(
        {
          user_id: TEST_USER_ID,
          email: TEST_EMAIL,
          tenant_id: TEST_TENANT_ID,
          role: 'officer',
        },
        JWT_SECRET,
        { expiresIn: '30m' }
      );

      const mockUser = {
        'tenant_id#user_id': `${TEST_TENANT_ID}#${TEST_USER_ID}`,
        tenant_id: TEST_TENANT_ID,
        user_id: TEST_USER_ID,
        email: TEST_EMAIL,
        status: 'active',
        role: 'officer',
      };

      dynamoDbMock.on(GetItemCommand).resolves({
        Item: marshall(mockUser),
      });

      const event = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        path: '/practice-sets',
        httpMethod: 'POST',
      } as any;

      const result = await authorizeRequest(event);

      expect(result.user_id).toBe(TEST_USER_ID);
      expect(result.tenant_id).toBe(TEST_TENANT_ID);
      expect(result.role).toBe('officer');
      expect(result.email).toBe(TEST_EMAIL);
    });

    it('should throw AuthenticationError if Authorization header is missing', async () => {
      const event = {
        headers: {},
        path: '/practice-sets',
        httpMethod: 'POST',
      } as any;

      await expect(authorizeRequest(event)).rejects.toThrow('Missing authorization header');
    });

    it('should throw AuthenticationError if Authorization header format is invalid', async () => {
      const event = {
        headers: {
          Authorization: 'InvalidFormat token',
        },
        path: '/practice-sets',
        httpMethod: 'POST',
      } as any;

      await expect(authorizeRequest(event)).rejects.toThrow('Missing authorization header');
    });

    it('should throw AuthenticationError if token is invalid', async () => {
      const event = {
        headers: {
          Authorization: 'Bearer invalid.token.here',
        },
        path: '/practice-sets',
        httpMethod: 'POST',
      } as any;

      await expect(authorizeRequest(event)).rejects.toThrow('Invalid token');
    });

    it('should throw AuthorizationError if user does not have access to tenant', async () => {
      const token = jwt.sign(
        {
          user_id: TEST_USER_ID,
          email: TEST_EMAIL,
          tenant_id: TEST_TENANT_ID,
          role: 'officer',
        },
        JWT_SECRET,
        { expiresIn: '30m' }
      );

      dynamoDbMock.on(GetItemCommand).resolves({
        Item: undefined, // User not found in tenant
      });

      const event = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        path: '/practice-sets',
        httpMethod: 'POST',
      } as any;

      await expect(authorizeRequest(event)).rejects.toThrow('Access denied');
    });

    it('should throw AuthorizationError if user role does not have required permission', async () => {
      const token = jwt.sign(
        {
          user_id: TEST_USER_ID,
          email: TEST_EMAIL,
          tenant_id: TEST_TENANT_ID,
          role: 'officer',
        },
        JWT_SECRET,
        { expiresIn: '30m' }
      );

      const mockUser = {
        'tenant_id#user_id': `${TEST_TENANT_ID}#${TEST_USER_ID}`,
        tenant_id: TEST_TENANT_ID,
        user_id: TEST_USER_ID,
        email: TEST_EMAIL,
        status: 'active',
        role: 'officer',
      };

      dynamoDbMock.on(GetItemCommand).resolves({
        Item: marshall(mockUser),
      });

      const event = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        path: '/admin/questions',
        httpMethod: 'POST',
      } as any;

      // Require admin role
      await expect(authorizeRequest(event, 'admin')).rejects.toThrow('Insufficient permissions');
    });

    it('should authorize request with sufficient role permission', async () => {
      const token = jwt.sign(
        {
          user_id: TEST_USER_ID,
          email: TEST_EMAIL,
          tenant_id: TEST_TENANT_ID,
          role: 'admin',
        },
        JWT_SECRET,
        { expiresIn: '30m' }
      );

      const mockUser = {
        'tenant_id#user_id': `${TEST_TENANT_ID}#${TEST_USER_ID}`,
        tenant_id: TEST_TENANT_ID,
        user_id: TEST_USER_ID,
        email: TEST_EMAIL,
        status: 'active',
        role: 'admin',
      };

      dynamoDbMock.on(GetItemCommand).resolves({
        Item: marshall(mockUser),
      });

      const event = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        path: '/admin/questions',
        httpMethod: 'POST',
      } as any;

      const result = await authorizeRequest(event, 'officer');

      expect(result.role).toBe('admin');
    });

    it('should handle case-insensitive Authorization header', async () => {
      const token = jwt.sign(
        {
          user_id: TEST_USER_ID,
          email: TEST_EMAIL,
          tenant_id: TEST_TENANT_ID,
          role: 'officer',
        },
        JWT_SECRET,
        { expiresIn: '30m' }
      );

      const mockUser = {
        'tenant_id#user_id': `${TEST_TENANT_ID}#${TEST_USER_ID}`,
        tenant_id: TEST_TENANT_ID,
        user_id: TEST_USER_ID,
        email: TEST_EMAIL,
        status: 'active',
        role: 'officer',
      };

      dynamoDbMock.on(GetItemCommand).resolves({
        Item: marshall(mockUser),
      });

      const event = {
        headers: {
          authorization: `Bearer ${token}`, // lowercase
        },
        path: '/practice-sets',
        httpMethod: 'POST',
      } as any;

      const result = await authorizeRequest(event);

      expect(result.user_id).toBe(TEST_USER_ID);
    });
  });

  describe('validateRequestTenantId', () => {
    it('should return true if tenant IDs match', () => {
      const result = validateRequestTenantId(TEST_TENANT_ID, TEST_TENANT_ID);
      expect(result).toBe(true);
    });

    it('should return false if tenant IDs do not match', () => {
      const result = validateRequestTenantId('tenant-123', 'tenant-456');
      expect(result).toBe(false);
    });

    it('should prevent cross-tenant access attempts', () => {
      const authenticatedTenantId = 'bank-a';
      const requestedTenantId = 'bank-b';

      const result = validateRequestTenantId(requestedTenantId, authenticatedTenantId);

      expect(result).toBe(false);
    });
  });

  describe('Cross-tenant access prevention', () => {
    it('should deny access when user from tenant-a tries to access tenant-b data', async () => {
      const token = jwt.sign(
        {
          user_id: TEST_USER_ID,
          email: TEST_EMAIL,
          tenant_id: 'tenant-a',
          role: 'officer',
        },
        JWT_SECRET,
        { expiresIn: '30m' }
      );

      // User exists in tenant-a
      const mockUser = {
        'tenant_id#user_id': 'tenant-a#user-456',
        tenant_id: 'tenant-a',
        user_id: TEST_USER_ID,
        email: TEST_EMAIL,
        status: 'active',
        role: 'officer',
      };

      dynamoDbMock.on(GetItemCommand).resolves({
        Item: marshall(mockUser),
      });

      const event = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        path: '/practice-sets',
        httpMethod: 'POST',
      } as any;

      const result = await authorizeRequest(event);

      // Verify tenant_id is from authenticated user, not from request
      expect(result.tenant_id).toBe('tenant-a');

      // Validate that cross-tenant access is prevented
      const crossTenantValid = validateRequestTenantId('tenant-b', result.tenant_id);
      expect(crossTenantValid).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should throw AuthenticationError if token payload is missing required fields', async () => {
      const token = jwt.sign(
        {
          email: TEST_EMAIL,
          // Missing user_id, tenant_id, role
        },
        JWT_SECRET,
        { expiresIn: '30m' }
      );

      const event = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        path: '/practice-sets',
        httpMethod: 'POST',
      } as any;

      await expect(authorizeRequest(event)).rejects.toThrow();
    });

    it('should handle database errors gracefully', async () => {
      const token = jwt.sign(
        {
          user_id: TEST_USER_ID,
          email: TEST_EMAIL,
          tenant_id: TEST_TENANT_ID,
          role: 'officer',
        },
        JWT_SECRET,
        { expiresIn: '30m' }
      );

      dynamoDbMock.on(GetItemCommand).rejects(new Error('Database connection failed'));

      const event = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        path: '/practice-sets',
        httpMethod: 'POST',
      } as any;

      await expect(authorizeRequest(event)).rejects.toThrow();
    });
  });
});
