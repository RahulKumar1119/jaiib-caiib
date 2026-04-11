/**
 * Authentication Lambda Handler
 * Handles user login, logout, and password reset operations
 * Implements JWT token generation and session management
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { DynamoDBClient, GetItemCommand, UpdateItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import {
  validateEmail,
  validatePassword,
  validateUUID,
} from '/opt/nodejs/validation';
import {
  encryptData,
  decryptData,
  hashPassword,
  verifyPassword,
} from '/opt/nodejs/encryption';
import {
  AuthenticationError,
  ValidationError,
  DatabaseError,
  formatErrorResponse,
} from '/opt/nodejs/error-handling';
import { Logger } from '/opt/nodejs/logging';
import {
  USERS_TABLE,
  JWT_SECRET,
  JWT_EXPIRATION_MINUTES,
  BCRYPT_SALT_ROUNDS,
  HTTP_STATUS,
} from '/opt/nodejs/constants';
import { User, AuthResponse } from '/opt/nodejs/types';

const dynamoDb = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const logger = new Logger({ functionName: 'AuthenticationHandler' });

/**
 * POST /auth/login - User login endpoint
 * Validates email and password, generates JWT token
 */
export const login = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    logger.info('Login request received', { path: event.path });

    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { email, password } = body;

    // Validate input
    if (!email || !validateEmail(email)) {
      logger.warn('Invalid email format', { email });
      throw new ValidationError('Invalid email format');
    }

    if (!password || typeof password !== 'string' || password.length === 0) {
      logger.warn('Password is required', { email });
      throw new ValidationError('Password is required');
    }

    // Get user from database
    const getUserCommand = new GetItemCommand({
      TableName: USERS_TABLE,
      Key: marshall({ email }),
    });

    const userResponse = await dynamoDb.send(getUserCommand);

    if (!userResponse.Item) {
      logger.warn('User not found', { email });
      throw new AuthenticationError('Invalid email or password');
    }

    const user = unmarshall(userResponse.Item) as User;

    // Verify password
    const passwordMatch = await verifyPassword(password, user.password_hash);

    if (!passwordMatch) {
      logger.warn('Invalid password', { email });
      throw new AuthenticationError('Invalid email or password');
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        user_id: user.user_id,
        email: user.email,
        tenant_id: user.tenant_id,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: `${JWT_EXPIRATION_MINUTES}m` }
    );

    // Encrypt and store session token
    const encryptedToken = encryptData(token);
    const sessionExpiresAt = new Date(Date.now() + JWT_EXPIRATION_MINUTES * 60 * 1000).toISOString();

    const updateUserCommand = new UpdateItemCommand({
      TableName: USERS_TABLE,
      Key: marshall({ email }),
      UpdateExpression: 'SET session_token = :token, session_expires_at = :expires, last_login = :now',
      ExpressionAttributeValues: marshall({
        ':token': encryptedToken,
        ':expires': sessionExpiresAt,
        ':now': new Date().toISOString(),
      }),
    });

    await dynamoDb.send(updateUserCommand);

    logger.info('User logged in successfully', { user_id: user.user_id, email });

    const response: AuthResponse = {
      success: true,
      token,
      user: {
        user_id: user.user_id,
        email: user.email,
        full_name: user.full_name,
        tenant_id: user.tenant_id,
        role: user.role,
      },
      expiresIn: JWT_EXPIRATION_MINUTES * 60, // in seconds
    };

    return {
      statusCode: HTTP_STATUS.OK,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
      },
      body: JSON.stringify(response),
    };
  } catch (error) {
    logger.error('Login error', error);
    return formatErrorResponse(error);
  }
};

/**
 * POST /auth/register - User registration endpoint
 * Creates new user account with email and password
 */
