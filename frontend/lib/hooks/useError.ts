/**
 * useError Hook - Custom hook for error handling
 * Provides convenient methods to manage errors in components
 */

import { useCallback } from 'react'
import { useError as useErrorContext } from '../error-context'
import { AppError, parseApiError, logErrorToCloudWatch } from '../utils/api-error-handler'

interface UseErrorOptions {
  onError?: (error: AppError) => void
  logToCloudWatch?: boolean
}

export function useError(options: UseErrorOptions = {}) {
  const { logToCloudWatch = true } = options
  const context = useErrorContext()

  const handleError = useCallback(
    async (error: any, context?: Record<string, any>) => {
      const appError = parseApiError(error)

      if (logToCloudWatch) {
        await logErrorToCloudWatch(appError, context)
      }

      context?.onError?.(appError)
      return appError
    },
    [logToCloudWatch, options]
  )

  const setError = useCallback(
    (error: AppError) => {
      context.setError(error)
    },
    [context]
  )

  const clearError = useCallback(
    (errorId: string) => {
      context.clearError(errorId)
    },
    [context]
  )

  const addError = useCallback(
    (error: AppError) => {
      return context.addError(error)
    },
    [context]
  )

  const clearAllErrors = useCallback(() => {
    context.clearAllErrors()
  }, [context])

  const getLatestError = useCallback(() => {
    return context.getLatestError()
  }, [context])

  return {
    errors: context.errors,
    handleError,
    setError,
    clearError,
    addError,
    clearAllErrors,
    getLatestError,
  }
}
