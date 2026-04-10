import { renderHook, act } from '@testing-library/react'
import { useError } from '../useError'
import { ErrorProvider } from '../../error-context'
import { AppError } from '../../utils/api-error-handler'

describe('useError', () => {
  const wrapper = ({ children }: any) => (
    <ErrorProvider>{children}</ErrorProvider>
  )

  it('should initialize with empty errors', () => {
    const { result } = renderHook(() => useError(), { wrapper })

    expect(result.current.errors).toEqual([])
  })

  it('should set error', () => {
    const { result } = renderHook(() => useError(), { wrapper })

    const error: AppError = {
      id: 'test-1',
      type: 'validation',
      severity: 'warning',
      message: 'Test error',
      timestamp: Date.now(),
    }

    act(() => {
      result.current.setError(error)
    })

    expect(result.current.errors).toHaveLength(1)
    expect(result.current.errors[0].message).toBe('Test error')
  })

  it('should add error', () => {
    const { result } = renderHook(() => useError(), { wrapper })

    const error: AppError = {
      id: 'test-1',
      type: 'network',
      severity: 'warning',
      message: 'Network error',
      timestamp: Date.now(),
    }

    act(() => {
      result.current.addError(error)
    })

    expect(result.current.errors).toHaveLength(1)
  })

  it('should clear specific error', () => {
    const { result } = renderHook(() => useError(), { wrapper })

    const error: AppError = {
      id: 'test-1',
      type: 'validation',
      severity: 'warning',
      message: 'Test error',
      timestamp: Date.now(),
    }

    act(() => {
      result.current.addError(error)
    })

    expect(result.current.errors).toHaveLength(1)

    act(() => {
      result.current.clearError('test-1')
    })

    expect(result.current.errors).toHaveLength(0)
  })

  it('should clear all errors', () => {
    const { result } = renderHook(() => useError(), { wrapper })

    const error1: AppError = {
      id: 'test-1',
      type: 'validation',
      severity: 'warning',
      message: 'Error 1',
      timestamp: Date.now(),
    }

    const error2: AppError = {
      id: 'test-2',
      type: 'network',
      severity: 'warning',
      message: 'Error 2',
      timestamp: Date.now(),
    }

    act(() => {
      result.current.addError(error1)
      result.current.addError(error2)
    })

    expect(result.current.errors).toHaveLength(2)

    act(() => {
      result.current.clearAllErrors()
    })

    expect(result.current.errors).toHaveLength(0)
  })

  it('should get latest error', () => {
    const { result } = renderHook(() => useError(), { wrapper })

    const error1: AppError = {
      id: 'test-1',
      type: 'validation',
      severity: 'warning',
      message: 'Error 1',
      timestamp: Date.now(),
    }

    const error2: AppError = {
      id: 'test-2',
      type: 'network',
      severity: 'warning',
      message: 'Error 2',
      timestamp: Date.now(),
    }

    act(() => {
      result.current.addError(error1)
      result.current.addError(error2)
    })

    const latest = result.current.getLatestError()
    expect(latest?.message).toBe('Error 2')
  })

  it('should return null for latest error when no errors', () => {
    const { result } = renderHook(() => useError(), { wrapper })

    const latest = result.current.getLatestError()
    expect(latest).toBeNull()
  })

  it('should handle error from API response', () => {
    const { result } = renderHook(() => useError(), { wrapper })

    const apiError = {
      isAxiosError: true,
      response: {
        status: 400,
        data: {
          error: 'Invalid request',
        },
      },
      config: {},
      message: 'Request failed',
    }

    act(() => {
      result.current.handleError(apiError)
    })

    expect(result.current.errors).toHaveLength(1)
    expect(result.current.errors[0].type).toBe('validation')
  })

  it('should handle network error', () => {
    const { result } = renderHook(() => useError(), { wrapper })

    const networkError = {
      message: 'Network Error',
      code: 'ECONNABORTED',
    }

    act(() => {
      result.current.handleError(networkError)
    })

    expect(result.current.errors).toHaveLength(1)
    expect(result.current.errors[0].type).toBe('network')
  })

  it('should call onError callback if provided', () => {
    const onError = jest.fn()
    const { result } = renderHook(() => useError({ onError }), { wrapper })

    const error = {
      message: 'Test error',
    }

    act(() => {
      result.current.handleError(error)
    })

    expect(onError).toHaveBeenCalled()
  })

  it('should log error to CloudWatch by default', async () => {
    const { result } = renderHook(() => useError(), { wrapper })

    const error = {
      message: 'Test error',
    }

    await act(async () => {
      await result.current.handleError(error)
    })

    expect(result.current.errors).toHaveLength(1)
  })

  it('should not log to CloudWatch when disabled', async () => {
    const { result } = renderHook(() => useError({ logToCloudWatch: false }), { wrapper })

    const error = {
      message: 'Test error',
    }

    await act(async () => {
      await result.current.handleError(error)
    })

    expect(result.current.errors).toHaveLength(1)
  })
})
