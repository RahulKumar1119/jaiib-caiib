/**
 * Unit Tests for Audit Log Querying and Filtering
 * Tests filtering by all supported criteria, pagination logic, and export formatting
 * Requirements: 12.7
 */

import {
  DynamoDBClient,
  QueryCommand,
} from '@aws-sdk/client-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import {
  AuditEventType,
  AuditLogRecord,
} from '../index';

// Mock AWS clients
const dynamoDbMock = mockClient(DynamoDBClient);

// Mock modules
jest.mock('/opt/nodejs/error-handling', () => ({
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
  formatErrorResponse: (error: Error) => {
    const statusCode = error.name === 'ValidationError' ? 400 : 500;
    return {
      statusCode,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: error.message }),
    };
  },
}));

jest.mock('/opt/nodejs/logging', () => ({
  createLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }),
}));

jest.mock('/opt/nodejs/constants', () => ({
  DYNAMODB_TABLES: {
    AUDIT_LOGS: 'audit_logs',
  },
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    METHOD_NOT_ALLOWED: 405,
    INTERNAL_SERVER_ERROR: 500,
  },
}));

import { handler } from '../index';

describe('Audit Log Querying Unit Tests', () => {
  beforeEach(() => {
    dynamoDbMock.reset();
    jest.clearAllMocks();
  });

  describe('Filtering by user_id', () => {
    it('should filter audit logs by user_id', async () => {
      const mockLogs: AuditLogRecord[] = [
        {
          tenant_id: 'tenant_abc',
          created_at: Math.floor(Date.now() / 1000),
          audit_id: 'audit_001',
          event_type: AuditEventType.LOGIN,
          user_id: 'user_123',
          ttl: Math.floor(Date.now() / 1000) + 7776000,
        },
      ];

      dynamoDbMock.on(QueryCommand).resolves({
        Items: mockLogs.map(log => ({
          'tenant_id': { S: log.tenant_id },
          'created_at': { N: log.created_at.toString() },
          'audit_id': { S: log.audit_id },
          'event_type': { S: log.event_type },
          'user_id': { S: log.user_id },
          'ttl': { N: log.ttl.toString() },
        })),
        Count: 1,
      });

      const apiEvent = {
        httpMethod: 'GET',
        path: '/audit-logs',
        queryStringParameters: { user_id: 'user_123' },
        headers: {},
        requestContext: {
          authorizer: {
            claims: {
              'custom:tenant_id': 'tenant_abc',
              'custom:role': 'admin',
            },
          },
        },
      } as any;

      const response = await handler(apiEvent);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.audit_logs.length).toBeGreaterThan(0);
    });

    it('should return empty list when no logs match user_id filter', async () => {
      dynamoDbMock.on(QueryCommand).resolves({
        Items: [],
        Count: 0,
      });

      const apiEvent = {
        httpMethod: 'GET',
        path: '/audit-logs',
        queryStringParameters: { user_id: 'nonexistent_user' },
        headers: {},
        requestContext: {
          authorizer: {
            claims: {
              'custom:tenant_id': 'tenant_abc',
              'custom:role': 'admin',
            },
          },
        },
      } as any;

      const response = await handler(apiEvent);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.audit_logs.length).toBe(0);
    });
  });

  describe('Filtering by event_type', () => {
    it('should filter audit logs by event_type', async () => {
      const mockLogs: AuditLogRecord[] = [
        {
          tenant_id: 'tenant_abc',
          created_at: Math.floor(Date.now() / 1000),
          audit_id: 'audit_001',
          event_type: AuditEventType.LOGIN,
          user_id: 'user_123',
          ttl: Math.floor(Date.now() / 1000) + 7776000,
        },
      ];

      dynamoDbMock.on(QueryCommand).resolves({
        Items: mockLogs.map(log => ({
          'tenant_id': { S: log.tenant_id },
          'created_at': { N: log.created_at.toString() },
          'audit_id': { S: log.audit_id },
          'event_type': { S: log.event_type },
          'user_id': { S: log.user_id },
          'ttl': { N: log.ttl.toString() },
        })),
        Count: 1,
      });

      const apiEvent = {
        httpMethod: 'GET',
        path: '/audit-logs',
        queryStringParameters: { event_type: AuditEventType.LOGIN },
        headers: {},
        requestContext: {
          authorizer: {
            claims: {
              'custom:tenant_id': 'tenant_abc',
              'custom:role': 'admin',
            },
          },
        },
      } as any;

      const response = await handler(apiEvent);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
    });

    it('should filter by PRACTICE_SET_COMPLETION event type', async () => {
      const mockLogs: AuditLogRecord[] = [
        {
          tenant_id: 'tenant_abc',
          created_at: Math.floor(Date.now() / 1000),
          audit_id: 'audit_002',
          event_type: AuditEventType.PRACTICE_SET_COMPLETION,
          user_id: 'user_123',
          ttl: Math.floor(Date.now() / 1000) + 7776000,
        },
      ];

      dynamoDbMock.on(QueryCommand).resolves({
        Items: mockLogs.map(log => ({
          'tenant_id': { S: log.tenant_id },
          'created_at': { N: log.created_at.toString() },
          'audit_id': { S: log.audit_id },
          'event_type': { S: log.event_type },
          'user_id': { S: log.user_id },
          'ttl': { N: log.ttl.toString() },
        })),
        Count: 1,
      });

      const apiEvent = {
        httpMethod: 'GET',
        path: '/audit-logs',
        queryStringParameters: { event_type: AuditEventType.PRACTICE_SET_COMPLETION },
        headers: {},
        requestContext: {
          authorizer: {
            claims: {
              'custom:tenant_id': 'tenant_abc',
              'custom:role': 'admin',
            },
          },
        },
      } as any;

      const response = await handler(apiEvent);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
    });
  });

  describe('Filtering by date range', () => {
    it('should filter audit logs by start_date and end_date', async () => {
      const now = Math.floor(Date.now() / 1000);
      const startDate = now - 86400; // 1 day ago
      const endDate = now;

      const mockLogs: AuditLogRecord[] = [
        {
          tenant_id: 'tenant_abc',
          created_at: now - 43200, // 12 hours ago
          audit_id: 'audit_001',
          event_type: AuditEventType.LOGIN,
          user_id: 'user_123',
          ttl: now + 7776000,
        },
      ];

      dynamoDbMock.on(QueryCommand).resolves({
        Items: mockLogs.map(log => ({
          'tenant_id': { S: log.tenant_id },
          'created_at': { N: log.created_at.toString() },
          'audit_id': { S: log.audit_id },
          'event_type': { S: log.event_type },
          'user_id': { S: log.user_id },
          'ttl': { N: log.ttl.toString() },
        })),
        Count: 1,
      });

      const apiEvent = {
        httpMethod: 'GET',
        path: '/audit-logs',
        queryStringParameters: {
          start_date: startDate.toString(),
          end_date: endDate.toString(),
        },
        headers: {},
        requestContext: {
          authorizer: {
            claims: {
              'custom:tenant_id': 'tenant_abc',
              'custom:role': 'admin',
            },
          },
        },
      } as any;

      const response = await handler(apiEvent);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
    });

    it('should reject invalid date range (start_date > end_date)', async () => {
      const now = Math.floor(Date.now() / 1000);

      const apiEvent = {
        httpMethod: 'GET',
        path: '/audit-logs',
        queryStringParameters: {
          start_date: (now + 86400).toString(),
          end_date: now.toString(),
        },
        headers: {},
        requestContext: {
          authorizer: {
            claims: {
              'custom:tenant_id': 'tenant_abc',
              'custom:role': 'admin',
            },
          },
        },
      } as any;

      const response = await handler(apiEvent);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
    });
  });

  describe('Pagination', () => {
    it('should support limit parameter', async () => {
      const mockLogs: AuditLogRecord[] = Array.from({ length: 50 }, (_, i) => ({
        tenant_id: 'tenant_abc',
        created_at: Math.floor(Date.now() / 1000) - i * 60,
        audit_id: `audit_${i}`,
        event_type: AuditEventType.LOGIN,
        user_id: 'user_123',
        ttl: Math.floor(Date.now() / 1000) + 7776000,
      }));

      dynamoDbMock.on(QueryCommand).resolves({
        Items: mockLogs.slice(0, 25).map(log => ({
          'tenant_id': { S: log.tenant_id },
          'created_at': { N: log.created_at.toString() },
          'audit_id': { S: log.audit_id },
          'event_type': { S: log.event_type },
          'user_id': { S: log.user_id },
          'ttl': { N: log.ttl.toString() },
        })),
        Count: 25,
      });

      const apiEvent = {
        httpMethod: 'GET',
        path: '/audit-logs',
        queryStringParameters: { limit: '25' },
        headers: {},
        requestContext: {
          authorizer: {
            claims: {
              'custom:tenant_id': 'tenant_abc',
              'custom:role': 'admin',
            },
          },
        },
      } as any;

      const response = await handler(apiEvent);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.pagination.limit).toBe(25);
    });

    it('should support offset parameter for pagination', async () => {
      const mockLogs: AuditLogRecord[] = Array.from({ length: 25 }, (_, i) => ({
        tenant_id: 'tenant_abc',
        created_at: Math.floor(Date.now() / 1000) - (i + 25) * 60,
        audit_id: `audit_${i + 25}`,
        event_type: AuditEventType.LOGIN,
        user_id: 'user_123',
        ttl: Math.floor(Date.now() / 1000) + 7776000,
      }));

      dynamoDbMock.on(QueryCommand).resolves({
        Items: mockLogs.map(log => ({
          'tenant_id': { S: log.tenant_id },
          'created_at': { N: log.created_at.toString() },
          'audit_id': { S: log.audit_id },
          'event_type': { S: log.event_type },
          'user_id': { S: log.user_id },
          'ttl': { N: log.ttl.toString() },
        })),
        Count: 25,
      });

      const apiEvent = {
        httpMethod: 'GET',
        path: '/audit-logs',
        queryStringParameters: { offset: '25', limit: '25' },
        headers: {},
        requestContext: {
          authorizer: {
            claims: {
              'custom:tenant_id': 'tenant_abc',
              'custom:role': 'admin',
            },
          },
        },
      } as any;

      const response = await handler(apiEvent);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.pagination.offset).toBe(25);
    });

    it('should include has_more flag in pagination', async () => {
      const mockLogs: AuditLogRecord[] = Array.from({ length: 101 }, (_, i) => ({
        tenant_id: 'tenant_abc',
        created_at: Math.floor(Date.now() / 1000) - i * 60,
        audit_id: `audit_${i}`,
        event_type: AuditEventType.LOGIN,
        user_id: 'user_123',
        ttl: Math.floor(Date.now() / 1000) + 7776000,
      }));

      dynamoDbMock.on(QueryCommand).resolves({
        Items: mockLogs.slice(0, 101).map(log => ({
          'tenant_id': { S: log.tenant_id },
          'created_at': { N: log.created_at.toString() },
          'audit_id': { S: log.audit_id },
          'event_type': { S: log.event_type },
          'user_id': { S: log.user_id },
          'ttl': { N: log.ttl.toString() },
        })),
        Count: 101,
      });

      const apiEvent = {
        httpMethod: 'GET',
        path: '/audit-logs',
        queryStringParameters: { limit: '100' },
        headers: {},
        requestContext: {
          authorizer: {
            claims: {
              'custom:tenant_id': 'tenant_abc',
              'custom:role': 'admin',
            },
          },
        },
      } as any;

      const response = await handler(apiEvent);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.pagination.has_more).toBe(true);
    });

    it('should reject limit > 1000', async () => {
      const apiEvent = {
        httpMethod: 'GET',
        path: '/audit-logs',
        queryStringParameters: { limit: '1001' },
        headers: {},
        requestContext: {
          authorizer: {
            claims: {
              'custom:tenant_id': 'tenant_abc',
              'custom:role': 'admin',
            },
          },
        },
      } as any;

      const response = await handler(apiEvent);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
    });

    it('should reject negative offset', async () => {
      const apiEvent = {
        httpMethod: 'GET',
        path: '/audit-logs',
        queryStringParameters: { offset: '-1' },
        headers: {},
        requestContext: {
          authorizer: {
            claims: {
              'custom:tenant_id': 'tenant_abc',
              'custom:role': 'admin',
            },
          },
        },
      } as any;

      const response = await handler(apiEvent);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
    });
  });

  describe('CSV Export', () => {
    it('should export audit logs as CSV', async () => {
      const mockLogs: AuditLogRecord[] = [
        {
          tenant_id: 'tenant_abc',
          created_at: Math.floor(Date.now() / 1000),
          audit_id: 'audit_001',
          event_type: AuditEventType.LOGIN,
          user_id: 'user_123',
          ip_address: '192.168.1.1',
          ttl: Math.floor(Date.now() / 1000) + 7776000,
        },
      ];

      dynamoDbMock.on(QueryCommand).resolves({
        Items: mockLogs.map(log => ({
          'tenant_id': { S: log.tenant_id },
          'created_at': { N: log.created_at.toString() },
          'audit_id': { S: log.audit_id },
          'event_type': { S: log.event_type },
          'user_id': { S: log.user_id },
          'ip_address': { S: log.ip_address || '' },
          'ttl': { N: log.ttl.toString() },
        })),
        Count: 1,
      });

      const apiEvent = {
        httpMethod: 'GET',
        path: '/audit-logs',
        queryStringParameters: { export: 'csv' },
        headers: {},
        requestContext: {
          authorizer: {
            claims: {
              'custom:tenant_id': 'tenant_abc',
              'custom:role': 'admin',
            },
          },
        },
      } as any;

      const response = await handler(apiEvent);

      expect(response.statusCode).toBe(200);
      expect(response.headers?.['Content-Type']).toBe('text/csv');
      expect(response.headers?.['Content-Disposition']).toContain('attachment');
      expect(response.body).toContain('audit_id');
      expect(response.body).toContain('event_type');
    });

    it('should include CSV headers', async () => {
      dynamoDbMock.on(QueryCommand).resolves({
        Items: [],
        Count: 0,
      });

      const apiEvent = {
        httpMethod: 'GET',
        path: '/audit-logs',
        queryStringParameters: { export: 'csv' },
        headers: {},
        requestContext: {
          authorizer: {
            claims: {
              'custom:tenant_id': 'tenant_abc',
              'custom:role': 'admin',
            },
          },
        },
      } as any;

      const response = await handler(apiEvent);

      expect(response.statusCode).toBe(200);
      expect(response.body).toContain('audit_id,event_type,user_id,tenant_id,created_at');
    });

    it('should properly escape CSV values', async () => {
      const mockLogs: AuditLogRecord[] = [
        {
          tenant_id: 'tenant_abc',
          created_at: Math.floor(Date.now() / 1000),
          audit_id: 'audit_001',
          event_type: AuditEventType.LOGIN,
          user_id: 'user_123',
          resource_type: 'test"with"quotes',
          ttl: Math.floor(Date.now() / 1000) + 7776000,
        },
      ];

      dynamoDbMock.on(QueryCommand).resolves({
        Items: mockLogs.map(log => ({
          'tenant_id': { S: log.tenant_id },
          'created_at': { N: log.created_at.toString() },
          'audit_id': { S: log.audit_id },
          'event_type': { S: log.event_type },
          'user_id': { S: log.user_id },
          'resource_type': { S: log.resource_type || '' },
          'ttl': { N: log.ttl.toString() },
        })),
        Count: 1,
      });

      const apiEvent = {
        httpMethod: 'GET',
        path: '/audit-logs',
        queryStringParameters: { export: 'csv' },
        headers: {},
        requestContext: {
          authorizer: {
            claims: {
              'custom:tenant_id': 'tenant_abc',
              'custom:role': 'admin',
            },
          },
        },
      } as any;

      const response = await handler(apiEvent);

      expect(response.statusCode).toBe(200);
      expect(response.body).toContain('""');
    });
  });

  describe('Authorization', () => {
    it('should reject non-admin users', async () => {
      const apiEvent = {
        httpMethod: 'GET',
        path: '/audit-logs',
        queryStringParameters: {},
        headers: {},
        requestContext: {
          authorizer: {
            claims: {
              'custom:tenant_id': 'tenant_abc',
              'custom:role': 'officer',
            },
          },
        },
      } as any;

      const response = await handler(apiEvent);

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
    });

    it('should allow super_admin users', async () => {
      const mockLogs: AuditLogRecord[] = [
        {
          tenant_id: 'tenant_abc',
          created_at: Math.floor(Date.now() / 1000),
          audit_id: 'audit_001',
          event_type: AuditEventType.LOGIN,
          user_id: 'user_123',
          ttl: Math.floor(Date.now() / 1000) + 7776000,
        },
      ];

      dynamoDbMock.on(QueryCommand).resolves({
        Items: mockLogs.map(log => ({
          'tenant_id': { S: log.tenant_id },
          'created_at': { N: log.created_at.toString() },
          'audit_id': { S: log.audit_id },
          'event_type': { S: log.event_type },
          'user_id': { S: log.user_id },
          'ttl': { N: log.ttl.toString() },
        })),
        Count: 1,
      });

      const apiEvent = {
        httpMethod: 'GET',
        path: '/audit-logs',
        queryStringParameters: {},
        headers: {},
        requestContext: {
          authorizer: {
            claims: {
              'custom:tenant_id': 'tenant_abc',
              'custom:role': 'super_admin',
            },
          },
        },
      } as any;

      const response = await handler(apiEvent);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
    });
  });

  describe('Combined Filters', () => {
    it('should filter by user_id and event_type together', async () => {
      const mockLogs: AuditLogRecord[] = [
        {
          tenant_id: 'tenant_abc',
          created_at: Math.floor(Date.now() / 1000),
          audit_id: 'audit_001',
          event_type: AuditEventType.LOGIN,
          user_id: 'user_123',
          ttl: Math.floor(Date.now() / 1000) + 7776000,
        },
      ];

      dynamoDbMock.on(QueryCommand).resolves({
        Items: mockLogs.map(log => ({
          'tenant_id': { S: log.tenant_id },
          'created_at': { N: log.created_at.toString() },
          'audit_id': { S: log.audit_id },
          'event_type': { S: log.event_type },
          'user_id': { S: log.user_id },
          'ttl': { N: log.ttl.toString() },
        })),
        Count: 1,
      });

      const apiEvent = {
        httpMethod: 'GET',
        path: '/audit-logs',
        queryStringParameters: {
          user_id: 'user_123',
          event_type: AuditEventType.LOGIN,
        },
        headers: {},
        requestContext: {
          authorizer: {
            claims: {
              'custom:tenant_id': 'tenant_abc',
              'custom:role': 'admin',
            },
          },
        },
      } as any;

      const response = await handler(apiEvent);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
    });

    it('should filter by all criteria together', async () => {
      const now = Math.floor(Date.now() / 1000);
      const mockLogs: AuditLogRecord[] = [
        {
          tenant_id: 'tenant_abc',
          created_at: now - 43200,
          audit_id: 'audit_001',
          event_type: AuditEventType.PRACTICE_SET_COMPLETION,
          user_id: 'user_123',
          ttl: now + 7776000,
        },
      ];

      dynamoDbMock.on(QueryCommand).resolves({
        Items: mockLogs.map(log => ({
          'tenant_id': { S: log.tenant_id },
          'created_at': { N: log.created_at.toString() },
          'audit_id': { S: log.audit_id },
          'event_type': { S: log.event_type },
          'user_id': { S: log.user_id },
          'ttl': { N: log.ttl.toString() },
        })),
        Count: 1,
      });

      const apiEvent = {
        httpMethod: 'GET',
        path: '/audit-logs',
        queryStringParameters: {
          user_id: 'user_123',
          event_type: AuditEventType.PRACTICE_SET_COMPLETION,
          start_date: (now - 86400).toString(),
          end_date: now.toString(),
          limit: '50',
          offset: '0',
        },
        headers: {},
        requestContext: {
          authorizer: {
            claims: {
              'custom:tenant_id': 'tenant_abc',
              'custom:role': 'admin',
            },
          },
        },
      } as any;

      const response = await handler(apiEvent);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
    });
  });
});
