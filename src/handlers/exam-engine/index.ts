/**
 * Exam Engine Lambda Handler
 * Handles practice set generation, retrieval, and submission
 * Implements randomization, answer shuffling, and session management
 * Requirements: 3.1, 3.2, 3.4, 3.5, 10.2
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  DynamoDBClient,
  QueryCommand,
  PutItemCommand,
  GetItemCommand,
  UpdateItemCommand,
} from '@aws-sdk/client-dynamodb';
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
const logger = createLogger({ service: 'ExamEngineHandler' });

// Constants
const PRACTICE_SET_SIZE = 4;
const SESSION_TIMEOUT_MINUTES = 15;
const VALID_PAPERS = ['JAIIB_IE_IFS', 'JAIIB_PPB', 'JAIIB_AFB', 'JAIIB_RBWM'];

/**
 * Shuffles an array using Fisher-Yates algorithm
 * Requirements: 3.4
 */
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Shuffles answer options while maintaining correct answer mapping
 * Requirements: 3.4
 */
const shuffleAnswerOptions = (question: any): any => {
  const options = ['A', 'B', 'C', 'D'];
  const shuffledOptions = shuffleArray(options);
  
  // Create mapping from original position to new position
  const optionMap: { [key: string]: string } = {};
  shuffledOptions.forEach((newPos, index) => {
    optionMap[options[index]] = newPos;
  });

  // Create shuffled question with new option order
  const shuffledQuestion = {
    ...question,
    options: {
      [shuffledOptions[0]]: question.options[options[0]],
      [shuffledOptions[1]]: question.options[options[1]],
      [shuffledOptions[2]]: question.options[options[2]],
      [shuffledOptions[3]]: question.options[options[3]],
    },
    order: shuffledOptions,
    correct_answer_original: question.correct_answer,
    correct_answer_shuffled: optionMap[question.correct_answer],
  };

  return shuffledQuestion;
};

/**
 * Queries active questions from Questions table filtered by paper
 * Requirements: 3.1, 3.2
 */
const getActiveQuestionsByPaper = async (paper: string): Promise<any[]> => {
  try {
    const command = new QueryCommand({
      TableName: DYNAMODB_TABLES.QUESTIONS,
      IndexName: 'paper-status-index',
      KeyConditionExpression: 'paper = :paper AND #status = :status',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: marshall({
        ':paper': paper,
        ':status': 'active',
      }),
    });

    const response = await dynamoDb.send(command);
    return response.Items ? response.Items.map((item) => unmarshall(item)) : [];
  } catch (error) {
    logger.error('Failed to query active questions', { paper, error });
    throw new DatabaseError('Failed to retrieve questions from database');
  }
};

/**
 * Randomly selects N unique questions from the question bank
 * Requirements: 3.1, 3.2
 */
const selectRandomQuestions = (questions: any[], count: number): any[] => {
  if (questions.length < count) {
    throw new ValidationError(
      `Insufficient questions available. Need ${count}, found ${questions.length}`
    );
  }

  const shuffled = shuffleArray(questions);
  return shuffled.slice(0, count);
};

/**
 * Generates a practice set with shuffled answer options
 * Requirements: 3.1, 3.2, 3.4, 3.5
 */
