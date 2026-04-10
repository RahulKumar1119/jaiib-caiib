export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface ApiError {
  status: number
  message: string
  code?: string
  details?: Record<string, any>
}

export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  total_pages: number
}

export interface Explanation {
  explanation_id: string
  question_id: string
  correct_answer: string
  explanation_text: string
  rbi_norms: string[]
  iibf_norms: string[]
  generated_at: number
  model: string
}

export interface AuditLog {
  audit_id: string
  event_type: string
  user_id: string
  resource_type: string
  resource_id: string
  action: string
  changes?: Record<string, any>
  ip_address: string
  user_agent: string
  status: 'success' | 'failure'
  error_message?: string
  response_time_ms: number
  created_at: number
}
