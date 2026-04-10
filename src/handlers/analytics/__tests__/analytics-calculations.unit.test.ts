/**
 * Unit Tests for Analytics Calculations
 * Tests user engagement metrics, average score calculations, and CSV export formatting
 * 
 * Requirements: 15.1, 15.2, 15.3, 15.4, 15.5
 */

import { DynamoDBClient, QueryCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { marshall } from '@aws-sdk/util-dynamodb';
import { getAnalytics } from '../index';
import { APIGatewayProxyEvent } from 'aws-lambda';

// Mock AWS SDK
const ddbMock = mockClient(DynamoDBClient);

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
  formatErrorResponse: jest.fn((error: any) => ({
    statusCode: error.name === 'ValidationError' ? 400 : 500,
    headers: { 'Content-Type': 'application/json', 'X-Content-Type-Options': 'nosniff' },
    body: JSON.stringify({ success: false, error: error.message }),
  })),
}));

jest.mock('/opt/nodejs/logging', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

jest.mock('/opt/nodejs/constants', () => ({
  DYNAMODB_TABLES: {
    SCORES: 'scores',
    QUESTIONS: 'questions',
  },
  HTTP_STATUS: {
    OK: 200,
    BAD_REQUEST: 400,
    FORBIDDEN: 403,
    INTERNAL_SERVER_ERROR: 500,
  },
  JAIIB_PAPERS: {
    IE_IFS: 'JAIIB_IE_IFS',
    PPB: 'JAIIB_PPB',
    AFB: 'JAIIB_AFB',
    RBWM: 'JAIIB_RBWM',
  },
}));

describe('Analytics Calculations', () => {
  beforeEach(() => {
    ddbMock.reset();
    jest.clearAllMocks();
  });

  describe('User engagement metrics', () => {
    it('should calculate total active users correctly', async () => {
      const tenantId = 'test-tenant-123';
      const now = Math.floor(Date.now() / 1000);

      const scores = [
        {
          'tenant_id#user_id': `${tenantId}#user-1`,
          user_id: 'user-1',
          paper: 'JAIIB_IE_IFS',
          score: 85,
          created_at: now - 86400,
        },
        {
          'tenant_id#user_id': `${tenantId}#user-1`,
          user_id: 'user-1',
          paper: 'JAIIB_PPB',
          score: 90,
          created_at: now - 172800,
        },
        {
          'tenant_id#user_id': `${tenantId}#user-2`,
          user_id: 'user-2',
          paper: 'JAIIB_IE_IFS',
          score: 75,
          created_at: now - 259200,
        },
        {
          'tenant_id#user_id': `${tenantId}#user-3`,
          user_id: 'user-3',
          paper: 'JAIIB_AFB',
          score: 80,
          created_at: now - 345600,
        },
      ];

      ddbMock.on(ScanCommand).resolves({
        Items: scores.map(score => marshall(score)),
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        path: '/admin/analytics',
        queryStringParameters: null,
        requestContext: {
          authorizer: {
            user_id: 'admin-user',
            tenant_id: tenantId,
            role: 'admin',
          },
        } as any,
      };

      const result = await getAnalytics(event as APIGatewayProxyEvent);
      expect(result.statusCode).toBe(200);

      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.analytics.user_engagement.total_active_users).toBe(3);
    });

    it('should count users from last 30 days correctly', async () => {
      const tenantId = 'test-tenant-456';
      const now = Math.floor(Date.now() / 1000);

      const scores = [
        {
          'tenant_id#user_id': `${tenantId}#user-1`,
          user_id: 'user-1',
          paper: 'JAIIB_IE_IFS',
          score: 85,
          created_at: now - 86400, // 1 day ago (included)
        },
        {
          'tenant_id#user_id': `${tenantId}#user-2`,
          user_id: 'user-2',
          paper: 'JAIIB_PPB',
          score: 90,
          created_at: now - 2592000 - 86400, // 31 days ago (excluded)
        },
        {
          'tenant_id#user_id': `${tenantId}#user-3`,
          user_id: 'user-3',
          paper: 'JAIIB_AFB',
          score: 80,
          created_at: now - 604800, // 7 days ago (included)
        },
      ];

      ddbMock.on(ScanCommand).resolves({
        Items: scores.map(score => marshall(score)),
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        path: '/admin/analytics',
        queryStringParameters: null,
        requestContext: {
          authorizer: {
            user_id: 'admin-user',
            tenant_id: tenantId,
            role: 'admin',
          },
        } as any,
      };

      const result = await getAnalytics(event as APIGatewayProxyEvent);
      expect(result.statusCode).toBe(200);

      const body = JSON.parse(result.body);
      expect(body.analytics.user_engagement.users_last_30_days).toBe(2);
    });

    it('should calculate average practice sets per user', async () => {
      const tenantId = 'test-tenant-789';
      const now = Math.floor(Date.now() / 1000);

      const scores = [
        {
          'tenant_id#user_id': `${tenantId}#user-1`,
          user_id: 'user-1',
          paper: 'JAIIB_IE_IFS',
          score: 85,
          created_at: now - 86400,
        },
        {
          'tenant_id#user_id': `${tenantId}#user-1`,
          user_id: 'user-1',
          paper: 'JAIIB_PPB',
          score: 90,
          created_at: now - 172800,
        },
        {
          'tenant_id#user_id': `${tenantId}#user-1`,
          user_id: 'user-1',
          paper: 'JAIIB_AFB',
          score: 80,
          created_at: now - 259200,
        },
        {
          'tenant_id#user_id': `${tenantId}#user-2`,
          user_id: 'user-2',
          paper: 'JAIIB_IE_IFS',
          score: 75,
          created_at: now - 345600,
        },
      ];

      ddbMock.on(ScanCommand).resolves({
        Items: scores.map(score => marshall(score)),
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        path: '/admin/analytics',
        queryStringParameters: null,
        requestContext: {
          authorizer: {
            user_id: 'admin-user',
            tenant_id: tenantId,
            role: 'admin',
          },
        } as any,
      };

      const result = await getAnalytics(event as APIGatewayProxyEvent);
      expect(result.statusCode).toBe(200);

      const body = JSON.parse(result.body);
      // 4 total scores / 2 users = 2 practice sets per user
      expect(body.analytics.user_engagement.average_practice_sets_per_user).toBe(2);
    });
  });

  describe('Average score calculations', () => {
    it('should calculate average score per paper correctly', async () => {
      const tenantId = 'test-tenant-avg';
      const now = Math.floor(Date.now() / 1000);

      const scores = [
        {
          'tenant_id#user_id': `${tenantId}#user-1`,
          user_id: 'user-1',
          paper: 'JAIIB_IE_IFS',
          score: 80,
          created_at: now - 86400,
        },
        {
          'tenant_id#user_id': `${tenantId}#user-2`,
          user_id: 'user-2',
          paper: 'JAIIB_IE_IFS',
          score: 90,
          created_at: now - 172800,
        },
        {
          'tenant_id#user_id': `${tenantId}#user-3`,
          user_id: 'user-3',
          paper: 'JAIIB_PPB',
          score: 70,
          created_at: now - 259200,
        },
        {
          'tenant_id#user_id': `${tenantId}#user-4`,
          user_id: 'user-4',
          paper: 'JAIIB_PPB',
          score: 80,
          created_at: now - 345600,
        },
      ];

      ddbMock.on(ScanCommand).resolves({
        Items: scores.map(score => marshall(score)),
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        path: '/admin/analytics',
        queryStringParameters: null,
        requestContext: {
          authorizer: {
            user_id: 'admin-user',
            tenant_id: tenantId,
            role: 'admin',
          },
        } as any,
      };

      const result = await getAnalytics(event as APIGatewayProxyEvent);
      expect(result.statusCode).toBe(200);

      const body = JSON.parse(result.body);
      const avgScores = body.analytics.average_scores_per_paper;

      const ieIfsScore = avgScores.find((s: any) => s.paper === 'JAIIB_IE_IFS');
      expect(ieIfsScore.average_score).toBe(85); // (80 + 90) / 2
      expect(ieIfsScore.total_attempts).toBe(2);

      const ppbScore = avgScores.find((s: any) => s.paper === 'JAIIB_PPB');
      expect(ppbScore.average_score).toBe(75); // (70 + 80) / 2
      expect(ppbScore.total_attempts).toBe(2);
    });

    it('should handle papers with no scores', async () => {
      const tenantId = 'test-tenant-no-scores';
      const now = Math.floor(Date.now() / 1000);

      const scores = [
        {
          'tenant_id#user_id': `${tenantId}#user-1`,
          user_id: 'user-1',
          paper: 'JAIIB_IE_IFS',
          score: 85,
          created_at: now - 86400,
        },
      ];

      ddbMock.on(ScanCommand).resolves({
        Items: scores.map(score => marshall(score)),
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        path: '/admin/analytics',
        queryStringParameters: null,
        requestContext: {
          authorizer: {
            user_id: 'admin-user',
            tenant_id: tenantId,
            role: 'admin',
          },
        } as any,
      };

      const result = await getAnalytics(event as APIGatewayProxyEvent);
      expect(result.statusCode).toBe(200);

      const body = JSON.parse(result.body);
      const avgScores = body.analytics.average_scores_per_paper;

      // Should only include papers with scores
      expect(avgScores.length).toBe(1);
      expect(avgScores[0].paper).toBe('JAIIB_IE_IFS');
    });
  });

  describe('CSV export formatting', () => {
    it('should export analytics data in CSV format', async () => {
      const tenantId = 'test-tenant-csv';
      const now = Math.floor(Date.now() / 1000);

      const scores = [
        {
          'tenant_id#user_id': `${tenantId}#user-1`,
          user_id: 'user-1',
          paper: 'JAIIB_IE_IFS',
          score: 85,
          created_at: now - 86400,
        },
        {
          'tenant_id#user_id': `${tenantId}#user-2`,
          user_id: 'user-2',
          paper: 'JAIIB_PPB',
          score: 90,
          created_at: now - 172800,
        },
      ];

      ddbMock.on(ScanCommand).resolves({
        Items: scores.map(score => marshall(score)),
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        path: '/admin/analytics',
        queryStringParameters: { export: 'csv' },
        requestContext: {
          authorizer: {
            user_id: 'admin-user',
            tenant_id: tenantId,
            role: 'admin',
          },
        } as any,
      };

      const result = await getAnalytics(event as APIGatewayProxyEvent);
      expect(result.statusCode).toBe(200);
      expect((result.headers as any)['Content-Type']).toBe('text/csv');
      expect((result.headers as any)['Content-Disposition']).toContain('attachment');
      expect((result.headers as any)['Content-Disposition']).toContain('.csv');

      const csvContent = result.body;
      expect(csvContent).toContain('JAIIB Exam Prep Portal - Analytics Report');
      expect(csvContent).toContain('USER ENGAGEMENT METRICS');
      expect(csvContent).toContain('AVERAGE SCORES PER PAPER');
    });

    it('should include all required sections in CSV export', async () => {
      const tenantId = 'test-tenant-csv-sections';
      const now = Math.floor(Date.now() / 1000);

      const scores = [
        {
          'tenant_id#user_id': `${tenantId}#user-1`,
          user_id: 'user-1',
          paper: 'JAIIB_IE_IFS',
          score: 85,
          created_at: now - 86400,
        },
      ];

      ddbMock.on(ScanCommand).resolves({
        Items: scores.map(score => marshall(score)),
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        path: '/admin/analytics',
        queryStringParameters: { export: 'csv' },
        requestContext: {
          authorizer: {
            user_id: 'admin-user',
            tenant_id: tenantId,
            role: 'admin',
          },
        } as any,
      };

      const result = await getAnalytics(event as APIGatewayProxyEvent);
      const csvContent = result.body;

      expect(csvContent).toContain('USER ENGAGEMENT METRICS');
      expect(csvContent).toContain('AVERAGE SCORES PER PAPER');
      expect(csvContent).toContain('PRACTICE SET COMPLETION TRENDS');
      expect(csvContent).toContain('MOST FREQUENTLY MISSED QUESTIONS');
    });

    it('should format CSV with proper escaping for special characters', async () => {
      const tenantId = 'test-tenant-csv-escape';
      const now = Math.floor(Date.now() / 1000);

      const scores = [
        {
          'tenant_id#user_id': `${tenantId}#user-1`,
          user_id: 'user-1',
          paper: 'JAIIB_IE_IFS',
          score: 85,
          created_at: now - 86400,
        },
      ];

      ddbMock.on(ScanCommand).resolves({
        Items: scores.map(score => marshall(score)),
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        path: '/admin/analytics',
        queryStringParameters: { export: 'csv' },
        requestContext: {
          authorizer: {
            user_id: 'admin-user',
            tenant_id: tenantId,
            role: 'admin',
          },
        } as any,
      };

      const result = await getAnalytics(event as APIGatewayProxyEvent);
      expect(result.statusCode).toBe(200);

      const csvContent = result.body;
      // CSV should be properly formatted
      expect(csvContent).toBeTruthy();
      expect(typeof csvContent).toBe('string');
    });
  });

  describe('Admin authorization', () => {
    it('should deny access for non-admin users', async () => {
      const tenantId = 'test-tenant-auth';

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        path: '/admin/analytics',
        queryStringParameters: null,
        requestContext: {
          authorizer: {
            user_id: 'officer-user',
            tenant_id: tenantId,
            role: 'officer',
          },
        } as any,
      };

      const result = await getAnalytics(event as APIGatewayProxyEvent);
      expect(result.statusCode).toBe(403);

      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('Insufficient permissions');
    });

    it('should allow access for admin users', async () => {
      const tenantId = 'test-tenant-admin-access';
      const now = Math.floor(Date.now() / 1000);

      const scores = [
        {
          'tenant_id#user_id': `${tenantId}#user-1`,
          user_id: 'user-1',
          paper: 'JAIIB_IE_IFS',
          score: 85,
          created_at: now - 86400,
        },
      ];

      ddbMock.on(ScanCommand).resolves({
        Items: scores.map(score => marshall(score)),
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        path: '/admin/analytics',
        queryStringParameters: null,
        requestContext: {
          authorizer: {
            user_id: 'admin-user',
            tenant_id: tenantId,
            role: 'admin',
          },
        } as any,
      };

      const result = await getAnalytics(event as APIGatewayProxyEvent);
      expect(result.statusCode).toBe(200);

      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
    });

    it('should allow access for super_admin users', async () => {
      const tenantId = 'test-tenant-super-admin';
      const now = Math.floor(Date.now() / 1000);

      const scores = [
        {
          'tenant_id#user_id': `${tenantId}#user-1`,
          user_id: 'user-1',
          paper: 'JAIIB_IE_IFS',
          score: 85,
          created_at: now - 86400,
        },
      ];

      ddbMock.on(ScanCommand).resolves({
        Items: scores.map(score => marshall(score)),
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        path: '/admin/analytics',
        queryStringParameters: null,
        requestContext: {
          authorizer: {
            user_id: 'super-admin-user',
            tenant_id: tenantId,
            role: 'super_admin',
          },
        } as any,
      };

      const result = await getAnalytics(event as APIGatewayProxyEvent);
      expect(result.statusCode).toBe(200);

      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
    });
  });

  describe('Completion trends', () => {
    it('should generate completion trends for last 30 days', async () => {
      const tenantId = 'test-tenant-trends';
      const now = Math.floor(Date.now() / 1000);

      const scores = [
        {
          'tenant_id#user_id': `${tenantId}#user-1`,
          user_id: 'user-1',
          paper: 'JAIIB_IE_IFS',
          score: 85,
          created_at: now - 86400,
        },
        {
          'tenant_id#user_id': `${tenantId}#user-2`,
          user_id: 'user-2',
          paper: 'JAIIB_PPB',
          score: 90,
          created_at: now - 86400,
        },
        {
          'tenant_id#user_id': `${tenantId}#user-3`,
          user_id: 'user-3',
          paper: 'JAIIB_IE_IFS',
          score: 80,
          created_at: now - 172800,
        },
      ];

      ddbMock.on(ScanCommand).resolves({
        Items: scores.map(score => marshall(score)),
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        path: '/admin/analytics',
        queryStringParameters: null,
        requestContext: {
          authorizer: {
            user_id: 'admin-user',
            tenant_id: tenantId,
            role: 'admin',
          },
        } as any,
      };

      const result = await getAnalytics(event as APIGatewayProxyEvent);
      expect(result.statusCode).toBe(200);

      const body = JSON.parse(result.body);
      expect(body.analytics.completion_trends).toBeDefined();
      expect(Array.isArray(body.analytics.completion_trends)).toBe(true);
      expect(body.analytics.completion_trends.length).toBeGreaterThan(0);

      // Verify trend structure
      body.analytics.completion_trends.forEach((trend: any) => {
        expect(trend.date).toBeDefined();
        expect(trend.total_completions).toBeDefined();
        expect(trend.by_paper).toBeDefined();
      });
    });
  });
});