const generatePracticeSet = async (
  userId: string,
  tenantId: string,
  paper: string
): Promise<any> => {
  const startTime = Date.now();

  // Validate paper
  if (!VALID_PAPERS.includes(paper)) {
    throw new ValidationError(`Invalid paper: ${paper}`);
  }

  // Get active questions for the paper
  const activeQuestions = await getActiveQuestionsByPaper(paper);

  // Select 4 random unique questions
  const selectedQuestions = selectRandomQuestions(activeQuestions, PRACTICE_SET_SIZE);

  // Shuffle answer options for each question
  const questionsWithShuffledOptions = selectedQuestions.map((q) => {
    const questionWithOptions = {
      question_id: q.question_id,
      question_text: q.question_text,
      options: {
        A: q.option_a,
        B: q.option_b,
        C: q.option_c,
        D: q.option_d,
      },
      correct_answer: q.correct_answer,
    };
    return shuffleAnswerOptions(questionWithOptions);
  });

  // Create practice set
  const practiceSetId = uuidv4();
  const now = Math.floor(Date.now() / 1000);
  const sessionExpiresAt = now + SESSION_TIMEOUT_MINUTES * 60;

  const practiceSet = {
    tenant_id: tenantId,
    user_id: userId,
    practice_set_id: practiceSetId,
    paper,
    created_at: now,
    started_at: now,
    submitted_at: null,
    status: 'in_progress',
    questions: questionsWithShuffledOptions.map((q) => ({
      question_id: q.question_id,
      question_text: q.question_text,
      options: q.options,
      order: q.order,
    })),
    user_answers: {},
    correct_answers: questionsWithShuffledOptions.reduce(
      (acc, q) => {
        acc[q.question_id] = q.correct_answer_shuffled;
        return acc;
      },
      {} as { [key: string]: string }
    ),
    score: null,
    time_taken: null,
    session_token: uuidv4(),
    session_expires_at: sessionExpiresAt,
    ip_address: '',
    user_agent: '',
  };

  // Store practice set in DynamoDB
  try {
    const command = new PutItemCommand({
      TableName: DYNAMODB_TABLES.PRACTICE_SETS,
      Item: marshall({
        'tenant_id#user_id': `${tenantId}#${userId}`,
        tenant_id: tenantId,
        user_id: userId,
        practice_set_id: practiceSetId,
        paper,
        created_at: now,
        started_at: now,
        submitted_at: null,
        status: 'in_progress',
        questions: questionsWithShuffledOptions.map((q) => ({
          question_id: q.question_id,
          question_text: q.question_text,
          options: q.options,
          order: q.order,
        })),
        user_answers: {},
        correct_answers: practiceSet.correct_answers,
        score: null,
        time_taken: null,
        session_token: practiceSet.session_token,
        session_expires_at: sessionExpiresAt,
        ip_address: '',
        user_agent: '',
      }),
    });

    await dynamoDb.send(command);
  } catch (error) {
    logger.error('Failed to store practice set', { practiceSetId, error });
    throw new DatabaseError('Failed to store practice set');
  }

  const responseTime = Date.now() - startTime;
  logger.info('Practice set generated', {
    practiceSetId,
    paper,
    responseTime,
  });

  // Verify response time < 500ms (Requirement 10.2)
  if (responseTime > 500) {
    logger.warn('Practice set generation exceeded 500ms target', {
      practiceSetId,
      responseTime,
    });
  }

  return {
    practice_set_id: practiceSetId,
    paper,
    questions: practiceSet.questions,
    time_limit: SESSION_TIMEOUT_MINUTES * 60,
    created_at: now,
    session_token: practiceSet.session_token,
  };
};

/**
 * POST /practice-sets endpoint handler
 * Requirements: 3.1, 3.2, 3.4, 3.5, 10.2
 */
const handleGeneratePracticeSet = async (
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

    const { paper } = body;

    if (!paper) {
      return formatErrorResponse(new ValidationError('Paper parameter is required'));
    }

    // Generate practice set
    const practiceSet = await generatePracticeSet(userId, tenantId, paper);

    return {
      statusCode: HTTP_STATUS.OK,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
      },
      body: JSON.stringify({
        success: true,
        practice_set: practiceSet,
      }),
    };
  } catch (error) {
    logger.error('Error generating practice set', { error });
    return formatErrorResponse(error as Error);
  }
};

/**
 * Validates session token and checks expiration
 * Requirements: 4.7
 */
const validateSessionToken = (practiceSet: any): { valid: boolean; expired: boolean } => {
  const now = Math.floor(Date.now() / 1000);
  const sessionExpiresAt = practiceSet.session_expires_at;

  if (now > sessionExpiresAt) {
    return { valid: false, expired: true };
  }

  return { valid: true, expired: false };
};

/**
 * Calculates time elapsed since session start
 * Requirements: 4.7
 */
