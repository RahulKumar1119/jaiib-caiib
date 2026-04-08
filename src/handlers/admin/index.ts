/**
 * Admin Question Management Lambda Handler
 * Handles CRUD operations for MCQ questions in the question bank
 * Implements question validation, versioning, and filtering
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  UpdateItemCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import {
  validateEmail,
  validateUUID,
} from '/opt/nodejs/validation';
import {
  ValidationError,
  DatabaseError,
  AuthenticationError,
  formatErrorResponse,
} from '/opt/nodejs/error-handling';
import { Logger, createLogger } from '/opt/nodejs/logging';
import {
  DYNAMODB_TABLES,
  HTTP_STATUS,
} from '/opt/nodejs/constants';
import { Question } from '/opt/nodejs/types';
import { v4 as uuidv4 } from 'uuid';

const dynamoDb = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const logger = createLogger({ service: 'AdminHandler' });

/**
 * Map of valid syllabus topics per paper
 * Requirements: 3.7, 8.8
 */
const VALID_SYLLABUS_TOPICS: { [key: string]: string[] } = {
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
 * Validates question data
 * Requirements: 8.2, 8.3, 8.4, 3.7, 8.8
 */
const validateQuestion = (question: any): void => {
  // Validate question text (min 10 characters)
  if (!question.question_text || typeof question.question_text !== 'string') {
    throw new ValidationError('Question text is required');
  }

  if (question.question_text.trim().length < 10) {
    throw new ValidationError('Question text must be at least 10 characters');
  }

  // Validate options are non-empty and unique
  const options = [question.option_a, question.option_b, question.option_c, question.option_d];

  for (const option of options) {
    if (!option || typeof option !== 'string' || option.trim().length === 0) {
      throw new ValidationError('All options must be non-empty');
    }
  }

  // Check for unique options
  const uniqueOptions = new Set(options.map(o => o.trim().toLowerCase()));
  if (uniqueOptions.size !== 4) {
    throw new ValidationError('All options must be unique');
  }

  // Validate correct answer (exactly one)
  if (!question.correct_answer || !['A', 'B', 'C', 'D'].includes(question.correct_answer)) {
    throw new ValidationError('Correct answer must be one of: A, B, C, D');
  }

  // Validate paper
  const validPapers = ['JAIIB_IE_IFS', 'JAIIB_PPB', 'JAIIB_AFB', 'JAIIB_RBWM'];
  if (!question.paper || !validPapers.includes(question.paper)) {
    throw new ValidationError('Paper must be one of: JAIIB_IE_IFS, JAIIB_PPB, JAIIB_AFB, JAIIB_RBWM');
  }

  // Validate difficulty level
  const validDifficulties = ['easy', 'medium', 'hard'];
  if (!question.difficulty_level || !validDifficulties.includes(question.difficulty_level)) {
    throw new ValidationError('Difficulty level must be one of: easy, medium, hard');
  }

  // Validate syllabus topic alignment (Requirements: 3.7, 8.8)
  if (!question.syllabus_topic || typeof question.syllabus_topic !== 'string') {
    throw new ValidationError('Syllabus topic is required for JAIIB alignment');
  }

  if (question.syllabus_topic.trim().length === 0) {
    throw new ValidationError('Syllabus topic cannot be empty');
  }

  const validTopics = VALID_SYLLABUS_TOPICS[question.paper];
  if (!validTopics.includes(question.syllabus_topic)) {
    throw new ValidationError(
      `Syllabus topic "${question.syllabus_topic}" is not valid for paper ${question.paper}. Valid topics: ${validTopics.join(', ')}`
    );
  }
};

/**
 * POST /admin/questions - Add new question
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */
export const addQuestion = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    logger.info('Add question request received', { path: event.path });

    // Extract user from JWT token (set by API Gateway authorizer)
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Missing or invalid authorization header');
      throw new AuthenticationError('Missing authorization header');
    }

    // Parse request body
    const body = JSON.parse(event.body || '{}');

    // Validate question data
    validateQuestion(body);

    // Generate question ID
    const questionId = uuidv4();
    const now = Math.floor(Date.now() / 1000); // Unix timestamp

    // Create question item
    const question: Question = {
      paper: body.paper,
      question_id: questionId,
      version: 1,
      question_text: body.question_text.trim(),
      option_a: body.option_a.trim(),
      option_b: body.option_b.trim(),
      option_c: body.option_c.trim(),
      option_d: body.option_d.trim(),
      correct_answer: body.correct_answer,
      difficulty_level: body.difficulty_level,
      status: 'active',
      created_at: now,
      updated_at: now,
      created_by: body.created_by || 'admin',
      updated_by: body.created_by || 'admin',
      rbi_norms: body.rbi_norms || [],
      iibf_norms: body.iibf_norms || [],
      syllabus_topic: body.syllabus_topic || '',
      usage_count: 0,
      avg_score: 0,
    };

    // Store in DynamoDB
    const putCommand = new PutItemCommand({
      TableName: DYNAMODB_TABLES.QUESTIONS,
      Item: marshall({
        [`${body.paper}#${questionId}`]: `${body.paper}#${questionId}`,
        ...question,
      }),
    });

    await dynamoDb.send(putCommand);

    logger.info('Question added successfully', { question_id: questionId, paper: body.paper });

    return {
      statusCode: HTTP_STATUS.CREATED,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
      },
      body: JSON.stringify({
        success: true,
        question: {
          question_id: questionId,
          version: 1,
          created_at: now,
        },
      }),
    };
  } catch (error) {
    logger.error('Add question error', error);
    return formatErrorResponse(error);
  }
};

