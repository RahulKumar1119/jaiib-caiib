'use client'

import LoginForm from '@/components/LoginForm'

export default function LoginPage() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
      <h1 className="text-3xl font-bold text-center mb-2 text-primary-700 dark:text-primary-300">
        Login
      </h1>
      <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
        Sign in to your account
      </p>

      <LoginForm />
    </div>
  )
}
