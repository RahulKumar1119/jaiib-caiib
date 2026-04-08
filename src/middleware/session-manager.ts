/**
 * Session Management Middleware
 * Handles JWT token validation, session expiration, and token refresh
 */

import * as jwt from 'jsonwebtoken';
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { decryptData } from '/opt/nodejs/encryption';
import { AuthenticationError } from '/opt/nodejs/error-handling';
import { Logger } from '/opt/nodejs/logging';
import { USERS_TABLE, JWT_SECRET, JWT_EXPIRATION_MINUTES } from '/opt/nodejs/constants';
import { User } from '/opt/nodejs/types';

const dynamoDb = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const logger = new Logger('SessionManager');

export interface SessionContext {
  user_id: string;
  email: string;
  tenant_id: string;
  role: string;
  token: string;
  expiresAt: number;
}

/**
 * Validates JWT token and returns session context
 * Throws AuthenticationError if token is invalid or expired
 */
export const validateToken = async (token: string): Promise<SessionContext> => {
  try {
    logger.info('Validating token');

    // Verify and decode token
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp <= now) {
      logger.warn('Token expired', { exp: decoded.exp, now });
      throw new AuthenticationError('Token has expired');
    }

    logger.info('Token validated successfully', { user_id: decoded.user_id });

    return {
      user_id: decoded.user_id,
      email: decoded.email,
      tenant_id: decoded.tenant_id,
      role: decoded.role,
      token,
      expiresAt: decoded.exp,
    };
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid token', { error: error.message });
      throw new AuthenticationError('Invalid token');
    }
    throw error;
  }
};

/**
 * Extracts token from Authorization header
 * Returns token or throws AuthenticationError if not found
 */
export const extractToken = (authHeader?: string): string => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Missing or invalid authorization header');
    throw new AuthenticationError('Missing authorization header');
  }

  return authHeader.substring(7);
};

/**
 * Checks if session is still valid in database
 * Verifies session token matches and hasn't expired
 */
export const validateSession = async (email: string, token: string): Promise<boolean> => {
  try {
    logger.info('Validating session', { email });

    // Get user from database
    const getUserCommand = new GetItemCommand({
      TableName: USERS_TABLE,
      Key: marshall({ email }),
    });

    const userResponse = await dynamoDb.send(getUserCommand);

    if (!userResponse.Item) {
      logger.warn('User not found', { email });
      return false;
    }

    const user = unmarshall(userResponse.Item) as User;

    // Check if session token exists
    if (!user.session_token) {
      logger.warn('No session token found', { email });
      return false;
    }

    // Decrypt and compare session token
    const decryptedSessionToken = decryptData(user.session_token);
    if (decryptedSessionToken !== token) {
      logger.warn('Session token mismatch', { email });
      return false;
    }

    // Check if session has expired
    if (user.session_expires_at && new Date(user.session_expires_at) < new Date()) {
      logger.warn('Session expired', { email, expiresAt: user.session_expires_at });
      return false;
    }

    logger.info('Session validated successfully', { email });
    return true;
  } catch (error) {
    logger.error('Session validation error', error);
    return false;
  }
};

/**
 * Refreshes token for user
 * Generates new token and updates session in database
 */
export const refreshToken = async (email: string): Promise<string> => {
  try {
    logger.info('Refreshing token', { email });

    // Get user from database
    const getUserCommand = new GetItemCommand({
      TableName: USERS_TABLE,
      Key: marshall({ email }),
    });

    const userResponse = await dynamoDb.send(getUserCommand);

    if (!userResponse.Item) {
      logger.warn('User not found', { email });
      throw new AuthenticationError('User not found');
    }

    const user = unmarshall(userResponse.Item) as User;

    // Generate new token
    const newToken = jwt.sign(
      {
        user_id: user.user_id,
        email: user.email,
        tenant_id: user.tenant_id,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: `${JWT_EXPIRATION_MINUTES}m` }
    );

    // Encrypt and store new session token
    const { encryptData } = await import('/opt/nodejs/encryption');
    const encryptedToken = encryptData(newToken);
    const sessionExpiresAt = new Date(Date.now() + JWT_EXPIRATION_MINUTES * 60 * 1000).toISOString();

    const updateUserCommand = new UpdateItemCommand({
      TableName: USERS_TABLE,
      Key: marshall({ email }),
      UpdateExpression: 'SET session_token = :token, session_expires_at = :expires',
      ExpressionAttributeValues: marshall({
        ':token': encryptedToken,
        ':expires': sessionExpiresAt,
      }),
    });

    await dynamoDb.send(updateUserCommand);

    logger.info('Token refreshed successfully', { email });
    return newToken;
  } catch (error) {
    logger.error('Token refresh error', error);
    throw error;
  }
};

/**
 * Invalidates session by clearing session token
 */
export const invalidateSession = async (email: string): Promise<void> => {
  try {
    logger.info('Invalidating session', { email });

    const updateUserCommand = new UpdateItemCommand({
      TableName: USERS_TABLE,
      Key: marshall({ email }),
      UpdateExpression: 'SET session_token = :null, session_expires_at = :null',
      ExpressionAttributeValues: marshall({
        ':null': null,
      }),
    });

    await dynamoDb.send(updateUserCommand);

    logger.info('Session invalidated successfully', { email });
  } catch (error) {
    logger.error('Session invalidation error', error);
    throw error;
  }
};

/**
 * Checks if token is about to expire (within 5 minutes)
 */
export const isTokenExpiringSoon = (expiresAt: number): boolean => {
  const now = Math.floor(Date.now() / 1000);
  const timeUntilExpiry = expiresAt - now;
  const fiveMinutesInSeconds = 5 * 60;

  return timeUntilExpiry <= fiveMinutesInSeconds && timeUntilExpiry > 0;
};

/**
 * Gets remaining time until token expiration in seconds
 */
export const getTokenTimeRemaining = (expiresAt: number): number => {
  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, expiresAt - now);
};

/**
 * API Gateway authorizer for validating tokens
 * Returns policy document for API Gateway
 */
export const authorizer = async (event: any): Promise<any> => {
  try {
    logger.info('Authorizer invoked', { methodArn: event.methodArn });

    const token = extractToken(event.authorizationToken);
    const sessionContext = await validateToken(token);

    // Validate session in database
    const isSessionValid = await validateSession(sessionContext.email, token);
    if (!isSessionValid) {
      logger.warn('Session validation failed', { email: sessionContext.email });
      throw new AuthenticationError('Session is invalid or expired');
    }

    logger.info('Authorization successful', { user_id: sessionContext.user_id });

    // Return allow policy
    return {
      principalId: sessionContext.user_id,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: event.methodArn,
          },
        ],
      },
      context: {
        user_id: sessionContext.user_id,
        email: sessionContext.email,
        tenant_id: sessionContext.tenant_id,
        role: sessionContext.role,
      },
    };
  } catch (error) {
    logger.error('Authorization failed', error);

    // Return deny policy
    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: event.methodArn,
          },
        ],
      },
    };
  }
};
