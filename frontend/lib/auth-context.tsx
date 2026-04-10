'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { apiClient } from './api-client'
import { User, AuthContextType, LoginResponse } from './types/auth'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const TOKEN_KEY = process.env.NEXT_PUBLIC_TOKEN_STORAGE_KEY || 'session_token'
const REFRESH_TOKEN_KEY = process.env.NEXT_PUBLIC_REFRESH_TOKEN_STORAGE_KEY || 'refresh_token'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem(TOKEN_KEY)
        if (token) {
          // Verify token is still valid by making a test request
          // This would typically be a GET /auth/me endpoint
          // For now, we'll assume token is valid if it exists
          setUser(null) // Will be set by login
        }
      } catch (err) {
        console.error('Failed to initialize auth:', err)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await apiClient.post<LoginResponse>('/auth/login', {
          email,
          password,
        })

        if (response.success && response.session_token && response.user) {
          localStorage.setItem(TOKEN_KEY, response.session_token)
          if (response.refresh_token) {
            localStorage.setItem(REFRESH_TOKEN_KEY, response.refresh_token)
          }
          setUser(response.user)
        } else {
          throw new Error(response.error || 'Login failed')
        }
      } catch (err: any) {
        const errorMessage = err.message || 'Login failed. Please try again.'
        setError(errorMessage)
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
      await apiClient.post('/auth/logout', {})
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
      setUser(null)
      setIsLoading(false)
    }
  }, [])

  const requestPasswordReset = useCallback(
    async (email: string) => {
      setIsLoading(true)
      setError(null)

      try {
        await apiClient.post('/auth/reset-password', {
          email,
        })
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to request password reset'
        setError(errorMessage)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const resetPassword = useCallback(
    async (token: string, newPassword: string) => {
      setIsLoading(true)
      setError(null)

      try {
        await apiClient.post('/auth/verify-reset-token', {
          reset_token: token,
          new_password: newPassword,
        })
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to reset password'
        setError(errorMessage)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const register = useCallback(
    async (email: string, password: string, fullName: string) => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await apiClient.post<LoginResponse>('/auth/register', {
          email,
          password,
          full_name: fullName,
        })

        if (response.success) {
          // Registration successful, but don't auto-login
          // User should go to login page
        } else {
          throw new Error(response.error || 'Registration failed')
        }
      } catch (err: any) {
        const errorMessage = err.message || 'Registration failed. Please try again.'
        setError(errorMessage)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    logout,
    register,
    requestPasswordReset,
    resetPassword,
    clearError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
