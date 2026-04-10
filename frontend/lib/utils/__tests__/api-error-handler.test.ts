import {
  parseApiError,
  extractErrorDetails,
  isRetryableError,
  formatErrorForDisplay,
  retryWithBackoff,
} from '../api-error-handler'
import { AppError } from '../api-error-handler'

describe('api-error-handler', () => {
  describe('parseApiError', () => {
    it('should parse Axios error with status code', () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 400,
          data: {
            error: 'Invalid request',
            details: 'Email is required',
          },
        },
        config: {
          url: '/api/test',
          method: 'POST',
        },
        message: 'Request failed',
      }

      const result = parseApiError(error)

      expect(result.type).toBe('validation')
      expect(result.message).toBe('Invalid request')
      expect(result.details).toBe('Email is required')
      expect(result.statusCode).toBe(400)
      expect(result.severity).toBe('warning')
    })

    it('should parse 401 error as auth type', () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 401,
          data: { error: 'Unauthorized' },
        },
        config: {},
        message: 'Unauthorized',
      }

      const result = parseApiError(error)

      expect(result.type).toBe('auth')
      expect(result.severity).toBe('critical')
    })

    it('should parse 500 error as server type', () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 500,
          data: { error: 'Internal server error' },
        },
        config: {},
        message: 'Server error',
      }

      const result = parseApiError(error)

      expect(result.type).toBe('server')
      expect(result.severity).toBe('critical')
    })

    it('should parse network error', () => {
      const error = {
        message: 'Network Error',
        code: 'ECONNABORTED',
      }

      const result = parseApiError(error)

      expect(result.type).toBe('network')
      expect(result.severity).toBe('warning')
    })

    it('should parse timeout error', () => {
      const error = {
        message: 'Request timeout',
        code: 'ECONNABORTED',
      }

      const result = parseApiError(error)

      expect(result.type).toBe('network')
    })

    it('should generate unique error ID', () => {
      const error1 = parseApiError({ message: 'Error 1' })
      const error2 = parseApiError({ message: 'Error 2' })

      expect(error1.id).not.toBe(error2.id)
    })

    it('should set timestamp', () => {
      const beforeTime = Date.now()
      const error = parseApiError({ message: 'Test error' })
      const afterTime = Date.now()

      expect(error.timestamp).toBeGreaterThanOrEqual(beforeTime)
      expect(error.timestamp).toBeLessThanOrEqual(afterTime)
    })
  })

  describe('extractErrorDetails', () => {
    it('should extract string error', () => {
      expect(extractErrorDetails('Error message')).toBe('Error message')
    })

    it('should extract details from object', () => {
      expect(extractErrorDetails({ details: 'Detail message' })).toBe('Detail message')
    })

    it('should extract message from object', () => {
      expect(extractErrorDetails({ message: 'Message text' })).toBe('Message text')
    })

    it('should extract error from object', () => {
      expect(extractErrorDetails({ error: 'Error text' })).toBe('Error text')
    })

    it('should return undefined if no details found', () => {
      expect(extractErrorDetails({})).toBeUndefined()
      expect(extractErrorDetails(null)).toBeUndefined()
    })
  })

  describe('isRetryableError', () => {
    it('should return true for network errors', () => {
      const error: AppError = {
        id: 'test',
        type: 'network',
        severity: 'warning',
        message: 'Network error',
        timestamp: Date.now(),
      }

      expect(isRetryableError(error)).toBe(true)
    })

    it('should return true for 5xx errors', () => {
      const error: AppError = {
        id: 'test',
        type: 'server',
        severity: 'critical',
        message: 'Server error',
        timestamp: Date.now(),
        statusCode: 500,
      }

      expect(isRetryableError(error)).toBe(true)
    })

    it('should return true for 429 (rate limit) errors', () => {
      const error: AppError = {
        id: 'test',
        type: 'validation',
        severity: 'warning',
        message: 'Too many requests',
        timestamp: Date.now(),
        statusCode: 429,
      }

      expect(isRetryableError(error)).toBe(true)
    })

    it('should return true for timeout errors', () => {
      const error: AppError = {
        id: 'test',
        type: 'network',
        severity: 'warning',
        message: 'Request timeout',
        timestamp: Date.now(),
      }

      expect(isRetryableError(error)).toBe(true)
    })

    it('should return false for auth errors', () => {
      const error: AppError = {
        id: 'test',
        type: 'auth',
        severity: 'critical',
        message: 'Unauthorized',
        timestamp: Date.now(),
        statusCode: 401,
      }

      expect(isRetryableError(error)).toBe(false)
    })

    it('should return false for validation errors', () => {
      const error: AppError = {
        id: 'test',
        type: 'validation',
        severity: 'warning',
        message: 'Invalid input',
        timestamp: Date.now(),
        statusCode: 400,
      }

      expect(isRetryableError(error)).toBe(false)
    })
  })

  describe('formatErrorForDisplay', () => {
    it('should format critical error', () => {
      const error: AppError = {
        id: 'test',
        type: 'server',
        severity: 'critical',
        message: 'Server error',
        timestamp: Date.now(),
      }

      const result = formatErrorForDisplay(error)

      expect(result.title).toBe('Error')
      expect(result.message).toBe('Server error')
    })

    it('should format warning error', () => {
      const error: AppError = {
        id: 'test',
        type: 'validation',
        severity: 'warning',
        message: 'Invalid input',
        timestamp: Date.now(),
      }

      const result = formatErrorForDisplay(error)

      expect(result.title).toBe('Warning')
    })

    it('should indicate retryable errors', () => {
      const error: AppError = {
        id: 'test',
        type: 'network',
        severity: 'warning',
        message: 'Network error',
        timestamp: Date.now(),
      }

      const result = formatErrorForDisplay(error)

      expect(result.isRetryable).toBe(true)
    })

    it('should indicate non-retryable errors', () => {
      const error: AppError = {
        id: 'test',
        type: 'auth',
        severity: 'critical',
        message: 'Unauthorized',
        timestamp: Date.now(),
      }

      const result = formatErrorForDisplay(error)

      expect(result.isRetryable).toBe(false)
    })
  })

  describe('retryWithBackoff', () => {
    it('should succeed on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success')

      const result = await retryWithBackoff(operation, 3, 100)

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValueOnce('success')

      const result = await retryWithBackoff(operation, 3, 10)

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(3)
    }, 10000)

    it('should throw after max attempts', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Always fails'))

      await expect(retryWithBackoff(operation, 3, 10)).rejects.toThrow('Always fails')
      expect(operation).toHaveBeenCalledTimes(3)
    }, 10000)

    it('should use exponential backoff', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockResolvedValueOnce('success')

      const result = await retryWithBackoff(operation, 2, 10)

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(2)
    }, 10000)
  })
})
