/**
 * AI Tutor Lambda Handler
 * Handles explanation generation using AWS Bedrock with Claude 4.5 Haiku
 * Implements caching for generated explanations with 30-day TTL
 * Includes retry logic with backoff and circuit breaker pattern for graceful degradation
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.8, 9.2
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  UpdateItemCommand,
} from '@aws-sdk/client-dynamodb';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import {
  ValidationError,
  DatabaseError,
  formatErrorResponse,
} from '/opt/nodejs/error-handling';
import { createLogger } from '/opt/nodejs/logging';
import {
  DYNAMODB_TABLES,
  HTTP_STATUS,
} from '/opt/nodejs/constants';
import { v4 as uuidv4 } from 'uuid';

const dynamoDb = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const bedrock = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const logger = createLogger({ service: 'AITutorHandler' });

// Constants
const BEDROCK_MODEL_ID = 'anthropic.claude-haiku-4-5-20251001-v1:0';
const CACHE_TTL_DAYS = 30;
const CACHE_TTL_SECONDS = CACHE_TTL_DAYS * 24 * 60 * 60;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 2000;
const EXPLANATION_TIMEOUT_MS = 3000;

// Circuit breaker constants
const CIRCUIT_BREAKER_FAILURE_THRESHOLD = 5;
const CIRCUIT_BREAKER_RESET_TIMEOUT_MS = 60000; // 1 minute
const CIRCUIT_BREAKER_TABLE = 'bedrock_circuit_breaker';

// Circuit breaker states
enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

interface Question {
  question_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  rbi_norms?: string[];
  iibf_norms?: string[];
}

interface Explanation {
  explanation_id: string;
  question_id: string;
  correct_answer: string;
  explanation_text: string;
  rbi_norms: string[];
  iibf_norms: string[];
  generated_at: number;
  model: string;
}

interface CircuitBreakerStatus {
  state: CircuitBreakerState;
  failure_count: number;
  last_failure_time: number;
  last_state_change: number;
}

/**
 * Gets current circuit breaker status
 * Requirements: 6.8, 9.2
 */
const getCircuitBreakerStatus = async (): Promise<CircuitBreakerStatus> => {
  try {
    const command = new GetItemCommand({
      TableName: DYNAMODB_TABLES.EXPLANATION_CACHE, // Reuse cache table for circuit breaker state
      Key: marshall({
        question_id: 'CIRCUIT_BREAKER_STATE',
      }),
    });

    const response = await dynamoDb.send(command);

    if (!response.Item) {
      return {
        state: CircuitBreakerState.CLOSED,
        failure_count: 0,
        last_failure_time: 0,
        last_state_change: Math.floor(Date.now() / 1000),
      };
    }

    const status = unmarshall(response.Item) as any;
    return {
      state: status.state || CircuitBreakerState.CLOSED,
      failure_count: status.failure_count || 0,
      last_failure_time: status.last_failure_time || 0,
      last_state_change: status.last_state_change || 0,
    };
  } catch (error) {
    logger.warn(`Failed to get circuit breaker status: ${(error as Error).message}`);
    // Default to CLOSED state on error
    return {
      state: CircuitBreakerState.CLOSED,
      failure_count: 0,
      last_failure_time: 0,
      last_state_change: Math.floor(Date.now() / 1000),
    };
  }
};

/**
 * Updates circuit breaker status
 * Requirements: 6.8, 9.2
 */
const updateCircuitBreakerStatus = async (status: CircuitBreakerStatus): Promise<void> => {
  try {
    const command = new PutItemCommand({
      TableName: DYNAMODB_TABLES.EXPLANATION_CACHE,
      Item: marshall({
        question_id: 'CIRCUIT_BREAKER_STATE',
        state: status.state,
        failure_count: status.failure_count,
        last_failure_time: status.last_failure_time,
        last_state_change: status.last_state_change,
        ttl: Math.floor(Date.now() / 1000) + 86400, // 24 hour TTL
      }),
    });

    await dynamoDb.send(command);
    logger.info(`Circuit breaker state updated to ${status.state}, failures: ${status.failure_count}`);
  } catch (error) {
    logger.warn(`Failed to update circuit breaker status: ${(error as Error).message}`);
  }
};

