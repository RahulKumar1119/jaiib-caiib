'use client'

import React, { useEffect } from 'react'
import { AppError, isRetryableError } from '../lib/utils/api-error-handler'

interface ErrorDisplayProps {
  error: AppError
  onDismiss?: () => void
  onRetry?: () => void
  showRetry?: boolean
}

/**
 * ErrorDisplay Component - Displays error messages with optional retry button
 * Supports different severity levels and auto-dismiss
 */
export function ErrorDisplay({
  error,
  onDismiss,
  onRetry,
  showRetry = true,
}: ErrorDisplayProps) {
  const isRetryable = showRetry && isRetryableError(error)

  useEffect(() => {
    // Auto-dismiss info and warning errors after 5 seconds
    if (error.severity !== 'critical') {
      const timer = setTimeout(() => {
        onDismiss?.()
      }, 5000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [error, onDismiss])

  const bgColor =
    error.severity === 'critical'
      ? 'bg-red-50 dark:bg-red-900/20'
      : error.severity === 'warning'
        ? 'bg-yellow-50 dark:bg-yellow-900/20'
        : 'bg-blue-50 dark:bg-blue-900/20'

  const borderColor =
    error.severity === 'critical'
      ? 'border-red-200 dark:border-red-800'
      : error.severity === 'warning'
        ? 'border-yellow-200 dark:border-yellow-800'
        : 'border-blue-200 dark:border-blue-800'

  const textColor =
    error.severity === 'critical'
      ? 'text-red-800 dark:text-red-200'
      : error.severity === 'warning'
        ? 'text-yellow-800 dark:text-yellow-200'
        : 'text-blue-800 dark:text-blue-200'

  const iconColor =
    error.severity === 'critical'
      ? 'text-red-600 dark:text-red-400'
      : error.severity === 'warning'
        ? 'text-yellow-600 dark:text-yellow-400'
        : 'text-blue-600 dark:text-blue-400'

  const buttonColor =
    error.severity === 'critical'
      ? 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600'
      : error.severity === 'warning'
        ? 'bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600'
        : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'

  return (
    <div
      className={`${bgColor} ${borderColor} border rounded-lg p-4 mb-4`}
      role="alert"
      aria-live={error.severity === 'critical' ? 'assertive' : 'polite'}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 pt-0.5">
          {error.severity === 'critical' ? (
            <svg
              className={`w-5 h-5 ${iconColor}`}
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          ) : error.severity === 'warning' ? (
            <svg
              className={`w-5 h-5 ${iconColor}`}
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              className={`w-5 h-5 ${iconColor}`}
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>

        {/* Content */}
        <div className="flex-1">
          <p className={`${textColor} font-medium`}>{error.message}</p>
          {error.details && (
            <p className={`${textColor} text-sm mt-1 opacity-90`}>{error.details}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex gap-2">
          {isRetryable && onRetry && (
            <button
              onClick={onRetry}
              className={`${buttonColor} text-white px-3 py-1 rounded text-sm font-medium transition-colors`}
              aria-label="Retry operation"
            >
              Retry
            </button>
          )}

          {onDismiss && (
            <button
              onClick={onDismiss}
              className={`${textColor} hover:opacity-75 transition-opacity`}
              aria-label="Dismiss error"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
