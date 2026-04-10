/**
 * User-friendly error messages for common error scenarios
 * Maps error types and HTTP status codes to clear, actionable messages
 */

export type ErrorType = 'network' | 'validation' | 'server' | 'auth' | 'notfound' | 'unknown'
export type ErrorSeverity = 'critical' | 'warning' | 'info'

export const ERROR_MESSAGES: Record<ErrorType, string> = {
  network: 'Unable to connect. Please check your internet connection and try again.',
  validation: 'Please check your input and try again.',
  server: 'Server error. Please try again later.',
  auth: 'You are not authorized. Please log in again.',
  notfound: 'The resource you\'re looking for doesn\'t exist.',
  unknown: 'Something went wrong. Please try again.',
}

export const HTTP_STATUS_ERROR_MESSAGES: Record<number, { type: ErrorType; message: string }> = {
  400: { type: 'validation', message: 'Invalid request. Please check your input.' },
  401: { type: 'auth', message: 'Your session has expired. Please log in again.' },
  403: { type: 'auth', message: 'You don\'t have permission to access this resource.' },
  404: { type: 'notfound', message: 'The resource you\'re looking for doesn\'t exist.' },
  408: { type: 'network', message: 'Request timed out. Please try again.' },
  429: { type: 'server', message: 'Too many requests. Please wait a moment and try again.' },
  500: { type: 'server', message: 'Server error. Please try again later.' },
  502: { type: 'server', message: 'Service temporarily unavailable. Please try again later.' },
  503: { type: 'server', message: 'Service temporarily unavailable. Please try again later.' },
  504: { type: 'server', message: 'Request timed out. Please try again.' },
}

export const SPECIFIC_ERROR_MESSAGES: Record<string, string> = {
  'NETWORK_ERROR': 'Unable to connect. Please check your internet connection.',
  'TIMEOUT_ERROR': 'Request timed out. Please try again.',
  'BEDROCK_UNAVAILABLE': 'Explanation service temporarily unavailable. Please try again later.',
  'PRACTICE_SET_GENERATION_FAILED': 'Unable to generate practice set. Please try again.',
  'SCORE_CALCULATION_FAILED': 'Unable to calculate score. Please try again.',
  'INVALID_EMAIL': 'Please enter a valid email address.',
  'PASSWORD_MISMATCH': 'Passwords do not match.',
  'PASSWORD_WEAK': 'Password must be at least 8 characters with uppercase, lowercase, and numeric characters.',
  'EMAIL_EXISTS': 'Email already exists. Please use a different email.',
  'INVALID_CREDENTIALS': 'Invalid email or password.',
  'SESSION_EXPIRED': 'Your session has expired. Please log in again.',
  'UNAUTHORIZED': 'You are not authorized to perform this action.',
  'FORBIDDEN': 'You don\'t have permission to access this resource.',
}

/**
 * Get user-friendly error message based on error type or HTTP status
 */
export function getErrorMessage(
  statusOrType: number | ErrorType | string,
  defaultMessage?: string
): string {
  // Check if it's a specific error code
  if (typeof statusOrType === 'string' && statusOrType in SPECIFIC_ERROR_MESSAGES) {
    return SPECIFIC_ERROR_MESSAGES[statusOrType]
  }

  // Check if it's an HTTP status code
  if (typeof statusOrType === 'number' && statusOrType in HTTP_STATUS_ERROR_MESSAGES) {
    return HTTP_STATUS_ERROR_MESSAGES[statusOrType].message
  }

  // Check if it's an error type
  if (typeof statusOrType === 'string' && statusOrType in ERROR_MESSAGES) {
    return ERROR_MESSAGES[statusOrType as ErrorType]
  }

  return defaultMessage || ERROR_MESSAGES.unknown
}

/**
 * Classify error type based on HTTP status code
 */
export function classifyErrorType(status: number): ErrorType {
  if (status >= 400 && status < 500) {
    if (status === 401 || status === 403) return 'auth'
    if (status === 404) return 'notfound'
    return 'validation'
  }
  if (status >= 500) return 'server'
  return 'unknown'
}

/**
 * Determine error severity based on type
 */
export function getErrorSeverity(type: ErrorType): ErrorSeverity {
  switch (type) {
    case 'auth':
    case 'server':
      return 'critical'
    case 'validation':
    case 'network':
      return 'warning'
    default:
      return 'info'
  }
}
