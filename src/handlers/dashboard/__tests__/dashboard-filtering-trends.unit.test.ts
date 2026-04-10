/**
 * Unit Tests for Dashboard Filtering and Trend Analysis
 * Tests paper-specific metric filtering, trend data calculation, and date range handling
 * 
 * Requirements: 7.3, 7.6
 */

import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { marshall } from '@aws-sdk/util-dynamodb';
import { getMetrics } from '../index';
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
  },
  HTTP_STATUS: {
    OK: 200,
    BAD_REQUEST: 400,
    INTERNAL_SERVER_ERROR: 500,
  },
  JAIIB_PAPERS: {
    IE_IFS: 'JAIIB_IE_IFS',
    PPB: 'JAIIB_PPB',
    AFB: 'JAIIB_AFB',
    RBWM: 'JAIIB_RBWM',
  },
}));

describe('Dashboard Filtering and Trend Analysis', () => {
  beforeEach(() => {
    ddbMock.reset();
    jest.clearAllMocks();
  });

  describe('Paper-specific metric filtering', () => {
    it('should filter metrics for a specific paper', async () => {
      const userId = 'test-user-123';
      const tenantId = 'test-tenant-123';
      const filterPaper = 'JAIIB_IE_IFS';

      const scores = [
        {
          score_id: 'score-1',
          paper: 'JAIIB_IE_IFS',
          score: 85,
          created_at: Math.floor(Date.now() / 1000) - 86400,
        },
        {
          score_id: 'score-2',
          paper: 'JAIIB_IE_IFS',
          score: 90,
          created_at: Math.floor(Date.now() / 1000) - 172800,
        },
        {
          score_id: 'score-3',
          paper: 'JAIIB_PPB',
          score: 75,
          created_at: Math.floor(Date.now() / 1000) - 259200,
        },
        {
          score_id: 'score-4',
          paper: 'JAIIB_AFB',
          score: 80,
          created_at: Math.floor(Date.now() / 1000) - 345600,
        },
      ];

      ddbMock.on(QueryCommand).resolves({
        Items: scores.map(score =>
          marshall({
            'tenant_id#user_id': `${tenantId}#${userId}`,
            ...score,
          })
        ),
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        path: '/dashboard/metrics',
        queryStringParameters: { paper: filterPaper },
        requestContext: {
          authorizer: {
            user_id: userId,
            tenant_id: tenantId,
          },
        } as any,
      };

      const result = await getMetrics(event as APIGatewayProxyEvent);
      expect(result.statusCode).toBe(200);

      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);

      // Should only include scores for the filtered paper
      expect(body.metrics.total_practice_sets).toBe(2);
      expect(body.metrics.average_score).toBe(87.5);
      expect(body.metrics.paper_stats[filterPaper]).toBeDefined();
      expect(body.metrics.paper_stats[filterPaper].average_score).toBe(87.5);
      expect(body.metrics.paper_stats[filterPaper].highest_score).toBe(90);
      expect(body.metrics.paper_stats[filterPaper].practice_count).toBe(2);
    });

    it('should return only filtered paper stats when paper filter is applied', async () => {
      const userId = 'test-user-456';
      const tenantId = 'test-tenant-456';
      const filterPaper = 'JAIIB_PPB';

      const scores = [
        {
          score_id: 'score-1',
          paper: 'JAIIB_IE_IFS',
          score: 85,
          created_at: Math.floor(Date.now() / 1000),
        },
        {
          score_id: 'score-2',
          paper: 'JAIIB_PPB',
          score: 92,
          created_at: Math.floor(Date.now() / 1000) - 86400,
        },
        {
          score_id: 'score-3',
          paper: 'JAIIB_PPB',
          score: 88,
          created_at: Math.floor(Date.now() / 1000) - 172800,
        },
      ];

      ddbMock.on(QueryCommand).resolves({
        Items: scores.map(score =>
          marshall({
            'tenant_id#user_id': `${tenantId}#${userId}`,
            ...score,
          })
        ),
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        path: '/dashboard/metrics',
        queryStringParameters: { paper: filterPaper },
        requestContext: {
          authorizer: {
            user_id: userId,
            tenant_id: tenantId,
          },
        } as any,
      };

      const result = await getMetrics(event as APIGatewayProxyEvent);
      expect(result.statusCode).toBe(200);

      const body = JSON.parse(result.body);
      expect(body.metrics.paper_stats[filterPaper]).toBeDefined();
      expect(body.metrics.paper_stats[filterPaper].practice_count).toBe(2);
      expect(body.metrics.paper_stats[filterPaper].average_score).toBe(90);
    });

    it('should reject invalid paper filter', async () => {
      const userId = 'test-user-789';
      const tenantId = 'test-tenant-789';

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        path: '/dashboard/metrics',
        queryStringParameters: { paper: 'INVALID_PAPER' },
        requestContext: {
          authorizer: {
            user_id: userId,
            tenant_id: tenantId,
          },
        } as any,
      };

      const result = await getMetrics(event as APIGatewayProxyEvent);
      expect(result.statusCode).toBe(400);

      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('Invalid paper');
    });
  });

  describe('Trend data calculation', () => {
    it('should calculate trend data for last 30 days', async () => {
      const userId = 'test-user-trend';
      const tenantId = 'test-tenant-trend';
      const now = Math.floor(Date.now() / 1000);

      const scores = [
        {
          score_id: 'score-1',
          paper: 'JAIIB_IE_IFS',
          score: 80,
          created_at: now - 86400, // 1 day ago
        },
        {
          score_id: 'score-2',
          paper: 'JAIIB_IE_IFS',
          score: 85,
          created_at: now - 86400, // Same day
        },
        {
          score_id: 'score-3',
          paper: 'JAIIB_IE_IFS',
          score: 90,
          created_at: now - 172800, // 2 days ago
        },
        {
          score_id: 'score-4',
          paper: 'JAIIB_IE_IFS',
          score: 75,
          created_at: now - 259200, // 3 days ago
        },
      ];

      ddbMock.on(QueryCommand).resolves({
        Items: scores.map(score =>
          marshall({
            'tenant_id#user_id': `${tenantId}#${userId}`,
            ...score,
          })
        ),
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        path: '/dashboard/metrics',
        queryStringParameters: null,
        requestContext: {
          authorizer: {
            user_id: userId,
            tenant_id: tenantId,
          },
        } as any,
      };

      const result = await getMetrics(event as APIGatewayProxyEvent);
      expect(result.statusCode).toBe(200);

      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.metrics.trend_data).toBeDefined();
      expect(Array.isArray(body.metrics.trend_data)).toBe(true);
      expect(body.metrics.trend_data.length).toBeGreaterThan(0);

      // Verify trend data structure
      body.metrics.trend_data.forEach((point: any) => {
        expect(point.date).toBeDefined();
        expect(point.average_score).toBeDefined();
        expect(point.practice_count).toBeDefined();
        expect(typeof point.average_score).toBe('number');
        expect(typeof point.practice_count).toBe('number');
      });
    });

    it('should exclude scores older than 30 days from trend data', async () => {
      const userId = 'test-user-old-scores';
      const tenantId = 'test-tenant-old-scores';
      const now = Math.floor(Date.now() / 1000);

      const scores = [
        {
          score_id: 'score-1',
          paper: 'JAIIB_IE_IFS',
          score: 85,
          created_at: now - 86400, // 1 day ago (included)
        },
        {
          score_id: 'score-2',
          paper: 'JAIIB_IE_IFS',
          score: 75,
          created_at: now - 2592000 - 86400, // 31 days ago (excluded)
        },
      ];

      ddbMock.on(QueryCommand).resolves({
        Items: scores.map(score =>
          marshall({
            'tenant_id#user_id': `${tenantId}#${userId}`,
            ...score,
          })
        ),
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        path: '/dashboard/metrics',
        queryStringParameters: null,
        requestContext: {
          authorizer: {
            user_id: userId,
            tenant_id: tenantId,
          },
        } as any,
      };

      const result = await getMetrics(event as APIGatewayProxyEvent);
      expect(result.statusCode).toBe(200);

      const body = JSON.parse(result.body);
      expect(body.metrics.trend_data).toBeDefined();

      // Only the recent score should be in trend data
      const trendDates = body.metrics.trend_data.map((point: any) => point.date);
      expect(trendDates.length).toBe(1);
    });

    it('should return empty trend data when no scores exist', async () => {
      const userId = 'test-user-no-scores';
      const tenantId = 'test-tenant-no-scores';

      ddbMock.on(QueryCommand).resolves({
        Items: [],
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        path: '/dashboard/metrics',
        queryStringParameters: null,
        requestContext: {
          authorizer: {
            user_id: userId,
            tenant_id: tenantId,
          },
        } as any,
      };

      const result = await getMetrics(event as APIGatewayProxyEvent);
      expect(result.statusCode).toBe(200);

      const body = JSON.parse(result.body);
      expect(body.metrics.trend_data).toBeDefined();
      expect(Array.isArray(body.metrics.trend_data)).toBe(true);
      expect(body.metrics.trend_data.length).toBe(0);
    });

    it('should group multiple scores on the same day in trend data', async () => {
      const userId = 'test-user-same-day';
      const tenantId = 'test-tenant-same-day';
      const now = Math.floor(Date.now() / 1000);
      const today = new Date(now * 1000).toISOString().split('T')[0];

      const scores = [
        {
          score_id: 'score-1',
          paper: 'JAIIB_IE_IFS',
          score: 80,
          created_at: now,
        },
        {
          score_id: 'score-2',
          paper: 'JAIIB_IE_IFS',
          score: 90,
          created_at: now - 3600, // 1 hour ago (same day)
        },
        {
          score_id: 'score-3',
          paper: 'JAIIB_IE_IFS',
          score: 85,
          created_at: now - 7200, // 2 hours ago (same day)
        },
      ];

      ddbMock.on(QueryCommand).resolves({
        Items: scores.map(score =>
          marshall({
            'tenant_id#user_id': `${tenantId}#${userId}`,
            ...score,
          })
        ),
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        path: '/dashboard/metrics',
        queryStringParameters: null,
        requestContext: {
          authorizer: {
            user_id: userId,
            tenant_id: tenantId,
          },
        } as any,
      };

      const result = await getMetrics(event as APIGatewayProxyEvent);
      expect(result.statusCode).toBe(200);

      const body = JSON.parse(result.body);
      const todayTrend = body.metrics.trend_data.find((point: any) => point.date === today);

      expect(todayTrend).toBeDefined();
      expect(todayTrend.practice_count).toBe(3);
      expect(todayTrend.average_score).toBe(85); // (80 + 90 + 85) / 3 = 85
    });
  });

  describe('Date range handling', () => {
    it('should handle date range filtering correctly', async () => {
      const userId = 'test-user-date-range';
      const tenantId = 'test-tenant-date-range';
      const now = Math.floor(Date.now() / 1000);

      const scores = [
        {
          score_id: 'score-1',
          paper: 'JAIIB_IE_IFS',
          score: 85,
          created_at: now - 86400, // 1 day ago
        },
        {
          score_id: 'score-2',
          paper: 'JAIIB_IE_IFS',
          score: 90,
          created_at: now - 604800, // 7 days ago
        },
        {
          score_id: 'score-3',
          paper: 'JAIIB_IE_IFS',
          score: 75,
          created_at: now - 1209600, // 14 days ago
        },
      ];

      ddbMock.on(QueryCommand).resolves({
        Items: scores.map(score =>
          marshall({
            'tenant_id#user_id': `${tenantId}#${userId}`,
            ...score,
          })
        ),
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        path: '/dashboard/metrics',
        queryStringParameters: null,
        requestContext: {
          authorizer: {
            user_id: userId,
            tenant_id: tenantId,
          },
        } as any,
      };

      const result = await getMetrics(event as APIGatewayProxyEvent);
      expect(result.statusCode).toBe(200);

      const body = JSON.parse(result.body);
      expect(body.metrics.trend_data).toBeDefined();

      // All scores should be within 30 days
      expect(body.metrics.trend_data.length).toBe(3);
    });

    it('should sort trend data by date in ascending order', async () => {
      const userId = 'test-user-sort';
      const tenantId = 'test-tenant-sort';
      const now = Math.floor(Date.now() / 1000);

      const scores = [
        {
          score_id: 'score-1',
          paper: 'JAIIB_IE_IFS',
          score: 85,
          created_at: now - 259200, // 3 days ago
        },
        {
          score_id: 'score-2',
          paper: 'JAIIB_IE_IFS',
          score: 90,
          created_at: now - 86400, // 1 day ago
        },
        {
          score_id: 'score-3',
          paper: 'JAIIB_IE_IFS',
          score: 75,
          created_at: now - 172800, // 2 days ago
        },
      ];

      ddbMock.on(QueryCommand).resolves({
        Items: scores.map(score =>
          marshall({
            'tenant_id#user_id': `${tenantId}#${userId}`,
            ...score,
          })
        ),
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        path: '/dashboard/metrics',
        queryStringParameters: null,
        requestContext: {
          authorizer: {
            user_id: userId,
            tenant_id: tenantId,
          },
        } as any,
      };

      const result = await getMetrics(event as APIGatewayProxyEvent);
      expect(result.statusCode).toBe(200);

      const body = JSON.parse(result.body);
      const trendData = body.metrics.trend_data;

      // Verify dates are in ascending order
      for (let i = 1; i < trendData.length; i++) {
        expect(trendData[i].date >= trendData[i - 1].date).toBe(true);
      }
    });
  });

  describe('Performance comparison', () => {
    it('should generate performance comparison across all papers', async () => {
      const userId = 'test-user-comparison';
      const tenantId = 'test-tenant-comparison';
      const now = Math.floor(Date.now() / 1000);

      const scores = [
        {
          score_id: 'score-1',
          paper: 'JAIIB_IE_IFS',
          score: 85,
          created_at: now - 86400,
        },
        {
          score_id: 'score-2',
          paper: 'JAIIB_IE_IFS',
          score: 90,
          created_at: now - 172800,
        },
        {
          score_id: 'score-3',
          paper: 'JAIIB_PPB',
          score: 75,
          created_at: now - 259200,
        },
        {
          score_id: 'score-4',
          paper: 'JAIIB_AFB',
          score: 80,
          created_at: now - 345600,
        },
      ];

      ddbMock.on(QueryCommand).resolves({
        Items: scores.map(score =>
          marshall({
            'tenant_id#user_id': `${tenantId}#${userId}`,
            ...score,
          })
        ),
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        path: '/dashboard/metrics',
        queryStringParameters: null,
        requestContext: {
          authorizer: {
            user_id: userId,
            tenant_id: tenantId,
          },
        } as any,
      };

      const result = await getMetrics(event as APIGatewayProxyEvent);
      expect(result.statusCode).toBe(200);

      const body = JSON.parse(result.body);
      expect(body.metrics.performance_comparison).toBeDefined();
      expect(Array.isArray(body.metrics.performance_comparison)).toBe(true);

      // Should include papers with scores
      const papers = body.metrics.performance_comparison.map((p: any) => p.paper);
      expect(papers).toContain('JAIIB_IE_IFS');
      expect(papers).toContain('JAIIB_PPB');
      expect(papers).toContain('JAIIB_AFB');
    });

    it('should not include performance comparison when paper filter is applied', async () => {
      const userId = 'test-user-no-comparison';
      const tenantId = 'test-tenant-no-comparison';
      const now = Math.floor(Date.now() / 1000);

      const scores = [
        {
          score_id: 'score-1',
          paper: 'JAIIB_IE_IFS',
          score: 85,
          created_at: now - 86400,
        },
      ];

      ddbMock.on(QueryCommand).resolves({
        Items: scores.map(score =>
          marshall({
            'tenant_id#user_id': `${tenantId}#${userId}`,
            ...score,
          })
        ),
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        path: '/dashboard/metrics',
        queryStringParameters: { paper: 'JAIIB_IE_IFS' },
        requestContext: {
          authorizer: {
            user_id: userId,
            tenant_id: tenantId,
          },
        } as any,
      };

      const result = await getMetrics(event as APIGatewayProxyEvent);
      expect(result.statusCode).toBe(200);

      const body = JSON.parse(result.body);
      expect(body.metrics.performance_comparison).toBeUndefined();
    });

    it('should calculate performance trend correctly', async () => {
      const userId = 'test-user-trend-calc';
      const tenantId = 'test-tenant-trend-calc';
      const now = Math.floor(Date.now() / 1000);

      // Scores showing improvement
      const scores = [
        {
          score_id: 'score-1',
          paper: 'JAIIB_IE_IFS',
          score: 60,
          created_at: now - 604800, // 7 days ago
        },
        {
          score_id: 'score-2',
          paper: 'JAIIB_IE_IFS',
          score: 65,
          created_at: now - 518400, // 6 days ago
        },
        {
          score_id: 'score-3',
          paper: 'JAIIB_IE_IFS',
          score: 85,
          created_at: now - 86400, // 1 day ago
        },
        {
          score_id: 'score-4',
          paper: 'JAIIB_IE_IFS',
          score: 90,
          created_at: now - 3600, // 1 hour ago
        },
      ];

      ddbMock.on(QueryCommand).resolves({
        Items: scores.map(score =>
          marshall({
            'tenant_id#user_id': `${tenantId}#${userId}`,
            ...score,
          })
        ),
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        path: '/dashboard/metrics',
        queryStringParameters: null,
        requestContext: {
          authorizer: {
            user_id: userId,
            tenant_id: tenantId,
          },
        } as any,
      };

      const result = await getMetrics(event as APIGatewayProxyEvent);
      expect(result.statusCode).toBe(200);

      const body = JSON.parse(result.body);
      const ieIfsTrend = body.metrics.performance_comparison.find(
        (p: any) => p.paper === 'JAIIB_IE_IFS'
      );

      expect(ieIfsTrend).toBeDefined();
      expect(ieIfsTrend.trend).toBe('improving');
    });
  });
});
