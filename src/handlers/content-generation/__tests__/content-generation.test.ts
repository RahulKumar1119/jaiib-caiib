/**
 * Unit Tests for Content Generation Handler
 * Tests MCQ content generation, prompt construction, response parsing, and caching
 * Requirements: 3.7, 6.9, 9.2
 */

import { handler } from '../index';
import {
  DynamoDBClient,
  PutItemCommand,
} from '@aws-sdk/client-dynamodb';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { mockClient } from 'aws-sdk-client-mock';

// Mock AWS clients
const dynamoDbMock = mockClient(DynamoDBClient);
const bedrockMock = mockClient(BedrockRuntimeClient);

// Helper to create mock Bedrock response
const createMockBedrockResponse = (mcq: any) => ({
  body: {
    transformToString: async () =>
      JSON.stringify({
        content: [{ text: JSON.stringify(mcq) }],
      }),
  },
});

describe('Content Generation Handler', () => {
  beforeEach(() => {
    dynamoDbMock.reset();
    bedrockMock.reset();
  });

  describe('POST /generate-questions', () => {
    it('should generate MCQ questions for a valid paper', async () => {
      const mockMCQ = {
        question_text: 'What is the primary function of RBI?',
        option_a: 'Monetary policy implementation',
        option_b: 'Tax collection',
        option_c: 'Direct lending to individuals',
        option_d: 'Stock market trading',
        correct_answer: 'A',
        rbi_norms: ['RBI Act 1934, Section 45'],
        iibf_norms: ['IIBF Banking Regulation Guide'],
        explanation: 'The RBI implements monetary policy to control inflation and credit.',
      };

      bedrockMock.on(InvokeModelCommand).resolves(createMockBedrockResponse(mockMCQ) as any);
      dynamoDbMock.on(PutItemCommand).resolves({});

      const event = {
        httpMethod: 'POST',
        path: '/generate-questions',
        body: JSON.stringify({
          paper: 'JAIIB_IE_IFS',
          count: 1,
          difficulty: 'medium',
        }),
        requestContext: {
          authorizer: {
            user_id: 'user_123',
            tenant_id: 'tenant_123',
          },
        },
        headers: {},
        pathParameters: null,
        queryStringParameters: null,
        multiValueHeaders: {},
        multiValueQueryStringParameters: null,
        isBase64Encoded: false,
        resource: '',
        requestId: '',
        accountId: '',
        stage: '',
        identity: {
          sourceIp: '',
        },
      } as any;

      const response = await handler(event);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.questions).toHaveLength(1);
      expect(body.questions[0].question_text).toBe(mockMCQ.question_text);
      expect(body.questions[0].correct_answer).toBe('A');
      expect(body.questions[0].paper).toBe('JAIIB_IE_IFS');
      expect(body.questions[0].rbi_norms).toContain('RBI Act 1934, Section 45');
      expect(body.questions[0].iibf_norms).toContain('IIBF Banking Regulation Guide');
    });

    it('should validate paper parameter', async () => {
      const event = {
        httpMethod: 'POST',
        path: '/generate-questions',
        body: JSON.stringify({
          paper: 'INVALID_PAPER',
          count: 1,
        }),
        requestContext: {
          authorizer: {
            user_id: 'user_123',
            tenant_id: 'tenant_123',
          },
        },
        headers: {},
        pathParameters: null,
        queryStringParameters: null,
        multiValueHeaders: {},
        multiValueQueryStringParameters: null,
        isBase64Encoded: false,
        resource: '',
        requestId: '',
        accountId: '',
        stage: '',
        identity: {
          sourceIp: '',
        },
      } as any;

      const response = await handler(event);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('Invalid paper');
    });

    it('should validate count parameter', async () => {
      const event = {
        httpMethod: 'POST',
        path: '/generate-questions',
        body: JSON.stringify({
          paper: 'JAIIB_IE_IFS',
          count: 15, // Invalid: > 10
        }),
        requestContext: {
          authorizer: {
            user_id: 'user_123',
            tenant_id: 'tenant_123',
          },
        },
        headers: {},
        pathParameters: null,
        queryStringParameters: null,
        multiValueHeaders: {},
        multiValueQueryStringParameters: null,
        isBase64Encoded: false,
        resource: '',
        requestId: '',
        accountId: '',
        stage: '',
        identity: {
          sourceIp: '',
        },
      } as any;

      const response = await handler(event);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('Count must be between 1 and 10');
    });

    it('should validate difficulty parameter', async () => {
      const event = {
        httpMethod: 'POST',
        path: '/generate-questions',
        body: JSON.stringify({
          paper: 'JAIIB_IE_IFS',
          count: 1,
          difficulty: 'invalid_difficulty',
        }),
        requestContext: {
          authorizer: {
            user_id: 'user_123',
            tenant_id: 'tenant_123',
          },
        },
        headers: {},
        pathParameters: null,
        queryStringParameters: null,
        multiValueHeaders: {},
        multiValueQueryStringParameters: null,
        isBase64Encoded: false,
        resource: '',
        requestId: '',
        accountId: '',
        stage: '',
        identity: {
          sourceIp: '',
        },
      } as any;

      const response = await handler(event);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('Invalid difficulty');
    });

    it('should generate multiple questions when count > 1', async () => {
      const mockMCQ1 = {
        question_text: 'Question 1?',
        option_a: 'Option A',
        option_b: 'Option B',
        option_c: 'Option C',
        option_d: 'Option D',
        correct_answer: 'A',
        rbi_norms: [],
        iibf_norms: [],
        explanation: 'Explanation 1',
      };

      const mockMCQ2 = {
        question_text: 'Question 2?',
        option_a: 'Option A',
        option_b: 'Option B',
        option_c: 'Option C',
        option_d: 'Option D',
        correct_answer: 'B',
        rbi_norms: [],
        iibf_norms: [],
        explanation: 'Explanation 2',
      };

      bedrockMock
        .on(InvokeModelCommand)
        .resolvesOnce(createMockBedrockResponse(mockMCQ1) as any)
        .resolvesOnce(createMockBedrockResponse(mockMCQ2) as any);

      dynamoDbMock.on(PutItemCommand).resolves({});

      const event = {
        httpMethod: 'POST',
        path: '/generate-questions',
        body: JSON.stringify({
          paper: 'JAIIB_PPB',
          count: 2,
          difficulty: 'hard',
        }),
        requestContext: {
          authorizer: {
            user_id: 'user_123',
            tenant_id: 'tenant_123',
          },
        },
        headers: {},
        pathParameters: null,
        queryStringParameters: null,
        multiValueHeaders: {},
        multiValueQueryStringParameters: null,
        isBase64Encoded: false,
        resource: '',
        requestId: '',
        accountId: '',
        stage: '',
        identity: {
          sourceIp: '',
        },
      } as any;

      const response = await handler(event);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.questions).toHaveLength(2);
      expect(body.generated_count).toBe(2);
    });

    it('should cache explanations in ExplanationCache table', async () => {
      const mockMCQ = {
        question_text: 'What is inflation?',
        option_a: 'Rise in prices',
        option_b: 'Fall in prices',
        option_c: 'Stable prices',
        option_d: 'No prices',
        correct_answer: 'A',
        rbi_norms: ['RBI Monetary Policy'],
        iibf_norms: [],
        explanation: 'Inflation is the rise in general price levels.',
      };

      bedrockMock.on(InvokeModelCommand).resolves(createMockBedrockResponse(mockMCQ) as any);

      let cacheCommand: any;
      dynamoDbMock.on(PutItemCommand).callsFake((input) => {
        if (input.TableName === 'explanation_cache') {
          cacheCommand = input;
        }
        return Promise.resolve({});
      });

      const event = {
        httpMethod: 'POST',
        path: '/generate-questions',
        body: JSON.stringify({
          paper: 'JAIIB_IE_IFS',
          count: 1,
        }),
        requestContext: {
          authorizer: {
            user_id: 'user_123',
            tenant_id: 'tenant_123',
          },
        },
        headers: {},
        pathParameters: null,
        queryStringParameters: null,
        multiValueHeaders: {},
        multiValueQueryStringParameters: null,
        isBase64Encoded: false,
        resource: '',
        requestId: '',
        accountId: '',
        stage: '',
        identity: {
          sourceIp: '',
        },
      } as any;

      const response = await handler(event);

      expect(response.statusCode).toBe(200);
      // Verify that cache command was called
      expect(cacheCommand).toBeDefined();
    });

    it('should handle Bedrock failures gracefully', async () => {
      bedrockMock.on(InvokeModelCommand).rejects(new Error('Bedrock service unavailable'));

      const event = {
        httpMethod: 'POST',
        path: '/generate-questions',
        body: JSON.stringify({
          paper: 'JAIIB_IE_IFS',
          count: 1,
        }),
        requestContext: {
          authorizer: {
            user_id: 'user_123',
            tenant_id: 'tenant_123',
          },
        },
        headers: {},
        pathParameters: null,
        queryStringParameters: null,
        multiValueHeaders: {},
        multiValueQueryStringParameters: null,
        isBase64Encoded: false,
        resource: '',
        requestId: '',
        accountId: '',
        stage: '',
        identity: {
          sourceIp: '',
        },
      } as any;

      const response = await handler(event);

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('Unable to generate practice set');
    });

    it('should require authentication context', async () => {
      const event = {
        httpMethod: 'POST',
        path: '/generate-questions',
        body: JSON.stringify({
          paper: 'JAIIB_IE_IFS',
          count: 1,
        }),
        requestContext: {
          authorizer: null, // Missing authorizer
        },
        headers: {},
        pathParameters: null,
        queryStringParameters: null,
        multiValueHeaders: {},
        multiValueQueryStringParameters: null,
        isBase64Encoded: false,
        resource: '',
        requestId: '',
        accountId: '',
        stage: '',
        identity: {
          sourceIp: '',
        },
      } as any;

      const response = await handler(event);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('Missing user context');
    });

    it('should include RBI and IIBF norms in generated questions', async () => {
      const mockMCQ = {
        question_text: 'What is the CRR?',
        option_a: 'Cash Reserve Ratio',
        option_b: 'Credit Risk Ratio',
        option_c: 'Capital Requirement Ratio',
        option_d: 'Compliance Review Ratio',
        correct_answer: 'A',
        rbi_norms: ['RBI Act 1934, Section 42', 'RBI Monetary Policy Framework'],
        iibf_norms: ['IIBF Banking Regulation Guide', 'IIBF Compliance Standards'],
        explanation: 'CRR is the Cash Reserve Ratio maintained by banks.',
      };

      bedrockMock.on(InvokeModelCommand).resolves(createMockBedrockResponse(mockMCQ) as any);
      dynamoDbMock.on(PutItemCommand).resolves({});

      const event = {
        httpMethod: 'POST',
        path: '/generate-questions',
        body: JSON.stringify({
          paper: 'JAIIB_IE_IFS',
          count: 1,
        }),
        requestContext: {
          authorizer: {
            user_id: 'user_123',
            tenant_id: 'tenant_123',
          },
        },
        headers: {},
        pathParameters: null,
        queryStringParameters: null,
        multiValueHeaders: {},
        multiValueQueryStringParameters: null,
        isBase64Encoded: false,
        resource: '',
        requestId: '',
        accountId: '',
        stage: '',
        identity: {
          sourceIp: '',
        },
      } as any;

      const response = await handler(event);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.questions[0].rbi_norms).toHaveLength(2);
      expect(body.questions[0].iibf_norms).toHaveLength(2);
      expect(body.questions[0].rbi_norms[0]).toContain('RBI Act');
      expect(body.questions[0].iibf_norms[0]).toContain('IIBF');
    });

    it('should generate questions aligned with JAIIB syllabus topics', async () => {
      const mockMCQ = {
        question_text: 'What is monetary policy?',
        option_a: 'Policy on money supply',
        option_b: 'Policy on taxation',
        option_c: 'Policy on spending',
        option_d: 'Policy on employment',
        correct_answer: 'A',
        rbi_norms: [],
        iibf_norms: [],
        explanation: 'Monetary policy controls money supply.',
      };

      bedrockMock.on(InvokeModelCommand).resolves(createMockBedrockResponse(mockMCQ) as any);
      dynamoDbMock.on(PutItemCommand).resolves({});

      const event = {
        httpMethod: 'POST',
        path: '/generate-questions',
        body: JSON.stringify({
          paper: 'JAIIB_IE_IFS',
          count: 1,
        }),
        requestContext: {
          authorizer: {
            user_id: 'user_123',
            tenant_id: 'tenant_123',
          },
        },
        headers: {},
        pathParameters: null,
        queryStringParameters: null,
        multiValueHeaders: {},
        multiValueQueryStringParameters: null,
        isBase64Encoded: false,
        resource: '',
        requestId: '',
        accountId: '',
        stage: '',
        identity: {
          sourceIp: '',
        },
      } as any;

      const response = await handler(event);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.questions[0].syllabus_topic).toBeDefined();
      // Verify it's one of the valid topics for JAIIB_IE_IFS
      const validTopics = [
        'Economic Planning in India',
        'Monetary Policy',
        'Fiscal Policy',
        'Banking Regulation',
        'RBI Functions',
        'International Financial System',
        'Foreign Exchange Management',
        'Capital Markets',
        'Insurance Sector',
        'Financial Inclusion',
      ];
      expect(validTopics).toContain(body.questions[0].syllabus_topic);
    });

    it('should handle partial failures when generating multiple questions', async () => {
      const mockMCQ = {
        question_text: 'Valid question?',
        option_a: 'Option A',
        option_b: 'Option B',
        option_c: 'Option C',
        option_d: 'Option D',
        correct_answer: 'A',
        rbi_norms: [],
        iibf_norms: [],
        explanation: 'Explanation',
      };

      bedrockMock
        .on(InvokeModelCommand)
        .resolvesOnce(createMockBedrockResponse(mockMCQ) as any)
        .rejectsOnce(new Error('Bedrock error'))
        .resolvesOnce(createMockBedrockResponse(mockMCQ) as any);

      dynamoDbMock.on(PutItemCommand).resolves({});

      const event = {
        httpMethod: 'POST',
        path: '/generate-questions',
        body: JSON.stringify({
          paper: 'JAIIB_AFB',
          count: 3,
        }),
        requestContext: {
          authorizer: {
            user_id: 'user_123',
            tenant_id: 'tenant_123',
          },
        },
        headers: {},
        pathParameters: null,
        queryStringParameters: null,
        multiValueHeaders: {},
        multiValueQueryStringParameters: null,
        isBase64Encoded: false,
        resource: '',
        requestId: '',
        accountId: '',
        stage: '',
        identity: {
          sourceIp: '',
        },
      } as any;

      const response = await handler(event);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.generated_count).toBe(2); // 2 successful, 1 failed
      expect(body.failed_count).toBe(1);
    }, 15000);
  });

  describe('Invalid endpoints', () => {
    it('should return 404 for invalid path', async () => {
      const event = {
        httpMethod: 'GET',
        path: '/invalid-path',
        body: null,
        requestContext: {
          authorizer: {
            user_id: 'user_123',
            tenant_id: 'tenant_123',
          },
        },
        headers: {},
        pathParameters: null,
        queryStringParameters: null,
        multiValueHeaders: {},
        multiValueQueryStringParameters: null,
        isBase64Encoded: false,
        resource: '',
        requestId: '',
        accountId: '',
        stage: '',
        identity: {
          sourceIp: '',
        },
      } as any;

      const response = await handler(event);

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('Not found');
    });
  });
});
