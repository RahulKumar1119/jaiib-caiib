/**
 * API Error Handler - Parse and normalize API errors
 * Provides consistent error handling across the application
 */

import { AxiosError } from 'axios'
import {
  ErrorType,
  ErrorSeverity,
  getErrorMessage,
  classifyErrorType,
  getErrorSeverity,
} from './error-messages'

export interface AppError {
  id: string
  type: ErrorType
  severity: ErrorSeverity
  message: string
  details?: string
  timestamp: number
  context?: Record<string, any>
  statusCode?: number
  originalError?: Error
}

/**
 * Parse API error response and extract details
 */
export function parseApiError(error: any): AppError {
  const id = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const timestamp = Date.now()

  // Handle Axios errors
  if (error.isAxiosError) {
    const axiosError = error as AxiosError
    const status = axiosError.response?.status || 500
    const type = classifyErrorType(status)
    const severity = getErrorSeverity(type)

    const responseData = axiosError.response?.data as any
    const message =
      responseData?.error ||
      responseData?.message ||
      getErrorMessage(status) ||
      axiosError.message

    return {
      id,
      type,
      severity,
      message,
      details: responseData?.details,
      timestamp,
      context: {
        url: axiosError.config?.url,
        method: axiosError.config?.method,
        statusCode: status,
      },
      statusCode: status,
      originalError: error,
    }
  }

  // Handle network errors
  if (error.message === 'Network Error' || error.code === 'ECONNABORTED') {
    return {
      id,
      type: 'network',
      severity: 'warning',
      message: getErrorMessage('network'),
      timestamp,
      originalError: error,
    }
  }

  // Handle timeout errors
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return {
      id,
      type: 'network',
      severity: 'warning',
      message: getErrorMessage('TIMEOUT_ERROR'),
      timestamp,
      originalError: error,
    }
  }

  // Handle generic errors
  return {
    id,
    type: 'unknown',
    severity: 'warning',
    message: error.message || getErrorMessage('unknown'),
    timestamp,
    originalError: error,
  }
}

/**
 * Extract error details from API response
 */
export function extractErrorDetails(error: any): string | undefined {
  if (typeof error === 'string') return error
  if (error?.details) return error.details
  if (error?.message) return error.message
  if (error?.error) return error.error
  return undefined
}

/**
 * Log error to CloudWatch (in production)
 */
export async function logErrorToCloudWatch(error: AppError, context?: Record<string, any>) {
  try {
    // In production, this would send to CloudWatch
    // For now, we'll log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[Error Log]', {
        id: error.id,
        type: error.type,
        severity: error.severity,
        message: error.message,
        timestamp: new Date(error.timestamp).toISOString(),
        context: { ...error.context, ...context },
      })
    } else {
      // In production, send to CloudWatch
      await fetch('/api/logs/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: error.id,
          type: error.type,
          severity: error.severity,
          message: error.message,
          details: error.details,
          timestamp: error.timestamp,
          context: { ...error.context, ...context },
          statusCode: error.statusCode,
        }),
      })
    }
  } catch (err) {
    // Silently fail if logging fails
    console.error('Failed to log error:', err)
  }
}

/**
 * Retry operation with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  initialDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      if (attempt < maxAttempts) {
        const delayMs = initialDelayMs * Math.pow(2, attempt - 1)
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }
  }

  throw lastError
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: AppError): boolean {
  // Network errors are retryable
  if (error.type === 'network') return true

  // Server errors (5xx) are retryable
  if (error.statusCode && error.statusCode >= 500) return true

  // Rate limiting (429) is retryable
  if (error.statusCode === 429) return true

  // Timeout errors are retryable
  if (error.message.includes('timeout')) return true

  return false
}

/**
 * Format error for display in UI
 */
export function formatErrorForDisplay(error: AppError): {
  title: string
  message: string
  isRetryable: boolean
} {
  const isRetryable = isRetryableError(error)

  return {
    title: error.severity === 'critical' ? 'Error' : 'Warning',
    message: error.message,
    isRetryable,
  }
}
