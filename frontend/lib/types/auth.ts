export type UserRole = 'officer' | 'admin' | 'super_admin'
export type UserStatus = 'active' | 'inactive' | 'suspended'

export interface User {
  user_id: string
  email: string
  full_name: string
  role: UserRole
  status: UserStatus
  tenant_id: string
  created_at: number
  updated_at: number
  last_login?: number
  mfa_enabled: boolean
  preferences?: Record<string, any>
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  success: boolean
  user?: User
  session_token?: string
  refresh_token?: string
  expires_in?: number
  error?: string
}

export interface SessionData {
  user_id: string
  tenant_id: string
  role: UserRole
  email: string
  expires_at: number
}

export interface PasswordResetRequest {
  email: string
}

export interface PasswordResetResponse {
  success: boolean
  message?: string
  error?: string
}

export interface VerifyResetTokenRequest {
  reset_token: string
  new_password: string
}

export interface VerifyResetTokenResponse {
  success: boolean
  message?: string
  error?: string
}

export interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (email: string, password: string, fullName: string) => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  resetPassword: (token: string, newPassword: string) => Promise<void>
  clearError: () => void
}