/**
 * Records a Bedrock failure and updates circuit breaker state
 * Requirements: 6.8, 9.2
 */
const recordBedrockFailure = async (error: Error): Promise<void> => {
  try {
    const status = await getCircuitBreakerStatus();
    const now = Math.floor(Date.now() / 1000);

    // Check if we should reset from HALF_OPEN
    if (status.state === CircuitBreakerState.HALF_OPEN) {
      // Failure in HALF_OPEN state transitions back to OPEN
      status.state = CircuitBreakerState.OPEN;
      status.failure_count = CIRCUIT_BREAKER_FAILURE_THRESHOLD;
      status.last_failure_time = now;
      status.last_state_change = now;
    } else if (status.state === CircuitBreakerState.CLOSED) {
      // Increment failure count in CLOSED state
      status.failure_count += 1;
      status.last_failure_time = now;

      // Transition to OPEN if threshold reached
      if (status.failure_count >= CIRCUIT_BREAKER_FAILURE_THRESHOLD) {
        status.state = CircuitBreakerState.OPEN;
        status.last_state_change = now;
        logger.warn(`Circuit breaker opened after ${status.failure_count} failures`);
      }
    }

    await updateCircuitBreakerStatus(status);

    // Log failure to CloudWatch
    logger.error(`Bedrock failure recorded: ${error.message}`, {
      circuit_breaker_state: status.state,
      failure_count: status.failure_count,
    });
  } catch (error) {
    logger.warn(`Failed to record Bedrock failure: ${(error as Error).message}`);
  }
};

/**
 * Checks if circuit breaker should transition from OPEN to HALF_OPEN
 * Requirements: 6.8, 9.2
 */
const checkCircuitBreakerReset = async (): Promise<CircuitBreakerState> => {
  try {
    const status = await getCircuitBreakerStatus();
    const now = Math.floor(Date.now() / 1000);

    if (status.state === CircuitBreakerState.OPEN) {
      const timeSinceOpen = now - status.last_state_change;

      if (timeSinceOpen >= CIRCUIT_BREAKER_RESET_TIMEOUT_MS / 1000) {
        // Transition to HALF_OPEN to test if service recovered
        status.state = CircuitBreakerState.HALF_OPEN;
        status.failure_count = 0;
        status.last_state_change = now;
        await updateCircuitBreakerStatus(status);
        logger.info('Circuit breaker transitioned to HALF_OPEN for recovery test');
        return CircuitBreakerState.HALF_OPEN;
      }
    }

    return status.state;
  } catch (error) {
    logger.warn(`Failed to check circuit breaker reset: ${(error as Error).message}`);
    return CircuitBreakerState.CLOSED;
  }
};

/**
 * Records a successful Bedrock call and resets circuit breaker if in HALF_OPEN
 * Requirements: 6.8, 9.2
 */
const recordBedrockSuccess = async (): Promise<void> => {
  try {
    const status = await getCircuitBreakerStatus();

    if (status.state === CircuitBreakerState.HALF_OPEN) {
      // Successful call in HALF_OPEN state transitions back to CLOSED
      status.state = CircuitBreakerState.CLOSED;
      status.failure_count = 0;
      status.last_state_change = Math.floor(Date.now() / 1000);
      await updateCircuitBreakerStatus(status);
      logger.info('Circuit breaker reset to CLOSED after successful recovery test');
    } else if (status.state === CircuitBreakerState.CLOSED && status.failure_count > 0) {
      // Decrement failure count on success in CLOSED state
      status.failure_count = Math.max(0, status.failure_count - 1);
      await updateCircuitBreakerStatus(status);
    }
  } catch (error) {
    logger.warn(`Failed to record Bedrock success: ${(error as Error).message}`);
  }
};

/**
 * Generates explanation using AWS Bedrock with Claude 4.5 Haiku
 * Includes retry logic with exponential backoff and circuit breaker pattern
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.8, 9.2
 */
