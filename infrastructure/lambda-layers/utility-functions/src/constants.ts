/**
 * Shared constants for JAIIB-CAIIB Exam Prep Portal
 */

// JAIIB Papers
export const JAIIB_PAPERS = {
  IE_IFS: 'JAIIB_IE_IFS',
  PPB: 'JAIIB_PPB',
  AFB: 'JAIIB_AFB',
  RBWM: 'JAIIB_RBWM',
} as const;

export const PAPER_NAMES: Record<string, string> = {
  [JAIIB_PAPERS.IE_IFS]: 'Indian Economy & Indian Financial System',
  [JAIIB_PAPERS.PPB]: 'Principles and Practices of Banking',
  [JAIIB_PAPERS.AFB]: 'Accounting & Financial Management for Bankers',
  [JAIIB_PAPERS.RBWM]: 'Retail Banking and Wealth Management',
};

// Difficulty Levels
export const DIFFICULTY_LEVELS = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
} as const;

// User Roles
export const USER_ROLES = {
  OFFICER: 'officer',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const;

// User Status
export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
} as const;

// Question Status
export const QUESTION_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ARCHIVED: 'archived',
} as const;

// Practice Set Status
export const PRACTICE_SET_STATUS = {
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  EXPIRED: 'expired',
} as const;

// Audit Event Types
export const AUDIT_EVENT_TYPES = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  PRACTICE_COMPLETE: 'practice_complete',
  EXPLANATION_REQUESTED: 'explanation_requested',
  QUESTION_MODIFIED: 'question_modified',
  ERROR: 'error',
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Error Codes
export const ERROR_CODES = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  INVALID_EMAIL: 'INVALID_EMAIL',
  INVALID_PASSWORD: 'INVALID_PASSWORD',
  EMAIL_EXISTS: 'EMAIL_EXISTS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  QUESTION_NOT_FOUND: 'QUESTION_NOT_FOUND',
  PRACTICE_SET_NOT_FOUND: 'PRACTICE_SET_NOT_FOUND',
  INVALID_PRACTICE_SET: 'INVALID_PRACTICE_SET',
  BEDROCK_ERROR: 'BEDROCK_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// DynamoDB Table Names
export const DYNAMODB_TABLES = {
  USERS: 'users',
  QUESTIONS: 'questions',
  PRACTICE_SETS: 'practice_sets',
  SCORES: 'scores',
  AUDIT_LOGS: 'audit_logs',
  EXPLANATION_CACHE: 'explanation_cache',
} as const;

// Convenience exports for commonly used table names
export const USERS_TABLE = DYNAMODB_TABLES.USERS;
export const QUESTIONS_TABLE = DYNAMODB_TABLES.QUESTIONS;
export const PRACTICE_SETS_TABLE = DYNAMODB_TABLES.PRACTICE_SETS;
export const SCORES_TABLE = DYNAMODB_TABLES.SCORES;
export const AUDIT_LOGS_TABLE = DYNAMODB_TABLES.AUDIT_LOGS;
export const EXPLANATION_CACHE_TABLE = DYNAMODB_TABLES.EXPLANATION_CACHE;

// Session Configuration
export const SESSION_CONFIG = {
  EXPIRATION_MINUTES: 30,
  EXPIRATION_SECONDS: 30 * 60,
  PRACTICE_SET_TIMEOUT_MINUTES: 15,
  PRACTICE_SET_TIMEOUT_SECONDS: 15 * 60,
  PASSWORD_RESET_EXPIRATION_HOURS: 24,
  PASSWORD_RESET_EXPIRATION_SECONDS: 24 * 60 * 60,
} as const;

// Convenience exports for commonly used session values
export const JWT_EXPIRATION_MINUTES = SESSION_CONFIG.EXPIRATION_MINUTES;
export const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Password Configuration
export const PASSWORD_CONFIG = {
  MIN_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMERIC: true,
  BCRYPT_SALT_ROUNDS: 10,
} as const;

// Convenience export for bcrypt salt rounds
export const BCRYPT_SALT_ROUNDS = PASSWORD_CONFIG.BCRYPT_SALT_ROUNDS;

// Scoring Configuration
export const SCORING_CONFIG = {
  TOTAL_QUESTIONS: 4,
  POINTS_PER_QUESTION: 25,
  MAX_SCORE: 100,
  PASSING_SCORE: 50,
} as const;

// Practice Set Configuration
export const PRACTICE_SET_CONFIG = {
  QUESTIONS_PER_SET: 4,
  TIME_LIMIT_MINUTES: 10,
  TIME_LIMIT_SECONDS: 10 * 60,
  MIN_QUESTIONS_PER_PAPER: 40,
  NO_REPEAT_SETS: 10,
} as const;

// Explanation Configuration
export const EXPLANATION_CONFIG = {
  CACHE_TTL_DAYS: 30,
  CACHE_TTL_SECONDS: 30 * 24 * 60 * 60,
  BEDROCK_MODEL: 'claude-3-5-sonnet',
  BEDROCK_MAX_TOKENS: 1024,
  BEDROCK_TIMEOUT_MS: 3000,
} as const;

// Audit Log Configuration
export const AUDIT_LOG_CONFIG = {
  RETENTION_DAYS: 90,
  RETENTION_SECONDS: 90 * 24 * 60 * 60,
} as const;

// Rate Limiting Configuration
export const RATE_LIMIT_CONFIG = {
  REQUESTS_PER_MINUTE: 100,
  REQUESTS_PER_SECOND: 100 / 60,
} as const;

// Environment Variables
export const ENV_VARS = {
  ENVIRONMENT: process.env.ENVIRONMENT || 'development',
  AWS_REGION: process.env.AWS_REGION || 'ap-south-1',
  DYNAMODB_ENDPOINT: process.env.DYNAMODB_ENDPOINT,
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
  BEDROCK_REGION: process.env.BEDROCK_REGION || 'us-east-1',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
} as const;

// Regex Patterns
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
} as const;
