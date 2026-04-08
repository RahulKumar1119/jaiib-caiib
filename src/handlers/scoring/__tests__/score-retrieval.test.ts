/**
 * Unit Tests for Score Retrieval and Filtering
 * Tests score retrieval by user and paper, date range filtering, and performance trend calculation
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { marshall } from '@aws-sdk/util-dynamodb';
import { getScores } from '../index';

// Mock DynamoDB client
const ddbMock = mockClient(DynamoDBClient);

// Helper to create mock event
const createMockEvent = (
  userId: string,
  tenantId: string,
  pathParams?: Record<string, string>,
  queryParams?: Record<string, string>
): APIGatewayProxyEvent => ({
  httpMethod: 'GET',
  path: `/scores/${userId}`,
  pathParameters: pathParams || { userId },
  queryStringParameters: queryParams || null,
  headers: {},
  body: null,
  isBase64Encoded: false,
  requestContext: {
    authorizer: {
      user_id: userId,
      tenant_id: tenantId,
    },
  } as any,
  resource: '',
  stageVariables: null,
  multiValueHeaders: {},
  multiValueQueryStringParameters: null,
});

// Helper to create mock score
const createMockScore = (
  overrides?: Partial<any>
): any => ({
  'tenant_id#user_id': 'tenant1#user1',
  score_id: 'score_123',
  tenant_id: 'tenant1',
  user_id: 'user1',
  practice_set_id: 'ps_123',
  paper: 'JAIIB_IE_IFS',
  score: 85,
  correct_count: 3,
  incorrect_count: 1,
  unanswered_count: 0,
  created_at: Math.floor(Date.now() / 1000),
  time_taken: 450,
  difficulty_avg: 2.5,
  ...overrides,
});

describe('Score Retrieval and Filtering', () => {
  beforeEach(() => {
    ddbMock.reset();
  });

  describe('Score Retrieval by User', () => {
    it('should retrieve all scores for a user', async () => {
      const userId = 'user1';
      const tenantId = 'tenant1';
      const scores = [
        createMockScore({ score: 85, created_at: 1000 }),
        createMockScore({ score: 90, created_at: 900 }),
        createMockScore({ score: 75, created_at: 800 }),
      ];

      ddbMock.on(QueryCommand).resolves({
        Items: scores.map(s => marshall(s)),
        Count: 3,
        ScannedCount: 3,
      });

      const event = createMockEvent(userId, tenantId);
      const result = (await getScores(event)) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.scores).toHaveLength(3);
      expect(body.pagination.count).toBe(3);
    });

    it('should return empty array when user has no scores', async () => {
      const userId = 'user1';
      const tenantId = 'tenant1';

      ddbMock.on(QueryCommand).resolves({
        Items: [],
        Count: 0,
        ScannedCount: 0,
      });

      const event = createMockEvent(userId, tenantId);
      const result = (await getScores(event)) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.scores).toHaveLength(0);
      expect(body.pagination.count).toBe(0);
    });

    it('should deny access when user tries to access another user\'s scores', async () => {
      const userId = 'user1';
      const tenantId = 'tenant1';

      const event = createMockEvent('user2', tenantId, { userId: 'user1' });
      const result = (await getScores(event)) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(403);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Access denied');
    });
  });

  describe('Score Filtering by Paper', () => {
    it('should filter scores by paper', async () => {
      const userId = 'user1';
      const tenantId = 'tenant1';
      const scores = [
        createMockScore({ paper: 'JAIIB_IE_IFS', score: 85 }),
        createMockScore({ paper: 'JAIIB_PPB', score: 90 }),
        createMockScore({ paper: 'JAIIB_IE_IFS', score: 75 }),
      ];

      ddbMock.on(QueryCommand).resolves({
        Items: scores
          .filter(s => s.paper === 'JAIIB_IE_IFS')
          .map(s => marshall(s)),
        Count: 2,
        ScannedCount: 2,
      });

      const event = createMockEvent(userId, tenantId, undefined, {
        paper: 'JAIIB_IE_IFS',
      });
      const result = (await getScores(event)) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.scores).toHaveLength(2);
      expect(body.scores.every((s: any) => s.paper === 'JAIIB_IE_IFS')).toBe(true);
    });

    it('should return empty array when filtering by paper with no matches', async () => {
      const userId = 'user1';
      const tenantId = 'tenant1';

      ddbMock.on(QueryCommand).resolves({
        Items: [],
        Count: 0,
        ScannedCount: 0,
      });

      const event = createMockEvent(userId, tenantId, undefined, {
        paper: 'JAIIB_AFB',
      });
      const result = (await getScores(event)) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.scores).toHaveLength(0);
    });
  });

  describe('Date Range Filtering', () => {
    it('should filter scores by start date', async () => {
      const userId = 'user1';
      const tenantId = 'tenant1';
      const now = Math.floor(Date.now() / 1000);
      const scores = [
        createMockScore({ created_at: now }),
        createMockScore({ created_at: now - 86400 }),
        createMockScore({ created_at: now - 172800 }),
      ];

      ddbMock.on(QueryCommand).resolves({
        Items: scores
          .filter(s => s.created_at >= now - 86400)
          .map(s => marshall(s)),
        Count: 2,
        ScannedCount: 2,
      });

      const event = createMockEvent(userId, tenantId, undefined, {
        start_date: String(now - 86400),
      });
      const result = (await getScores(event)) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.scores).toHaveLength(2);
    });

    it('should filter scores by end date', async () => {
      const userId = 'user1';
      const tenantId = 'tenant1';
      const now = Math.floor(Date.now() / 1000);
      const scores = [
        createMockScore({ created_at: now }),
        createMockScore({ created_at: now - 86400 }),
        createMockScore({ created_at: now - 172800 }),
      ];

      ddbMock.on(QueryCommand).resolves({
        Items: scores
          .filter(s => s.created_at <= now - 86400)
          .map(s => marshall(s)),
        Count: 2,
        ScannedCount: 2,
      });

      const event = createMockEvent(userId, tenantId, undefined, {
        end_date: String(now - 86400),
      });
      const result = (await getScores(event)) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.scores).toHaveLength(2);
    });

    it('should filter scores by date range', async () => {
      const userId = 'user1';
      const tenantId = 'tenant1';
      const now = Math.floor(Date.now() / 1000);
      const scores = [
        createMockScore({ created_at: now }),
        createMockScore({ created_at: now - 86400 }),
        createMockScore({ created_at: now - 172800 }),
      ];

      ddbMock.on(QueryCommand).resolves({
        Items: scores
          .filter(s => s.created_at >= now - 172800 && s.created_at <= now - 86400)
          .map(s => marshall(s)),
        Count: 2,
        ScannedCount: 2,
      });

      const event = createMockEvent(userId, tenantId, undefined, {
        start_date: String(now - 172800),
        end_date: String(now - 86400),
      });
      const result = (await getScores(event)) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.scores).toHaveLength(2);
    });

    it('should reject invalid date range (start_date > end_date)', async () => {
      const userId = 'user1';
      const tenantId = 'tenant1';
      const now = Math.floor(Date.now() / 1000);

      const event = createMockEvent(userId, tenantId, undefined, {
        start_date: String(now),
        end_date: String(now - 86400),
      });
      const result = (await getScores(event)) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
    });
  });

  describe('Performance Trend Calculation', () => {
    it('should calculate improving trend when current score > average of last 3', async () => {
      const userId = 'user1';
      const tenantId = 'tenant1';
      const now = Math.floor(Date.now() / 1000);
      const scores = [
        createMockScore({ score: 95, created_at: now }), // Current: 95
        createMockScore({ score: 70, created_at: now - 86400 }), // Previous: 70
        createMockScore({ score: 75, created_at: now - 172800 }), // Previous: 75
        createMockScore({ score: 80, created_at: now - 259200 }), // Previous: 80
      ];

      ddbMock.on(QueryCommand).resolves({
        Items: scores.map(s => marshall(s)),
        Count: 4,
        ScannedCount: 4,
      });

      const event = createMockEvent(userId, tenantId);
      const result = (await getScores(event)) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      // First score should have improving trend (95 > avg(70,75,80) = 75)
      expect(body.scores[0].performance_trend).toBe('improving');
    });

    it('should calculate declining trend when current score < average of last 3', async () => {
      const userId = 'user1';
      const tenantId = 'tenant1';
      const now = Math.floor(Date.now() / 1000);
      const scores = [
        createMockScore({ score: 60, created_at: now }), // Current: 60
        createMockScore({ score: 85, created_at: now - 86400 }), // Previous: 85
        createMockScore({ score: 90, created_at: now - 172800 }), // Previous: 90
        createMockScore({ score: 80, created_at: now - 259200 }), // Previous: 80
      ];

      ddbMock.on(QueryCommand).resolves({
        Items: scores.map(s => marshall(s)),
        Count: 4,
        ScannedCount: 4,
      });

      const event = createMockEvent(userId, tenantId);
      const result = (await getScores(event)) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      // First score should have declining trend (60 < avg(85,90,80) = 85)
      expect(body.scores[0].performance_trend).toBe('declining');
    });

    it('should calculate stable trend when current score ≈ average of last 3 (within 5 points)', async () => {
      const userId = 'user1';
      const tenantId = 'tenant1';
      const now = Math.floor(Date.now() / 1000);
      const scores = [
        createMockScore({ score: 80, created_at: now }), // Current: 80
        createMockScore({ score: 78, created_at: now - 86400 }), // Previous: 78
        createMockScore({ score: 82, created_at: now - 172800 }), // Previous: 82
        createMockScore({ score: 80, created_at: now - 259200 }), // Previous: 80
      ];

      ddbMock.on(QueryCommand).resolves({
        Items: scores.map(s => marshall(s)),
        Count: 4,
        ScannedCount: 4,
      });

      const event = createMockEvent(userId, tenantId);
      const result = (await getScores(event)) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      // First score should have stable trend (80 ≈ avg(78,82,80) = 80)
      expect(body.scores[0].performance_trend).toBe('stable');
    });

    it('should default to stable trend when no previous scores', async () => {
      const userId = 'user1';
      const tenantId = 'tenant1';
      const scores = [createMockScore({ score: 85 })];

      ddbMock.on(QueryCommand).resolves({
        Items: scores.map(s => marshall(s)),
        Count: 1,
        ScannedCount: 1,
      });

      const event = createMockEvent(userId, tenantId);
      const result = (await getScores(event)) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.scores[0].performance_trend).toBe('stable');
    });
  });

  describe('Pagination', () => {
    it('should support pagination with limit parameter', async () => {
      const userId = 'user1';
      const tenantId = 'tenant1';
      const scores = Array.from({ length: 60 }, (_, i) =>
        createMockScore({ score_id: `score_${i}`, score: 50 + i })
      );

      ddbMock.on(QueryCommand).resolves({
        Items: scores.slice(0, 51).map(s => marshall(s)), // Return 51 to check pagination
        Count: 51,
        ScannedCount: 51,
        LastEvaluatedKey: marshall({
          'tenant_id#user_id': 'tenant1#user1',
          created_at: 1000,
        }),
      });

      const event = createMockEvent(userId, tenantId, undefined, {
        limit: '50',
      });
      const result = (await getScores(event)) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.scores).toHaveLength(50);
      expect(body.pagination.next_page_token).toBeDefined();
    });

    it('should cap limit at 100', async () => {
      const userId = 'user1';
      const tenantId = 'tenant1';
      const scores = Array.from({ length: 101 }, (_, i) =>
        createMockScore({ score_id: `score_${i}` })
      );

      ddbMock.on(QueryCommand).resolves({
        Items: scores.slice(0, 101).map(s => marshall(s)),
        Count: 101,
        ScannedCount: 101,
        LastEvaluatedKey: marshall({
          'tenant_id#user_id': 'tenant1#user1',
          created_at: 1000,
        }),
      });

      const event = createMockEvent(userId, tenantId, undefined, {
        limit: '200', // Request 200, should be capped at 100
      });
      const result = (await getScores(event)) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.scores).toHaveLength(100);
      expect(body.pagination.limit).toBe(100);
    });

    it('should use default limit of 50 when not specified', async () => {
      const userId = 'user1';
      const tenantId = 'tenant1';
      const scores = Array.from({ length: 50 }, (_, i) =>
        createMockScore({ score_id: `score_${i}` })
      );

      ddbMock.on(QueryCommand).resolves({
        Items: scores.map(s => marshall(s)),
        Count: 50,
        ScannedCount: 50,
      });

      const event = createMockEvent(userId, tenantId);
      const result = (await getScores(event)) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.pagination.limit).toBe(50);
    });
  });

  describe('Combined Filtering', () => {
    it('should filter by paper and date range simultaneously', async () => {
      const userId = 'user1';
      const tenantId = 'tenant1';
      const now = Math.floor(Date.now() / 1000);
      const scores = [
        createMockScore({
          paper: 'JAIIB_IE_IFS',
          created_at: now,
          score: 85,
        }),
        createMockScore({
          paper: 'JAIIB_IE_IFS',
          created_at: now - 86400,
          score: 90,
        }),
        createMockScore({
          paper: 'JAIIB_PPB',
          created_at: now,
          score: 75,
        }),
      ];

      ddbMock.on(QueryCommand).resolves({
        Items: scores
          .filter(
            s =>
              s.paper === 'JAIIB_IE_IFS' &&
              s.created_at >= now - 172800 &&
              s.created_at <= now
          )
          .map(s => marshall(s)),
        Count: 2,
        ScannedCount: 2,
      });

      const event = createMockEvent(userId, tenantId, undefined, {
        paper: 'JAIIB_IE_IFS',
        start_date: String(now - 172800),
        end_date: String(now),
      });
      const result = (await getScores(event)) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.scores).toHaveLength(2);
      expect(body.scores.every((s: any) => s.paper === 'JAIIB_IE_IFS')).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should return 400 when missing user context', async () => {
      const event = createMockEvent('user1', 'tenant1');
      event.requestContext.authorizer = undefined;

      const result = (await getScores(event)) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
    });

    it('should handle DynamoDB query errors gracefully', async () => {
      const userId = 'user1';
      const tenantId = 'tenant1';

      ddbMock.on(QueryCommand).rejects(new Error('DynamoDB error'));

      const event = createMockEvent(userId, tenantId);
      const result = (await getScores(event)) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
    });
  });

  describe('Response Format', () => {
    it('should return properly formatted response with all required fields', async () => {
      const userId = 'user1';
      const tenantId = 'tenant1';
      const scores = [createMockScore()];

      ddbMock.on(QueryCommand).resolves({
        Items: scores.map(s => marshall(s)),
        Count: 1,
        ScannedCount: 1,
      });

      const event = createMockEvent(userId, tenantId);
      const result = (await getScores(event)) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      expect((result.headers as any)['Content-Type']).toBe('application/json');
      expect((result.headers as any)['X-Content-Type-Options']).toBe('nosniff');

      const body = JSON.parse(result.body as string);
      expect(body).toHaveProperty('success', true);
      expect(body).toHaveProperty('scores');
      expect(body).toHaveProperty('pagination');
      expect(body.pagination).toHaveProperty('limit');
      expect(body.pagination).toHaveProperty('count');
    });

    it('should include performance_trend in each score', async () => {
      const userId = 'user1';
      const tenantId = 'tenant1';
      const scores = [
        createMockScore({ score: 85 }),
        createMockScore({ score: 90 }),
      ];

      ddbMock.on(QueryCommand).resolves({
        Items: scores.map(s => marshall(s)),
        Count: 2,
        ScannedCount: 2,
      });

      const event = createMockEvent(userId, tenantId);
      const result = (await getScores(event)) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.scores.every((s: any) => s.performance_trend)).toBe(true);
    });
  });
});
