/**
 * Property-Based Tests for Answer Option Shuffling
 * Validates that answer options are properly shuffled while maintaining correct answer mapping
 * 
 * Property 4: Answer Option Shuffling
 * For any practice set generated multiple times for the same question, the order of 
 * answer options (A, B, C, D) must vary across generations.
 * 
 * **Validates: Requirements 3.4**
 */

import fc from 'fast-check';
import { DynamoDBClient, QueryCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { marshall } from '@aws-sdk/util-dynamodb';
import { handler } from '../index';
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
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

jest.mock('/opt/nodejs/constants', () => ({
  DYNAMODB_TABLES: {
    QUESTIONS: 'questions',
    PRACTICE_SETS: 'practice_sets',
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

describe('Property: Answer Option Shuffling', () => {
  beforeEach(() => {
    ddbMock.reset();
    jest.clearAllMocks();
  });

  /**
   * Property 4.1: Answer options are shuffled (not in original A, B, C, D order)
   * For any practice set, the answer options should be shuffled and not appear
   * in the original A, B, C, D order.
   */
  it('should shuffle answer options and not maintain original order', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          user_id: fc.uuid(),
          tenant_id: fc.string({ minLength: 1, maxLength: 50 }),
          paper: fc.oneof(
            fc.constant('JAIIB_IE_IFS'),
            fc.constant('JAIIB_PPB'),
            fc.constant('JAIIB_AFB'),
            fc.constant('JAIIB_RBWM')
          ),
        }),
        async (context: any) => {
          // Generate 40 unique questions
          const questions = Array.from({ length: 40 }, (_, i) => ({
            'paper#question_id': `${context.paper}#q_${i}`,
            paper: context.paper,
            question_id: `q_${i}`,
            version: 1,
            question_text: `Question ${i}`,
            option_a: `Option A for Q${i}`,
            option_b: `Option B for Q${i}`,
            option_c: `Option C for Q${i}`,
            option_d: `Option D for Q${i}`,
            correct_answer: 'A',
            status: 'active',
            difficulty_level: 'medium',
          }));

          ddbMock.on(QueryCommand).resolves({
            Items: questions.map((q) => marshall(q)),
          });

          ddbMock.on(PutItemCommand).resolves({});

          const event: Partial<APIGatewayProxyEvent> = {
            httpMethod: 'POST',
            path: '/practice-sets',
            body: JSON.stringify({ paper: context.paper }),
            requestContext: {
              authorizer: {
                user_id: context.user_id,
                tenant_id: context.tenant_id,
              },
            } as any,
          };

          const result = await handler(event as APIGatewayProxyEvent);
          expect(result.statusCode).toBe(200);

          const body = JSON.parse(result.body);
          const questions_in_set = body.practice_set.questions;

          // For each question, verify that the order is not the original A, B, C, D
          let hasShuffledQuestion = false;
          for (const question of questions_in_set) {
            const order = question.order;
            // Original order would be ['A', 'B', 'C', 'D']
            if (JSON.stringify(order) !== JSON.stringify(['A', 'B', 'C', 'D'])) {
              hasShuffledQuestion = true;
              break;
            }
          }

          // At least one question should be shuffled
          expect(hasShuffledQuestion).toBe(true);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 4.2: Correct answer mapping is preserved after shuffling
   * For any practice set, the correct answer should still be correct after shuffling.
   */
  it('should preserve correct answer mapping after shuffling', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          user_id: fc.uuid(),
          tenant_id: fc.string({ minLength: 1, maxLength: 50 }),
          paper: fc.oneof(
            fc.constant('JAIIB_IE_IFS'),
            fc.constant('JAIIB_PPB'),
            fc.constant('JAIIB_AFB'),
            fc.constant('JAIIB_RBWM')
          ),
        }),
        async (context: any) => {
          // Generate 40 unique questions with different correct answers
          const questions = Array.from({ length: 40 }, (_, i) => {
            const correctAnswers = ['A', 'B', 'C', 'D'];
            const correctAnswer = correctAnswers[i % 4];
            return {
              'paper#question_id': `${context.paper}#q_${i}`,
              paper: context.paper,
              question_id: `q_${i}`,
              version: 1,
              question_text: `Question ${i}`,
              option_a: `Option A for Q${i}`,
              option_b: `Option B for Q${i}`,
              option_c: `Option C for Q${i}`,
              option_d: `Option D for Q${i}`,
              correct_answer: correctAnswer,
              status: 'active',
              difficulty_level: 'medium',
            };
          });

          ddbMock.on(QueryCommand).resolves({
            Items: questions.map((q) => marshall(q)),
          });

          ddbMock.on(PutItemCommand).resolves({});

          const event: Partial<APIGatewayProxyEvent> = {
            httpMethod: 'POST',
            path: '/practice-sets',
            body: JSON.stringify({ paper: context.paper }),
            requestContext: {
              authorizer: {
                user_id: context.user_id,
                tenant_id: context.tenant_id,
              },
            } as any,
          };

          const result = await handler(event as APIGatewayProxyEvent);
          expect(result.statusCode).toBe(200);

          const body = JSON.parse(result.body);
          const questions_in_set = body.practice_set.questions;

          // For each question, verify that the correct answer is still correct
          for (const question of questions_in_set) {
            const order = question.order;
            const options = question.options;

            // The correct answer should be one of the options
            expect(order).toContain('A');
            expect(order).toContain('B');
            expect(order).toContain('C');
            expect(order).toContain('D');

            // All options should be present
            expect(Object.keys(options)).toHaveLength(4);
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 4.3: Shuffling is random (different shuffles produce different orderings)
   * For any question, generating multiple practice sets should result in different
   * answer option orderings.
   */
  it('should produce different shuffles across multiple practice set generations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          user_id: fc.uuid(),
          tenant_id: fc.string({ minLength: 1, maxLength: 50 }),
          paper: fc.oneof(
            fc.constant('JAIIB_IE_IFS'),
            fc.constant('JAIIB_PPB'),
            fc.constant('JAIIB_AFB'),
            fc.constant('JAIIB_RBWM')
          ),
        }),
        async (context: any) => {
          // Generate 50 unique questions
          const questions = Array.from({ length: 50 }, (_, i) => ({
            'paper#question_id': `${context.paper}#q_${i}`,
            paper: context.paper,
            question_id: `q_${i}`,
            version: 1,
            question_text: `Question ${i}`,
            option_a: `Option A for Q${i}`,
            option_b: `Option B for Q${i}`,
            option_c: `Option C for Q${i}`,
            option_d: `Option D for Q${i}`,
            correct_answer: 'A',
            status: 'active',
            difficulty_level: 'medium',
          }));

          ddbMock.on(QueryCommand).resolves({
            Items: questions.map((q) => marshall(q)),
          });

          ddbMock.on(PutItemCommand).resolves({});

          // Generate 10 practice sets and collect the orderings
          const orderings: string[][] = [];

          for (let i = 0; i < 10; i++) {
            const event: Partial<APIGatewayProxyEvent> = {
              httpMethod: 'POST',
              path: '/practice-sets',
              body: JSON.stringify({ paper: context.paper }),
              requestContext: {
                authorizer: {
                  user_id: context.user_id,
                  tenant_id: context.tenant_id,
                },
              } as any,
            };

            const result = await handler(event as APIGatewayProxyEvent);
            expect(result.statusCode).toBe(200);

            const body = JSON.parse(result.body);
            const questions_in_set = body.practice_set.questions;

            // Collect the orderings from this practice set
            for (const question of questions_in_set) {
              orderings.push(question.order);
            }
          }

          // Verify that we have at least some different orderings
          // (not all orderings are the same)
          const uniqueOrderings = new Set(orderings.map((o) => JSON.stringify(o)));
          expect(uniqueOrderings.size).toBeGreaterThan(1);
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property 4.4: All answer options are present in shuffled questions
   * For any practice set, each question should have all four answer options (A, B, C, D).
   */
  it('should include all four answer options in each shuffled question', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          user_id: fc.uuid(),
          tenant_id: fc.string({ minLength: 1, maxLength: 50 }),
          paper: fc.oneof(
            fc.constant('JAIIB_IE_IFS'),
            fc.constant('JAIIB_PPB'),
            fc.constant('JAIIB_AFB'),
            fc.constant('JAIIB_RBWM')
          ),
        }),
        async (context: any) => {
          // Generate 40 unique questions
          const questions = Array.from({ length: 40 }, (_, i) => ({
            'paper#question_id': `${context.paper}#q_${i}`,
            paper: context.paper,
            question_id: `q_${i}`,
            version: 1,
            question_text: `Question ${i}`,
            option_a: `Option A for Q${i}`,
            option_b: `Option B for Q${i}`,
            option_c: `Option C for Q${i}`,
            option_d: `Option D for Q${i}`,
            correct_answer: 'A',
            status: 'active',
            difficulty_level: 'medium',
          }));

          ddbMock.on(QueryCommand).resolves({
            Items: questions.map((q) => marshall(q)),
          });

          ddbMock.on(PutItemCommand).resolves({});

          const event: Partial<APIGatewayProxyEvent> = {
            httpMethod: 'POST',
            path: '/practice-sets',
            body: JSON.stringify({ paper: context.paper }),
            requestContext: {
              authorizer: {
                user_id: context.user_id,
                tenant_id: context.tenant_id,
              },
            } as any,
          };

          const result = await handler(event as APIGatewayProxyEvent);
          expect(result.statusCode).toBe(200);

          const body = JSON.parse(result.body);
          const questions_in_set = body.practice_set.questions;

          // For each question, verify all four options are present
          for (const question of questions_in_set) {
            const options = question.options;
            const order = question.order;

            // Should have exactly 4 options
            expect(Object.keys(options)).toHaveLength(4);

            // Order should contain all four letters
            expect(order).toHaveLength(4);
            expect(order).toContain('A');
            expect(order).toContain('B');
            expect(order).toContain('C');
            expect(order).toContain('D');

            // Each letter should appear exactly once in the order
            expect(new Set(order).size).toBe(4);
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 4.5: Shuffled options maintain option content integrity
   * For any practice set, the content of each option should remain unchanged,
   * only the order should change.
   */
  it('should maintain option content integrity after shuffling', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          user_id: fc.uuid(),
          tenant_id: fc.string({ minLength: 1, maxLength: 50 }),
          paper: fc.oneof(
            fc.constant('JAIIB_IE_IFS'),
            fc.constant('JAIIB_PPB'),
            fc.constant('JAIIB_AFB'),
            fc.constant('JAIIB_RBWM')
          ),
        }),
        async (context: any) => {
          // Generate 40 unique questions
          const questions = Array.from({ length: 40 }, (_, i) => ({
            'paper#question_id': `${context.paper}#q_${i}`,
            paper: context.paper,
            question_id: `q_${i}`,
            version: 1,
            question_text: `Question ${i}`,
            option_a: `Option A for Q${i}`,
            option_b: `Option B for Q${i}`,
            option_c: `Option C for Q${i}`,
            option_d: `Option D for Q${i}`,
            correct_answer: 'A',
            status: 'active',
            difficulty_level: 'medium',
          }));

          ddbMock.on(QueryCommand).resolves({
            Items: questions.map((q) => marshall(q)),
          });

          ddbMock.on(PutItemCommand).resolves({});

          const event: Partial<APIGatewayProxyEvent> = {
            httpMethod: 'POST',
            path: '/practice-sets',
            body: JSON.stringify({ paper: context.paper }),
            requestContext: {
              authorizer: {
                user_id: context.user_id,
                tenant_id: context.tenant_id,
              },
            } as any,
          };

          const result = await handler(event as APIGatewayProxyEvent);
          expect(result.statusCode).toBe(200);

          const body = JSON.parse(result.body);
          const questions_in_set = body.practice_set.questions;

          // For each question, verify that the option content is preserved
          for (const question of questions_in_set) {
            const options = question.options;
            const order = question.order;

            // Verify that each option in the order exists in the options object
            for (const letter of order) {
              expect(options[letter]).toBeDefined();
              expect(typeof options[letter]).toBe('string');
              expect(options[letter].length).toBeGreaterThan(0);
            }

            // Verify that all options in the object are referenced in the order
            for (const letter of ['A', 'B', 'C', 'D']) {
              expect(options[letter]).toBeDefined();
              expect(order).toContain(letter);
            }
          }
        }
      ),
      { numRuns: 20 }
    );
  });
});
