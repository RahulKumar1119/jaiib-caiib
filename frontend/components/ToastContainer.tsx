'use client'

import React from 'react'
import { useNotification } from '@/lib/notification-context'
import { Toast } from './Toast'

interface ToastContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  maxToasts?: number
}

export function ToastContainer({ position = 'top-right', maxToasts = 3 }: ToastContainerProps) {
  const { notifications, removeNotification } = useNotification()

  const positionClasses: Record<string, string> = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  }

  const visibleNotifications = notifications.slice(-maxToasts)

  return (
    <div
      className={`
        fixed ${positionClasses[position]} z-50
        flex flex-col gap-2
        pointer-events-none
        max-w-sm
      `}
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      aria-atomic="false"
    >
      {visibleNotifications.map((notification) => (
        <div key={notification.id} className="pointer-events-auto">
          <Toast
            id={notification.id}
            type={notification.type}
            message={notification.message}
            duration={notification.duration}
            onClose={removeNotification}
          />
        </div>
      ))}
    </div>
  )
}
