'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow" aria-label="Main navigation">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <a href="/dashboard" className="text-2xl font-bold text-primary-700 dark:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 rounded px-2 py-1">
            JAIIB-CAIIB Portal
          </a>
          <ul className="flex space-x-4" role="menubar">
            <li role="none">
              <a 
                href="/dashboard" 
                className="text-gray-600 dark:text-gray-400 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 rounded px-2 py-1 transition-colors"
                role="menuitem"
              >
                Dashboard
              </a>
            </li>
            <li role="none">
              <a 
                href="/practice" 
                className="text-gray-600 dark:text-gray-400 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 rounded px-2 py-1 transition-colors"
                role="menuitem"
              >
                Practice
              </a>
            </li>
            <li role="none">
              <a 
                href="/profile" 
                className="text-gray-600 dark:text-gray-400 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 rounded px-2 py-1 transition-colors"
                role="menuitem"
              >
                Profile
              </a>
            </li>
          </ul>
        </div>
      </nav>

      <main id="main-content" className="container mx-auto px-4 py-8" role="main">
        {children}
      </main>
    </div>
  )
}
