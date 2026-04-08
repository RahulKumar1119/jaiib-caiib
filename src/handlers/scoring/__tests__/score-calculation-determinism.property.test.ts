/**
 * Property-Based Tests for Score Calculation Determinism
 * Validates that score calculation is deterministic and consistent
 * 
 * Property 5: Score Calculation Determinism
 * For any set of user answers and correct answers, the calculated score must be:
 * 1. Deterministic (same inputs always produce same output)
 * 2. Between 0 and 100
 * 3. Proportional to correct answers (more correct = higher score)
 * 4. Treat unanswered questions as incorrect
 * 5. Consistent across multiple invocations
 * 
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7**
 */

import fc from 'fast-check';
import { DynamoDBClient, GetItemCommand, PutItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { marshall } from '@aws-sdk/util-dynamodb';
import { submitPracticeSet } from '../index';
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
  Logger: class Logger {
    constructor(name: string) {}
    info = jest.fn();
    warn = jest.fn();
    error = jest.fn();
  },
}));

jest.mock('/opt/nodejs/constants', () => ({
  DYNAMODB_TABLES: {
    PRACTICE_SETS: 'practice_sets',
    SCORES: 'scores',
  },
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
  },
}));

describe('Property: Score Calculation Determinism', () => {
  beforeEach(() => {
    ddbMock.reset();
    jest.clearAllMocks();
  });

  /**
   * Property 5.1: Score calculation is deterministic
   * For any given set of user answers and correct answers, the calculated score
   * must always be the same regardless of how many times it's calculated.
   */
  it('should calculate deterministic scores for identical inputs', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          user_id: fc.uuid(),
          tenant_id: fc.string({ minLength: 1, maxLength: 50 }),
          practice_set_id: fc.uuid(),
          answers: fc.record({
            q_1: fc.oneof(fc.constant('A'), fc.constant('B'), fc.constant('C'), fc.constant('D'), fc.constant(null)),
            q_2: fc.oneof(fc.constant('A'), fc.constant('B'), fc.constant('C'), fc.constant('D'), fc.constant(null)),
            q_3: fc.oneof(fc.constant('A'), fc.constant('B'), fc.constant('C'), fc.constant('D'), fc.constant(null)),
            q_4: fc.oneof(fc.constant('A'), fc.constant('B'), fc.constant('C'), fc.constant('D'), fc.constant(null)),
          }),
        }),
        async (context: any) => {
          // Mock DynamoDB responses
          ddbMock.on(GetItemCommand).resolves({
            Item: marshall({
              'tenant_id#user_id': `${context.tenant_id}#${context.user_id}`,
              practice_set_id: context.practice_set_id,
              correct_answers: {
                q_1: 'A',
                q_2: 'B',
                q_3: 'C',
                q_4: 'D',
              },
              paper: 'JAIIB_IE_IFS',
            }),
          });

          ddbMock.on(PutItemCommand).resolves({});
          ddbMock.on(UpdateItemCommand).resolves({});

          // Create event
          const event: Partial<APIGatewayProxyEvent> = {
            httpMethod: 'POST',
            path: `/practice-sets/${context.practice_set_id}/submit`,
            pathParameters: { id: context.practice_set_id },
            body: JSON.stringify({ answers: context.answers, time_taken: 300 }),
            requestContext: {
              authorizer: {
                user_id: context.user_id,
                tenant_id: context.tenant_id,
              },
            } as any,
          };

          // Calculate score multiple times
          const scores: number[] = [];
          for (let i = 0; i < 3; i++) {
            const result = await submitPracticeSet(event as APIGatewayProxyEvent);
            expect(result.statusCode).toBe(200);

            const body = JSON.parse(result.body);
            expect(body.success).toBe(true);
            scores.push(body.score.score);
          }

          // All scores should be identical
          expect(scores[0]).toBe(scores[1]);
          expect(scores[1]).toBe(scores[2]);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 5.2: Score is always between 0 and 100
   * For any combination of user answers, the calculated score must be
   * within the valid range [0, 100].
   */
  it('should always calculate scores between 0 and 100', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          user_id: fc.uuid(),
          tenant_id: fc.string({ minLength: 1, maxLength: 50 }),
          practice_set_id: fc.uuid(),
          answers: fc.record({
            q_1: fc.oneof(fc.constant('A'), fc.constant('B'), fc.constant('C'), fc.constant('D'), fc.constant(null)),
            q_2: fc.oneof(fc.constant('A'), fc.constant('B'), fc.constant('C'), fc.constant('D'), fc.constant(null)),
            q_3: fc.oneof(fc.constant('A'), fc.constant('B'), fc.constant('C'), fc.constant('D'), fc.constant(null)),
            q_4: fc.oneof(fc.constant('A'), fc.constant('B'), fc.constant('C'), fc.constant('D'), fc.constant(null)),
          }),
        }),
        async (context: any) => {
          ddbMock.on(GetItemCommand).resolves({
            Item: marshall({
              'tenant_id#user_id': `${context.tenant_id}#${context.user_id}`,
              practice_set_id: context.practice_set_id,
              correct_answers: {
                q_1: 'A',
                q_2: 'B',
                q_3: 'C',
                q_4: 'D',
              },
              paper: 'JAIIB_IE_IFS',
            }),
          });

          ddbMock.on(PutItemCommand).resolves({});
          ddbMock.on(UpdateItemCommand).resolves({});

          const event: Partial<APIGatewayProxyEvent> = {
            httpMethod: 'POST',
            path: `/practice-sets/${context.practice_set_id}/submit`,
            pathParameters: { id: context.practice_set_id },
            body: JSON.stringify({ answers: context.answers, time_taken: 300 }),
            requestContext: {
              authorizer: {
                user_id: context.user_id,
                tenant_id: context.tenant_id,
              },
            } as any,
          };

          const result = await submitPracticeSet(event as APIGatewayProxyEvent);
          expect(result.statusCode).toBe(200);

          const body = JSON.parse(result.body);
          expect(body.success).toBe(true);
          expect(body.score.score).toBeGreaterThanOrEqual(0);
          expect(body.score.score).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5.3: Score increases with more correct answers
   * For any two sets of answers where one has more correct answers than the other,
   * the score for the first set must be greater than or equal to the second.
   */
  it('should increase score with more correct answers', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          user_id: fc.uuid(),
          tenant_id: fc.string({ minLength: 1, maxLength: 50 }),
          practice_set_id: fc.uuid(),
          correctCount: fc.integer({ min: 0, max: 4 }),
        }),
        async (context: any) => {
          ddbMock.on(GetItemCommand).resolves({
            Item: marshall({
              'tenant_id#user_id': `${context.tenant_id}#${context.user_id}`,
              practice_set_id: context.practice_set_id,
              correct_answers: {
                q_1: 'A',
                q_2: 'B',
                q_3: 'C',
                q_4: 'D',
              },
              paper: 'JAIIB_IE_IFS',
            }),
          });

          ddbMock.on(PutItemCommand).resolves({});
          ddbMock.on(UpdateItemCommand).resolves({});

          // Create answers with specified number of correct answers
          const answers: any = {};
          const correctAnswers = ['A', 'B', 'C', 'D'];

          for (let i = 0; i < 4; i++) {
            if (i < context.correctCount) {
              answers[`q_${i + 1}`] = correctAnswers[i];
            } else {
              // Wrong answer or unanswered
              answers[`q_${i + 1}`] = i % 2 === 0 ? null : 'X';
            }
          }

          const event: Partial<APIGatewayProxyEvent> = {
            httpMethod: 'POST',
            path: `/practice-sets/${context.practice_set_id}/submit`,
            pathParameters: { id: context.practice_set_id },
            body: JSON.stringify({ answers, time_taken: 300 }),
            requestContext: {
              authorizer: {
                user_id: context.user_id,
                tenant_id: context.tenant_id,
              },
            } as any,
          };

          const result = await submitPracticeSet(event as APIGatewayProxyEvent);
          expect(result.statusCode).toBe(200);

          const body = JSON.parse(result.body);
          const expectedScore = (context.correctCount / 4) * 100;
          expect(body.score.score).toBe(expectedScore);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 5.4: Unanswered questions are treated as incorrect
   * For any question left unanswered (null or empty), it must be counted as incorrect
   * and not contribute to the score.
   */
  it('should treat unanswered questions as incorrect', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          user_id: fc.uuid(),
          tenant_id: fc.string({ minLength: 1, maxLength: 50 }),
          practice_set_id: fc.uuid(),
          unansweredIndices: fc.array(fc.integer({ min: 0, max: 3 }), { maxLength: 4 }).map((arr) => [...new Set(arr)]),
        }),
        async (context: any) => {
          ddbMock.on(GetItemCommand).resolves({
            Item: marshall({
              'tenant_id#user_id': `${context.tenant_id}#${context.user_id}`,
              practice_set_id: context.practice_set_id,
              correct_answers: {
                q_1: 'A',
                q_2: 'B',
                q_3: 'C',
                q_4: 'D',
              },
              paper: 'JAIIB_IE_IFS',
            }),
          });

          ddbMock.on(PutItemCommand).resolves({});
          ddbMock.on(UpdateItemCommand).resolves({});

          // Create answers with some unanswered
          const answers: any = {
            q_1: 'A',
            q_2: 'B',
            q_3: 'C',
            q_4: 'D',
          };

          context.unansweredIndices.forEach((idx: number) => {
            answers[`q_${idx + 1}`] = null;
          });

          const event: Partial<APIGatewayProxyEvent> = {
            httpMethod: 'POST',
            path: `/practice-sets/${context.practice_set_id}/submit`,
            pathParameters: { id: context.practice_set_id },
            body: JSON.stringify({ answers, time_taken: 300 }),
            requestContext: {
              authorizer: {
                user_id: context.user_id,
                tenant_id: context.tenant_id,
              },
            } as any,
          };

          const result = await submitPracticeSet(event as APIGatewayProxyEvent);
          expect(result.statusCode).toBe(200);

          const body = JSON.parse(result.body);
          const correctCount = 4 - context.unansweredIndices.length;
          const expectedScore = (correctCount / 4) * 100;
          expect(body.score.score).toBe(expectedScore);
          expect(body.score.unanswered_count).toBe(context.unansweredIndices.length);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 5.5: Score calculation is consistent across multiple invocations
   * For the same user answers and correct answers, multiple score calculations
   * must produce identical results.
   */
  it('should produce consistent scores across multiple invocations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          user_id: fc.uuid(),
          tenant_id: fc.string({ minLength: 1, maxLength: 50 }),
          practice_set_id: fc.uuid(),
          answers: fc.record({
            q_1: fc.oneof(fc.constant('A'), fc.constant('B'), fc.constant('C'), fc.constant('D'), fc.constant(null)),
            q_2: fc.oneof(fc.constant('A'), fc.constant('B'), fc.constant('C'), fc.constant('D'), fc.constant(null)),
            q_3: fc.oneof(fc.constant('A'), fc.constant('B'), fc.constant('C'), fc.constant('D'), fc.constant(null)),
            q_4: fc.oneof(fc.constant('A'), fc.constant('B'), fc.constant('C'), fc.constant('D'), fc.constant(null)),
          }),
        }),
        async (context: any) => {
          ddbMock.on(GetItemCommand).resolves({
            Item: marshall({
              'tenant_id#user_id': `${context.tenant_id}#${context.user_id}`,
              practice_set_id: context.practice_set_id,
              correct_answers: {
                q_1: 'A',
                q_2: 'B',
                q_3: 'C',
                q_4: 'D',
              },
              paper: 'JAIIB_IE_IFS',
            }),
          });

          ddbMock.on(PutItemCommand).resolves({});
          ddbMock.on(UpdateItemCommand).resolves({});

          const event: Partial<APIGatewayProxyEvent> = {
            httpMethod: 'POST',
            path: `/practice-sets/${context.practice_set_id}/submit`,
            pathParameters: { id: context.practice_set_id },
            body: JSON.stringify({ answers: context.answers, time_taken: 300 }),
            requestContext: {
              authorizer: {
                user_id: context.user_id,
                tenant_id: context.tenant_id,
              },
            } as any,
          };

          // Calculate score 5 times
          const scores: number[] = [];
          for (let i = 0; i < 5; i++) {
            const result = await submitPracticeSet(event as APIGatewayProxyEvent);
            expect(result.statusCode).toBe(200);

            const body = JSON.parse(result.body);
            scores.push(body.score.score);
          }

          // All scores should be identical
          const firstScore = scores[0];
          scores.forEach((score) => {
            expect(score).toBe(firstScore);
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 5.6: Score breakdown is accurate
   * For any set of answers, the correct_count, incorrect_count, and unanswered_count
   * must sum to 4 and accurately reflect the answer distribution.
   */
  it('should provide accurate score breakdown', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          user_id: fc.uuid(),
          tenant_id: fc.string({ minLength: 1, maxLength: 50 }),
          practice_set_id: fc.uuid(),
          answers: fc.record({
            q_1: fc.oneof(fc.constant('A'), fc.constant('B'), fc.constant('C'), fc.constant('D'), fc.constant(null)),
            q_2: fc.oneof(fc.constant('A'), fc.constant('B'), fc.constant('C'), fc.constant('D'), fc.constant(null)),
            q_3: fc.oneof(fc.constant('A'), fc.constant('B'), fc.constant('C'), fc.constant('D'), fc.constant(null)),
            q_4: fc.oneof(fc.constant('A'), fc.constant('B'), fc.constant('C'), fc.constant('D'), fc.constant(null)),
          }),
        }),
        async (context: any) => {
          ddbMock.on(GetItemCommand).resolves({
            Item: marshall({
              'tenant_id#user_id': `${context.tenant_id}#${context.user_id}`,
              practice_set_id: context.practice_set_id,
              correct_answers: {
                q_1: 'A',
                q_2: 'B',
                q_3: 'C',
                q_4: 'D',
              },
              paper: 'JAIIB_IE_IFS',
            }),
          });

          ddbMock.on(PutItemCommand).resolves({});
          ddbMock.on(UpdateItemCommand).resolves({});

          const event: Partial<APIGatewayProxyEvent> = {
            httpMethod: 'POST',
            path: `/practice-sets/${context.practice_set_id}/submit`,
            pathParameters: { id: context.practice_set_id },
            body: JSON.stringify({ answers: context.answers, time_taken: 300 }),
            requestContext: {
              authorizer: {
                user_id: context.user_id,
                tenant_id: context.tenant_id,
              },
            } as any,
          };

          const result = await submitPracticeSet(event as APIGatewayProxyEvent);
          expect(result.statusCode).toBe(200);

          const body = JSON.parse(result.body);
          const { correct_count, incorrect_count, unanswered_count } = body.score;

          // Sum should equal 4
          expect(correct_count + incorrect_count + unanswered_count).toBe(4);

          // All counts should be non-negative
          expect(correct_count).toBeGreaterThanOrEqual(0);
          expect(incorrect_count).toBeGreaterThanOrEqual(0);
          expect(unanswered_count).toBeGreaterThanOrEqual(0);

          // Score should match correct count
          const expectedScore = (correct_count / 4) * 100;
          expect(body.score.score).toBe(expectedScore);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5.7: Score calculation handles edge cases correctly
   * For edge cases (all correct, all incorrect, all unanswered), the score
   * must be calculated correctly.
   */
  it('should handle edge cases correctly', async () => {
    const testCases = [
      { answers: { q_1: 'A', q_2: 'B', q_3: 'C', q_4: 'D' }, expectedScore: 100, description: 'all correct' },
      { answers: { q_1: 'B', q_2: 'A', q_3: 'D', q_4: 'C' }, expectedScore: 0, description: 'all incorrect' },
      { answers: { q_1: null, q_2: null, q_3: null, q_4: null }, expectedScore: 0, description: 'all unanswered' },
      { answers: { q_1: 'A', q_2: null, q_3: null, q_4: null }, expectedScore: 25, description: '1 correct, 3 unanswered' },
      { answers: { q_1: 'A', q_2: 'B', q_3: null, q_4: null }, expectedScore: 50, description: '2 correct, 2 unanswered' },
      { answers: { q_1: 'A', q_2: 'B', q_3: 'C', q_4: null }, expectedScore: 75, description: '3 correct, 1 unanswered' },
    ];

    for (const testCase of testCases) {
      const context = {
        user_id: 'test-user',
        tenant_id: 'test-tenant',
        practice_set_id: 'test-ps',
      };

      ddbMock.on(GetItemCommand).resolves({
        Item: marshall({
          'tenant_id#user_id': `${context.tenant_id}#${context.user_id}`,
          practice_set_id: context.practice_set_id,
          correct_answers: {
            q_1: 'A',
            q_2: 'B',
            q_3: 'C',
            q_4: 'D',
          },
          paper: 'JAIIB_IE_IFS',
        }),
      });

      ddbMock.on(PutItemCommand).resolves({});
      ddbMock.on(UpdateItemCommand).resolves({});

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'POST',
        path: `/practice-sets/${context.practice_set_id}/submit`,
        pathParameters: { id: context.practice_set_id },
        body: JSON.stringify({ answers: testCase.answers, time_taken: 300 }),
        requestContext: {
          authorizer: {
            user_id: context.user_id,
            tenant_id: context.tenant_id,
          },
        } as any,
      };

      const result = await submitPracticeSet(event as APIGatewayProxyEvent);
      expect(result.statusCode).toBe(200);

      const body = JSON.parse(result.body);
      expect(body.score.score).toBe(testCase.expectedScore);
    }
  });
});