/**
 * PUT /admin/questions/{id} - Update question
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */
export const updateQuestion = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    logger.info('Update question request received', { path: event.path });

    // Extract user from JWT token
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Missing or invalid authorization header');
      throw new AuthenticationError('Missing authorization header');
    }

    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { paper, questionId } = event.pathParameters || {};

    if (!paper || !questionId) {
      throw new ValidationError('Paper and question ID are required');
    }

    // Validate question data
    validateQuestion(body);

    // Query to get the latest version of the question
    const queryCommand = new QueryCommand({
      TableName: DYNAMODB_TABLES.QUESTIONS,
      KeyConditionExpression: `${paper}#${questionId} = :pk`,
      ExpressionAttributeValues: marshall({
        ':pk': `${paper}#${questionId}`,
      }),
      ScanIndexForward: false, // Sort descending to get latest version first
      Limit: 1,
    });

    const queryResponse = await dynamoDb.send(queryCommand);
    if (!queryResponse.Items || queryResponse.Items.length === 0) {
      throw new ValidationError('Question not found');
    }

    const currentQuestion = unmarshall(queryResponse.Items[0]) as any;
    const currentVersion = currentQuestion.version || 1;
    const newVersion = currentVersion + 1;
    const now = Math.floor(Date.now() / 1000); // Unix timestamp

    // Store previous version as audit trail
    const previousVersionItem: Question = {
      ...currentQuestion,
      version: currentVersion,
    };

    // Create new version with updated data
    const newVersionItem: Question = {
      paper: body.paper,
      question_id: questionId,
      version: newVersion,
      question_text: body.question_text.trim(),
      option_a: body.option_a.trim(),
      option_b: body.option_b.trim(),
      option_c: body.option_c.trim(),
      option_d: body.option_d.trim(),
      correct_answer: body.correct_answer,
      difficulty_level: body.difficulty_level,
      status: currentQuestion.status || 'active',
      created_at: currentQuestion.created_at,
      updated_at: now,
      created_by: currentQuestion.created_by,
      updated_by: body.updated_by || 'admin',
      rbi_norms: body.rbi_norms || [],
      iibf_norms: body.iibf_norms || [],
      syllabus_topic: body.syllabus_topic || '',
      usage_count: currentQuestion.usage_count || 0,
      avg_score: currentQuestion.avg_score || 0,
    };

    // Put new version
    const putCommand = new PutItemCommand({
      TableName: DYNAMODB_TABLES.QUESTIONS,
      Item: marshall({
        [`${paper}#${questionId}`]: `${paper}#${questionId}`,
        ...newVersionItem,
      }),
    });

    await dynamoDb.send(putCommand);

    // Create audit log entry
    const auditLogId = uuidv4();
    const auditLogCommand = new PutItemCommand({
      TableName: DYNAMODB_TABLES.AUDIT_LOGS,
      Item: marshall({
        tenant_id: 'default', // In multi-tenant, extract from token
        created_at: now,
        audit_id: auditLogId,
        event_type: 'question_modified',
        user_id: body.updated_by || 'admin',
        resource_type: 'question',
        resource_id: questionId,
        action: 'update',
        changes: {
          version: { old: currentVersion, new: newVersion },
          question_text: { old: currentQuestion.question_text, new: body.question_text.trim() },
          option_a: { old: currentQuestion.option_a, new: body.option_a.trim() },
          option_b: { old: currentQuestion.option_b, new: body.option_b.trim() },
          option_c: { old: currentQuestion.option_c, new: body.option_c.trim() },
          option_d: { old: currentQuestion.option_d, new: body.option_d.trim() },
          correct_answer: { old: currentQuestion.correct_answer, new: body.correct_answer },
          difficulty_level: { old: currentQuestion.difficulty_level, new: body.difficulty_level },
        },
        status: 'success',
      }),
    });

    await dynamoDb.send(auditLogCommand);

    logger.info('Question updated successfully', {
      question_id: questionId,
      paper,
      new_version: newVersion,
      audit_id: auditLogId,
    });

    return {
      statusCode: HTTP_STATUS.OK,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
      },
      body: JSON.stringify({
        success: true,
        question: {
          question_id: questionId,
          version: newVersion,
          updated_at: now,
        },
      }),
    };
  } catch (error) {
    logger.error('Update question error', error);
    return formatErrorResponse(error);
  }
};

