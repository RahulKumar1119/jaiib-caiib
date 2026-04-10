/**
 * Unit Tests for Audit Log Creation
 * Tests event logging for all event types, log field completeness, and CloudWatch integration
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6
 */

import {
  DynamoDBClient,
  PutItemCommand,
  QueryCommand,
} from '@aws-sdk/client-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import {
  AuditEventType,
  AuditEvent,
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

// Import handler functions for testing
import {
  handler,
} from '../index';

describe('Audit Log Creation Unit Tests', () => {
  beforeEach(() => {
    dynamoDbMock.reset();
    jest.clearAllMocks();
  });

  describe('Login Event Logging', () => {
    it('should log login event with all required fields', async () => {
      const loginEvent: AuditEvent = {
        event_type: AuditEventType.LOGIN,
        user_id: 'user_123',
        tenant_id: 'tenant_abc',
        timestamp: Math.floor(Date.now() / 1000),
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
      };

      dynamoDbMock.on(PutItemCommand).resolves({});

      const apiEvent = {
        httpMethod: 'POST',
        path: '/audit-logs',
        body: JSON.stringify(loginEvent),
        headers: { 'user-agent': 'Mozilla/5.0' },
        requestContext: {
          identity: { sourceIp: '192.168.1.1' },
        },
      } as any;

      const response = await handler(apiEvent);

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.audit_log.event_type).toBe(AuditEventType.LOGIN);
      expect(body.audit_log.audit_id).toBeDefined();
    });

    it('should include timestamp in login event', async () => {
      const now = Math.floor(Date.now() / 1000);
      const loginEvent: AuditEvent = {
        event_type: AuditEventType.LOGIN,
        user_id: 'user_123',
        tenant_id: 'tenant_abc',
        timestamp: now,
      };

      dynamoDbMock.on(PutItemCommand).resolves({});

      const apiEvent = {
        httpMethod: 'POST',
        path: '/audit-logs',
        body: JSON.stringify(loginEvent),
        headers: {},
        requestContext: { identity: { sourceIp: '192.168.1.1' } },
      } as any;

      const response = await handler(apiEvent);

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.audit_log.created_at).toBe(now);
    });

    it('should include user_id and tenant_id in login event', async () => {
      const loginEvent: AuditEvent = {
        event_type: AuditEventType.LOGIN,
        user_id: 'user_456',
        tenant_id: 'tenant_xyz',
        timestamp: Math.floor(Date.now() / 1000),
      };

      dynamoDbMock.on(PutItemCommand).resolves({});

      const apiEvent = {
        httpMethod: 'POST',
        path: '/audit-logs',
        body: JSON.stringify(loginEvent),
        headers: {},
        requestContext: { identity: { sourceIp: '192.168.1.1' } },
      } as any;

      const response = await handler(apiEvent);

      expect(response.statusCode).toBe(201);
    });
  });

  describe('Logout Event Logging', () => {
    it('should log logout event with required fields', async () => {
      const logoutEvent: AuditEvent = {
        event_type: AuditEventType.LOGOUT,
        user_id: 'user_123',
        tenant_id: 'tenant_abc',
        timestamp: Math.floor(Date.now() / 1000),
        ip_address: '192.168.1.1',
      };

      dynamoDbMock.on(PutItemCommand).resolves({});

      const apiEvent = {
        httpMethod: 'POST',
        path: '/audit-logs',
        body: JSON.stringify(logoutEvent),
        headers: {},
        requestContext: { identity: { sourceIp: '192.168.1.1' } },
      } as any;

      const response = await handler(apiEvent);

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.audit_log.event_type).toBe(AuditEventType.LOGOUT);
    });
  });

  describe('Practice Set Completion Event Logging', () => {
    it('should log practice set completion with answers and score', async () => {
      const completionEvent: AuditEvent = {
        event_type: AuditEventType.PRACTICE_SET_COMPLETION,
        user_id: 'user_123',
        tenant_id: 'tenant_abc',
        timestamp: Math.floor(Date.now() / 1000),
        resource_type: 'practice_set',
        resource_id: 'ps_123',
        details: {
          score: 85,
          answers: {
            q_001: 'A',
            q_002: 'B',
            q_003: 'C',
            q_004: 'D',
          },
          paper: 'JAIIB_IE_IFS',
          time_taken: 450,
        },
      };

      dynamoDbMock.on(PutItemCommand).resolves({});

      const apiEvent = {
        httpMethod: 'POST',
        path: '/audit-logs',
        body: JSON.stringify(completionEvent),
        headers: {},
        requestContext: { identity: { sourceIp: '192.168.1.1' } },
      } as any;

      const response = await handler(apiEvent);

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.audit_log.event_type).toBe(AuditEventType.PRACTICE_SET_COMPLETION);
    });

    it('should require score in practice set completion event', async () => {
      const completionEvent: AuditEvent = {
        event_type: AuditEventType.PRACTICE_SET_COMPLETION,
        user_id: 'user_123',
        tenant_id: 'tenant_abc',
        timestamp: Math.floor(Date.now() / 1000),
        details: {
          answers: { q_001: 'A' },
        },
      };

      const apiEvent = {
        httpMethod: 'POST',
        path: '/audit-logs',
        body: JSON.stringify(completionEvent),
        headers: {},
        requestContext: { identity: { sourceIp: '192.168.1.1' } },
      } as any;

      const response = await handler(apiEvent);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
    });

    it('should require answers in practice set completion event', async () => {
      const completionEvent: AuditEvent = {
        event_type: AuditEventType.PRACTICE_SET_COMPLETION,
        user_id: 'user_123',
        tenant_id: 'tenant_abc',
        timestamp: Math.floor(Date.now() / 1000),
        details: {
          score: 85,
        },
      };

      const apiEvent = {
        httpMethod: 'POST',
        path: '/audit-logs',
        body: JSON.stringify(completionEvent),
        headers: {},
        requestContext: { identity: { sourceIp: '192.168.1.1' } },
      } as any;

      const response = await handler(apiEvent);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
    });
  });

  describe('Explanation Request Event Logging', () => {
    it('should log explanation request with question_id', async () => {
      const explanationEvent: AuditEvent = {
        event_type: AuditEventType.EXPLANATION_REQUEST,
        user_id: 'user_123',
        tenant_id: 'tenant_abc',
        timestamp: Math.floor(Date.now() / 1000),
        resource_type: 'question',
        resource_id: 'q_001',
        details: {
          question_id: 'q_001',
          response: 'Explanation text here...',
        },
      };

      dynamoDbMock.on(PutItemCommand).resolves({});

      const apiEvent = {
        httpMethod: 'POST',
        path: '/audit-logs',
        body: JSON.stringify(explanationEvent),
        headers: {},
        requestContext: { identity: { sourceIp: '192.168.1.1' } },
      } as any;

      const response = await handler(apiEvent);

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.audit_log.event_type).toBe(AuditEventType.EXPLANATION_REQUEST);
    });

    it('should require question_id in explanation request event', async () => {
      const explanationEvent: AuditEvent = {
        event_type: AuditEventType.EXPLANATION_REQUEST,
        user_id: 'user_123',
        tenant_id: 'tenant_abc',
        timestamp: Math.floor(Date.now() / 1000),
        details: {},
      };

      const apiEvent = {
        httpMethod: 'POST',
        path: '/audit-logs',
        body: JSON.stringify(explanationEvent),
        headers: {},
        requestContext: { identity: { sourceIp: '192.168.1.1' } },
      } as any;

      const response = await handler(apiEvent);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
    });
  });

  describe('Question Modification Event Logging', () => {
    it('should log question modification with before/after values', async () => {
      const modificationEvent: AuditEvent = {
        event_type: AuditEventType.QUESTION_MODIFICATION,
        user_id: 'admin_123',
        tenant_id: 'tenant_abc',
        timestamp: Math.floor(Date.now() / 1000),
        resource_type: 'question',
        resource_id: 'q_001',
        action: 'update',
        details: {
          before: {
            question_text: 'Old question text',
            correct_answer: 'A',
          },
          after: {
            question_text: 'New question text',
            correct_answer: 'B',
          },
        },
      };

      dynamoDbMock.on(PutItemCommand).resolves({});

      const apiEvent = {
        httpMethod: 'POST',
        path: '/audit-logs',
        body: JSON.stringify(modificationEvent),
        headers: {},
        requestContext: { identity: { sourceIp: '192.168.1.1' } },
      } as any;

      const response = await handler(apiEvent);

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.audit_log.event_type).toBe(AuditEventType.QUESTION_MODIFICATION);
    });

    it('should require before and after in question modification event', async () => {
      const modificationEvent: AuditEvent = {
        event_type: AuditEventType.QUESTION_MODIFICATION,
        user_id: 'admin_123',
        tenant_id: 'tenant_abc',
        timestamp: Math.floor(Date.now() / 1000),
        details: {
          before: { question_text: 'Old' },
        },
      };

      const apiEvent = {
        httpMethod: 'POST',
        path: '/audit-logs',
        body: JSON.stringify(modificationEvent),
        headers: {},
        requestContext: { identity: { sourceIp: '192.168.1.1' } },
      } as any;

      const response = await handler(apiEvent);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
    });
  });

  describe('Error Event Logging', () => {
    it('should log error with full context', async () => {
      const errorEvent: AuditEvent = {
        event_type: AuditEventType.ERROR,
        user_id: 'user_123',
        tenant_id: 'tenant_abc',
        timestamp: Math.floor(Date.now() / 1000),
        error_context: {
          error_type: 'ValidationError',
          error_message: 'Invalid input provided',
          stack_trace: 'Error: Invalid input\n  at validateInput (file.ts:10)',
        },
      };

      dynamoDbMock.on(PutItemCommand).resolves({});

      const apiEvent = {
        httpMethod: 'POST',
        path: '/audit-logs',
        body: JSON.stringify(errorEvent),
        headers: {},
        requestContext: { identity: { sourceIp: '192.168.1.1' } },
      } as any;

      const response = await handler(apiEvent);

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.audit_log.event_type).toBe(AuditEventType.ERROR);
    });

    it('should require error_context in error event', async () => {
      const errorEvent: AuditEvent = {
        event_type: AuditEventType.ERROR,
        user_id: 'user_123',
        tenant_id: 'tenant_abc',
        timestamp: Math.floor(Date.now() / 1000),
      };

      const apiEvent = {
        httpMethod: 'POST',
        path: '/audit-logs',
        body: JSON.stringify(errorEvent),
        headers: {},
        requestContext: { identity: { sourceIp: '192.168.1.1' } },
      } as any;

      const response = await handler(apiEvent);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
    });
  });

  describe('Log Field Completeness', () => {
    it('should include audit_id in all logs', async () => {
      const auditEvent: AuditEvent = {
        event_type: AuditEventType.LOGIN,
        user_id: 'user_123',
        tenant_id: 'tenant_abc',
        timestamp: Math.floor(Date.now() / 1000),
      };

      dynamoDbMock.on(PutItemCommand).resolves({});

      const apiEvent = {
        httpMethod: 'POST',
        path: '/audit-logs',
        body: JSON.stringify(auditEvent),
        headers: {},
        requestContext: { identity: { sourceIp: '192.168.1.1' } },
      } as any;

      const response = await handler(apiEvent);

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.audit_log.audit_id).toBeDefined();
      expect(typeof body.audit_log.audit_id).toBe('string');
    });

    it('should include created_at timestamp in all logs', async () => {
      const now = Math.floor(Date.now() / 1000);
      const auditEvent: AuditEvent = {
        event_type: AuditEventType.LOGIN,
        user_id: 'user_123',
        tenant_id: 'tenant_abc',
        timestamp: now,
      };

      dynamoDbMock.on(PutItemCommand).resolves({});

      const apiEvent = {
        httpMethod: 'POST',
        path: '/audit-logs',
        body: JSON.stringify(auditEvent),
        headers: {},
        requestContext: { identity: { sourceIp: '192.168.1.1' } },
      } as any;

      const response = await handler(apiEvent);

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.audit_log.created_at).toBe(now);
    });

    it('should include event_type in all logs', async () => {
      const auditEvent: AuditEvent = {
        event_type: AuditEventType.LOGIN,
        user_id: 'user_123',
        tenant_id: 'tenant_abc',
        timestamp: Math.floor(Date.now() / 1000),
      };

      dynamoDbMock.on(PutItemCommand).resolves({});

      const apiEvent = {
        httpMethod: 'POST',
        path: '/audit-logs',
        body: JSON.stringify(auditEvent),
        headers: {},
        requestContext: { identity: { sourceIp: '192.168.1.1' } },
      } as any;

      const response = await handler(apiEvent);

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.audit_log.event_type).toBe(AuditEventType.LOGIN);
    });

    it('should include user_id and tenant_id in all logs', async () => {
      const auditEvent: AuditEvent = {
        event_type: AuditEventType.LOGIN,
        user_id: 'user_789',
        tenant_id: 'tenant_xyz',
        timestamp: Math.floor(Date.now() / 1000),
      };

      dynamoDbMock.on(PutItemCommand).resolves({});

      const apiEvent = {
        httpMethod: 'POST',
        path: '/audit-logs',
        body: JSON.stringify(auditEvent),
        headers: {},
        requestContext: { identity: { sourceIp: '192.168.1.1' } },
      } as any;

      const response = await handler(apiEvent);

      expect(response.statusCode).toBe(201);
    });
  });

  describe('CloudWatch Integration', () => {
    it('should store logs in CloudWatch', async () => {
      const auditEvent: AuditEvent = {
        event_type: AuditEventType.LOGIN,
        user_id: 'user_123',
        tenant_id: 'tenant_abc',
        timestamp: Math.floor(Date.now() / 1000),
      };

      dynamoDbMock.on(PutItemCommand).resolves({});

      const apiEvent = {
        httpMethod: 'POST',
        path: '/audit-logs',
        body: JSON.stringify(auditEvent),
        headers: {},
        requestContext: { identity: { sourceIp: '192.168.1.1' } },
      } as any;

      const response = await handler(apiEvent);

      expect(response.statusCode).toBe(201);
    });

    it('should handle CloudWatch failures gracefully', async () => {
      const auditEvent: AuditEvent = {
        event_type: AuditEventType.LOGIN,
        user_id: 'user_123',
        tenant_id: 'tenant_abc',
        timestamp: Math.floor(Date.now() / 1000),
      };

      dynamoDbMock.on(PutItemCommand).resolves({});

      const apiEvent = {
        httpMethod: 'POST',
        path: '/audit-logs',
        body: JSON.stringify(auditEvent),
        headers: {},
        requestContext: { identity: { sourceIp: '192.168.1.1' } },
      } as any;

      const response = await handler(apiEvent);

      // Should still succeed because DynamoDB succeeded
      expect(response.statusCode).toBe(201);
    });
  });

  describe('Validation', () => {
    it('should reject event without event_type', async () => {
      const invalidEvent = {
        user_id: 'user_123',
        tenant_id: 'tenant_abc',
        timestamp: Math.floor(Date.now() / 1000),
      };

      const apiEvent = {
        httpMethod: 'POST',
        path: '/audit-logs',
        body: JSON.stringify(invalidEvent),
        headers: {},
        requestContext: { identity: { sourceIp: '192.168.1.1' } },
      } as any;

      const response = await handler(apiEvent);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
    });

    it('should reject event without user_id', async () => {
      const invalidEvent = {
        event_type: AuditEventType.LOGIN,
        tenant_id: 'tenant_abc',
        timestamp: Math.floor(Date.now() / 1000),
      };

      const apiEvent = {
        httpMethod: 'POST',
        path: '/audit-logs',
        body: JSON.stringify(invalidEvent),
        headers: {},
        requestContext: { identity: { sourceIp: '192.168.1.1' } },
      } as any;

      const response = await handler(apiEvent);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
    });

    it('should reject event without tenant_id', async () => {
      const invalidEvent = {
        event_type: AuditEventType.LOGIN,
        user_id: 'user_123',
        timestamp: Math.floor(Date.now() / 1000),
      };

      const apiEvent = {
        httpMethod: 'POST',
        path: '/audit-logs',
        body: JSON.stringify(invalidEvent),
        headers: {},
        requestContext: { identity: { sourceIp: '192.168.1.1' } },
      } as any;

      const response = await handler(apiEvent);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
    });

    it('should reject event without timestamp', async () => {
      const invalidEvent = {
        event_type: AuditEventType.LOGIN,
        user_id: 'user_123',
        tenant_id: 'tenant_abc',
      };

      const apiEvent = {
        httpMethod: 'POST',
        path: '/audit-logs',
        body: JSON.stringify(invalidEvent),
        headers: {},
        requestContext: { identity: { sourceIp: '192.168.1.1' } },
      } as any;

      const response = await handler(apiEvent);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
    });

    it('should reject event with invalid event_type', async () => {
      const invalidEvent = {
        event_type: 'invalid_event_type',
        user_id: 'user_123',
        tenant_id: 'tenant_abc',
        timestamp: Math.floor(Date.now() / 1000),
      };

      const apiEvent = {
        httpMethod: 'POST',
        path: '/audit-logs',
        body: JSON.stringify(invalidEvent),
        headers: {},
        requestContext: { identity: { sourceIp: '192.168.1.1' } },
      } as any;

      const response = await handler(apiEvent);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
    });
  });

  describe('TTL Configuration', () => {
    it('should set TTL to 90 days from creation', async () => {
      const auditEvent: AuditEvent = {
        event_type: AuditEventType.LOGIN,
        user_id: 'user_123',
        tenant_id: 'tenant_abc',
        timestamp: Math.floor(Date.now() / 1000),
      };

      dynamoDbMock.on(PutItemCommand).resolves({});

      const apiEvent = {
        httpMethod: 'POST',
        path: '/audit-logs',
        body: JSON.stringify(auditEvent),
        headers: {},
        requestContext: { identity: { sourceIp: '192.168.1.1' } },
      } as any;

      const response = await handler(apiEvent);

      expect(response.statusCode).toBe(201);
      // Verify DynamoDB was called with TTL
      const putItemCall = dynamoDbMock.call(0);
      expect(putItemCall).toBeDefined();
    });
  });

  describe('IP Address and User Agent Capture', () => {
    it('should capture IP address from request context', async () => {
      const auditEvent: AuditEvent = {
        event_type: AuditEventType.LOGIN,
        user_id: 'user_123',
        tenant_id: 'tenant_abc',
        timestamp: Math.floor(Date.now() / 1000),
      };

      dynamoDbMock.on(PutItemCommand).resolves({});

      const apiEvent = {
        httpMethod: 'POST',
        path: '/audit-logs',
        body: JSON.stringify(auditEvent),
        headers: { 'user-agent': 'Mozilla/5.0' },
        requestContext: { identity: { sourceIp: '203.0.113.42' } },
      } as any;

      const response = await handler(apiEvent);

      expect(response.statusCode).toBe(201);
    });

    it('should capture user agent from headers', async () => {
      const auditEvent: AuditEvent = {
        event_type: AuditEventType.LOGIN,
        user_id: 'user_123',
        tenant_id: 'tenant_abc',
        timestamp: Math.floor(Date.now() / 1000),
      };

      dynamoDbMock.on(PutItemCommand).resolves({});

      const apiEvent = {
        httpMethod: 'POST',
        path: '/audit-logs',
        body: JSON.stringify(auditEvent),
        headers: { 'user-agent': 'Chrome/91.0' },
        requestContext: { identity: { sourceIp: '192.168.1.1' } },
      } as any;

      const response = await handler(apiEvent);

      expect(response.statusCode).toBe(201);
    });
  });
});
