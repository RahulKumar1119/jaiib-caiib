/**
 * Property-Based Tests for Dashboard Metric Accuracy
 * Validates that dashboard metrics are calculated correctly across various data scenarios
 * 
 * Property 8: Dashboard Metric Accuracy
 * For any set of user scores, the dashboard metrics must be:
 * 1. Accurate average scores per paper
 * 2. Accurate highest scores per paper
 * 3. Accurate total practice sets count
 * 4. Correct recent scores retrieval (up to 10)
 * 5. Consistent across multiple invocations
 * 6. Correct when filtered by paper
 * 
 * **Validates: Requirements 7.1, 7.2**
 */

import fc from 'fast-check';
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

describe('Property: Dashboard Metric Accuracy', () => {
  beforeEach(() => {
    ddbMock.reset();
    jest.clearAllMocks();
  });

  /**
   * Property 7.1: Average score calculation is accurate
   * For any set of scores, the calculated average must be the sum of all scores
   * divided by the count of scores, rounded to 2 decimal places.
   */
  it('should calculate accurate average scores per paper', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          user_id: fc.uuid(),
          tenant_id: fc.string({ minLength: 1, maxLength: 50 }),
          scores: fc.array(
            fc.record({
              score_id: fc.uuid(),
              paper: fc.oneof(
                fc.constant('JAIIB_IE_IFS'),
                fc.constant('JAIIB_PPB'),
                fc.constant('JAIIB_AFB'),
                fc.constant('JAIIB_RBWM')
              ),
              score: fc.integer({ min: 0, max: 100 }),
              created_at: fc.integer({ min: 1000000000, max: 2000000000 }),
            }),
            { minLength: 1, maxLength: 50 }
          ),
        }),
        async (context: any) => {
          // Mock DynamoDB response
          ddbMock.on(QueryCommand).resolves({
            Items: context.scores.map((score: any) =>
              marshall({
                'tenant_id#user_id': `${context.tenant_id}#${context.user_id}`,
                score_id: score.score_id,
                paper: score.paper,
                score: score.score,
                created_at: score.created_at,
              })
            ),
          });

          const event: Partial<APIGatewayProxyEvent> = {
            httpMethod: 'GET',
            path: '/dashboard/metrics',
            queryStringParameters: null,
            requestContext: {
              authorizer: {
                user_id: context.user_id,
                tenant_id: context.tenant_id,
              },
            } as any,
          };

          const result = await getMetrics(event as APIGatewayProxyEvent);
          expect(result.statusCode).toBe(200);

          const body = JSON.parse(result.body);
          expect(body.success).toBe(true);

          // Verify average score calculation for each paper
          const paperGroups: { [key: string]: number[] } = {};
          context.scores.forEach((score: any) => {
            if (!paperGroups[score.paper]) {
              paperGroups[score.paper] = [];
            }
            paperGroups[score.paper].push(score.score);
          });

          Object.entries(paperGroups).forEach(([paper, scores]: [string, any]) => {
            const expectedAverage = Math.round(
              (scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 100
            ) / 100;
            expect(body.metrics.paper_stats[paper].average_score).toBe(expectedAverage);
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 7.2: Highest score per paper is accurate
   * For any set of scores, the highest score per paper must be the maximum
   * score value for that paper.
   */
  it('should calculate accurate highest scores per paper', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          user_id: fc.uuid(),
          tenant_id: fc.string({ minLength: 1, maxLength: 50 }),
          scores: fc.array(
            fc.record({
              score_id: fc.uuid(),
              paper: fc.oneof(
                fc.constant('JAIIB_IE_IFS'),
                fc.constant('JAIIB_PPB'),
                fc.constant('JAIIB_AFB'),
                fc.constant('JAIIB_RBWM')
              ),
              score: fc.integer({ min: 0, max: 100 }),
              created_at: fc.integer({ min: 1000000000, max: 2000000000 }),
            }),
            { minLength: 1, maxLength: 50 }
          ),
        }),
        async (context: any) => {
          ddbMock.on(QueryCommand).resolves({
            Items: context.scores.map((score: any) =>
              marshall({
                'tenant_id#user_id': `${context.tenant_id}#${context.user_id}`,
                score_id: score.score_id,
                paper: score.paper,
                score: score.score,
                created_at: score.created_at,
              })
            ),
          });

          const event: Partial<APIGatewayProxyEvent> = {
            httpMethod: 'GET',
            path: '/dashboard/metrics',
            queryStringParameters: null,
            requestContext: {
              authorizer: {
                user_id: context.user_id,
                tenant_id: context.tenant_id,
              },
            } as any,
          };

          const result = await getMetrics(event as APIGatewayProxyEvent);
          expect(result.statusCode).toBe(200);

          const body = JSON.parse(result.body);
          expect(body.success).toBe(true);

          // Verify highest score for each paper
          const paperGroups: { [key: string]: number[] } = {};
          context.scores.forEach((score: any) => {
            if (!paperGroups[score.paper]) {
              paperGroups[score.paper] = [];
            }
            paperGroups[score.paper].push(score.score);
          });

          Object.entries(paperGroups).forEach(([paper, scores]: [string, any]) => {
            const expectedHighest = Math.max(...scores);
            expect(body.metrics.paper_stats[paper].highest_score).toBe(expectedHighest);
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 7.3: Total practice sets count is accurate
   * For any set of scores, the total practice sets count must equal
   * the number of scores retrieved.
   */
  it('should calculate accurate total practice sets count', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          user_id: fc.uuid(),
          tenant_id: fc.string({ minLength: 1, maxLength: 50 }),
          scores: fc.array(
            fc.record({
              score_id: fc.uuid(),
              paper: fc.oneof(
                fc.constant('JAIIB_IE_IFS'),
                fc.constant('JAIIB_PPB'),
                fc.constant('JAIIB_AFB'),
                fc.constant('JAIIB_RBWM')
              ),
              score: fc.integer({ min: 0, max: 100 }),
              created_at: fc.integer({ min: 1000000000, max: 2000000000 }),
            }),
            { minLength: 0, maxLength: 100 }
          ),
        }),
        async (context: any) => {
          ddbMock.on(QueryCommand).resolves({
            Items: context.scores.map((score: any) =>
              marshall({
                'tenant_id#user_id': `${context.tenant_id}#${context.user_id}`,
                score_id: score.score_id,
                paper: score.paper,
                score: score.score,
                created_at: score.created_at,
              })
            ),
          });

          const event: Partial<APIGatewayProxyEvent> = {
            httpMethod: 'GET',
            path: '/dashboard/metrics',
            queryStringParameters: null,
            requestContext: {
              authorizer: {
                user_id: context.user_id,
                tenant_id: context.tenant_id,
              },
            } as any,
          };

          const result = await getMetrics(event as APIGatewayProxyEvent);
          expect(result.statusCode).toBe(200);

          const body = JSON.parse(result.body);
          expect(body.success).toBe(true);
          expect(body.metrics.total_practice_sets).toBe(context.scores.length);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 7.4: Recent scores retrieval is limited to 10
   * For any set of scores, the recent_scores array must contain at most 10 items,
   * and they must be the most recent scores (sorted by created_at descending).
   */
  it('should retrieve recent scores limited to 10 items', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          user_id: fc.uuid(),
          tenant_id: fc.string({ minLength: 1, maxLength: 50 }),
          scores: fc.array(
            fc.record({
              score_id: fc.uuid(),
              paper: fc.oneof(
                fc.constant('JAIIB_IE_IFS'),
                fc.constant('JAIIB_PPB'),
                fc.constant('JAIIB_AFB'),
                fc.constant('JAIIB_RBWM')
              ),
              score: fc.integer({ min: 0, max: 100 }),
              created_at: fc.integer({ min: 1000000000, max: 2000000000 }),
            }),
            { minLength: 1, maxLength: 50 }
          ),
        }),
        async (context: any) => {
          // Sort scores by created_at descending to simulate DynamoDB behavior
          const sortedScores = [...context.scores].sort((a, b) => b.created_at - a.created_at);

          ddbMock.on(QueryCommand).resolves({
            Items: sortedScores.map((score: any) =>
              marshall({
                'tenant_id#user_id': `${context.tenant_id}#${context.user_id}`,
                score_id: score.score_id,
                paper: score.paper,
                score: score.score,
                created_at: score.created_at,
              })
            ),
          });

          const event: Partial<APIGatewayProxyEvent> = {
            httpMethod: 'GET',
            path: '/dashboard/metrics',
            queryStringParameters: null,
            requestContext: {
              authorizer: {
                user_id: context.user_id,
                tenant_id: context.tenant_id,
              },
            } as any,
          };

          const result = await getMetrics(event as APIGatewayProxyEvent);
          expect(result.statusCode).toBe(200);

          const body = JSON.parse(result.body);
          expect(body.success).toBe(true);

          // Recent scores should be limited to 10
          expect(body.metrics.recent_scores.length).toBeLessThanOrEqual(10);

          // Recent scores should be the most recent ones
          const expectedRecentScores = sortedScores.slice(0, 10);
          body.metrics.recent_scores.forEach((recentScore: any, index: number) => {
            expect(recentScore.score_id).toBe(expectedRecentScores[index].score_id);
            expect(recentScore.score).toBe(expectedRecentScores[index].score);
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 7.5: Metrics are consistent across multiple invocations
   * For the same user and score data, multiple metric calculations must
   * produce identical results.
   */
  it('should produce consistent metrics across multiple invocations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          user_id: fc.uuid(),
          tenant_id: fc.string({ minLength: 1, maxLength: 50 }),
          scores: fc.array(
            fc.record({
              score_id: fc.uuid(),
              paper: fc.oneof(
                fc.constant('JAIIB_IE_IFS'),
                fc.constant('JAIIB_PPB'),
                fc.constant('JAIIB_AFB'),
                fc.constant('JAIIB_RBWM')
              ),
              score: fc.integer({ min: 0, max: 100 }),
              created_at: fc.integer({ min: 1000000000, max: 2000000000 }),
            }),
            { minLength: 1, maxLength: 50 }
          ),
        }),
        async (context: any) => {
          ddbMock.on(QueryCommand).resolves({
            Items: context.scores.map((score: any) =>
              marshall({
                'tenant_id#user_id': `${context.tenant_id}#${context.user_id}`,
                score_id: score.score_id,
                paper: score.paper,
                score: score.score,
                created_at: score.created_at,
              })
            ),
          });

          const event: Partial<APIGatewayProxyEvent> = {
            httpMethod: 'GET',
            path: '/dashboard/metrics',
            queryStringParameters: null,
            requestContext: {
              authorizer: {
                user_id: context.user_id,
                tenant_id: context.tenant_id,
              },
            } as any,
          };

          // Call getMetrics multiple times
          const results = [];
          for (let i = 0; i < 3; i++) {
            const result = await getMetrics(event as APIGatewayProxyEvent);
            expect(result.statusCode).toBe(200);
            results.push(JSON.parse(result.body));
          }

          // All results should be identical
          const firstMetrics = results[0].metrics;
          results.forEach((result) => {
            expect(result.metrics.total_practice_sets).toBe(firstMetrics.total_practice_sets);
            expect(result.metrics.average_score).toBe(firstMetrics.average_score);
            expect(JSON.stringify(result.metrics.paper_stats)).toBe(
              JSON.stringify(firstMetrics.paper_stats)
            );
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 7.6: Paper filter works correctly
   * When filtering by a specific paper, only scores for that paper should be
   * included in the metrics calculation.
   */
  it('should filter metrics correctly by paper', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          user_id: fc.uuid(),
          tenant_id: fc.string({ minLength: 1, maxLength: 50 }),
          scores: fc.array(
            fc.record({
              score_id: fc.uuid(),
              paper: fc.oneof(
                fc.constant('JAIIB_IE_IFS'),
                fc.constant('JAIIB_PPB'),
                fc.constant('JAIIB_AFB'),
                fc.constant('JAIIB_RBWM')
              ),
              score: fc.integer({ min: 0, max: 100 }),
              created_at: fc.integer({ min: 1000000000, max: 2000000000 }),
            }),
            { minLength: 1, maxLength: 50 }
          ),
          filterPaper: fc.oneof(
            fc.constant('JAIIB_IE_IFS'),
            fc.constant('JAIIB_PPB'),
            fc.constant('JAIIB_AFB'),
            fc.constant('JAIIB_RBWM')
          ),
        }),
        async (context: any) => {
          ddbMock.on(QueryCommand).resolves({
            Items: context.scores.map((score: any) =>
              marshall({
                'tenant_id#user_id': `${context.tenant_id}#${context.user_id}`,
                score_id: score.score_id,
                paper: score.paper,
                score: score.score,
                created_at: score.created_at,
              })
            ),
          });

          const event: Partial<APIGatewayProxyEvent> = {
            httpMethod: 'GET',
            path: '/dashboard/metrics',
            queryStringParameters: { paper: context.filterPaper },
            requestContext: {
              authorizer: {
                user_id: context.user_id,
                tenant_id: context.tenant_id,
              },
            } as any,
          };

          const result = await getMetrics(event as APIGatewayProxyEvent);
          expect(result.statusCode).toBe(200);

          const body = JSON.parse(result.body);
          expect(body.success).toBe(true);

          // Filter scores by paper
          const filteredScores = context.scores.filter((s: any) => s.paper === context.filterPaper);

          // Total practice sets should match filtered count
          expect(body.metrics.total_practice_sets).toBe(filteredScores.length);

          // Only the filtered paper should have stats
          expect(body.metrics.paper_stats[context.filterPaper]).toBeDefined();

          // Verify average score for filtered paper
          if (filteredScores.length > 0) {
            const expectedAverage = Math.round(
              (filteredScores.reduce((a: number, b: any) => a + b.score, 0) / filteredScores.length) * 100
            ) / 100;
            expect(body.metrics.paper_stats[context.filterPaper].average_score).toBe(expectedAverage);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 7.7: Overall average score is accurate
   * The overall average score must be the sum of all scores divided by
   * the total number of scores, rounded to 2 decimal places.
   */
  it('should calculate accurate overall average score', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          user_id: fc.uuid(),
          tenant_id: fc.string({ minLength: 1, maxLength: 50 }),
          scores: fc.array(
            fc.record({
              score_id: fc.uuid(),
              paper: fc.oneof(
                fc.constant('JAIIB_IE_IFS'),
                fc.constant('JAIIB_PPB'),
                fc.constant('JAIIB_AFB'),
                fc.constant('JAIIB_RBWM')
              ),
              score: fc.integer({ min: 0, max: 100 }),
              created_at: fc.integer({ min: 1000000000, max: 2000000000 }),
            }),
            { minLength: 1, maxLength: 50 }
          ),
        }),
        async (context: any) => {
          ddbMock.on(QueryCommand).resolves({
            Items: context.scores.map((score: any) =>
              marshall({
                'tenant_id#user_id': `${context.tenant_id}#${context.user_id}`,
                score_id: score.score_id,
                paper: score.paper,
                score: score.score,
                created_at: score.created_at,
              })
            ),
          });

          const event: Partial<APIGatewayProxyEvent> = {
            httpMethod: 'GET',
            path: '/dashboard/metrics',
            queryStringParameters: null,
            requestContext: {
              authorizer: {
                user_id: context.user_id,
                tenant_id: context.tenant_id,
              },
            } as any,
          };

          const result = await getMetrics(event as APIGatewayProxyEvent);
          expect(result.statusCode).toBe(200);

          const body = JSON.parse(result.body);
          expect(body.success).toBe(true);

          // Calculate expected average
          const totalScore = context.scores.reduce((sum: number, s: any) => sum + s.score, 0);
          const expectedAverage = Math.round((totalScore / context.scores.length) * 100) / 100;

          expect(body.metrics.average_score).toBe(expectedAverage);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 7.8: Metrics handle empty score data correctly
   * When a user has no scores, the metrics should return zero values
   * without errors.
   */
  it('should handle empty score data correctly', async () => {
    const context = {
      user_id: 'test-user',
      tenant_id: 'test-tenant',
    };

    ddbMock.on(QueryCommand).resolves({
      Items: [],
    });

    const event: Partial<APIGatewayProxyEvent> = {
      httpMethod: 'GET',
      path: '/dashboard/metrics',
      queryStringParameters: null,
      requestContext: {
        authorizer: {
          user_id: context.user_id,
          tenant_id: context.tenant_id,
        },
      } as any,
    };

    const result = await getMetrics(event as APIGatewayProxyEvent);
    expect(result.statusCode).toBe(200);

    const body = JSON.parse(result.body);
    expect(body.success).toBe(true);
    expect(body.metrics.total_practice_sets).toBe(0);
    expect(body.metrics.average_score).toBe(0);
    expect(body.metrics.recent_scores.length).toBe(0);

    // All papers should have zero stats
    Object.values(body.metrics.paper_stats).forEach((stats: any) => {
      expect(stats.average_score).toBe(0);
      expect(stats.highest_score).toBe(0);
      expect(stats.practice_count).toBe(0);
    });
  });
});
