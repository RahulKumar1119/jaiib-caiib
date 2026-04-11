import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios'
import { ApiError } from './types/api'
import { parseApiError, logErrorToCloudWatch } from './utils/api-error-handler'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const TOKEN_KEY = process.env.NEXT_PUBLIC_TOKEN_STORAGE_KEY || 'session_token'
const REFRESH_TOKEN_KEY = process.env.NEXT_PUBLIC_REFRESH_TOKEN_STORAGE_KEY || 'refresh_token'
const REQUEST_TIMEOUT = 30000 // 30 seconds
const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY = 1000 // 1 second

interface RequestLog {
  method: string
  url: string
  timestamp: number
  duration: number
  status?: number
  error?: string
}

class ApiClient {
  private client: AxiosInstance
  private isRefreshing = false
  private failedQueue: Array<{
    resolve: (token: string) => void
    reject: (error: ApiError) => void
  }> = []
  private requestLogs: RequestLog[] = []
  private maxLogs = 100

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor for token injection and logging
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }

        // Add request timestamp for logging
        ;(config as any).requestStartTime = Date.now()

        // Log request
        this.logRequest({
          method: config.method?.toUpperCase() || 'UNKNOWN',
          url: config.url || '',
          timestamp: Date.now(),
          duration: 0,
        })

        return config
      },
      (error) => Promise.reject(this.handleError(error))
    )

    // Response interceptor for error handling, token refresh, and logging
    this.client.interceptors.response.use(
      (response) => {
        // Log successful response
        const duration = Date.now() - ((response.config as any).requestStartTime || Date.now())
        this.logRequest({
          method: response.config.method?.toUpperCase() || 'UNKNOWN',
          url: response.config.url || '',
          timestamp: (response.config as any).requestStartTime || Date.now(),
          duration,
          status: response.status,
        })

        return response
      },
      async (error) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: number; _refreshAttempt?: boolean }

        // Log failed request
        const duration = Date.now() - ((originalRequest as any).requestStartTime || Date.now())
        this.logRequest({
          method: originalRequest.method?.toUpperCase() || 'UNKNOWN',
          url: originalRequest.url || '',
          timestamp: (originalRequest as any).requestStartTime || Date.now(),
          duration,
          status: error.response?.status,
          error: error.message,
        })

        // Handle 401 Unauthorized - attempt token refresh
        if (error.response?.status === 401 && !originalRequest._refreshAttempt) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject })
            })
              .then((token) => {
                originalRequest.headers = originalRequest.headers || {}
                originalRequest.headers.Authorization = `Bearer ${token}`
                return this.client(originalRequest)
              })
              .catch((err) => Promise.reject(err))
          }

          this.isRefreshing = true
          originalRequest._refreshAttempt = true

          try {
            const refreshToken = this.getRefreshToken()
            if (!refreshToken) {
              throw new Error('No refresh token available')
            }

            const response = await this.client.post('/auth/refresh', {
              refresh_token: refreshToken,
            })

            const { session_token } = response.data
            this.setToken(session_token)

            this.failedQueue.forEach(({ resolve }) => resolve(session_token))
            this.failedQueue = []

            originalRequest.headers = originalRequest.headers || {}
            originalRequest.headers.Authorization = `Bearer ${session_token}`
            return this.client(originalRequest)
          } catch (err) {
            this.failedQueue.forEach(({ reject }) => reject(this.handleError(err)))
            this.failedQueue = []
            this.clearTokens()
            if (typeof window !== 'undefined') {
              window.location.href = '/login'
            }
            return Promise.reject(this.handleError(err))
          } finally {
            this.isRefreshing = false
          }
        }

        return Promise.reject(this.handleError(error))
      }
    )
  }

  private handleError(error: any): ApiError {
    const appError = parseApiError(error)

    // Log error to CloudWatch
    logErrorToCloudWatch(appError, {
      source: 'api-client',
    })

    return {
      status: appError.statusCode || 500,
      message: appError.message,
      code: appError.type,
      details: appError.details ? { message: appError.details } : undefined,
    }
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(TOKEN_KEY)
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  }

  private setToken(token: string): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(TOKEN_KEY, token)
  }

  private clearTokens(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  }

  private logRequest(log: RequestLog): void {
    this.requestLogs.push(log)
    if (this.requestLogs.length > this.maxLogs) {
      this.requestLogs.shift()
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      const logLevel = log.error ? 'error' : log.status && log.status >= 400 ? 'warn' : 'log'
      const message = `[API] ${log.method} ${log.url} - Status: ${log.status || 'pending'} - Duration: ${log.duration}ms`
      if (logLevel === 'error') {
        console.error(message)
      } else if (logLevel === 'warn') {
        console.warn(message)
      } else {
        console.log(message)
      }
    }
  }

  /**
   * Get all request logs for debugging
   */
  public getRequestLogs(): RequestLog[] {
    return [...this.requestLogs]
  }

  /**
   * Clear request logs
   */
  public clearRequestLogs(): void {
    this.requestLogs = []
  }

  /**
   * Retry a request with exponential backoff
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    retries: number = MAX_RETRIES,
    delay: number = INITIAL_RETRY_DELAY
  ): Promise<T> {
    try {
      return await fn()
    } catch (error) {
      if (retries > 0 && this.isRetryableError(error)) {
        await new Promise((resolve) => setTimeout(resolve, delay))
        return this.retryWithBackoff(fn, retries - 1, delay * 2)
      }
      throw error
    }
  }

  /**
   * Determine if an error is retryable
   */
  private isRetryableError(error: any): boolean {
    if (!error.response) {
      // Network error
      return true
    }
    const status = error.response.status
    // Retry on 5xx errors and 429 (too many requests)
    return status >= 500 || status === 429
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.retryWithBackoff(() => this.client.get(url, config))
    return response.data
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.retryWithBackoff(() => this.client.post(url, data, config))
    return response.data
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.retryWithBackoff(() => this.client.put(url, data, config))
    return response.data
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.retryWithBackoff(() => this.client.patch(url, data, config))
    return response.data
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.retryWithBackoff(() => this.client.delete(url, config))
    return response.data
  }
}

export const apiClient = new ApiClient()