export const register = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    logger.info('Registration request received', { path: event.path });

    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { email, password, confirmPassword, full_name } = body;

    // Validate input
    if (!email || !validateEmail(email)) {
      logger.warn('Invalid email format', { email });
      throw new ValidationError('Invalid email format');
    }

    if (!password || !validatePassword(password)) {
      logger.warn('Invalid password format', { email });
      throw new ValidationError(
        'Password must be at least 8 characters and contain uppercase, lowercase, and numeric characters'
      );
    }

    if (password !== confirmPassword) {
      logger.warn('Passwords do not match', { email });
      throw new ValidationError('Passwords do not match');
    }

    if (!full_name || typeof full_name !== 'string' || full_name.trim().length === 0) {
      logger.warn('Full name is required', { email });
      throw new ValidationError('Full name is required');
    }

    // Check if user already exists
    const getUserCommand = new GetItemCommand({
      TableName: USERS_TABLE,
      Key: marshall({ email }),
    });

    const userResponse = await dynamoDb.send(getUserCommand);

    if (userResponse.Item) {
      logger.warn('User already exists', { email });
      throw new ValidationError('Email already registered');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate user ID
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create new user
    const newUser: User = {
      user_id: userId,
      email,
      password_hash: passwordHash,
      full_name: full_name.trim(),
      tenant_id: 'default', // Default tenant for now
      role: 'officer', // Default role
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      session_token: null,
      session_expires_at: null,
      reset_token: null,
      reset_token_expires_at: null,
      last_login: null,
    };

    const putUserCommand = new PutItemCommand({
      TableName: USERS_TABLE,
      Item: marshall(newUser),
    });

    await dynamoDb.send(putUserCommand);

    logger.info('User registered successfully', { user_id: userId, email });

    return {
      statusCode: HTTP_STATUS.CREATED,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
      },
      body: JSON.stringify({
        success: true,
        message: 'User registered successfully',
        user: {
          user_id: userId,
          email,
          full_name,
        },
      }),
    };
  } catch (error) {
    logger.error('Registration error', error);
    return formatErrorResponse(error);
  }
};

/**
 * POST /auth/logout - User logout endpoint
 * Invalidates session token
 */
export const logout = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    logger.info('Logout request received', { path: event.path });

    // Extract user from JWT token (set by API Gateway authorizer)
    const authHeader = event.headers.Authorization || event.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Missing or invalid authorization header');
      throw new AuthenticationError('Missing authorization header');
    }

    const token = authHeader.substring(7);

    // Verify and decode token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const { email } = decoded;

    // Clear session token
    const updateUserCommand = new UpdateItemCommand({
      TableName: USERS_TABLE,
      Key: marshall({ email }),
      UpdateExpression: 'SET session_token = :null, session_expires_at = :null',
      ExpressionAttributeValues: marshall({
        ':null': null,
      }),
    });

    await dynamoDb.send(updateUserCommand);

    logger.info('User logged out successfully', { user_id: decoded.user_id, email });

    return {
      statusCode: HTTP_STATUS.OK,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
      },
      body: JSON.stringify({
        success: true,
        message: 'Logged out successfully',
      }),
    };
  } catch (error) {
    logger.error('Logout error', error);
    return formatErrorResponse(error);
  }
};

/**
 * POST /auth/reset-password - Request password reset
 * Generates single-use reset token with 24-hour expiration
 */
export const requestPasswordReset = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    logger.info('Password reset request received', { path: event.path });

    const body = JSON.parse(event.body || '{}');
    const { email } = body;

    // Validate email
    if (!email || !validateEmail(email)) {
      logger.warn('Invalid email format', { email });
      throw new ValidationError('Invalid email format');
    }

    // Get user from database
    const getUserCommand = new GetItemCommand({
      TableName: USERS_TABLE,
      Key: marshall({ email }),
    });

    const userResponse = await dynamoDb.send(getUserCommand);

    if (!userResponse.Item) {
      // Don't reveal if user exists
      logger.info('Password reset requested for non-existent user', { email });
      return {
        statusCode: HTTP_STATUS.OK,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff',
        },
        body: JSON.stringify({
          success: true,
          message: 'If the email exists, a password reset link has been sent',
        }),
      };
    }

    const user = unmarshall(userResponse.Item) as User;

    // Generate reset token (valid for 24 hours)
    const resetToken = jwt.sign(
      {
        user_id: user.user_id,
        email: user.email,
        type: 'password_reset',
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Encrypt and store reset token
    const encryptedResetToken = encryptData(resetToken);
    const resetTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const updateUserCommand = new UpdateItemCommand({
      TableName: USERS_TABLE,
      Key: marshall({ email }),
      UpdateExpression: 'SET reset_token = :token, reset_token_expires_at = :expires',
      ExpressionAttributeValues: marshall({
        ':token': encryptedResetToken,
        ':expires': resetTokenExpiresAt,
      }),
    });

    await dynamoDb.send(updateUserCommand);

    logger.info('Password reset token generated', { user_id: user.user_id, email });

    // In production, send email with reset link
    // For now, return the token (should be sent via email in production)
    return {
      statusCode: HTTP_STATUS.OK,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
      },
      body: JSON.stringify({
        success: true,
        message: 'If the email exists, a password reset link has been sent',
        // In production, don't return the token
        // token: resetToken,
      }),
    };
  } catch (error) {
    logger.error('Password reset request error', error);
    return formatErrorResponse(error);
  }
};