const generateExplanationWithBedrock = async (question: Question): Promise<Explanation> => {
  // Check circuit breaker state before attempting
  const cbState = await checkCircuitBreakerReset();
  if (cbState === CircuitBreakerState.OPEN) {
    const error = new Error('Circuit breaker is OPEN - Bedrock service unavailable');
    logger.warn(error.message);
    throw error;
  }

  const prompt = `You are an expert in JAIIB (Junior Associate of the Indian Institute of Banking and Finance) exam preparation.

Question: ${question.question_text}
Options:
A) ${question.option_a}
B) ${question.option_b}
C) ${question.option_c}
D) ${question.option_d}

Correct Answer: ${question.correct_answer}

Please provide:
1. Why the correct answer is right
2. Why other options are incorrect
3. Relevant RBI norms and guidelines
4. Relevant IIBF standards

Format your response as valid JSON (no markdown, no code blocks):
{
  "explanation_text": "Detailed explanation covering all points",
  "rbi_norms": ["RBI Act 1934, Section X", "..."],
  "iibf_norms": ["IIBF Banking Regulation Guide", "..."]
}`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const command = new InvokeModelCommand({
        modelId: BEDROCK_MODEL_ID,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-06-01',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      });

      const response = await bedrock.send(command);

      // Handle both real and mocked responses
      let responseText: string;
      if (typeof response.body === 'string') {
        responseText = response.body;
      } else if (response.body && typeof (response.body as any).transformToString === 'function') {
        responseText = await (response.body as any).transformToString();
      } else {
        responseText = new TextDecoder().decode(response.body as any);
      }

      const responseBody = JSON.parse(responseText);

      // Extract text from Claude response
      const textContent = responseBody.content[0].text;
      const parsedResponse = JSON.parse(textContent);

      const explanation: Explanation = {
        explanation_id: uuidv4(),
        question_id: question.question_id,
        correct_answer: question.correct_answer,
        explanation_text: parsedResponse.explanation_text,
        rbi_norms: parsedResponse.rbi_norms || [],
        iibf_norms: parsedResponse.iibf_norms || [],
        generated_at: Math.floor(Date.now() / 1000),
        model: BEDROCK_MODEL_ID,
      };

      // Record success and reset circuit breaker if needed
      await recordBedrockSuccess();
      return explanation;
    } catch (error) {
      lastError = error as Error;
      logger.warn(`Bedrock invocation attempt ${attempt + 1} failed: ${lastError.message}`);

      if (attempt < MAX_RETRIES) {
        // Exponential backoff: 2s, then 4s
        const backoffDelay = RETRY_DELAY_MS * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, backoffDelay));
      }
    }
  }

  // Record failure and update circuit breaker
  if (lastError) {
    await recordBedrockFailure(lastError);
  }

  throw lastError || new Error('Failed to generate explanation after retries');
};

/**
 * Retrieves cached explanation from DynamoDB
 * Requirements: 6.6
 */
const getCachedExplanation = async (questionId: string): Promise<Explanation | null> => {
  try {
    const command = new GetItemCommand({
      TableName: DYNAMODB_TABLES.EXPLANATION_CACHE,
      Key: marshall({
        question_id: questionId,
      }),
    });

    const response = await dynamoDb.send(command);

    if (!response.Item) {
      return null;
    }

    const cached = unmarshall(response.Item) as any;

    // Check if cache has expired
    const now = Math.floor(Date.now() / 1000);
    if (cached.created_at + CACHE_TTL_SECONDS < now) {
      return null;
    }

    // Increment usage count
    await updateCacheUsage(questionId);

    return {
      explanation_id: cached.explanation_id,
      question_id: cached.question_id,
      correct_answer: cached.correct_answer,
      explanation_text: cached.explanation,
      rbi_norms: cached.rbi_norms || [],
      iibf_norms: cached.iibf_norms || [],
      generated_at: cached.created_at,
      model: cached.bedrock_model,
    };
  } catch (error) {
    logger.warn(`Failed to retrieve cached explanation: ${(error as Error).message}`);
    return null;
  }
};

