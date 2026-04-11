/**
 * useApi Hook
 * Custom React hook for making API calls with loading and error states
 */

import { useState, useCallback } from 'react'
import { ApiError } from '../services/api'

export interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: ApiError | null
}

export interface UseApiReturn<T> extends UseApiState<T> {
  execute: (...args: any[]) => Promise<T>
  reset: () => void
}

/**
 * Hook for executing async API calls with loading and error handling
 * @param apiFunction - The API function to call
 * @returns Object with data, loading, error states and execute function
 */
export function useApi<T>(
  apiFunction: (...args: any[]) => Promise<T>
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  })

  const execute = useCallback(
    async (...args: any[]): Promise<T> => {
      setState({ data: null, loading: true, error: null })

      try {
        const result = await apiFunction(...args)
        setState({ data: result, loading: false, error: null })
        return result
      } catch (err) {
        const error = err instanceof ApiError ? err : new ApiError(0, 'UNKNOWN_ERROR', String(err))
        setState({ data: null, loading: false, error })
        throw error
      }
    },
    [apiFunction]
  )

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null })
  }, [])

  return {
    ...state,
    execute,
    reset,
  }
}

/**
 * Hook for executing API calls on component mount
 * @param apiFunction - The API function to call
 * @param dependencies - Dependencies array for useEffect
 * @returns Object with data, loading, error states
 */
export function useApiEffect<T>(
  apiFunction: (...args: any[]) => Promise<T>,
  dependencies: any[] = []
): UseApiState<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
  })

  const { execute } = useApi(apiFunction)

  React.useEffect(() => {
    execute()
      .catch((err) => {
        // Error already handled in execute
      })
  }, dependencies)

  return state
}

export default useApi
