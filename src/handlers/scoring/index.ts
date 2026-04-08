/**
 * Scoring Lambda Handler
 * Handles practice set submission and score calculation
 * Implements scoring logic: (correct_count / 4) * 100
 * Stores scores in DynamoDB with metadata
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient, GetItemCommand, UpdateItemCommand, PutItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import {
  validateUUID,
} from '/opt/nodejs/validation';
import {
  ValidationError,
  DatabaseError,
  formatErrorResponse,
} from '/opt/nodejs/error-handling';
import { Logger } from '/opt/nodejs/logging';
import {
  DYNAMODB_TABLES,
  HTTP_STATUS,
} from '/opt/nodejs/constants';

const dynamoDb = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const logger = new Logger();

// Constants
const TOTAL_QUESTIONS = 4;
const MAX_SCORE = 100;
const POINTS_PER_QUESTION = MAX_SCORE / TOTAL_QUESTIONS; // 25 points per question
const SCORING_TIMEOUT_MS = 100;

interface UserAnswers {
  [questionId: string]: string | null;
}

interface ScoreResult {
  score_id: string;
  score: number;
  correct_count: number;
  incorrect_count: number;
  unanswered_count: number;
  answers_detail: Array<{
    question_id: string;
    user_answer: string | null;
    correct_answer: string;
    is_correct: boolean;
  }>;
}

/**
 * Calculate score based on user answers
 * Score = (correct_count / 4) * 100
 * Unanswered questions are treated as incorrect
 */
const calculateScore = (
  userAnswers: UserAnswers,
  correctAnswers: { [key: string]: string }
): { score: number; breakdown: { correct: number; incorrect: number; unanswered: number }; details: any[] } => {
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;
  const details: any[] = [];

  // Get all question IDs from correct answers
  const questionIds = Object.keys(correctAnswers);

  // Iterate through all questions
  for (const questionId of questionIds) {
    const userAnswer = userAnswers[questionId] || null;
    const correctAnswer = correctAnswers[questionId];
    const isCorrect = userAnswer !== null && userAnswer !== undefined && userAnswer !== '' && userAnswer === correctAnswer;

    if (userAnswer === null || userAnswer === undefined || userAnswer === '') {
      unansweredCount++;
    } else if (isCorrect) {
      correctCount++;
    } else {
      incorrectCount++;
    }

    details.push({
      question_id: questionId,
      user_answer: userAnswer,
      correct_answer: correctAnswer,
      is_correct: isCorrect,
    });
  }

  // Calculate score: (correct_count / 4) * 100
  const score = (correctCount / TOTAL_QUESTIONS) * MAX_SCORE;

  return {
    score,
    breakdown: {
      correct: correctCount,
      incorrect: incorrectCount,
      unanswered: unansweredCount,
    },
    details,
  };
};

/**
 * POST /practice-sets/{id}/submit - Submit practice set and calculate score
 * Compares user answers against correct answers
 * Stores score in Scores table
 */
