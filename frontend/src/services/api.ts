/**
 * API Client Service
 * Centralized HTTP client for all backend API calls
 * Handles authentication, error handling, and request/response interceptors
 */

import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios'

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  details?: any
}

export interface AuthResponse {
  success: boolean
  user?: {
    user_id: string
    email: string
    full_name: string
    role: string
  }
  session_token?: string
  expires_in?: number
  refresh_token?: string
  error?: string
}

export interface PracticeSetResponse {
  practice_set_id: string
  paper: string
  questions: Array<{
    question_id: string
    question_text: string
    options: {
      A: string
      B: string
      C: string
      D: string
    }
    order: string[]
  }>
  session_token: string
  session_expires_at: number
  time_limit_seconds: number
}

export interface ScoreResponse {
  score: number
  correct_count: number
  total_questions: number
  answers: Record<string, { user_answer: string; correct_answer: string; is_correct: boolean }>
  time_taken: number
}

export interface ExplanationResponse {
  explanation_id: string
  question_id: string
  correct_answer: string
  explanation_text: string
  rbi_norms?: string[]
  iibf_norms?: string[]
}

export interface DashboardMetricsResponse {
  total_practice_sets: number
  average_score: number
  paper_stats: Record<
    string,
    {
      average_score: number
      highest_score: number
      practice_count: number
    }
  >
  recent_scores: Array<{
    score_id: string
    paper: string
    score: number
    created_at: number
    time_taken: number
  }>
}

// Error handling
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public errorCode?: string,
    message?: string
  ) {
    super(message || 'API Error')
    this.name = 'ApiError'
  }
}

class ApiClient {
  private client: AxiosInstance
  private baseURL: string
  private tokenKey = 'auth_token'
  private refreshTokenKey = 'refresh_token'

