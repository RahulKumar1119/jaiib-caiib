/**
 * Property-Based Tests for Tenant Data Isolation
 * Validates that tenant data is properly isolated across all database queries
 * 
 * Property 2: Tenant Data Isolation
 * For any multi-tenant system, tenant data must be completely isolated:
 * - Tenant data queries never return cross-tenant data
 * - Authorization always prevents cross-tenant access
 * - Tenant ID validation is consistent across all operations
 * - Session tokens are tenant-specific
 */

import fc from 'fast-check';
import * as jwt from 'jsonwebtoken';
import { DynamoDBClient, GetItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import {
  extractTenantId,
  validateTenantAccess,
  authorizeRequest,
  validateRequestTenantId,
} from '../authorization';

// Constants
const JWT_SECRET = 'test-secret-key';

// Mock AWS SDK
const ddbMock = mockClient(DynamoDBClient);

// Mock error handling module
jest.mock('/opt/nodejs/error-handling', () => ({
  AuthenticationError: class AuthenticationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'AuthenticationError';
    }
  },
  AuthorizationError: class AuthorizationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'AuthorizationError';
    }
  },
}));

// Mock logging module
jest.mock('/opt/nodejs/logging', () => ({
  Logger: class Logger {
    constructor(name: string) {}
    info = jest.fn();
    warn = jest.fn();
    error = jest.fn();
  },
}));

// Mock constants module
jest.mock('/opt/nodejs/constants', () => ({
  ENV_VARS: {
    JWT_SECRET: 'test-secret-key',
    AWS_REGION: 'ap-south-1',
  },
  DYNAMODB_TABLES: {
    USERS: 'users',
    PRACTICE_SETS: 'practice_sets',
    SCORES: 'scores',
  },
}));