export const submitPracticeSet = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();

  try {
    logger.info('Practice set submission received', { path: event.path });

    // Extract user context from authorizer
    const authorizer = event.requestContext.authorizer as any;
    if (!authorizer || !authorizer.user_id || !authorizer.tenant_id) {
      return formatErrorResponse(
        new ValidationError('Missing user context in request')
      );
    }

    const userId = authorizer.user_id;
    const tenantId = authorizer.tenant_id;

    // Extract practice set ID from path
    const practiceSetId = event.pathParameters?.id;
    if (!practiceSetId) {
      return formatErrorResponse(new ValidationError('Practice set ID is required'));
    }

    // Parse request body
    let body: any;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (error) {
      return formatErrorResponse(new ValidationError('Invalid request body'));
    }

    const { answers, time_taken } = body;

    if (!answers || typeof answers !== 'object') {
      return formatErrorResponse(new ValidationError('Answers object is required'));
    }

    // Retrieve practice set from DynamoDB
    let practiceSet: any;
    let correctAnswers: { [key: string]: string } = {};
    
    try {
      const getCommand = new GetItemCommand({
        TableName: DYNAMODB_TABLES.PRACTICE_SETS,
        Key: marshall({
          'tenant_id#user_id': `${tenantId}#${userId}`,
          practice_set_id: practiceSetId,
        }),
      });

      const response = await dynamoDb.send(getCommand);
      
      if (response.Item) {
        practiceSet = unmarshall(response.Item);
        correctAnswers = practiceSet.correct_answers || {};
      } else {
        logger.warn('Practice set not found', { practiceSetId, userId, tenantId });
        throw new DatabaseError('Practice set not found');
      }

      logger.info('Retrieved practice set', { practiceSetId, userId, tenantId });
    } catch (error) {
      logger.error('Failed to retrieve practice set', { practiceSetId, error });
      throw new DatabaseError('Failed to retrieve practice set');
    }

    // Calculate score
    const scoreResult = calculateScore(answers, correctAnswers);

    // Verify scoring completes within 100ms
    const scoringTime = Date.now() - startTime;
    if (scoringTime > SCORING_TIMEOUT_MS) {
      logger.warn('Scoring exceeded 100ms target', {
        practiceSetId,
        scoringTime,
      });
    }

    // Generate score ID
    const scoreId = `score_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Math.floor(Date.now() / 1000);

    // Store score in Scores table
    try {
      const putCommand = new PutItemCommand({
        TableName: DYNAMODB_TABLES.SCORES,
        Item: marshall({
          'tenant_id#user_id': `${tenantId}#${userId}`,
          score_id: scoreId,
          tenant_id: tenantId,
          user_id: userId,
          practice_set_id: practiceSetId,
          paper: '', // Would come from practice set
          score: scoreResult.score,
          correct_count: scoreResult.breakdown.correct,
          incorrect_count: scoreResult.breakdown.incorrect,
          unanswered_count: scoreResult.breakdown.unanswered,
          created_at: now,
          time_taken: time_taken || 0,
          difficulty_avg: 0, // Would be calculated from questions
          performance_trend: 'stable', // Would be calculated from history
        }),
      });

      await dynamoDb.send(putCommand);
    } catch (error) {
      logger.error('Failed to store score', { scoreId, error });
      throw new DatabaseError('Failed to store score');
    }

    // Update practice set status to submitted
    try {
      const updateCommand = new UpdateItemCommand({
        TableName: DYNAMODB_TABLES.PRACTICE_SETS,
        Key: marshall({
          'tenant_id#user_id': `${tenantId}#${userId}`,
          created_at: 0, // Would be actual created_at
        }),
        UpdateExpression: 'SET #status = :status, submitted_at = :submitted_at, score = :score',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: marshall({
          ':status': 'submitted',
          ':submitted_at': now,
          ':score': scoreResult.score,
        }),
      });

      await dynamoDb.send(updateCommand);
    } catch (error) {
      logger.error('Failed to update practice set status', { practiceSetId, error });
      // Don't throw - score was already stored
    }

    const responseTime = Date.now() - startTime;
    logger.info('Practice set scored', {
      practiceSetId,
      score: scoreResult.score,
      responseTime,
    });

    return {
      statusCode: HTTP_STATUS.OK,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
      },
      body: JSON.stringify({
        success: true,
        score: {
          score_id: scoreId,
          score: scoreResult.score,
          correct_count: scoreResult.breakdown.correct,
          incorrect_count: scoreResult.breakdown.incorrect,
          unanswered_count: scoreResult.breakdown.unanswered,
          total_questions: TOTAL_QUESTIONS,
          answers_detail: scoreResult.details,
        },
      }),
    };
  } catch (error) {
    logger.error('Error submitting practice set', { error });
    return formatErrorResponse(error as Error);
  }
};

/**
 * Calculate performance trend based on score history
 * Improving: current score > average of last 3 scores
 * Declining: current score < average of last 3 scores
 * Stable: current score ≈ average of last 3 scores (within 5 points)
 */
const calculatePerformanceTrend = (
  currentScore: number,
  previousScores: number[]
): string => {
  if (previousScores.length === 0) {
    return 'stable'; // No history, default to stable
  }

  // Use up to last 3 scores
  const recentScores = previousScores.slice(0, 3);
  const averageScore = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;

  const difference = currentScore - averageScore;

  if (difference > 5) {
    return 'improving';
  } else if (difference < -5) {
    return 'declining';
  } else {
    return 'stable';
  }
};

/**
 * GET /scores/{userId} - Retrieve scores with filtering and pagination
 * Supports filtering by paper and date range
 * Returns scores with performance trend metadata
 */
