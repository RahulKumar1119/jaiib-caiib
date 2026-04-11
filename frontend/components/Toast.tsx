'use client'

import React, { useEffect, useState } from 'react'
import { NotificationType } from '@/lib/notification-context'

interface ToastProps {
  id: string
  type: NotificationType
  message: string
  duration?: number
  onClose: (id: string) => void
  action?: {
    label: string
    onClick: () => void
  }
}

const iconMap: Record<NotificationType, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
}

const colorMap: Record<NotificationType, string> = {
  success: 'bg-green-50 border-green-200 dark:bg-green-900 dark:border-green-700',
  error: 'bg-red-50 border-red-200 dark:bg-red-900 dark:border-red-700',
  warning: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900 dark:border-yellow-700',
  info: 'bg-blue-50 border-blue-200 dark:bg-blue-900 dark:border-blue-700',
}

const textColorMap: Record<NotificationType, string> = {
  success: 'text-green-800 dark:text-green-100',
  error: 'text-red-800 dark:text-red-100',
  warning: 'text-yellow-800 dark:text-yellow-100',
  info: 'text-blue-800 dark:text-blue-100',
}

const iconColorMap: Record<NotificationType, string> = {
  success: 'text-green-600 dark:text-green-400',
  error: 'text-red-600 dark:text-red-400',
  warning: 'text-yellow-600 dark:text-yellow-400',
  info: 'text-blue-600 dark:text-blue-400',
}

export function Toast({ id, type, message, duration = 5000, onClose, action }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => onClose(id), 300) // Allow animation to complete
      }, duration)

      return () => clearTimeout(timer)
    }
    return undefined
  }, [duration, id, onClose])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => onClose(id), 300)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose()
    }
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      className={`
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
      `}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div
        className={`
          flex items-start gap-3 p-4 rounded-lg border
          ${colorMap[type]} ${textColorMap[type]}
          shadow-lg
        `}
      >
        <span className={`flex-shrink-0 text-lg font-bold ${iconColorMap[type]}`}>
          {iconMap[type]}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium break-words">{message}</p>
        </div>
        {action && (
          <button
            onClick={action.onClick}
            className={`
              flex-shrink-0 text-sm font-medium underline
              hover:opacity-80 transition-opacity
              focus:outline-none focus:ring-2 focus:ring-offset-2
              focus:ring-offset-transparent
            `}
          >
            {action.label}
          </button>
        )}
        <button
          onClick={handleClose}
          className={`
            flex-shrink-0 text-lg font-bold
            hover:opacity-60 transition-opacity
            focus:outline-none focus:ring-2 focus:ring-offset-2
            focus:ring-offset-transparent
          `}
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  )
}
