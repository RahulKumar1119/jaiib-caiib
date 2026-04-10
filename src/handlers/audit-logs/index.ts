/**
 * Audit Logging Lambda Handler
 * Handles audit logging for all system events
 * Logs user login/logout, practice set completion, explanation requests, question modifications, and errors
 * Stores logs in DynamoDB with CloudWatch integration
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  DynamoDBClient,
  PutItemCommand,
  QueryCommand,
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

const dynamoDb = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const logger = createLogger({ service: 'AuditLogHandler' });

// Constants
const AUDIT_LOG_GROUP = '/aws/lambda/audit-logs';
const AUDIT_LOG_STREAM = 'audit-events';
const NINETY_DAYS_SECONDS = 90 * 24 * 60 * 60;
const TTL_BUFFER_SECONDS = 60; // Add 60 seconds buffer to TTL calculation

// Event types
export enum AuditEventType {
  LOGIN = 'login',
  LOGOUT = 'logout',
  PRACTICE_SET_COMPLETION = 'practice_set_completion',
  EXPLANATION_REQUEST = 'explanation_request',
  QUESTION_MODIFICATION = 'question_modification',
  ERROR = 'error',
}

// Interfaces
export interface AuditEvent {
  event_type: AuditEventType;
  user_id: string;
  tenant_id: string;
  timestamp: number;
  ip_address?: string;
  user_agent?: string;
  resource_type?: string;
  resource_id?: string;
  action?: string;
  details?: Record<string, any>;
  error_context?: {
    error_type?: string;
    error_message?: string;
    stack_trace?: string;
  };
}

export interface AuditLogRecord {
  tenant_id: string;
  created_at: number;
  audit_id: string;
  event_type: AuditEventType;
  user_id: string;
  ip_address?: string;
  user_agent?: string;
  resource_type?: string;
  resource_id?: string;
  action?: string;
  details?: Record<string, any>;
  error_context?: Record<string, any>;
  ttl: number;
}

/**
 * Validate audit event
 */
const validateAuditEvent = (event: any): void => {
  if (!event.event_type) {
    throw new ValidationError('event_type is required');
  }

  if (!Object.values(AuditEventType).includes(event.event_type)) {
    throw new ValidationError(`Invalid event_type: ${event.event_type}`);
  }

  if (!event.user_id || typeof event.user_id !== 'string') {
    throw new ValidationError('user_id is required and must be a string');
  }

  if (!event.tenant_id || typeof event.tenant_id !== 'string') {
    throw new ValidationError('tenant_id is required and must be a string');
  }

  if (!event.timestamp || typeof event.timestamp !== 'number') {
    throw new ValidationError('timestamp is required and must be a number');
  }

  // Validate event-specific fields
  if (event.event_type === AuditEventType.PRACTICE_SET_COMPLETION) {
    if (!event.details || typeof event.details !== 'object') {
      throw new ValidationError('details object is required for practice_set_completion events');
    }
    if (event.details.score === undefined || typeof event.details.score !== 'number') {
      throw new ValidationError('details.score is required and must be a number');
    }
    if (!event.details.answers || typeof event.details.answers !== 'object') {
      throw new ValidationError('details.answers is required for practice_set_completion events');
    }
  }

  if (event.event_type === AuditEventType.EXPLANATION_REQUEST) {
    if (!event.details || !event.details.question_id) {
      throw new ValidationError('details.question_id is required for explanation_request events');
    }
  }

  if (event.event_type === AuditEventType.QUESTION_MODIFICATION) {
    if (!event.details || !event.details.before || !event.details.after) {
      throw new ValidationError('details.before and details.after are required for question_modification events');
    }
  }

  if (event.event_type === AuditEventType.ERROR) {
    if (!event.error_context) {
      throw new ValidationError('error_context is required for error events');
    }
  }
};

/**
 * Store audit log in DynamoDB
 */
