'use client'

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react'
import { DashboardContextType, DashboardMetrics, JaiibPaper } from './types/score'
import { apiClient } from './api-client'

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

const DASHBOARD_CACHE_KEY = 'dashboard_metrics'
const DASHBOARD_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

interface DashboardState {
  metrics: DashboardMetrics | null
  selectedPaper: JaiibPaper | null
  isLoading: boolean
  error: string | null
  lastFetchTime: number | null
}

type DashboardAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_METRICS'; payload: DashboardMetrics }
  | { type: 'SET_SELECTED_PAPER'; payload: JaiibPaper | null }
  | { type: 'SET_LAST_FETCH_TIME'; payload: number }

const initialState: DashboardState = {
  metrics: null,
  selectedPaper: null,
  isLoading: false,
  error: null,
  lastFetchTime: null,
}

function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'SET_METRICS':
      return { ...state, metrics: action.payload }
    case 'SET_SELECTED_PAPER':
      return { ...state, selectedPaper: action.payload }
    case 'SET_LAST_FETCH_TIME':
      return { ...state, lastFetchTime: action.payload }
    default:
      return state
  }
}

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState)

  // Restore cached metrics from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(DASHBOARD_CACHE_KEY)
        if (cached) {
          const { metrics, timestamp } = JSON.parse(cached)
          // Check if cache is still valid
          if (Date.now() - timestamp < DASHBOARD_CACHE_TTL) {
            dispatch({ type: 'SET_METRICS', payload: metrics })
            dispatch({ type: 'SET_LAST_FETCH_TIME', payload: timestamp })
          } else {
            localStorage.removeItem(DASHBOARD_CACHE_KEY)
          }
        }
      } catch (err) {
        console.error('Failed to restore dashboard cache:', err)
      }
    }
  }, [])

  const fetchMetrics = useCallback(async (paper?: JaiibPaper) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })

    try {
      const params = paper ? `?paper=${paper}` : ''
      const response = await apiClient.get<{ metrics: DashboardMetrics }>(
        `/dashboard/metrics${params}`
      )

      if (response.metrics) {
        dispatch({ type: 'SET_METRICS', payload: response.metrics })
        const now = Date.now()
        dispatch({ type: 'SET_LAST_FETCH_TIME', payload: now })

        // Cache metrics in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            DASHBOARD_CACHE_KEY,
            JSON.stringify({
              metrics: response.metrics,
              timestamp: now,
            })
          )
        }
      } else {
        throw new Error('Failed to fetch dashboard metrics')
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load dashboard metrics'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      throw err
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  const selectPaper = useCallback((paper: JaiibPaper | null) => {
    dispatch({ type: 'SET_SELECTED_PAPER', payload: paper })
  }, [])

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null })
  }, [])

  const value: DashboardContextType = {
    metrics: state.metrics,
    selectedPaper: state.selectedPaper,
    isLoading: state.isLoading,
    error: state.error,
    fetchMetrics,
    selectPaper,
    clearError,
  }

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
}

export function useDashboardContext(): DashboardContextType {
  const context = useContext(DashboardContext)
  if (context === undefined) {
    throw new Error('useDashboardContext must be used within a DashboardProvider')
  }
  return context
}
