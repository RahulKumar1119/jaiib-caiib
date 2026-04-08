/**
 * Multi-tenant Authorization Middleware
 * Handles tenant_id extraction, role-based access control, and cross-tenant access prevention
 */

import { APIGatewayProxyEvent } from 'aws-lambda';
import * as jwt from 'jsonwebtoken';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { AuthenticationError, AuthorizationError } from '/opt/nodejs/error-handling';
import { Logger } from '/opt/nodejs/logging';
import { ENV_VARS, DYNAMODB_TABLES } from '/opt/nodejs/constants';
import { User } from '/opt/nodejs/types';

const dynamoDb = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const logger = new Logger({ name: 'AuthorizationMiddleware' });

export type UserRole = 'officer' | 'admin' | 'super_admin';

export interface AuthorizationContext {
  user_id: string;
  email: string;
  tenant_id: string;
  role: UserRole;
  token: string;
}

export interface RolePermissions {
  [key: string]: UserRole[];
}

// Define role-based permissions
const ROLE_PERMISSIONS: RolePermissions = {
  'practice:create': ['officer', 'admin', 'super_admin'],
  'practice:read': ['officer', 'admin', 'super_admin'],
  'practice:submit': ['officer', 'admin', 'super_admin'],
  'questions:read': ['officer', 'admin', 'super_admin'],
  'questions:create': ['admin', 'super_admin'],
  'questions:update': ['admin', 'super_admin'],
  'questions:delete': ['admin', 'super_admin'],
  'analytics:read': ['admin', 'super_admin'],
  'users:manage': ['super_admin'],
  'audit:read': ['admin', 'super_admin'],
};

/**
 * Extracts tenant_id from JWT token
 * @param token JWT token string
 * @returns tenant_id from token payload
 * @throws AuthenticationError if token is invalid or missing tenant_id
 */
export const extractTenantId = (token: string): string => {
  try {
    logger.info('Extracting tenant_id from token');

    const decoded = jwt.verify(token, ENV_VARS.JWT_SECRET) as any;

    if (!decoded.tenant_id) {
      logger.warn('tenant_id not found in token');
      throw new AuthenticationError('tenant_id not found in token');
    }

    logger.info('tenant_id extracted successfully', { tenant_id: decoded.tenant_id });
    return decoded.tenant_id;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid token', { error: error.message });
      throw new AuthenticationError('Invalid token');
    }
    throw error;
  }
};

/**
 * Validates that user has access to the specified tenant
 * @param tenantId Tenant ID to validate access for
 * @param userId User ID to check
 * @returns true if user has access to tenant, false otherwise
 */
export const validateTenantAccess = async (tenantId: string, userId: string): Promise<boolean> => {
  try {
    logger.info('Validating tenant access', { tenant_id: tenantId, user_id: userId });

    // Query user by tenant_id#user_id composite key
    const getUserCommand = new GetItemCommand({
      TableName: DYNAMODB_TABLES.USERS,
      Key: marshall({ 'tenant_id#user_id': `${tenantId}#${userId}` }),
    });

    const userResponse = await dynamoDb.send(getUserCommand);

    if (!userResponse.Item) {
      logger.warn('User not found in tenant', { tenant_id: tenantId, user_id: userId });
      return false;
    }

    const user = unmarshall(userResponse.Item) as User;

    // Verify user status is active
    if (user.status !== 'active') {
      logger.warn('User is not active', { user_id: userId, status: user.status });
      return false;
    }

    logger.info('Tenant access validated', { tenant_id: tenantId, user_id: userId });
    return true;
  } catch (error) {
    logger.error('Tenant access validation error', error);
    return false;
  }
};

/**
 * Checks if user role has permission for the specified action
 * @param role User role
 * @param requiredRole Minimum required role for the action
 * @returns true if user role has permission, false otherwise
 */
