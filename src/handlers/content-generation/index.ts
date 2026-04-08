/**
 * Content Generation Lambda Handler
 * Handles MCQ content generation using AWS Bedrock with Claude 4.5 Haiku
 * Implements caching for generated questions with 30-day TTL
 * Requirements: 3.7, 6.9, 9.2
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  QueryCommand,
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
const logger = createLogger({ service: 'ContentGenerationHandler' });

// Constants
const BEDROCK_MODEL_ID = 'anthropic.claude-haiku-4-5-20251001-v1:0';
const CACHE_TTL_DAYS = 30;
const CACHE_TTL_SECONDS = CACHE_TTL_DAYS * 24 * 60 * 60;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 2000;

/**
 * Syllabus topics for each JAIIB paper
 * Requirements: 3.7
 */
const SYLLABUS_TOPICS: { [key: string]: string[] } = {
  JAIIB_IE_IFS: [
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
  ],
  JAIIB_PPB: [
    'Banking Fundamentals',
    'Customer Service',
    'Deposit Products',
    'Lending Products',
    'Credit Analysis',
    'Risk Management',
    'Compliance and Regulations',
    'Technology in Banking',
    'Payment Systems',
    'Anti-Money Laundering',
  ],
  JAIIB_AFB: [
    'Accounting Principles',
    'Financial Statements',
    'Balance Sheet Analysis',
    'Income Statement Analysis',
    'Cash Flow Analysis',
    'Financial Ratios',
    'Cost Accounting',
    'Management Accounting',
    'Budgeting',
    'Audit and Assurance',
  ],
  JAIIB_RBWM: [
    'Retail Banking Products',
    'Wealth Management',
    'Investment Advisory',
    'Insurance Products',
    'Mutual Funds',
    'Retirement Planning',
    'Tax Planning',
    'Estate Planning',
    'Customer Relationship Management',
    'Regulatory Compliance in Retail',
  ],
};

/**
 * Paper names for prompts
 */
const PAPER_NAMES: { [key: string]: string } = {
  JAIIB_IE_IFS: 'Indian Economy & International Financial System',
  JAIIB_PPB: 'Principles and Practices of Banking',
  JAIIB_AFB: 'Accounting & Finance for Bankers',
  JAIIB_RBWM: 'Retail Banking & Wealth Management',
};

/**
 * Generates MCQ content using AWS Bedrock with Claude 4.5 Haiku
 * Requirements: 3.7, 6.9
 */