/**
 * Caches explanation in DynamoDB with 30-day TTL
 * Requirements: 6.6
 */
const cacheExplanation = async (explanation: Explanation): Promise<void> => {
  try {
    const now = Math.floor(Date.now() / 1000);
    const ttl = now + CACHE_TTL_SECONDS;

    const command = new PutItemCommand({
      TableName: DYNAMODB_TABLES.EXPLANATION_CACHE,
      Item: marshall({
        question_id: explanation.question_id,
        explanation_id: explanation.explanation_id,
        correct_answer: explanation.correct_answer,
        explanation: explanation.explanation_text,
        rbi_norms: explanation.rbi_norms,
        iibf_norms: explanation.iibf_norms,
        created_at: now,
        updated_at: now,
        usage_count: 1,
        bedrock_model: explanation.model,
        ttl,
      }),
    });

    await dynamoDb.send(command);
    logger.info(`Cached explanation for question ${explanation.question_id}`);
  } catch (error) {
    logger.error(`Failed to cache explanation: ${(error as Error).message}`);
    // Don't throw - caching failure shouldn't block explanation delivery
  }
};

/**
 * Updates cache usage count
 */
const updateCacheUsage = async (questionId: string): Promise<void> => {
  try {
    const command = new UpdateItemCommand({
      TableName: DYNAMODB_TABLES.EXPLANATION_CACHE,
      Key: marshall({
        question_id: questionId,
      }),
      UpdateExpression: 'SET usage_count = if_not_exists(usage_count, :zero) + :inc, updated_at = :now',
      ExpressionAttributeValues: marshall({
        ':zero': 0,
        ':inc': 1,
        ':now': Math.floor(Date.now() / 1000),
      }),
    });

    await dynamoDb.send(command);
  } catch (error) {
    logger.warn(`Failed to update cache usage: ${(error as Error).message}`);
  }
};

/**
 * Retrieves question from DynamoDB
 */
const getQuestion = async (questionId: string): Promise<Question | null> => {
  try {
    const command = new GetItemCommand({
      TableName: DYNAMODB_TABLES.QUESTIONS,
      Key: marshall({
        question_id: questionId,
      }),
    });

    const response = await dynamoDb.send(command);

    if (!response.Item) {
      return null;
    }

    const item = unmarshall(response.Item) as any;
    return {
      question_id: item.question_id,
      question_text: item.question_text,
      option_a: item.option_a,
      option_b: item.option_b,
      option_c: item.option_c,
      option_d: item.option_d,
      correct_answer: item.correct_answer,
      rbi_norms: item.rbi_norms || [],
      iibf_norms: item.iibf_norms || [],
    };
  } catch (error) {
    logger.error(`Failed to retrieve question: ${(error as Error).message}`);
    throw new DatabaseError(`Failed to retrieve question: ${(error as Error).message}`);
  }
};

/**
 * POST /explanations endpoint handler
 * Generates or retrieves cached explanation for a question
 * Falls back to cached explanation on Bedrock failure
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.8, 9.2
 */