export const checkRolePermission = (role: UserRole, requiredRole: UserRole): boolean => {
  logger.info('Checking role permission', { role, required_role: requiredRole });

  const roleHierarchy: { [key in UserRole]: number } = {
    officer: 1,
    admin: 2,
    super_admin: 3,
  };

  const hasPermission = roleHierarchy[role] >= roleHierarchy[requiredRole];

  logger.info('Role permission check result', { role, required_role: requiredRole, has_permission: hasPermission });
  return hasPermission;
};

/**
 * Checks if user has permission for a specific action
 * @param role User role
 * @param action Action to check permission for
 * @returns true if user has permission for action, false otherwise
 */
export const hasActionPermission = (role: UserRole, action: string): boolean => {
  logger.info('Checking action permission', { role, action });

  const allowedRoles = ROLE_PERMISSIONS[action];

  if (!allowedRoles) {
    logger.warn('Unknown action', { action });
    return false;
  }

  const hasPermission = allowedRoles.includes(role);

  logger.info('Action permission check result', { role, action, has_permission: hasPermission });
  return hasPermission;
};

/**
 * Authorizes a request by validating token, tenant access, and role permissions
 * @param event API Gateway event
 * @param requiredRole Minimum required role for the action (optional)
 * @returns AuthorizationContext if authorized
 * @throws AuthenticationError or AuthorizationError if not authorized
 */
export const authorizeRequest = async (
  event: APIGatewayProxyEvent,
  requiredRole?: UserRole
): Promise<AuthorizationContext> => {
  try {
    logger.info('Authorizing request', { path: event.path, method: event.httpMethod });

    // Extract token from Authorization header
    const authHeader = event.headers['Authorization'] || event.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Missing or invalid authorization header');
      throw new AuthenticationError('Missing authorization header');
    }

    const token = authHeader.substring(7);

    // Verify and decode token
    const decoded = jwt.verify(token, ENV_VARS.JWT_SECRET) as any;

    if (!decoded.user_id || !decoded.tenant_id || !decoded.role) {
      logger.warn('Invalid token payload');
      throw new AuthenticationError('Invalid token payload');
    }

    // Validate tenant access
    const hasAccess = await validateTenantAccess(decoded.tenant_id, decoded.user_id);

    if (!hasAccess) {
      logger.warn('Tenant access denied', { tenant_id: decoded.tenant_id, user_id: decoded.user_id });
      throw new AuthorizationError('Access denied: Cross-tenant access not allowed');
    }

    // Check role permission if required
    if (requiredRole && !checkRolePermission(decoded.role, requiredRole)) {
      logger.warn('Insufficient permissions', { role: decoded.role, required_role: requiredRole });
      throw new AuthorizationError('Insufficient permissions for this action');
    }

    logger.info('Request authorized successfully', {
      user_id: decoded.user_id,
      tenant_id: decoded.tenant_id,
      role: decoded.role,
    });

    return {
      user_id: decoded.user_id,
      email: decoded.email,
      tenant_id: decoded.tenant_id,
      role: decoded.role,
      token,
    };
  } catch (error) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      throw error;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid token', { error: error.message });
      throw new AuthenticationError('Invalid token');
    }

    logger.error('Authorization error', error);
    throw new AuthenticationError('Authorization failed');
  }
};

/**
 * Validates that the requested tenant_id matches the authenticated user's tenant_id
 * Used to prevent cross-tenant data access in query parameters
 * @param requestedTenantId Tenant ID from request (query param or path)
 * @param authenticatedTenantId Tenant ID from authenticated user
 * @returns true if tenant IDs match, false otherwise
 */
export const validateRequestTenantId = (requestedTenantId: string, authenticatedTenantId: string): boolean => {
  logger.info('Validating request tenant_id', {
    requested_tenant_id: requestedTenantId,
    authenticated_tenant_id: authenticatedTenantId,
  });

  const isValid = requestedTenantId === authenticatedTenantId;

  if (!isValid) {
    logger.warn('Tenant ID mismatch', {
      requested_tenant_id: requestedTenantId,
      authenticated_tenant_id: authenticatedTenantId,
    });
  }

  return isValid;
};