const storeAuditLogInDynamoDB = async (auditLog: AuditLogRecord): Promise<void> => {
  try {
    // Filter out undefined values to avoid marshall errors
    const cleanedLog = Object.fromEntries(
      Object.entries(auditLog).filter(([, value]) => value !== undefined)
    );

    const params = {
      TableName: DYNAMODB_TABLES.AUDIT_LOGS,
      Item: marshall(cleanedLog),
    };

    await dynamoDb.send(new PutItemCommand(params));
    logger.info('Audit log stored in DynamoDB', {
      audit_id: auditLog.audit_id,
      event_type: auditLog.event_type,
    });
  } catch (error) {
    logger.error('Failed to store audit log in DynamoDB', {
      error: error instanceof Error ? error.message : String(error),
      audit_id: auditLog.audit_id,
    });
    throw new DatabaseError(`Failed to store audit log: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Store audit log in CloudWatch (via console.log which Lambda captures)
 */
const storeAuditLogInCloudWatch = async (auditLog: AuditLogRecord): Promise<void> => {
  try {
    const logMessage = JSON.stringify({
      audit_id: auditLog.audit_id,
      event_type: auditLog.event_type,
      user_id: auditLog.user_id,
      tenant_id: auditLog.tenant_id,
      timestamp: auditLog.created_at,
      ip_address: auditLog.ip_address,
      resource_type: auditLog.resource_type,
      resource_id: auditLog.resource_id,
      action: auditLog.action,
      details: auditLog.details,
      error_context: auditLog.error_context,
    });

    // Lambda automatically captures console.log to CloudWatch Logs
    console.log(JSON.stringify({
      level: 'AUDIT',
      message: logMessage,
      timestamp: auditLog.created_at * 1000,
    }));

    logger.info('Audit log stored in CloudWatch', {
      audit_id: auditLog.audit_id,
      event_type: auditLog.event_type,
    });
  } catch (error) {
    logger.error('Failed to store audit log in CloudWatch', {
      error: error instanceof Error ? error.message : String(error),
      audit_id: auditLog.audit_id,
    });
    // Don't throw - CloudWatch logging is secondary to DynamoDB
  }
};

/**
 * Create audit log record from event
 */
const createAuditLogRecord = (event: AuditEvent): AuditLogRecord => {
  const now = Math.floor(Date.now() / 1000);
  const ttl = now + NINETY_DAYS_SECONDS + TTL_BUFFER_SECONDS;

  return {
    tenant_id: event.tenant_id,
    created_at: event.timestamp,
    audit_id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    event_type: event.event_type,
    user_id: event.user_id,
    ip_address: event.ip_address,
    user_agent: event.user_agent,
    resource_type: event.resource_type,
    resource_id: event.resource_id,
    action: event.action,
    details: event.details,
    error_context: event.error_context,
    ttl,
  };
};

/**
 * Log audit event
 */
const logAuditEvent = async (event: AuditEvent): Promise<AuditLogRecord> => {
  validateAuditEvent(event);

  const auditLog = createAuditLogRecord(event);

  // Store in both DynamoDB and CloudWatch
  await Promise.all([
    storeAuditLogInDynamoDB(auditLog),
    storeAuditLogInCloudWatch(auditLog),
  ]);

  return auditLog;
};

/**
 * Query audit logs with filtering and pagination
 */
const queryAuditLogs = async (
  tenantId: string,
  filters?: {
    user_id?: string;
    event_type?: AuditEventType;
    start_date?: number;
    end_date?: number;
    limit?: number;
    offset?: number;
  }
): Promise<{ logs: AuditLogRecord[]; total: number; hasMore: boolean }> => {
  try {
    const limit = Math.min(filters?.limit || 100, 1000); // Cap at 1000
    const offset = filters?.offset || 0;
    const startDate = filters?.start_date || Math.floor(Date.now() / 1000) - NINETY_DAYS_SECONDS;
    const endDate = filters?.end_date || Math.floor(Date.now() / 1000);

    let keyConditionExpression = 'tenant_id = :tenant_id AND created_at BETWEEN :start_date AND :end_date';
    const expressionAttributeValues: Record<string, any> = {
      ':tenant_id': { S: tenantId },
      ':start_date': { N: startDate.toString() },
      ':end_date': { N: endDate.toString() },
    };

    let filterExpression = '';
    const filterExpressions: string[] = [];

    if (filters?.user_id) {
      filterExpressions.push('user_id = :user_id');
      expressionAttributeValues[':user_id'] = { S: filters.user_id };
    }

    if (filters?.event_type) {
      filterExpressions.push('event_type = :event_type');
      expressionAttributeValues[':event_type'] = { S: filters.event_type };
    }

    if (filterExpressions.length > 0) {
      filterExpression = filterExpressions.join(' AND ');
    }

    const params = {
      TableName: DYNAMODB_TABLES.AUDIT_LOGS,
      KeyConditionExpression: keyConditionExpression,
      FilterExpression: filterExpression || undefined,
      ExpressionAttributeValues: expressionAttributeValues,
      Limit: limit + offset + 1, // Fetch one extra to determine if there are more
      ScanIndexForward: false, // Descending order (newest first)
    };

    const result = await dynamoDb.send(new QueryCommand(params));
    const allItems = (result.Items || []).map(item => unmarshall(item) as AuditLogRecord);

    // Apply offset-based pagination
    const paginatedItems = allItems.slice(offset, offset + limit);
    const hasMore = allItems.length > offset + limit;
    const total = result.Count || 0;

    return {
      logs: paginatedItems,
      total,
      hasMore,
    };
  } catch (error) {
    logger.error('Failed to query audit logs', {
      error: error instanceof Error ? error.message : String(error),
      tenant_id: tenantId,
    });
    throw new DatabaseError(`Failed to query audit logs: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Convert audit logs to CSV format
 */
const convertToCSV = (logs: AuditLogRecord[]): string => {
  if (logs.length === 0) {
    return 'audit_id,event_type,user_id,tenant_id,created_at,ip_address,resource_type,resource_id,action,status\n';
  }

  const headers = [
    'audit_id',
    'event_type',
    'user_id',
    'tenant_id',
    'created_at',
    'ip_address',
    'resource_type',
    'resource_id',
    'action',
    'status',
  ];

  const rows = logs.map(log => [
    log.audit_id,
    log.event_type,
    log.user_id,
    log.tenant_id,
    new Date(log.created_at * 1000).toISOString(),
    log.ip_address || '',
    log.resource_type || '',
    log.resource_id || '',
    log.action || '',
    'success', // All stored logs are successful
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  return csvContent;
};

/**
 * Handle POST /audit-logs - Log an audit event
 */
const handlePostAuditLog = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      throw new ValidationError('Request body is required');
    }

    const auditEvent = JSON.parse(event.body) as AuditEvent;

    // Extract IP address from event
    const ipAddress = event.requestContext?.identity?.sourceIp || 'unknown';
    const userAgent = event.headers['user-agent'] || 'unknown';

    auditEvent.ip_address = auditEvent.ip_address || ipAddress;
    auditEvent.user_agent = auditEvent.user_agent || userAgent;

    const auditLog = await logAuditEvent(auditEvent);

    return {
      statusCode: HTTP_STATUS.CREATED,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        audit_log: {
          audit_id: auditLog.audit_id,
          event_type: auditLog.event_type,
          created_at: auditLog.created_at,
        },
      }),
    };
  } catch (error) {
    logger.error('Error handling POST /audit-logs', {
      error: error instanceof Error ? error.message : String(error),
    });

    return formatErrorResponse(error as Error);
  }
};