/**
 * DELETE /admin/questions/{id} - Archive question
 * Requirements: 8.1, 8.4
 */
export const deleteQuestion = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    logger.info('Delete question request received', { path: event.path });

    // Extract user from JWT token
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Missing or invalid authorization header');
      throw new AuthenticationError('Missing authorization header');
    }

    const { paper, questionId } = event.pathParameters || {};

    if (!paper || !questionId) {
      throw new ValidationError('Paper and question ID are required');
    }

    // Get current question
    const getCommand = new GetItemCommand({
      TableName: DYNAMODB_TABLES.QUESTIONS,
      Key: marshall({
        [`${paper}#${questionId}`]: `${paper}#${questionId}`,
        version: 1,
      }),
    });

    const response = await dynamoDb.send(getCommand);
    if (!response.Item) {
      throw new ValidationError('Question not found');
    }

    const currentQuestion = unmarshall(response.Item) as any;
    const now = Math.floor(Date.now() / 1000); // Unix timestamp

    // Archive question by setting status to archived
    const updateCommand = new UpdateItemCommand({
      TableName: DYNAMODB_TABLES.QUESTIONS,
      Key: marshall({
        [`${paper}#${questionId}`]: `${paper}#${questionId}`,
        version: currentQuestion.version || 1,
      }),
      UpdateExpression: 'SET #status = :archived, updated_at = :now',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: marshall({
        ':archived': 'archived',
        ':now': now,
      }),
    });

    await dynamoDb.send(updateCommand);

    logger.info('Question archived successfully', { question_id: questionId, paper });

    return {
      statusCode: HTTP_STATUS.OK,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
      },
      body: JSON.stringify({
        success: true,
        message: 'Question archived successfully',
      }),
    };
  } catch (error) {
    logger.error('Delete question error', error);
    return formatErrorResponse(error);
  }
};

/**
 * GET /admin/questions/{id}/versions - Get version history for a question
 * Requirements: 8.5, 12.4
 */
export const getQuestionVersions = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    logger.info('Get question versions request received', { path: event.path });

    // Extract user from JWT token
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Missing or invalid authorization header');
      throw new AuthenticationError('Missing authorization header');
    }

    const { paper, questionId } = event.pathParameters || {};

    if (!paper || !questionId) {
      throw new ValidationError('Paper and question ID are required');
    }

    // Query all versions of the question
    const queryCommand = new QueryCommand({
      TableName: DYNAMODB_TABLES.QUESTIONS,
      KeyConditionExpression: `${paper}#${questionId} = :pk`,
      ExpressionAttributeValues: marshall({
        ':pk': `${paper}#${questionId}`,
      }),
      ScanIndexForward: false, // Sort descending to get latest versions first
    });

    const response = await dynamoDb.send(queryCommand);
    if (!response.Items || response.Items.length === 0) {
      throw new ValidationError('Question not found');
    }

    const versions = (response.Items || []).map(item => {
      const q = unmarshall(item) as any;
      return {
        version: q.version,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_answer: q.correct_answer,
        difficulty_level: q.difficulty_level,
        status: q.status,
        created_at: q.created_at,
        updated_at: q.updated_at,
        updated_by: q.updated_by,
      };
    });

    logger.info('Question versions retrieved successfully', {
      question_id: questionId,
      paper,
      version_count: versions.length,
    });

    return {
      statusCode: HTTP_STATUS.OK,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
      },
      body: JSON.stringify({
        success: true,
        question_id: questionId,
        paper,
        versions,
        total_versions: versions.length,
      }),
    };
  } catch (error) {
    logger.error('Get question versions error', error);
    return formatErrorResponse(error);
  }
};

