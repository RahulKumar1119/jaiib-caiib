'use client'

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react'
import { PracticeContextType, PracticeSet, PracticeSetResult, JaiibPaper } from './types/practice'
import { apiClient } from './api-client'

const PracticeContext = createContext<PracticeContextType | undefined>(undefined)

const PRACTICE_STORAGE_KEY = 'practice_session'

interface PracticeState {
  currentPracticeSet: PracticeSet | null
  result: PracticeSetResult | null
  isLoading: boolean
  error: string | null
}

type PracticeAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PRACTICE_SET'; payload: PracticeSet }
  | { type: 'SET_RESULT'; payload: PracticeSetResult }
  | { type: 'CLEAR_PRACTICE_SET' }
  | { type: 'CLEAR_RESULT' }

const initialState: PracticeState = {
  currentPracticeSet: null,
  result: null,
  isLoading: false,
  error: null,
}

function practiceReducer(state: PracticeState, action: PracticeAction): PracticeState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'SET_PRACTICE_SET':
      return { ...state, currentPracticeSet: action.payload, result: null }
    case 'SET_RESULT':
      return { ...state, result: action.payload }
    case 'CLEAR_PRACTICE_SET':
      return { ...state, currentPracticeSet: null }
    case 'CLEAR_RESULT':
      return { ...state, result: null }
    default:
      return state
  }
}

export function PracticeProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(practiceReducer, initialState)

  // Restore practice session from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(PRACTICE_STORAGE_KEY)
        if (stored) {
          const practiceSet = JSON.parse(stored) as PracticeSet
          // Check if session is still valid
          if (practiceSet.session_expires_at > Date.now()) {
            dispatch({ type: 'SET_PRACTICE_SET', payload: practiceSet })
          } else {
            localStorage.removeItem(PRACTICE_STORAGE_KEY)
          }
        }
      } catch (err) {
        console.error('Failed to restore practice session:', err)
      }
    }
  }, [])

  const generatePracticeSet = useCallback(async (paper: JaiibPaper) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })

    try {
      const response = await apiClient.post<{ practice_set: PracticeSet }>(
        '/practice-sets',
        { paper }
      )

      if (response.practice_set) {
        dispatch({ type: 'SET_PRACTICE_SET', payload: response.practice_set })
        // Persist to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem(PRACTICE_STORAGE_KEY, JSON.stringify(response.practice_set))
        }
      } else {
        throw new Error('Failed to generate practice set')
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Unable to generate practice set. Please try again.'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      throw err
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  const submitPracticeSet = useCallback(
    async (answers: Record<string, string | null>, timeTaken: number) => {
      if (!state.currentPracticeSet) {
        throw new Error('No active practice set')
      }

      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      try {
        const response = await apiClient.post<{ score: PracticeSetResult }>(
          `/practice-sets/${state.currentPracticeSet.practice_set_id}/submit`,
          { answers, time_taken: timeTaken }
        )

        if (response.score) {
          dispatch({ type: 'SET_RESULT', payload: response.score })
          // Clear localStorage after successful submission
          if (typeof window !== 'undefined') {
            localStorage.removeItem(PRACTICE_STORAGE_KEY)
          }
        } else {
          throw new Error('Failed to submit practice set')
        }
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to submit practice set'
        dispatch({ type: 'SET_ERROR', payload: errorMessage })
        throw err
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },
    [state.currentPracticeSet]
  )

  const resumePracticeSet = useCallback(async (sessionToken: string) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })

    try {
      const response = await apiClient.get<{ practice_set: PracticeSet }>(
        `/practice-sets/resume?session_token=${sessionToken}`
      )

      if (response.practice_set) {
        dispatch({ type: 'SET_PRACTICE_SET', payload: response.practice_set })
        // Persist to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem(PRACTICE_STORAGE_KEY, JSON.stringify(response.practice_set))
        }
      } else {
        throw new Error('Failed to resume practice set')
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to resume practice set'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      throw err
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null })
  }, [])

  const value: PracticeContextType = {
    currentPracticeSet: state.currentPracticeSet,
    result: state.result,
    isLoading: state.isLoading,
    error: state.error,
    generatePracticeSet,
    submitPracticeSet,
    resumePracticeSet,
    clearError,
  }

  return <PracticeContext.Provider value={value}>{children}</PracticeContext.Provider>
}

export function usePracticeContext(): PracticeContextType {
  const context = useContext(PracticeContext)
  if (context === undefined) {
    throw new Error('usePracticeContext must be used within a PracticeProvider')
  }
  return context
}
