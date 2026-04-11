/**
 * Authentication Context
 * Manages global authentication state and provides auth methods
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { apiClient, AuthResponse, ApiError } from '../services/api'

export interface User {
  user_id: string
  email: string
  full_name: string
  role: string
}

export interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (fullName: string, email: string, password: string, confirmPassword: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (apiClient.isAuthenticated()) {
          const response = await apiClient.getUserProfile()
          if (response.data) {
            setUser(response.data)
          }
        }
      } catch (err) {
        console.error('Auth check failed:', err)
        // Clear tokens if profile fetch fails
        apiClient.logout()
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await apiClient.login(email, password)

      if (response.user) {
        setUser(response.user)
      } else {
        throw new Error('Login failed: No user data returned')
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : String(err)
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const register = useCallback(
    async (fullName: string, email: string, password: string, confirmPassword: string) => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await apiClient.register(fullName, email, password, confirmPassword)

        if (!response.success) {
          throw new Error(response.error || 'Registration failed')
        }
      } catch (err) {
        const message = err instanceof ApiError ? err.message : String(err)
        setError(message)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const logout = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      await apiClient.logout()
      setUser(null)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : String(err)
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await apiClient.resetPassword(email)

      if (!response.success) {
        throw new Error(response.error || 'Password reset failed')
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : String(err)
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    register,
    logout,
    resetPassword,
    clearError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook to use authentication context
 * @throws Error if used outside AuthProvider
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}

export default AuthContext