const calculateTimeElapsed = (practiceSet: any): number => {
  const now = Math.floor(Date.now() / 1000);
  const startedAt = practiceSet.started_at;
  return now - startedAt;
};

/**
 * Calculates time remaining for session
 * Requirements: 4.7
 */
const calculateTimeRemaining = (practiceSet: any): number => {
  const now = Math.floor(Date.now() / 1000);
  const sessionExpiresAt = practiceSet.session_expires_at;
  const timeRemaining = sessionExpiresAt - now;
  return Math.max(0, timeRemaining);
};

/**
 * GET /practice-sets/{id} endpoint handler
 * Retrieves active session and validates session token and expiration
 * Requirements: 4.7, 3.5
 */
const handleGetPracticeSet = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const authorizer = event.requestContext.authorizer as any;
    if (!authorizer || !authorizer.user_id || !authorizer.tenant_id) {
      return formatErrorResponse(
        new ValidationError('Missing user context in request')
      );
    }

    const userId = authorizer.user_id;
    const tenantId = authorizer.tenant_id;
    const practiceSetId = event.pathParameters?.id;

    if (!practiceSetId) {
      return formatErrorResponse(new ValidationError('Practice set ID is required'));
    }

    // Retrieve practice set from DynamoDB
    try {
      const command = new QueryCommand({
        TableName: DYNAMODB_TABLES.PRACTICE_SETS,
        KeyConditionExpression: 'tenant_id#user_id = :pk AND practice_set_id = :sk',
        ExpressionAttributeValues: marshall({
          ':pk': `${tenantId}#${userId}`,
          ':sk': practiceSetId,
        }),
      });

      const response = await dynamoDb.send(command);
      if (!response.Items || response.Items.length === 0) {
        return formatErrorResponse(
          new ValidationError('Practice set not found')
        );
      }

      const practiceSet = unmarshall(response.Items[0]);

      // Validate session token and check expiration
      const { valid, expired } = validateSessionToken(practiceSet);

      if (expired) {
        return {
          statusCode: HTTP_STATUS.OK,
          headers: {
            'Content-Type': 'application/json',
            'X-Content-Type-Options': 'nosniff',
          },
          body: JSON.stringify({
            success: false,
            error: 'Session has expired',
            status: 'expired',
          }),
        };
      }

      if (!valid) {
        return formatErrorResponse(
          new ValidationError('Invalid session token')
        );
      }

      // Calculate time elapsed and remaining
      const timeElapsed = calculateTimeElapsed(practiceSet);
      const timeRemaining = calculateTimeRemaining(practiceSet);

      return {
        statusCode: HTTP_STATUS.OK,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff',
        },
        body: JSON.stringify({
          success: true,
          practice_set: {
            practice_set_id: practiceSet.practice_set_id,
            status: practiceSet.status,
            paper: practiceSet.paper,
            questions: practiceSet.questions,
            user_answers: practiceSet.user_answers,
            time_elapsed: timeElapsed,
            time_remaining: timeRemaining,
            session_token: practiceSet.session_token,
            session_expires_at: practiceSet.session_expires_at,
          },
        }),
      };
    } catch (error) {
      logger.error('Failed to retrieve practice set', { practiceSetId, error });
      throw new DatabaseError('Failed to retrieve practice set');
    }
  } catch (error) {
    logger.error('Error retrieving practice set', { error });
    return formatErrorResponse(error as Error);
  }
};

/**
 * Main handler for routing requests
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  logger.info('Exam Engine Handler invoked', {
    method: event.httpMethod,
    path: event.path,
  });

  try {
    if (event.httpMethod === 'POST' && event.path === '/practice-sets') {
      return await handleGeneratePracticeSet(event);
    } else if (event.httpMethod === 'GET' && event.path.startsWith('/practice-sets/')) {
      return await handleGetPracticeSet(event);
    } else {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, error: 'Not found' }),
      };
    }
  } catch (error) {
    logger.error('Unhandled error in Exam Engine Handler', { error });
    return formatErrorResponse(error as Error);
  }
};
