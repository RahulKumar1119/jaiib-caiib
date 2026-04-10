'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { AppError } from './utils/api-error-handler'

interface ErrorContextType {
  errors: AppError[]
  setError: (error: AppError) => void
  clearError: (errorId: string) => void
  addError: (error: AppError) => string
  clearAllErrors: () => void
  getLatestError: () => AppError | null
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined)

export function ErrorProvider({ children }: { children: React.ReactNode }) {
  const [errors, setErrors] = useState<AppError[]>([])

  const setError = useCallback((error: AppError) => {
    setErrors((prev) => {
      // Replace existing error with same type, or add new one
      const filtered = prev.filter((e) => e.type !== error.type)
      return [...filtered, error]
    })
  }, [])

  const addError = useCallback((error: AppError) => {
    setErrors((prev) => [...prev, error])
    return error.id
  }, [])

  const clearError = useCallback((errorId: string) => {
    setErrors((prev) => prev.filter((e) => e.id !== errorId))
  }, [])

  const clearAllErrors = useCallback(() => {
    setErrors([])
  }, [])

  const getLatestError = useCallback((): AppError | null => {
    return errors.length > 0 ? errors[errors.length - 1] : null
  }, [errors])

  const value: ErrorContextType = {
    errors,
    setError,
    clearError,
    addError,
    clearAllErrors,
    getLatestError,
  }

  return <ErrorContext.Provider value={value}>{children}</ErrorContext.Provider>
}

export function useError(): ErrorContextType {
  const context = useContext(ErrorContext)
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider')
  }
  return context
}