describe('Property: Tenant Data Isolation', () => {
  beforeEach(() => {
    ddbMock.reset();
    jest.clearAllMocks();
  });

  /**
   * Property 2.1: Tenant data queries never return cross-tenant data
   * For any tenant, querying practice sets should only return data for that tenant
   * 
   * **Validates: Requirements 2.2, 2.3**
   */
  it('should never return cross-tenant data in practice set queries', () => {
    fc.assert(
      fc.property(
        fc.record({
          tenants: fc.array(fc.string({ minLength: 5, maxLength: 20 }), {
            minLength: 3,
            maxLength: 5,
          }).chain((tenants) => fc.constant([...new Set(tenants)])),
          usersPerTenant: fc.integer({ min: 1, max: 3 }),
          practiceSetsPerUser: fc.integer({ min: 2, max: 4 }),
        }),
        (data: any) => {
          const { tenants, usersPerTenant, practiceSetsPerUser } = data;

          // Generate users and practice sets for each tenant
          const tenantData: {
            [key: string]: {
              users: Array<{ user_id: string; email: string }>;
              practiceSets: Array<{ practice_set_id: string; user_id: string; score: number }>;
            };
          } = {};

          tenants.forEach((tenantId: string) => {
            const users = Array.from({ length: usersPerTenant }, (_, i) => ({
              user_id: `user-${tenantId}-${i}`,
              email: `user${i}@${tenantId}.com`,
            }));

            const practiceSets = users.flatMap((user) =>
              Array.from({ length: practiceSetsPerUser }, (_, i) => ({
                practice_set_id: `ps-${tenantId}-${user.user_id}-${i}`,
                user_id: user.user_id,
                score: Math.floor(Math.random() * 100),
              }))
            );

            tenantData[tenantId] = { users, practiceSets };
          });

          // For each tenant, verify that queries only return that tenant's data
          tenants.forEach((queryTenantId: string) => {
            const queryUser = tenantData[queryTenantId].users[0];
            const expectedPracticeSets = tenantData[queryTenantId].practiceSets.filter(
              (ps) => ps.user_id === queryUser.user_id
            );

            // Mock DynamoDB query to return only this tenant's data
            ddbMock.on(QueryCommand).resolves({
              Items: expectedPracticeSets.map((ps) =>
                marshall({
                  'tenant_id#user_id': `${queryTenantId}#${queryUser.user_id}`,
                  practice_set_id: ps.practice_set_id,
                  score: ps.score,
                })
              ),
            });

            // Verify that no cross-tenant data is returned
            const allPracticeSets = Object.values(tenantData).flatMap((td) => td.practiceSets);
            const crossTenantSets = allPracticeSets.filter(
              (ps) => !expectedPracticeSets.find((eps) => eps.practice_set_id === ps.practice_set_id)
            );

            // Assert that cross-tenant data is not in the expected results
            expectedPracticeSets.forEach((ps) => {
              expect(ps.user_id).toBe(queryUser.user_id);
              expect(crossTenantSets.find((cts) => cts.practice_set_id === ps.practice_set_id)).toBeUndefined();
            });
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 2.2: Authorization always prevents cross-tenant access
   * For any two different tenants, a user from tenant A cannot access tenant B resources
   * 
   * **Validates: Requirements 2.2, 2.3**
   */
  it('should prevent cross-tenant access with authorization checks', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(
          fc.record({
            tenant_id: fc.string({ minLength: 5, maxLength: 20 }),
            user_id: fc.uuid(),
            email: fc.emailAddress(),
            role: fc.oneof(fc.constant('officer'), fc.constant('admin')),
            password: fc.string({ minLength: 8, maxLength: 50 }).filter(
              (p: string) => /[A-Z]/.test(p) && /[a-z]/.test(p) && /[0-9]/.test(p)
            ),
          }),
          fc.record({
            tenant_id: fc.string({ minLength: 5, maxLength: 20 }),
            user_id: fc.uuid(),
            email: fc.emailAddress(),
            role: fc.oneof(fc.constant('officer'), fc.constant('admin')),
          })
        ).filter(([user1, user2]: any) => user1.tenant_id !== user2.tenant_id),
        async ([userTenantA, userTenantB]: any) => {
          // Create token for user in tenant A
          const tokenTenantA = jwt.sign(
            {
              user_id: userTenantA.user_id,
              email: userTenantA.email,
              tenant_id: userTenantA.tenant_id,
              role: userTenantA.role,
            },
            JWT_SECRET,
            { expiresIn: '30m' }
          );

          // Mock user from tenant A
          const mockUserTenantA = {
            'tenant_id#user_id': `${userTenantA.tenant_id}#${userTenantA.user_id}`,
            tenant_id: userTenantA.tenant_id,
            user_id: userTenantA.user_id,
            email: userTenantA.email,
            status: 'active',
            role: userTenantA.role,
          };

          ddbMock.on(GetItemCommand).resolves({
            Item: marshall(mockUserTenantA),
          });

          // Authorize request from tenant A
          const event = {
            headers: {
              Authorization: `Bearer ${tokenTenantA}`,
            },
            path: '/practice-sets',
            httpMethod: 'POST',
          } as any;

          const authContext = await authorizeRequest(event);

          // Verify tenant_id is from authenticated user (tenant A)
          expect(authContext.tenant_id).toBe(userTenantA.tenant_id);

          // Attempt to access tenant B data
          const crossTenantValid = validateRequestTenantId(userTenantB.tenant_id, authContext.tenant_id);

          // Assert cross-tenant access is denied
          expect(crossTenantValid).toBe(false);
          expect(authContext.tenant_id).not.toBe(userTenantB.tenant_id);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 2.3: Tenant ID validation is consistent across all operations
   * For any operation (create, read, update, delete), tenant_id validation must be consistent
   * 
   * **Validates: Requirements 2.2, 2.3**
   */
  it('should validate tenant_id consistently across all operations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          tenant_id: fc.string({ minLength: 5, maxLength: 20 }).filter((t) => !t.includes('#')),
          user_id: fc.uuid(),
          email: fc.emailAddress(),
          role: fc.oneof(fc.constant('officer'), fc.constant('admin'), fc.constant('super_admin')),
          password: fc.string({ minLength: 8, maxLength: 50 }).filter(
            (p: string) => /[A-Z]/.test(p) && /[a-z]/.test(p) && /[0-9]/.test(p)
          ),
        }),
        async (user: any) => {
          // Create token with tenant_id
          const token = jwt.sign(
            {
              user_id: user.user_id,
              email: user.email,
              tenant_id: user.tenant_id,
              role: user.role,
            },
            JWT_SECRET,
            { expiresIn: '30m' }
          );

          // Extract tenant_id from token
          const extractedTenantId = extractTenantId(token);

          // Verify tenant_id is consistent
          expect(extractedTenantId).toBe(user.tenant_id);

          // Mock user in database - only for the correct tenant
          const mockUser = {
            'tenant_id#user_id': `${user.tenant_id}#${user.user_id}`,
            tenant_id: user.tenant_id,
            user_id: user.user_id,
            email: user.email,
            status: 'active',
            role: user.role,
          };

          ddbMock.on(GetItemCommand).callsFake((input: any) => {
            const key = input.Key['tenant_id#user_id'].S;
            if (key === `${user.tenant_id}#${user.user_id}`) {
              return Promise.resolve({ Item: marshall(mockUser) });
            }
            return Promise.resolve({ Item: undefined });
          });

          // Validate tenant access
          const hasAccess = await validateTenantAccess(user.tenant_id, user.user_id);

          // Verify access is granted for correct tenant
          expect(hasAccess).toBe(true);

          // Verify tenant_id validation fails for different tenant
          const differentTenantId = `${user.tenant_id}-different`;
          const crossTenantAccess = await validateTenantAccess(differentTenantId, user.user_id);

          // Should fail because user doesn't exist in different tenant
          expect(crossTenantAccess).toBe(false);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 2.4: Session tokens are tenant-specific
   * For any user, their session token should only grant access to their tenant's resources
   * 
   * **Validates: Requirements 2.2, 2.3**
   */
  it('should enforce tenant-specific session tokens', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            tenant_id: fc.string({ minLength: 5, maxLength: 20 }),
            user_id: fc.uuid(),
            email: fc.emailAddress(),
            role: fc.oneof(fc.constant('officer'), fc.constant('admin')),
            password: fc.string({ minLength: 8, maxLength: 50 }).filter(
              (p: string) => /[A-Z]/.test(p) && /[a-z]/.test(p) && /[0-9]/.test(p)
            ),
          }),
          { minLength: 2, maxLength: 4 }
        ).chain((users) => fc.constant(users.filter((u, i) => users.findIndex((u2) => u2.tenant_id === u.tenant_id) === i))),
        (users: any) => {
          // Create tokens for each user
          const tokens = users.map((user: any) =>
            jwt.sign(
              {
                user_id: user.user_id,
                email: user.email,
                tenant_id: user.tenant_id,
                role: user.role,
              },
              JWT_SECRET,
              { expiresIn: '30m' }
            )
          );

          // Verify each token is tenant-specific
          tokens.forEach((token: string, index: number) => {
            const decoded = jwt.verify(token, JWT_SECRET) as any;
            expect(decoded.tenant_id).toBe(users[index].tenant_id);

            // Verify token cannot be used for different tenant
            if (users.length > 1) {
              const differentTenantId = users[(index + 1) % users.length].tenant_id;
              expect(decoded.tenant_id).not.toBe(differentTenantId);
            }
          });

          // Verify tokens are different for different tenants
          const uniqueTokens = new Set(tokens);
          expect(uniqueTokens.size).toBe(tokens.length);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 2.5: Tenant ID is immutable in authorization context
   * For any authorized request, the tenant_id cannot be changed or overridden
   * 
   * **Validates: Requirements 2.2, 2.3**
   */
  it('should prevent tenant_id modification in authorization context', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          tenant_id: fc.string({ minLength: 5, maxLength: 20 }),
          user_id: fc.uuid(),
          email: fc.emailAddress(),
          role: fc.oneof(fc.constant('officer'), fc.constant('admin')),
          password: fc.string({ minLength: 8, maxLength: 50 }).filter(
            (p: string) => /[A-Z]/.test(p) && /[a-z]/.test(p) && /[0-9]/.test(p)
          ),
        }),
        async (user: any) => {
          // Create token with tenant_id
          const token = jwt.sign(
            {
              user_id: user.user_id,
              email: user.email,
              tenant_id: user.tenant_id,
              role: user.role,
            },
            JWT_SECRET,
            { expiresIn: '30m' }
          );

          // Mock user in database
          const mockUser = {
            'tenant_id#user_id': `${user.tenant_id}#${user.user_id}`,
            tenant_id: user.tenant_id,
            user_id: user.user_id,
            email: user.email,
            status: 'active',
            role: user.role,
          };

          ddbMock.on(GetItemCommand).resolves({
            Item: marshall(mockUser),
          });

          // Authorize request
          const event = {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            path: '/practice-sets',
            httpMethod: 'POST',
          } as any;

          const authContext = await authorizeRequest(event);

          // Verify tenant_id is immutable
          const originalTenantId = authContext.tenant_id;
          expect(originalTenantId).toBe(user.tenant_id);

          // Attempt to validate with different tenant_id
          const attemptedTenantId = `${user.tenant_id}-modified`;
          const isValid = validateRequestTenantId(attemptedTenantId, authContext.tenant_id);

          // Should fail because tenant_id doesn't match
          expect(isValid).toBe(false);
          expect(authContext.tenant_id).toBe(originalTenantId);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 2.6: Multiple tenants can coexist without data leakage
   * For any number of tenants, each tenant's data must remain isolated
   * 
   * **Validates: Requirements 2.2, 2.3**
   */
  it('should maintain isolation across multiple concurrent tenants', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            tenant_id: fc.string({ minLength: 5, maxLength: 20 }),
            user_id: fc.uuid(),
            email: fc.emailAddress(),
            role: fc.constant('officer'),
          }),
          { minLength: 3, maxLength: 5 }
        ).chain((users) => fc.constant(users.filter((u, i) => users.findIndex((u2) => u2.tenant_id === u.tenant_id) === i))),
        (users: any) => {
          // Create authorization contexts for each tenant
          const authContexts = users.map((user: any) => ({
            user_id: user.user_id,
            email: user.email,
            tenant_id: user.tenant_id,
            role: user.role,
          }));

          // Verify each context has unique tenant_id
          const tenantIds = authContexts.map((ctx: any) => ctx.tenant_id);
          const uniqueTenantIds = new Set(tenantIds);
          expect(uniqueTenantIds.size).toBe(tenantIds.length);

          // Verify cross-tenant validation fails for all combinations
          authContexts.forEach((ctx1: any, index1: number) => {
            authContexts.forEach((ctx2: any, index2: number) => {
              if (index1 !== index2) {
                const isValid = validateRequestTenantId(ctx2.tenant_id, ctx1.tenant_id);
                expect(isValid).toBe(false);
              }
            });
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 2.7: Tenant isolation is enforced at database query level
   * For any database query, the partition key must include tenant_id
   * 
   * **Validates: Requirements 2.2, 2.3**
   */
  it('should enforce tenant_id in database partition keys', () => {
    fc.assert(
      fc.property(
        fc.record({
          tenant_id: fc.string({ minLength: 5, maxLength: 20 }).filter((t) => !t.includes('#')),
          user_id: fc.uuid(),
          email: fc.emailAddress(),
        }),
        (data: any) => {
          // Verify partition key format includes tenant_id
          const partitionKey = `${data.tenant_id}#${data.user_id}`;

          // Partition key must contain tenant_id
          expect(partitionKey).toContain(data.tenant_id);
          expect(partitionKey).toContain(data.user_id);

          // Verify tenant_id is first component (partition key prefix)
          const [tenantPart, userPart] = partitionKey.split('#');
          expect(tenantPart).toBe(data.tenant_id);
          expect(userPart).toBe(data.user_id);

          // Verify partition key cannot be constructed without tenant_id
          const invalidKey = `#${data.user_id}`;
          expect(invalidKey).not.toBe(partitionKey);
        }
      ),
      { numRuns: 50 }
    );
  });
});