/**
 * GET /admin/questions - Get questions with filtering
 * Requirements: 8.1, 8.4
 */
export const getQuestions = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    logger.info('Get questions request received', { path: event.path });

    // Extract user from JWT token
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Missing or invalid authorization header');
      throw new AuthenticationError('Missing authorization header');
    }

    // Get query parameters
    const queryParams = event.queryStringParameters || {};
    const paper = queryParams.paper;
    const status = queryParams.status || 'active';
    const limit = parseInt(queryParams.limit || '50', 10);

    // Validate paper if provided
    if (paper) {
      const validPapers = ['JAIIB_IE_IFS', 'JAIIB_PPB', 'JAIIB_AFB', 'JAIIB_RBWM'];
      if (!validPapers.includes(paper)) {
        throw new ValidationError('Invalid paper');
      }
    }

    let questions: any[] = [];

    if (paper) {
      // Query by paper and status using GSI
      const queryCommand = new QueryCommand({
        TableName: DYNAMODB_TABLES.QUESTIONS,
        IndexName: 'paper-status-index',
        KeyConditionExpression: 'paper = :paper AND #status = :status',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: marshall({
          ':paper': paper,
          ':status': status,
        }),
        Limit: limit,
      });

      const response = await dynamoDb.send(queryCommand);
      questions = (response.Items || []).map(item => unmarshall(item));
    } else {
      // Scan all questions with status filter
      const scanCommand = new ScanCommand({
        TableName: DYNAMODB_TABLES.QUESTIONS,
        FilterExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: marshall({
          ':status': status,
        }),
        Limit: limit,
      });

      const response = await dynamoDb.send(scanCommand);
      questions = (response.Items || []).map(item => unmarshall(item));
    }

    logger.info('Questions retrieved successfully', {
      count: questions.length,
      paper,
      status,
    });

    return {
      statusCode: HTTP_STATUS.OK,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
      },
      body: JSON.stringify({
        success: true,
        questions: questions.map(q => ({
          question_id: q.question_id,
          question_text: q.question_text,
          paper: q.paper,
          difficulty_level: q.difficulty_level,
          status: q.status,
          version: q.version,
          created_at: q.created_at,
          updated_at: q.updated_at,
        })),
        count: questions.length,
      }),
    };
  } catch (error) {
    logger.error('Get questions error', error);
    return formatErrorResponse(error);
  }
};

/**
 * Validates JAIIB syllabus topic alignment
 * Requirements: 3.7, 8.8
 */
const validateSyllabusTopicAlignment = (question: any): void => {
  // Validate that syllabus_topic is provided
  if (!question.syllabus_topic || typeof question.syllabus_topic !== 'string') {
    throw new ValidationError('Syllabus topic is required for JAIIB alignment');
  }

  if (question.syllabus_topic.trim().length === 0) {
    throw new ValidationError('Syllabus topic cannot be empty');
  }

  const paper = question.paper;
  const validTopics = VALID_SYLLABUS_TOPICS[paper];

  if (!validTopics) {
    throw new ValidationError(`Invalid paper: ${paper}`);
  }

  // Check if the provided topic is in the valid list
  if (!validTopics.includes(question.syllabus_topic)) {
    throw new ValidationError(
      `Syllabus topic "${question.syllabus_topic}" is not valid for paper ${paper}. Valid topics: ${validTopics.join(', ')}`
    );
  }
};

/**
 * POST /admin/validate-question-bank - Validate question bank completeness
 * Requirements: 8.7, 8.8, 3.7, 12.8
 */
