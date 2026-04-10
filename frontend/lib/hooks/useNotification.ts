'use client'

import { useNotificationContext } from '../notification-context'

export function useNotification() {
  return useNotificationContext()
}