/**
 * Handle GET /audit-logs - Query audit logs with filtering, pagination, and export
 */
const handleGetAuditLogs = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const tenantId = event.requestContext?.authorizer?.claims?.['custom:tenant_id'] as string;
    if (!tenantId) {
      throw new ValidationError('Tenant ID not found in token');
    }

    // Check authorization - only admin/super_admin can query audit logs
    const userRole = event.requestContext?.authorizer?.claims?.['custom:role'] as string;
    if (!userRole || !['admin', 'super_admin'].includes(userRole)) {
      return {
        statusCode: HTTP_STATUS.UNAUTHORIZED,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'Unauthorized: Only admin users can access audit logs',
        }),
      };
    }

    const queryParams = event.queryStringParameters || {};
    const exportFormat = queryParams.export as string | undefined;
    const filters = {
      user_id: queryParams.user_id,
      event_type: queryParams.event_type as AuditEventType,
      start_date: queryParams.start_date ? parseInt(queryParams.start_date, 10) : undefined,
      end_date: queryParams.end_date ? parseInt(queryParams.end_date, 10) : undefined,
      limit: queryParams.limit ? parseInt(queryParams.limit, 10) : 100,
      offset: queryParams.offset ? parseInt(queryParams.offset, 10) : 0,
    };

    // Validate date range
    if (filters.start_date && filters.end_date && filters.start_date > filters.end_date) {
      throw new ValidationError('start_date must be before end_date');
    }

    // Validate limit
    if (filters.limit && (filters.limit < 1 || filters.limit > 1000)) {
      throw new ValidationError('limit must be between 1 and 1000');
    }

    // Validate offset
    if (filters.offset && filters.offset < 0) {
      throw new ValidationError('offset must be non-negative');
    }

    const result = await queryAuditLogs(tenantId, filters);

    // Handle CSV export
    if (exportFormat === 'csv') {
      const csvContent = convertToCSV(result.logs);
      return {
        statusCode: HTTP_STATUS.OK,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit-logs-${Date.now()}.csv"`,
        },
        body: csvContent,
      };
    }

    // Return JSON response with pagination info
    return {
      statusCode: HTTP_STATUS.OK,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        audit_logs: result.logs,
        pagination: {
          count: result.logs.length,
          total: result.total,
          offset: filters.offset,
          limit: filters.limit,
          has_more: result.hasMore,
        },
      }),
    };
  } catch (error) {
    logger.error('Error handling GET /audit-logs', {
      error: error instanceof Error ? error.message : String(error),
    });

    return formatErrorResponse(error as Error);
  }
};

/**
 * Main Lambda handler
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Audit log handler invoked', {
    method: event.httpMethod,
    path: event.path,
  });

  try {
    if (event.httpMethod === 'POST') {
      return await handlePostAuditLog(event);
    }

    if (event.httpMethod === 'GET') {
      return await handleGetAuditLogs(event);
    }

    throw new ValidationError('Method not allowed');
  } catch (error) {
    logger.error('Unhandled error in audit log handler', {
      error: error instanceof Error ? error.message : String(error),
    });

    return formatErrorResponse(error as Error);
  }
};
