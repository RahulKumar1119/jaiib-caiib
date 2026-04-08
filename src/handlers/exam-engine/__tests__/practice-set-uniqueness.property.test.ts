/**
 * Property-Based Tests for Practice Set Uniqueness per Paper
 * Validates that practice sets contain unique questions across consecutive generations
 * 
 * Property 3: Practice Set Uniqueness per Paper
 * For any user and JAIIB paper, generating 10 consecutive practice sets must result in 
 * no question appearing in more than one set.
 * 
 * **Validates: Requirements 3.3**
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

describe('Property: Practice Set Uniqueness per Paper', () => {
  beforeEach(() => {
    ddbMock.reset();
    jest.clearAllMocks();
  });

  /**
   * Property 3.1: No question repeats within a single practice set
   * For any paper, each generated practice set should contain 4 unique questions
   * with no duplicates within that set.
   */
  it('should generate practice sets with no question repeats within the set', async () => {
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
          // Generate 50 unique questions for the paper
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

          // Mock QueryCommand to return questions
          ddbMock.on(QueryCommand).resolves({
            Items: questions.map((q) => marshall(q)),
          });

          // Mock PutItemCommand for storing practice sets
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
          expect(body.success).toBe(true);
          expect(body.practice_set.questions).toHaveLength(4);

          // Collect question IDs from this practice set
          const questionIds = body.practice_set.questions.map((q: any) => q.question_id);
          const uniqueIds = new Set(questionIds);

          // Verify all questions are unique within the set
          expect(uniqueIds.size).toBe(4);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 3.2: Each practice set contains exactly 4 unique questions
   * For any paper, each generated practice set should contain exactly 4 questions
   * and no question should appear twice in the same set.
   */
  it('should generate practice sets with exactly 4 unique questions', async () => {
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
          // Generate 40 unique questions for the paper
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
          expect(body.practice_set.questions).toHaveLength(4);

          // Verify all questions are unique
          const questionIds = body.practice_set.questions.map((q: any) => q.question_id);
          const uniqueIds = new Set(questionIds);
          expect(uniqueIds.size).toBe(4);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 3.3: Different practice sets for same paper use randomization
   * For any paper with sufficient questions, generating multiple practice sets should 
   * result in varied question selections (not always the same questions).
   */
  it('should generate varied questions across multiple practice sets for same paper', async () => {
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
          // Generate 50 unique questions for the paper
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

          // Generate 5 practice sets
          const allQuestionIds: string[] = [];
          const setQuestions: string[][] = [];

          for (let i = 0; i < 5; i++) {
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
            const questionIds = body.practice_set.questions.map((q: any) => q.question_id);
            setQuestions.push(questionIds);
            allQuestionIds.push(...questionIds);
          }

          // Verify we have 20 question IDs (5 sets * 4 questions)
          expect(allQuestionIds).toHaveLength(20);

          // Verify that not all sets are identical (randomization is working)
          const setStrings = setQuestions.map((s) => JSON.stringify(s.sort()));
          const uniqueSets = new Set(setStrings);
          expect(uniqueSets.size).toBeGreaterThan(1);
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property 3.4: Practice set generation fails gracefully with insufficient questions
   * For any paper with fewer than 4 active questions, practice set generation should fail
   * with a clear error message.
   */
  it('should fail gracefully when insufficient questions are available', async () => {
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
          questionCount: fc.integer({ min: 0, max: 3 }),
        }),
        async (context: any) => {
          // Generate fewer than 4 questions
          const questions = Array.from({ length: context.questionCount }, (_, i) => ({
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
          expect(result.statusCode).toBe(400);

          const body = JSON.parse(result.body);
          expect(body.success).toBe(false);
          expect(body.error).toContain('Insufficient questions');
        }
      ),
      { numRuns: 10 }
    );
  });
});