const handleExplanationRequest = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { question_id } = body;

    if (!question_id) {
      throw new ValidationError('question_id is required');
    }

    // Try to get cached explanation first
    let explanation = await getCachedExplanation(question_id);

    if (!explanation) {
      // Retrieve question details
      const question = await getQuestion(question_id);

      if (!question) {
        throw new ValidationError(`Question not found: ${question_id}`);
      }

      // Generate explanation with timeout
      const explanationPromise = generateExplanationWithBedrock(question);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Explanation generation timeout')), EXPLANATION_TIMEOUT_MS)
      );

      try {
        explanation = await Promise.race([explanationPromise, timeoutPromise]);
        // Cache the generated explanation
        await cacheExplanation(explanation);
      } catch (error) {
        logger.error(`Failed to generate explanation: ${(error as Error).message}`);

        // Try to get any cached explanation as fallback
        const cachedFallback = await getCachedExplanation(question_id);
        if (cachedFallback) {
          logger.info(`Using cached explanation as fallback for question ${question_id}`);
          explanation = cachedFallback;
        } else {
          // No cached explanation available - return graceful degradation error
          return {
            statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE,
            headers: {
              'Content-Type': 'application/json',
              'X-Content-Type-Options': 'nosniff',
            },
            body: JSON.stringify({
              success: false,
              error: 'Explanation service temporarily unavailable. Please try again later.',
            }),
          };
        }
      }
    }

    return {
      statusCode: HTTP_STATUS.OK,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
      },
      body: JSON.stringify({
        success: true,
        explanation: {
          explanation_id: explanation.explanation_id,
          question_id: explanation.question_id,
          correct_answer: explanation.correct_answer,
          explanation_text: explanation.explanation_text,
          rbi_norms: explanation.rbi_norms,
          iibf_norms: explanation.iibf_norms,
          generated_at: explanation.generated_at,
          model: explanation.model,
        },
      }),
    };
  } catch (error) {
    logger.error(`Error handling explanation request: ${(error as Error).message}`);
    return formatErrorResponse(error as Error);
  }
};

/**
 * GET /explanations/{id} endpoint handler
 * Retrieves cached explanation by question ID
 * Returns usage count and cache metadata
 * Requirements: 6.6
 */
const handleGetExplanation = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const questionId = event.pathParameters?.id;

    if (!questionId) {
      throw new ValidationError('question_id is required in path');
    }

    // Try to get cached explanation
    const explanation = await getCachedExplanation(questionId);

    if (!explanation) {
      return {
        statusCode: HTTP_STATUS.NOT_FOUND,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff',
        },
        body: JSON.stringify({
          success: false,
          error: `Explanation not found for question: ${questionId}`,
        }),
      };
    }

    // Get cache metadata including usage count
    let usageCount = 0;
    try {
      const command = new GetItemCommand({
        TableName: DYNAMODB_TABLES.EXPLANATION_CACHE,
        Key: marshall({
          question_id: questionId,
        }),
      });

      const response = await dynamoDb.send(command);
      if (response.Item) {
        const cached = unmarshall(response.Item) as any;
        usageCount = cached.usage_count || 0;
      }
    } catch (error) {
      logger.warn(`Failed to retrieve cache metadata: ${(error as Error).message}`);
    }

    return {
      statusCode: HTTP_STATUS.OK,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
      },
      body: JSON.stringify({
        success: true,
        explanation: {
          explanation_id: explanation.explanation_id,
          question_id: explanation.question_id,
          correct_answer: explanation.correct_answer,
          explanation_text: explanation.explanation_text,
          rbi_norms: explanation.rbi_norms,
          iibf_norms: explanation.iibf_norms,
          generated_at: explanation.generated_at,
          model: explanation.model,
          usage_count: usageCount,
          cached: true,
        },
      }),
    };
  } catch (error) {
    logger.error(`Error handling get explanation request: ${(error as Error).message}`);
    return formatErrorResponse(error as Error);
  }
};

/**
 * Lambda handler for API Gateway events
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info(`Received request: ${event.httpMethod} ${event.path}`);

  try {
    if (event.httpMethod === 'POST' && event.path === '/explanations') {
      return await handleExplanationRequest(event);
    }

    if (event.httpMethod === 'GET' && event.path?.startsWith('/explanations/')) {
      return await handleGetExplanation(event);
    }

    return {
      statusCode: HTTP_STATUS.NOT_FOUND,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
      },
      body: JSON.stringify({
        success: false,
        error: 'Endpoint not found',
      }),
    };
  } catch (error) {
    logger.error(`Unhandled error: ${(error as Error).message}`);
    return formatErrorResponse(error as Error);
  }
};

// Export for testing
export {
  generateExplanationWithBedrock,
  getCachedExplanation,
  cacheExplanation,
  getQuestion,
  handleGetExplanation,
  handleExplanationRequest,
  getCircuitBreakerStatus,
  updateCircuitBreakerStatus,
  recordBedrockFailure,
  recordBedrockSuccess,
  checkCircuitBreakerReset,
};
