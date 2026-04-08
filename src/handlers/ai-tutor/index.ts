/**
 * AI Tutor Lambda Handler
 * Handles explanation generation using AWS Bedrock with Claude 4.5 Haiku
 * Implements caching for generated explanations with 30-day TTL
 * Includes retry logic and graceful degradation on Bedrock failures
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

/**
 * Generates explanation using AWS Bedrock with Claude 4.5 Haiku
 * Includes retry logic with exponential backoff
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */
const generateExplanationWithBedrock = async (question: Question): Promise<Explanation> => {
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

      return explanation;
    } catch (error) {
      lastError = error as Error;
      logger.warn(`Bedrock invocation attempt ${attempt + 1} failed: ${lastError.message}`);

      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
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
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.8, 9.2
 */
const handleExplanationRequest = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { question_id, practice_set_id } = body;

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
        // Return graceful degradation error
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
 * Lambda handler for API Gateway events
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info(`Received request: ${event.httpMethod} ${event.path}`);

  try {
    if (event.httpMethod === 'POST' && event.path === '/explanations') {
      return await handleExplanationRequest(event);
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
export { generateExplanationWithBedrock, getCachedExplanation, cacheExplanation, getQuestion };