/**
 * POST /auth/verify-reset-token - Verify password reset token
 * Validates reset token and allows password change
 */
export const verifyResetToken = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    logger.info('Reset token verification request received', { path: event.path });

    const body = JSON.parse(event.body || '{}');
    const { token, newPassword, confirmPassword } = body;

    // Validate input
    if (!token || typeof token !== 'string') {
      logger.warn('Invalid reset token');
      throw new ValidationError('Invalid reset token');
    }

    if (!newPassword || !validatePassword(newPassword)) {
      logger.warn('Invalid password format');
      throw new ValidationError(
        'Password must be at least 8 characters and contain uppercase, lowercase, and numeric characters'
      );
    }

    if (newPassword !== confirmPassword) {
      logger.warn('Passwords do not match');
      throw new ValidationError('Passwords do not match');
    }

    // Verify reset token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as any;
    } catch (error) {
      logger.warn('Invalid or expired reset token');
      throw new AuthenticationError('Invalid or expired reset token');
    }

    if (decoded.type !== 'password_reset') {
      logger.warn('Invalid token type');
      throw new AuthenticationError('Invalid token');
    }

    const { email } = decoded;

    // Get user and verify reset token matches
    const getUserCommand = new GetItemCommand({
      TableName: USERS_TABLE,
      Key: marshall({ email }),
    });

    const userResponse = await dynamoDb.send(getUserCommand);

    if (!userResponse.Item) {
      logger.warn('User not found', { email });
      throw new AuthenticationError('Invalid reset token');
    }

    const user = unmarshall(userResponse.Item) as User;

    // Verify stored reset token matches
    if (!user.reset_token) {
      logger.warn('No reset token found for user', { email });
      throw new AuthenticationError('Invalid reset token');
    }

    const decryptedStoredToken = decryptData(user.reset_token);
    if (decryptedStoredToken !== token) {
      logger.warn('Reset token mismatch', { email });
      throw new AuthenticationError('Invalid reset token');
    }

    // Check token expiration
    if (!user.reset_token_expires_at || new Date(user.reset_token_expires_at) < new Date()) {
      logger.warn('Reset token expired', { email });
      throw new AuthenticationError('Reset token has expired');
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update user password and clear reset token
    const updateUserCommand = new UpdateItemCommand({
      TableName: USERS_TABLE,
      Key: marshall({ email }),
      UpdateExpression: 'SET password_hash = :hash, reset_token = :null, reset_token_expires_at = :null',
      ExpressionAttributeValues: marshall({
        ':hash': passwordHash,
        ':null': null,
      }),
    });

    await dynamoDb.send(updateUserCommand);

    logger.info('Password reset successfully', { user_id: user.user_id, email });

    return {
      statusCode: HTTP_STATUS.OK,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
      },
      body: JSON.stringify({
        success: true,
        message: 'Password reset successfully',
      }),
    };
  } catch (error) {
    logger.error('Password reset verification error', error);
    return formatErrorResponse(error);
  }
};

/**
 * Main handler - routes requests to appropriate function
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const path = event.path || '';
  const method = event.httpMethod || 'GET';

  logger.info('Authentication handler invoked', { path, method });

  if (path === '/auth/register' && method === 'POST') {
    return register(event);
  } else if (path === '/auth/login' && method === 'POST') {
    return login(event);
  } else if (path === '/auth/logout' && method === 'POST') {
    return logout(event);
  } else if (path === '/auth/reset-password' && method === 'POST') {
    return requestPasswordReset(event);
  } else if (path === '/auth/verify-reset-token' && method === 'POST') {
    return verifyResetToken(event);
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