export const validateQuestionBank = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    logger.info('Validate question bank request received', { path: event.path });

    // Extract user from JWT token
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Missing or invalid authorization header');
      throw new AuthenticationError('Missing authorization header');
    }

    const papers = ['JAIIB_IE_IFS', 'JAIIB_PPB', 'JAIIB_AFB', 'JAIIB_RBWM'];
    const validationResults: any = {
      success: true,
      papers: {},
      overall_status: 'valid',
      issues: [],
    };

    // Check each paper for minimum question count and syllabus alignment
    for (const paper of papers) {
      const queryCommand = new QueryCommand({
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

      const response = await dynamoDb.send(queryCommand);
      const questions = (response.Items || []).map(item => unmarshall(item)) as any[];

      // Check minimum question count (40 per paper)
      const questionCount = questions.length;
      const hasMinimumQuestions = questionCount >= 40;

      // Check syllabus topic alignment
      const questionsWithoutSyllabusTopic = questions.filter(
        q => !q.syllabus_topic || q.syllabus_topic.trim().length === 0
      );

      const syllabusAlignmentPercentage =
        questions.length > 0
          ? ((questions.length - questionsWithoutSyllabusTopic.length) / questions.length) * 100
          : 0;

      const paperStatus = {
        paper,
        question_count: questionCount,
        minimum_required: 40,
        meets_minimum: hasMinimumQuestions,
        syllabus_alignment: {
          total_questions: questions.length,
          questions_with_topic: questions.length - questionsWithoutSyllabusTopic.length,
          questions_without_topic: questionsWithoutSyllabusTopic.length,
          alignment_percentage: Math.round(syllabusAlignmentPercentage * 100) / 100,
        },
        status: hasMinimumQuestions && syllabusAlignmentPercentage === 100 ? 'valid' : 'invalid',
      };

      validationResults.papers[paper] = paperStatus;

      // Track issues
      if (!hasMinimumQuestions) {
        validationResults.issues.push({
          paper,
          issue: `Insufficient questions: ${questionCount} found, 40 required`,
          severity: 'error',
        });
        validationResults.overall_status = 'invalid';
      }

      if (questionsWithoutSyllabusTopic.length > 0) {
        validationResults.issues.push({
          paper,
          issue: `${questionsWithoutSyllabusTopic.length} questions missing syllabus topic alignment`,
          severity: 'warning',
          question_ids: questionsWithoutSyllabusTopic.map(q => q.question_id),
        });
        if (syllabusAlignmentPercentage < 100) {
          validationResults.overall_status = 'invalid';
        }
      }
    }

    logger.info('Question bank validation completed', {
      overall_status: validationResults.overall_status,
      issue_count: validationResults.issues.length,
    });

    return {
      statusCode: HTTP_STATUS.OK,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
      },
      body: JSON.stringify(validationResults),
    };
  } catch (error) {
    logger.error('Validate question bank error', error);
    return formatErrorResponse(error);
  }
};

/**
 * Main handler - routes requests to appropriate function
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const path = event.path || '';
  const method = event.httpMethod || 'GET';

  logger.info('Admin handler invoked', { path, method });

  if (path === '/admin/questions' && method === 'POST') {
    return addQuestion(event);
  } else if (path === '/admin/validate-question-bank' && method === 'POST') {
    return validateQuestionBank(event);
  } else if (path.match(/^\/admin\/questions\/[^/]+\/versions$/) && method === 'GET') {
    // Extract paper and questionId from path like /admin/questions/JAIIB_IE_IFS#q_123/versions
    const pathParts = path.split('/');
    const questionPart = pathParts[3]; // e.g., "JAIIB_IE_IFS#q_123"
    const [paper, questionId] = questionPart.split('#');
    
    event.pathParameters = { paper, questionId };
    return getQuestionVersions(event);
  } else if (path.match(/^\/admin\/questions\/[^/]+$/) && method === 'PUT') {
    // Extract paper and questionId from path
    const pathParts = path.split('/');
    const questionPart = pathParts[3]; // e.g., "JAIIB_IE_IFS#q_123"
    const [paper, questionId] = questionPart.split('#');
    
    event.pathParameters = { paper, questionId };
    return updateQuestion(event);
  } else if (path.match(/^\/admin\/questions\/[^/]+$/) && method === 'DELETE') {
    // Extract paper and questionId from path
    const pathParts = path.split('/');
    const questionPart = pathParts[3]; // e.g., "JAIIB_IE_IFS#q_123"
    const [paper, questionId] = questionPart.split('#');
    
    event.pathParameters = { paper, questionId };
    return deleteQuestion(event);
  } else if (path === '/admin/questions' && method === 'GET') {
    return getQuestions(event);
  } else {
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
  }
};
