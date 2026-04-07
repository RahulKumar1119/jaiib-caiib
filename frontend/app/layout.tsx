import type { Metadata } from 'next'
import { AuthProvider } from '@/lib/auth-context'
import { NotificationProvider } from '@/lib/notification-context'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'JAIIB-CAIIB Exam Prep Portal',
  description: 'Prepare for JAIIB and CAIIB exams with interactive practice sets and AI-powered explanations',
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
        <AuthProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
