/**
 * Unit Tests for Explanation Caching and Retrieval
 * Tests cache hit/miss scenarios, TTL expiration, and usage count tracking
 * 
 * Requirements: 6.6
 */

import { DynamoDBClient, GetItemCommand, PutItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import {
  getCachedExplanation,
  cacheExplanation,
  handleGetExplanation,
} from '../index';
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
    QUESTIONS: 'questions',
    EXPLANATION_CACHE: 'explanation_cache',
  },
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
  },
}));

describe('Explanation Caching Unit Tests', () => {
  beforeEach(() => {
    ddbMock.reset();
    jest.clearAllMocks();
  });

  afterEach(() => {
    ddbMock.reset();
  });

  describe('Cache Hit Scenarios', () => {
    /**
     * Test 1: Cache hit returns cached explanation
     * When an explanation exists in cache and hasn't expired,
     * getCachedExplanation should return the cached explanation
     */
    it('should return cached explanation on cache hit', async () => {
      const questionId = 'q_001';
      const now = Math.floor(Date.now() / 1000);
      const cachedData = {
        question_id: questionId,
        explanation_id: 'exp_123',
        correct_answer: 'A',
        explanation: 'The correct answer is A because...',
        rbi_norms: ['RBI Act 1934, Section 45'],
        iibf_norms: ['IIBF Banking Guide'],
        created_at: now - 86400, // 1 day ago
        updated_at: now,
        usage_count: 5,
        bedrock_model: 'anthropic.claude-haiku-4-5-20251001-v1:0',
        ttl: now + 2592000, // 30 days from creation
      };

      // Mock GetItemCommand for cache lookup
      ddbMock.on(GetItemCommand).resolves({
        Item: marshall(cachedData),
      });

      // Mock UpdateItemCommand for usage count increment
      ddbMock.on(UpdateItemCommand).resolves({});

      const result = await getCachedExplanation(questionId);

      expect(result).toBeDefined();
      expect(result?.question_id).toBe(questionId);
      expect(result?.explanation_id).toBe('exp_123');
      expect(result?.correct_answer).toBe('A');
      expect(result?.explanation_text).toBe('The correct answer is A because...');
      expect(result?.rbi_norms).toEqual(['RBI Act 1934, Section 45']);
      expect(result?.iibf_norms).toEqual(['IIBF Banking Guide']);
    });

    /**
     * Test 2: Cache hit increments usage count
     * When an explanation is retrieved from cache,
     * the usage_count should be incremented
     */
    it('should increment usage count on cache hit', async () => {
      const questionId = 'q_002';
      const now = Math.floor(Date.now() / 1000);
      const cachedData = {
        question_id: questionId,
        explanation_id: 'exp_124',
        correct_answer: 'B',
        explanation: 'The correct answer is B because...',
        rbi_norms: ['RBI Circular 2024'],
        iibf_norms: ['IIBF Compliance Standards'],
        created_at: now - 3600, // 1 hour ago
        updated_at: now,
        usage_count: 10,
        bedrock_model: 'anthropic.claude-haiku-4-5-20251001-v1:0',
        ttl: now + 2592000,
      };

      ddbMock.on(GetItemCommand).resolves({
        Item: marshall(cachedData),
      });

      let updateCalled = false;
      ddbMock.on(UpdateItemCommand).callsFake(async (input: any) => {
        updateCalled = true;
        // Verify the update expression includes usage_count increment
        expect(input.UpdateExpression).toContain('usage_count');
        return {};
      });

      await getCachedExplanation(questionId);

      expect(updateCalled).toBe(true);
    });

    /**
     * Test 3: Multiple cache hits return same explanation
     * When the same question is requested multiple times,
     * all requests should return the same cached explanation
     */
    it('should return same explanation for multiple cache hits', async () => {
      const questionId = 'q_003';
      const now = Math.floor(Date.now() / 1000);
      const cachedData = {
        question_id: questionId,
        explanation_id: 'exp_125',
        correct_answer: 'C',
        explanation: 'The correct answer is C because...',
        rbi_norms: ['RBI Act 1934'],
        iibf_norms: ['IIBF Banking Guide'],
        created_at: now - 7200, // 2 hours ago
        updated_at: now,
        usage_count: 1,
        bedrock_model: 'anthropic.claude-haiku-4-5-20251001-v1:0',
        ttl: now + 2592000,
      };

      ddbMock.on(GetItemCommand).resolves({
        Item: marshall(cachedData),
      });

      ddbMock.on(UpdateItemCommand).resolves({});

      const result1 = await getCachedExplanation(questionId);
      const result2 = await getCachedExplanation(questionId);
      const result3 = await getCachedExplanation(questionId);

      expect(result1?.explanation_id).toBe(result2?.explanation_id);
      expect(result2?.explanation_id).toBe(result3?.explanation_id);
      expect(result1?.explanation_text).toBe(result2?.explanation_text);
      expect(result2?.explanation_text).toBe(result3?.explanation_text);
    });
  });

  describe('Cache Miss Scenarios', () => {
    /**
     * Test 4: Cache miss returns null
     * When an explanation doesn't exist in cache,
     * getCachedExplanation should return null
     */
    it('should return null on cache miss', async () => {
      const questionId = 'q_nonexistent';

      ddbMock.on(GetItemCommand).resolves({
        Item: undefined,
      });

      const result = await getCachedExplanation(questionId);

      expect(result).toBeNull();
    });

    /**
     * Test 5: Cache miss doesn't increment usage count
     * When an explanation is not found in cache,
     * no usage count update should occur
     */
    it('should not increment usage count on cache miss', async () => {
      const questionId = 'q_nonexistent_2';

      ddbMock.on(GetItemCommand).resolves({
        Item: undefined,
      });

      let updateCalled = false;
      ddbMock.on(UpdateItemCommand).callsFake(async () => {
        updateCalled = true;
        return {};
      });

      await getCachedExplanation(questionId);

      expect(updateCalled).toBe(false);
    });

    /**
     * Test 6: Database error on cache lookup returns null
     * When DynamoDB fails during cache lookup,
     * getCachedExplanation should return null gracefully
     */
    it('should return null on database error during cache lookup', async () => {
      const questionId = 'q_error';

      ddbMock.on(GetItemCommand).rejects(new Error('DynamoDB connection failed'));

      const result = await getCachedExplanation(questionId);

      expect(result).toBeNull();
    });
  });

  describe('TTL Expiration Scenarios', () => {
    /**
     * Test 7: Expired cache returns null
     * When an explanation's TTL has expired,
     * getCachedExplanation should return null
     */
    it('should return null when cache has expired', async () => {
      const questionId = 'q_expired';
      const now = Math.floor(Date.now() / 1000);
      const expiredData = {
        question_id: questionId,
        explanation_id: 'exp_126',
        correct_answer: 'D',
        explanation: 'The correct answer is D because...',
        rbi_norms: ['RBI Act 1934'],
        iibf_norms: ['IIBF Banking Guide'],
        created_at: now - 2592001, // 30 days + 1 second ago
        updated_at: now - 2592001,
        usage_count: 3,
        bedrock_model: 'anthropic.claude-haiku-4-5-20251001-v1:0',
        ttl: now - 1, // Already expired
      };

      ddbMock.on(GetItemCommand).resolves({
        Item: marshall(expiredData),
      });

      const result = await getCachedExplanation(questionId);

      expect(result).toBeNull();
    });

    /**
     * Test 8: Cache near expiration still returns data
     * When an explanation is near TTL expiration but not expired,
     * getCachedExplanation should still return the cached data
     */
    it('should return cache data when near expiration but not expired', async () => {
      const questionId = 'q_near_expiration';
      const now = Math.floor(Date.now() / 1000);
      const nearExpirationData = {
        question_id: questionId,
        explanation_id: 'exp_127',
        correct_answer: 'A',
        explanation: 'The correct answer is A because...',
        rbi_norms: ['RBI Act 1934'],
        iibf_norms: ['IIBF Banking Guide'],
        created_at: now - 2591999, // 29 days + 59 seconds ago
        updated_at: now,
        usage_count: 2,
        bedrock_model: 'anthropic.claude-haiku-4-5-20251001-v1:0',
        ttl: now + 1, // Expires in 1 second
      };

      ddbMock.on(GetItemCommand).resolves({
        Item: marshall(nearExpirationData),
      });

      ddbMock.on(UpdateItemCommand).resolves({});

      const result = await getCachedExplanation(questionId);

      expect(result).toBeDefined();
      expect(result?.question_id).toBe(questionId);
    });

    /**
     * Test 9: TTL is exactly 30 days
     * When an explanation is cached, the TTL should be set to 30 days
     */
    it('should set TTL to 30 days when caching explanation', async () => {
      const explanation = {
        explanation_id: 'exp_128',
        question_id: 'q_ttl_test',
        correct_answer: 'B',
        explanation_text: 'The correct answer is B because...',
        rbi_norms: ['RBI Act 1934'],
        iibf_norms: ['IIBF Banking Guide'],
        generated_at: Math.floor(Date.now() / 1000),
        model: 'anthropic.claude-haiku-4-5-20251001-v1:0',
      };

      let capturedTTL: number | null = null;
      ddbMock.on(PutItemCommand).callsFake(async (input: any) => {
        const item = unmarshall(input.Item);
        capturedTTL = item.ttl;
        return {};
      });

      await cacheExplanation(explanation);

      expect(capturedTTL).toBeDefined();
      const now = Math.floor(Date.now() / 1000);
      const expectedTTL = now + 2592000; // 30 days
      // Allow 5 second tolerance for test execution time
      expect(capturedTTL).toBeGreaterThanOrEqual(expectedTTL - 5);
      expect(capturedTTL).toBeLessThanOrEqual(expectedTTL + 5);
    });
  });

  describe('Usage Count Tracking', () => {
    /**
     * Test 10: Usage count starts at 1 when caching
     * When an explanation is first cached,
     * usage_count should be initialized to 1
     */
    it('should initialize usage count to 1 when caching', async () => {
      const explanation = {
        explanation_id: 'exp_129',
        question_id: 'q_usage_test_1',
        correct_answer: 'C',
        explanation_text: 'The correct answer is C because...',
        rbi_norms: ['RBI Act 1934'],
        iibf_norms: ['IIBF Banking Guide'],
        generated_at: Math.floor(Date.now() / 1000),
        model: 'anthropic.claude-haiku-4-5-20251001-v1:0',
      };

      let capturedUsageCount: number | null = null;
      ddbMock.on(PutItemCommand).callsFake(async (input: any) => {
        const item = unmarshall(input.Item);
        capturedUsageCount = item.usage_count;
        return {};
      });

      await cacheExplanation(explanation);

      expect(capturedUsageCount).toBe(1);
    });

    /**
     * Test 11: Usage count increments on each cache hit
     * When an explanation is retrieved from cache multiple times,
     * usage_count should increment by 1 each time
     */
    it('should increment usage count on each cache hit', async () => {
      const questionId = 'q_usage_increment';
      const now = Math.floor(Date.now() / 1000);
      const cachedData = {
        question_id: questionId,
        explanation_id: 'exp_130',
        correct_answer: 'D',
        explanation: 'The correct answer is D because...',
        rbi_norms: ['RBI Act 1934'],
        iibf_norms: ['IIBF Banking Guide'],
        created_at: now - 3600,
        updated_at: now,
        usage_count: 5,
        bedrock_model: 'anthropic.claude-haiku-4-5-20251001-v1:0',
        ttl: now + 2592000,
      };

      ddbMock.on(GetItemCommand).resolves({
        Item: marshall(cachedData),
      });

      let updateCallCount = 0;
      ddbMock.on(UpdateItemCommand).callsFake(async (input: any) => {
        updateCallCount++;
        // Verify increment expression
        expect(input.UpdateExpression).toContain('usage_count = if_not_exists(usage_count, :zero) + :inc');
        return {};
      });

      // Simulate 3 cache hits
      await getCachedExplanation(questionId);
      await getCachedExplanation(questionId);
      await getCachedExplanation(questionId);

      expect(updateCallCount).toBe(3);
    });

    /**
     * Test 12: Usage count is returned in GET endpoint
     * When retrieving an explanation via GET /explanations/{id},
     * the response should include the current usage_count
     */
    it('should return usage count in GET endpoint response', async () => {
      const questionId = 'q_get_usage';
      const now = Math.floor(Date.now() / 1000);
      const cachedData = {
        question_id: questionId,
        explanation_id: 'exp_131',
        correct_answer: 'A',
        explanation: 'The correct answer is A because...',
        rbi_norms: ['RBI Act 1934'],
        iibf_norms: ['IIBF Banking Guide'],
        created_at: now - 3600,
        updated_at: now,
        usage_count: 42,
        bedrock_model: 'anthropic.claude-haiku-4-5-20251001-v1:0',
        ttl: now + 2592000,
      };

      // Mock GetItemCommand for cache lookup (called twice - once in getCachedExplanation, once in handleGetExplanation)
      ddbMock.on(GetItemCommand).resolves({
        Item: marshall(cachedData),
      });

      ddbMock.on(UpdateItemCommand).resolves({});

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        path: `/explanations/${questionId}`,
        pathParameters: { id: questionId },
      };

      const result = await handleGetExplanation(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.explanation.usage_count).toBe(42);
      expect(body.explanation.cached).toBe(true);
    });
  });

  describe('GET /explanations/{id} Endpoint', () => {
    /**
     * Test 13: GET endpoint returns cached explanation
     * When requesting a cached explanation via GET,
     * the endpoint should return the explanation with metadata
     */
    it('should return cached explanation via GET endpoint', async () => {
      const questionId = 'q_get_test';
      const now = Math.floor(Date.now() / 1000);
      const cachedData = {
        question_id: questionId,
        explanation_id: 'exp_132',
        correct_answer: 'B',
        explanation: 'The correct answer is B because...',
        rbi_norms: ['RBI Act 1934, Section 45'],
        iibf_norms: ['IIBF Banking Guide'],
        created_at: now - 86400,
        updated_at: now,
        usage_count: 15,
        bedrock_model: 'anthropic.claude-haiku-4-5-20251001-v1:0',
        ttl: now + 2592000,
      };

      ddbMock.on(GetItemCommand).resolves({
        Item: marshall(cachedData),
      });

      ddbMock.on(UpdateItemCommand).resolves({});

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        path: `/explanations/${questionId}`,
        pathParameters: { id: questionId },
      };

      const result = await handleGetExplanation(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.explanation.question_id).toBe(questionId);
      expect(body.explanation.correct_answer).toBe('B');
      expect(body.explanation.explanation_text).toBe('The correct answer is B because...');
      expect(body.explanation.rbi_norms).toEqual(['RBI Act 1934, Section 45']);
      expect(body.explanation.iibf_norms).toEqual(['IIBF Banking Guide']);
    });

    /**
     * Test 14: GET endpoint returns 404 for non-existent explanation
     * When requesting an explanation that doesn't exist in cache,
     * the endpoint should return 404 Not Found
     */
    it('should return 404 when explanation not found', async () => {
      const questionId = 'q_nonexistent_get';

      ddbMock.on(GetItemCommand).resolves({
        Item: undefined,
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        path: `/explanations/${questionId}`,
        pathParameters: { id: questionId },
      };

      const result = await handleGetExplanation(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(404);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('Explanation not found');
    });

    /**
     * Test 15: GET endpoint requires question_id in path
     * When requesting without question_id in path,
     * the endpoint should return 400 Bad Request
     */
    it('should return 400 when question_id is missing from path', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        path: '/explanations/',
        pathParameters: { id: undefined },
      };

      const result = await handleGetExplanation(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('question_id is required');
    });

    /**
     * Test 16: GET endpoint includes cache metadata
     * When retrieving an explanation via GET,
     * the response should include cache metadata (generated_at, model, cached flag)
     */
    it('should include cache metadata in GET response', async () => {
      const questionId = 'q_metadata_test';
      const now = Math.floor(Date.now() / 1000);
      const cachedData = {
        question_id: questionId,
        explanation_id: 'exp_133',
        correct_answer: 'C',
        explanation: 'The correct answer is C because...',
        rbi_norms: ['RBI Act 1934'],
        iibf_norms: ['IIBF Banking Guide'],
        created_at: now - 172800, // 2 days ago
        updated_at: now,
        usage_count: 8,
        bedrock_model: 'anthropic.claude-haiku-4-5-20251001-v1:0',
        ttl: now + 2592000,
      };

      ddbMock.on(GetItemCommand).resolves({
        Item: marshall(cachedData),
      });

      ddbMock.on(UpdateItemCommand).resolves({});

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        path: `/explanations/${questionId}`,
        pathParameters: { id: questionId },
      };

      const result = await handleGetExplanation(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.explanation.generated_at).toBeDefined();
      expect(body.explanation.model).toBe('anthropic.claude-haiku-4-5-20251001-v1:0');
      expect(body.explanation.cached).toBe(true);
    });
  });

  describe('Cache Storage', () => {
    /**
     * Test 17: Explanation is stored with all required fields
     * When caching an explanation,
     * all required fields should be stored in DynamoDB
     */
    it('should store explanation with all required fields', async () => {
      const explanation = {
        explanation_id: 'exp_134',
        question_id: 'q_storage_test',
        correct_answer: 'D',
        explanation_text: 'The correct answer is D because...',
        rbi_norms: ['RBI Act 1934', 'RBI Circular 2024'],
        iibf_norms: ['IIBF Banking Guide', 'IIBF Compliance Standards'],
        generated_at: Math.floor(Date.now() / 1000),
        model: 'anthropic.claude-haiku-4-5-20251001-v1:0',
      };

      let storedItem: any = null;
      ddbMock.on(PutItemCommand).callsFake(async (input: any) => {
        storedItem = unmarshall(input.Item);
        return {};
      });

      await cacheExplanation(explanation);

      expect(storedItem).toBeDefined();
      expect(storedItem.question_id).toBe('q_storage_test');
      expect(storedItem.explanation_id).toBe('exp_134');
      expect(storedItem.correct_answer).toBe('D');
      expect(storedItem.explanation).toBe('The correct answer is D because...');
      expect(storedItem.rbi_norms).toEqual(['RBI Act 1934', 'RBI Circular 2024']);
      expect(storedItem.iibf_norms).toEqual(['IIBF Banking Guide', 'IIBF Compliance Standards']);
      expect(storedItem.bedrock_model).toBe('anthropic.claude-haiku-4-5-20251001-v1:0');
      expect(storedItem.usage_count).toBe(1);
      expect(storedItem.ttl).toBeDefined();
    });

    /**
     * Test 18: Cache storage failure doesn't throw error
     * When DynamoDB fails during cache storage,
     * the error should be logged but not thrown
     */
    it('should handle cache storage failure gracefully', async () => {
      const explanation = {
        explanation_id: 'exp_135',
        question_id: 'q_storage_error',
        correct_answer: 'A',
        explanation_text: 'The correct answer is A because...',
        rbi_norms: ['RBI Act 1934'],
        iibf_norms: ['IIBF Banking Guide'],
        generated_at: Math.floor(Date.now() / 1000),
        model: 'anthropic.claude-haiku-4-5-20251001-v1:0',
      };

      ddbMock.on(PutItemCommand).rejects(new Error('DynamoDB write failed'));

      // Should not throw
      await expect(cacheExplanation(explanation)).resolves.toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    /**
     * Test 19: Empty RBI/IIBF norms arrays are handled
     * When an explanation has empty norms arrays,
     * they should be stored and retrieved correctly
     */
    it('should handle empty RBI/IIBF norms arrays', async () => {
      const explanation = {
        explanation_id: 'exp_136',
        question_id: 'q_empty_norms',
        correct_answer: 'B',
        explanation_text: 'The correct answer is B because...',
        rbi_norms: [],
        iibf_norms: [],
        generated_at: Math.floor(Date.now() / 1000),
        model: 'anthropic.claude-haiku-4-5-20251001-v1:0',
      };

      let storedItem: any = null;
      ddbMock.on(PutItemCommand).callsFake(async (input: any) => {
        storedItem = unmarshall(input.Item);
        return {};
      });

      await cacheExplanation(explanation);

      expect(storedItem.rbi_norms).toEqual([]);
      expect(storedItem.iibf_norms).toEqual([]);
    });

    /**
     * Test 20: Very long explanation text is cached correctly
     * When an explanation has very long text,
     * it should be cached and retrieved without truncation
     */
    it('should handle very long explanation text', async () => {
      const longText = 'A'.repeat(5000); // 5000 character explanation
      const explanation = {
        explanation_id: 'exp_137',
        question_id: 'q_long_text',
        correct_answer: 'C',
        explanation_text: longText,
        rbi_norms: ['RBI Act 1934'],
        iibf_norms: ['IIBF Banking Guide'],
        generated_at: Math.floor(Date.now() / 1000),
        model: 'anthropic.claude-haiku-4-5-20251001-v1:0',
      };

      let storedItem: any = null;
      ddbMock.on(PutItemCommand).callsFake(async (input: any) => {
        storedItem = unmarshall(input.Item);
        return {};
      });

      await cacheExplanation(explanation);

      expect(storedItem.explanation).toBe(longText);
      expect(storedItem.explanation.length).toBe(5000);
    });
  });
});
