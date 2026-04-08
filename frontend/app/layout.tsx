import type { Metadata, Viewport } from 'next'
import { AuthProvider } from '@/lib/auth-context'
import { NotificationProvider } from '@/lib/notification-context'
import { ToastContainer } from '@/components/ToastContainer'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'JAIIB-CAIIB Exam Prep Portal',
  description: 'Prepare for JAIIB and CAIIB exams with interactive practice sets and AI-powered explanations',
  robots: 'index, follow',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
        <a href="#main-content" className="skip-to-main">
          Skip to main content
        </a>
        <AuthProvider>
          <NotificationProvider>
            <ToastContainer position="top-right" maxToasts={3} />
            {children}
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