export const getScores = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();

  try {
    logger.info('Score retrieval requested', { path: event.path });

    // Extract user context from authorizer
    const authorizer = event.requestContext.authorizer as any;
    if (!authorizer || !authorizer.user_id || !authorizer.tenant_id) {
      return formatErrorResponse(
        new ValidationError('Missing user context in request')
      );
    }

    const tenantId = authorizer.tenant_id;
    const pathUserId = event.pathParameters?.userId;

    // Validate that user can only access their own scores
    if (pathUserId !== authorizer.user_id) {
      return {
        statusCode: HTTP_STATUS.FORBIDDEN,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: false,
          error: 'Access denied',
        }),
      };
    }

    const userId = pathUserId;

    // Parse query parameters
    const queryParams = event.queryStringParameters || {};
    const paper = queryParams.paper || undefined;
    const startDate = queryParams.start_date ? parseInt(queryParams.start_date) : undefined;
    const endDate = queryParams.end_date ? parseInt(queryParams.end_date) : undefined;
    const limit = queryParams.limit ? Math.min(parseInt(queryParams.limit), 100) : 50;
    const pageToken = queryParams.page_token || undefined;

    // Validate date range if provided
    if (startDate && endDate && startDate > endDate) {
      return formatErrorResponse(
        new ValidationError('start_date must be before end_date')
      );
    }

    // Query scores from DynamoDB
    let scores: any[] = [];
    let lastEvaluatedKey: any = undefined;

    try {
      // Build query parameters
      const keyConditionExpression = 'tenant_id#user_id = :pk';
      const expressionAttributeValues: any = {
        ':pk': `${tenantId}#${userId}`,
      };

      // Build filter expression for date range and paper
      const filterExpressions: string[] = [];
      
      if (startDate !== undefined) {
        filterExpressions.push('created_at >= :startDate');
        expressionAttributeValues[':startDate'] = startDate;
      }

      if (endDate !== undefined) {
        filterExpressions.push('created_at <= :endDate');
        expressionAttributeValues[':endDate'] = endDate;
      }

      if (paper !== undefined) {
        filterExpressions.push('paper = :paper');
        expressionAttributeValues[':paper'] = paper;
      }

      const filterExpression = filterExpressions.length > 0 
        ? filterExpressions.join(' AND ')
        : undefined;

      const queryCommand = new QueryCommand({
        TableName: DYNAMODB_TABLES.SCORES,
        KeyConditionExpression: keyConditionExpression,
        FilterExpression: filterExpression,
        ExpressionAttributeValues: marshall(expressionAttributeValues),
        ScanIndexForward: false, // Sort by created_at descending
        Limit: limit + 1, // Fetch one extra to determine if there are more results
        ExclusiveStartKey: pageToken ? JSON.parse(Buffer.from(pageToken, 'base64').toString()) : undefined,
      });

      const response = await dynamoDb.send(queryCommand);
      
      if (response.Items) {
        scores = response.Items.map(item => unmarshall(item));
        
        // Check if there are more results
        if (scores.length > limit) {
          scores = scores.slice(0, limit);
          lastEvaluatedKey = response.LastEvaluatedKey;
        }
      }

      logger.info('Retrieved scores', { userId, tenantId, count: scores.length });
    } catch (error) {
      logger.error('Failed to retrieve scores', { userId, error });
      throw new DatabaseError('Failed to retrieve scores');
    }

    // Calculate performance trends for each score
    const scoresWithTrends = scores.map((score, index) => {
      // Get previous scores for trend calculation
      const previousScores = scores
        .slice(index + 1)
        .filter(s => !paper || s.paper === paper)
        .map(s => s.score);

      const performanceTrend = calculatePerformanceTrend(score.score, previousScores);

      return {
        ...score,
        performance_trend: performanceTrend,
      };
    });

    // Build pagination token
    let nextPageToken: string | undefined = undefined;
    if (lastEvaluatedKey) {
      nextPageToken = Buffer.from(JSON.stringify(lastEvaluatedKey)).toString('base64');
    }

    const responseTime = Date.now() - startTime;
    logger.info('Scores retrieved successfully', {
      userId,
      count: scoresWithTrends.length,
      responseTime,
    });

    return {
      statusCode: HTTP_STATUS.OK,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
      },
      body: JSON.stringify({
        success: true,
        scores: scoresWithTrends,
        pagination: {
          limit,
          count: scoresWithTrends.length,
          next_page_token: nextPageToken,
        },
      }),
    };
  } catch (error) {
    logger.error('Error retrieving scores', { error });
    return formatErrorResponse(error as Error);
  }
};

/**
 * Lambda handler for routing requests
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Scoring handler invoked', {
    method: event.httpMethod,
    path: event.path,
  });

  // Route to appropriate handler
  if (event.httpMethod === 'POST' && event.path.includes('/submit')) {
    return submitPracticeSet(event);
  }

  if (event.httpMethod === 'GET' && event.path.includes('/scores/')) {
    return getScores(event);
  }

  return {
    statusCode: HTTP_STATUS.NOT_FOUND,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      success: false,
      error: 'Endpoint not found',
    }),
  };
};