const generateMCQWithBedrock = async (
  paper: string,
  topic: string,
  difficulty: string = 'medium'
): Promise<any> => {
  const prompt = `You are an expert in JAIIB (Junior Associate of the Indian Institute of Banking and Finance) exam preparation.

Generate a single multiple-choice question for the JAIIB exam.

Paper: ${PAPER_NAMES[paper]}
Syllabus Topic: ${topic}
Difficulty Level: ${difficulty}

Requirements:
- Question must be aligned with official JAIIB syllabus for the ${PAPER_NAMES[paper]} paper
- Include 4 unique options (A, B, C, D)
- Specify the correct answer (A, B, C, or D)
- Include relevant RBI (Reserve Bank of India) and/or IIBF (Indian Institute of Banking and Finance) norm references
- Question text must be 10-200 characters
- Options must be 5-100 characters each
- All options must be unique and distinct

Format your response as valid JSON (no markdown, no code blocks):
{
  "question_text": "...",
  "option_a": "...",
  "option_b": "...",
  "option_c": "...",
  "option_d": "...",
  "correct_answer": "A|B|C|D",
  "rbi_norms": ["RBI Act 1934, Section X", "..."],
  "iibf_norms": ["IIBF Banking Regulation Guide", "..."],
  "explanation": "Brief explanation of why the correct answer is right"
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

      // Extract the text content from the response
      const textContent = responseBody.content[0].text;

      // Parse the JSON response
      const mcq = JSON.parse(textContent);

      // Validate the response
      if (
        !mcq.question_text ||
        !mcq.option_a ||
        !mcq.option_b ||
        !mcq.option_c ||
        !mcq.option_d ||
        !mcq.correct_answer ||
        !['A', 'B', 'C', 'D'].includes(mcq.correct_answer)
      ) {
        throw new ValidationError('Invalid MCQ response from Bedrock');
      }

      logger.info('MCQ generated successfully from Bedrock', {
        paper,
        topic,
        difficulty,
      });

      return mcq;
    } catch (error) {
      lastError = error as Error;
      logger.warn(`Bedrock invocation attempt ${attempt + 1} failed`, {
        paper,
        topic,
        error: (error as Error).message,
      });

      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
  }

  logger.error('Failed to generate MCQ after retries', {
    paper,
    topic,
    error: lastError?.message,
  });

  throw new Error(
    `Failed to generate MCQ content from Bedrock after ${MAX_RETRIES + 1} attempts: ${lastError?.message}`
  );
};

/**
 * Retrieves cached explanation from ExplanationCache table
 * Requirements: 3.7, 6.9
 */
const getCachedExplanation = async (questionId: string): Promise<any | null> => {
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

    const cached = unmarshall(response.Item);
    logger.info('Retrieved cached explanation', { question_id: questionId });
    return cached;
  } catch (error) {
    logger.error('Failed to retrieve cached explanation', { question_id: questionId, error });
    return null;
  }
};

/**
 * Caches explanation in ExplanationCache table with 30-day TTL
 * Requirements: 3.7, 6.9
 */
const cacheExplanation = async (
  questionId: string,
  explanation: string,
  model: string
): Promise<void> => {
  try {
    const now = Math.floor(Date.now() / 1000);
    const ttl = now + CACHE_TTL_SECONDS;

    const command = new PutItemCommand({
      TableName: DYNAMODB_TABLES.EXPLANATION_CACHE,
      Item: marshall({
        question_id: questionId,
        explanation,
        created_at: now,
        updated_at: now,
        usage_count: 1,
        bedrock_model: model,
        tokens_used: 0, // Would be populated from Bedrock response metadata
        ttl,
      }),
    });

    await dynamoDb.send(command);
    logger.info('Explanation cached successfully', { question_id: questionId, ttl });
  } catch (error) {
    logger.error('Failed to cache explanation', { question_id: questionId, error });
    // Don't throw - caching failure shouldn't block the response
  }
};

/**
 * POST /generate-questions endpoint handler
 * Requirements: 3.7, 6.9, 9.2
 */
const handleGenerateQuestions = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Extract user context from authorizer
    const authorizer = event.requestContext.authorizer as any;
    if (!authorizer || !authorizer.user_id || !authorizer.tenant_id) {
      return formatErrorResponse(
        new ValidationError('Missing user context in request')
      );
    }

    const userId = authorizer.user_id;
    const tenantId = authorizer.tenant_id;

    // Parse request body
    let body: any;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (error) {
      return formatErrorResponse(new ValidationError('Invalid request body'));
    }

    const { paper, count = 1, difficulty = 'medium' } = body;

    // Validate paper
    const validPapers = ['JAIIB_IE_IFS', 'JAIIB_PPB', 'JAIIB_AFB', 'JAIIB_RBWM'];
    if (!paper || !validPapers.includes(paper)) {
      return formatErrorResponse(
        new ValidationError(`Invalid paper. Must be one of: ${validPapers.join(', ')}`)
      );
    }

    // Validate count
    if (typeof count !== 'number' || count < 1 || count > 10) {
      return formatErrorResponse(
        new ValidationError('Count must be between 1 and 10')
      );
    }

    // Validate difficulty
    const validDifficulties = ['easy', 'medium', 'hard'];
    if (!validDifficulties.includes(difficulty)) {
      return formatErrorResponse(
        new ValidationError(`Invalid difficulty. Must be one of: ${validDifficulties.join(', ')}`)
      );
    }

    const generatedQuestions: any[] = [];
    const errors: any[] = [];

    // Generate MCQs
    for (let i = 0; i < count; i++) {
      try {
        // Select a random topic from the paper's syllabus
        const topics = SYLLABUS_TOPICS[paper];
        const randomTopic = topics[Math.floor(Math.random() * topics.length)];

        // Generate MCQ using Bedrock
        const mcq = await generateMCQWithBedrock(paper, randomTopic, difficulty);

        // Create question ID
        const questionId = uuidv4();
        const now = Math.floor(Date.now() / 1000);

        // Cache the explanation
        await cacheExplanation(
          questionId,
          mcq.explanation || '',
          BEDROCK_MODEL_ID
        );

        generatedQuestions.push({
          question_id: questionId,
          question_text: mcq.question_text,
          option_a: mcq.option_a,
          option_b: mcq.option_b,
          option_c: mcq.option_c,
          option_d: mcq.option_d,
          correct_answer: mcq.correct_answer,
          paper,
          difficulty_level: difficulty,
          syllabus_topic: randomTopic,
          rbi_norms: mcq.rbi_norms || [],
          iibf_norms: mcq.iibf_norms || [],
          explanation: mcq.explanation || '',
          generated_at: now,
          generated_by: 'bedrock-claude-haiku',
        });

        logger.info('MCQ generated and cached', {
          question_id: questionId,
          paper,
          topic: randomTopic,
        });
      } catch (error) {
        logger.error(`Failed to generate MCQ ${i + 1}`, { error });
        errors.push({
          index: i,
          error: (error as Error).message,
        });
      }
    }

    // If all generations failed, return error
    if (generatedQuestions.length === 0) {
      return formatErrorResponse(
        new Error('Unable to generate practice set. Please try again.')
      );
    }

    // Log audit event
    logger.info('Questions generated successfully', {
      user_id: userId,
      tenant_id: tenantId,
      paper,
      count: generatedQuestions.length,
      errors: errors.length,
    });

    return {
      statusCode: HTTP_STATUS.OK,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
      },
      body: JSON.stringify({
        success: true,
        questions: generatedQuestions,
        generated_count: generatedQuestions.length,
        failed_count: errors.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
    };
  } catch (error) {
    logger.error('Error generating questions', { error });
    return formatErrorResponse(error as Error);
  }
};

/**
 * Main handler for routing requests
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  logger.info('Content Generation Handler invoked', {
    method: event.httpMethod,
    path: event.path,
  });

  try {
    if (event.httpMethod === 'POST' && event.path === '/generate-questions') {
      return await handleGenerateQuestions(event);
    } else {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, error: 'Not found' }),
      };
    }
  } catch (error) {
    logger.error('Unhandled error in Content Generation Handler', { error });
    return formatErrorResponse(error as Error);
  }
};
