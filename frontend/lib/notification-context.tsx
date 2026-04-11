'use client'

import React, { createContext, useContext, useReducer, useCallback, useRef } from 'react'

export type NotificationType = 'success' | 'error' | 'info' | 'warning'

export interface Notification {
  id: string
  type: NotificationType
  message: string
  duration?: number
}

export interface NotificationContextType {
  notifications: Notification[]
  addNotification: (message: string, type?: NotificationType, duration?: number) => string
  removeNotification: (id: string) => void
  clearNotifications: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

interface NotificationState {
  notifications: Notification[]
}

type NotificationAction =
  | { type: 'ADD'; payload: Notification }
  | { type: 'REMOVE'; payload: string }
  | { type: 'CLEAR' }

const initialState: NotificationState = {
  notifications: [],
}

function notificationReducer(state: NotificationState, action: NotificationAction): NotificationState {
  switch (action.type) {
    case 'ADD':
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
      }
    case 'REMOVE':
      return {
        ...state,
        notifications: state.notifications.filter((n) => n.id !== action.payload),
      }
    case 'CLEAR':
      return {
        ...state,
        notifications: [],
      }
    default:
      return state
  }
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(notificationReducer, initialState)
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map())

  const addNotification = useCallback(
    (message: string, type: NotificationType = 'info', duration: number = 5000) => {
      const id = `notification-${Date.now()}-${Math.random()}`

      const notification: Notification = {
        id,
        type,
        message,
        duration,
      }

      dispatch({ type: 'ADD', payload: notification })

      // Auto-remove notification after duration
      if (duration > 0) {
        const timeout = setTimeout(() => {
          dispatch({ type: 'REMOVE', payload: id })
          timeoutRefs.current.delete(id)
        }, duration)

        timeoutRefs.current.set(id, timeout)
      }

      return id
    },
    []
  )

  const removeNotification = useCallback((id: string) => {
    // Clear timeout if exists
    const timeout = timeoutRefs.current.get(id)
    if (timeout) {
      clearTimeout(timeout)
      timeoutRefs.current.delete(id)
    }

    dispatch({ type: 'REMOVE', payload: id })
  }, [])

  const clearNotifications = useCallback(() => {
    // Clear all timeouts
    timeoutRefs.current.forEach((timeout) => clearTimeout(timeout))
    timeoutRefs.current.clear()

    dispatch({ type: 'CLEAR' })
  }, [])

  const value: NotificationContextType = {
    notifications: state.notifications,
    addNotification,
    removeNotification,
    clearNotifications,
  }

  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  )
}

export function useNotificationContext(): NotificationContextType {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider')
  }
  return context
}

// Alias for convenience
export const useNotification = useNotificationContext