  constructor() {
    this.baseURL = this.getBaseURL()

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor - handle errors and token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any

        // Handle 401 Unauthorized - try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            const refreshToken = this.getRefreshToken()
            if (refreshToken) {
              const response = await this.client.post('/auth/refresh', {
                refresh_token: refreshToken,
              })

              const { session_token, expires_in } = response.data
              this.setToken(session_token, expires_in)

              // Retry original request with new token
              originalRequest.headers.Authorization = `Bearer ${session_token}`
              return this.client(originalRequest)
            }
          } catch (refreshError) {
            // Refresh failed, clear tokens and redirect to login
            this.clearTokens()
            window.location.href = '/login'
            return Promise.reject(refreshError)
          }
        }

        return Promise.reject(error)
      }
    )
  }

  private getBaseURL(): string {
    const env = import.meta.env.VITE_API_BASE_URL
    if (env) return env

    // Default based on environment
    if (import.meta.env.DEV) {
      return 'http://localhost:3000/api'
    }

    // Production - use relative path
    return '/api'
  }

  private getToken(): string | null {
    return localStorage.getItem(this.tokenKey)
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey)
  }

  private setToken(token: string, expiresIn?: number): void {
    localStorage.setItem(this.tokenKey, token)
    if (expiresIn) {
      const expiresAt = Date.now() + expiresIn * 1000
      localStorage.setItem('token_expires_at', expiresAt.toString())
    }
  }

  private setRefreshToken(token: string): void {
    localStorage.setItem(this.refreshTokenKey, token)
  }

  private clearTokens(): void {
    localStorage.removeItem(this.tokenKey)
    localStorage.removeItem(this.refreshTokenKey)
    localStorage.removeItem('token_expires_at')
  }

  private handleError(error: any): never {
    if (error.response) {
      const status = error.response.status
      const data = error.response.data

      throw new ApiError(
        status,
        data?.error || data?.errorCode,
        data?.message || data?.error || error.message
      )
    }

    if (error.request) {
      throw new ApiError(0, 'NETWORK_ERROR', 'Network request failed')
    }

    throw new ApiError(0, 'UNKNOWN_ERROR', error.message)
  }

  // ==================== AUTH ENDPOINTS ====================

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await this.client.post<AuthResponse>('/auth/login', {
        email,
        password,
      })

      if (response.data.session_token) {
        this.setToken(response.data.session_token, response.data.expires_in)
        if (response.data.refresh_token) {
          this.setRefreshToken(response.data.refresh_token)
        }
      }

      return response.data
    } catch (error) {
      this.handleError(error)
    }
  }

  async register(
    fullName: string,
    email: string,
    password: string,
    confirmPassword: string
  ): Promise<AuthResponse> {
    try {
      const response = await this.client.post<AuthResponse>('/auth/register', {
        full_name: fullName,
        email,
        password,
        confirmPassword,
      })

      return response.data
    } catch (error) {
      this.handleError(error)
    }
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      this.clearTokens()
    }
  }

  async resetPassword(email: string): Promise<ApiResponse> {
    try {
      const response = await this.client.post<ApiResponse>('/auth/reset-password', {
        email,
      })

      return response.data
    } catch (error) {
      this.handleError(error)
    }
  }

  async verifyResetToken(resetToken: string, newPassword: string): Promise<ApiResponse> {
    try {
      const response = await this.client.post<ApiResponse>('/auth/verify-reset-token', {
        reset_token: resetToken,
        new_password: newPassword,
      })

      return response.data
    } catch (error) {
      this.handleError(error)
    }
  }

  // ==================== PRACTICE SET ENDPOINTS ====================

  async generatePracticeSet(paper: string): Promise<PracticeSetResponse> {
    try {
      const response = await this.client.post<PracticeSetResponse>('/practice-sets', {
        paper,
      })

      return response.data
    } catch (error) {
      this.handleError(error)
    }
  }

  async getPracticeSet(practiceSetId: string): Promise<PracticeSetResponse> {
    try {
      const response = await this.client.get<PracticeSetResponse>(
        `/practice-sets/${practiceSetId}`
      )

      return response.data
    } catch (error) {
      this.handleError(error)
    }
  }

  async submitPracticeSet(
    practiceSetId: string,
    answers: Record<string, string>
  ): Promise<ScoreResponse> {
    try {
      const response = await this.client.post<ScoreResponse>(
        `/practice-sets/${practiceSetId}/submit`,
        {
          answers,
        }
      )

      return response.data
    } catch (error) {
      this.handleError(error)
    }
  }

  async resumePracticeSet(practiceSetId: string): Promise<PracticeSetResponse> {
    try {
      const response = await this.client.get<PracticeSetResponse>(
        `/practice-sets/${practiceSetId}/resume`
      )

      return response.data
    } catch (error) {
      this.handleError(error)
    }
  }

  // ==================== EXPLANATION ENDPOINTS ====================

  async getExplanation(questionId: string): Promise<ExplanationResponse> {
    try {
      const response = await this.client.post<ExplanationResponse>('/explanations', {
        question_id: questionId,
      })

      return response.data
    } catch (error) {
      this.handleError(error)
    }
  }

  async getCachedExplanation(explanationId: string): Promise<ExplanationResponse> {
    try {
      const response = await this.client.get<ExplanationResponse>(
        `/explanations/${explanationId}`
      )

      return response.data
    } catch (error) {
      this.handleError(error)
    }
  }

  // ==================== DASHBOARD ENDPOINTS ====================

  async getDashboardMetrics(): Promise<DashboardMetricsResponse> {
    try {
      const response = await this.client.get<DashboardMetricsResponse>('/dashboard/metrics')

      return response.data
    } catch (error) {
      this.handleError(error)
    }
  }

  async getUserScores(paper?: string, limit?: number): Promise<ApiResponse> {
    try {
      const params = new URLSearchParams()
      if (paper) params.append('paper', paper)
      if (limit) params.append('limit', limit.toString())

      const response = await this.client.get<ApiResponse>(
        `/dashboard/scores?${params.toString()}`
      )

      return response.data
    } catch (error) {
      this.handleError(error)
    }
  }

  // ==================== USER PROFILE ENDPOINTS ====================

  async getUserProfile(): Promise<ApiResponse> {
    try {
      const response = await this.client.get<ApiResponse>('/user/profile')

      return response.data
    } catch (error) {
      this.handleError(error)
    }
  }

  async updateUserProfile(data: Record<string, any>): Promise<ApiResponse> {
    try {
      const response = await this.client.put<ApiResponse>('/user/profile', data)

      return response.data
    } catch (error) {
      this.handleError(error)
    }
  }

  // ==================== ADMIN ENDPOINTS ====================

  async createQuestion(questionData: Record<string, any>): Promise<ApiResponse> {
    try {
      const response = await this.client.post<ApiResponse>('/admin/questions', questionData)

      return response.data
    } catch (error) {
      this.handleError(error)
    }
  }

  async updateQuestion(questionId: string, questionData: Record<string, any>): Promise<ApiResponse> {
    try {
      const response = await this.client.put<ApiResponse>(
        `/admin/questions/${questionId}`,
        questionData
      )

      return response.data
    } catch (error) {
      this.handleError(error)
    }
  }

  async deleteQuestion(questionId: string): Promise<ApiResponse> {
    try {
      const response = await this.client.delete<ApiResponse>(`/admin/questions/${questionId}`)

      return response.data
    } catch (error) {
      this.handleError(error)
    }
  }

  async getQuestions(paper?: string, status?: string): Promise<ApiResponse> {
    try {
      const params = new URLSearchParams()
      if (paper) params.append('paper', paper)
      if (status) params.append('status', status)

      const response = await this.client.get<ApiResponse>(
        `/admin/questions?${params.toString()}`
      )

      return response.data
    } catch (error) {
      this.handleError(error)
    }
  }

  // ==================== UTILITY METHODS ====================

  isAuthenticated(): boolean {
    return !!this.getToken()
  }

  isTokenExpiring(): boolean {
    const expiresAt = localStorage.getItem('token_expires_at')
    if (!expiresAt) return false

    const now = Date.now()
    const expiresAtTime = parseInt(expiresAt, 10)
    const fiveMinutesMs = 5 * 60 * 1000

    return expiresAtTime - now <= fiveMinutesMs
  }

  getTimeUntilExpiry(): number {
    const expiresAt = localStorage.getItem('token_expires_at')
    if (!expiresAt) return 0

    const now = Date.now()
    const expiresAtTime = parseInt(expiresAt, 10)
    return Math.max(0, expiresAtTime - now)
  }
}

// Export singleton instance
export const apiClient = new ApiClient()

export default apiClient
