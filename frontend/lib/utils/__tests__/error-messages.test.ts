import {
  getErrorMessage,
  classifyErrorType,
  getErrorSeverity,
  ERROR_MESSAGES,
  HTTP_STATUS_ERROR_MESSAGES,
  SPECIFIC_ERROR_MESSAGES,
} from '../error-messages'

describe('error-messages', () => {
  describe('getErrorMessage', () => {
    it('should return message for error type', () => {
      expect(getErrorMessage('network')).toBe(ERROR_MESSAGES.network)
      expect(getErrorMessage('validation')).toBe(ERROR_MESSAGES.validation)
      expect(getErrorMessage('server')).toBe(ERROR_MESSAGES.server)
      expect(getErrorMessage('auth')).toBe(ERROR_MESSAGES.auth)
      expect(getErrorMessage('notfound')).toBe(ERROR_MESSAGES.notfound)
      expect(getErrorMessage('unknown')).toBe(ERROR_MESSAGES.unknown)
    })

    it('should return message for HTTP status code', () => {
      expect(getErrorMessage(400)).toBe(HTTP_STATUS_ERROR_MESSAGES[400].message)
      expect(getErrorMessage(401)).toBe(HTTP_STATUS_ERROR_MESSAGES[401].message)
      expect(getErrorMessage(403)).toBe(HTTP_STATUS_ERROR_MESSAGES[403].message)
      expect(getErrorMessage(404)).toBe(HTTP_STATUS_ERROR_MESSAGES[404].message)
      expect(getErrorMessage(500)).toBe(HTTP_STATUS_ERROR_MESSAGES[500].message)
    })

    it('should return message for specific error code', () => {
      expect(getErrorMessage('NETWORK_ERROR')).toBe(SPECIFIC_ERROR_MESSAGES.NETWORK_ERROR)
      expect(getErrorMessage('TIMEOUT_ERROR')).toBe(SPECIFIC_ERROR_MESSAGES.TIMEOUT_ERROR)
      expect(getErrorMessage('BEDROCK_UNAVAILABLE')).toBe(
        SPECIFIC_ERROR_MESSAGES.BEDROCK_UNAVAILABLE
      )
    })

    it('should return default message if not found', () => {
      const defaultMsg = 'Custom error message'
      expect(getErrorMessage(999, defaultMsg)).toBe(defaultMsg)
    })

    it('should return unknown message if no match', () => {
      expect(getErrorMessage(999)).toBe(ERROR_MESSAGES.unknown)
    })
  })

  describe('classifyErrorType', () => {
    it('should classify 4xx errors correctly', () => {
      expect(classifyErrorType(400)).toBe('validation')
      expect(classifyErrorType(401)).toBe('auth')
      expect(classifyErrorType(403)).toBe('auth')
      expect(classifyErrorType(404)).toBe('notfound')
      expect(classifyErrorType(429)).toBe('validation')
    })

    it('should classify 5xx errors as server', () => {
      expect(classifyErrorType(500)).toBe('server')
      expect(classifyErrorType(502)).toBe('server')
      expect(classifyErrorType(503)).toBe('server')
    })

    it('should classify other status codes as unknown', () => {
      expect(classifyErrorType(200)).toBe('unknown')
      expect(classifyErrorType(300)).toBe('unknown')
    })
  })

  describe('getErrorSeverity', () => {
    it('should return critical for auth and server errors', () => {
      expect(getErrorSeverity('auth')).toBe('critical')
      expect(getErrorSeverity('server')).toBe('critical')
    })

    it('should return warning for validation and network errors', () => {
      expect(getErrorSeverity('validation')).toBe('warning')
      expect(getErrorSeverity('network')).toBe('warning')
    })

    it('should return info for other error types', () => {
      expect(getErrorSeverity('notfound')).toBe('info')
      expect(getErrorSeverity('unknown')).toBe('info')
    })
  })
})
