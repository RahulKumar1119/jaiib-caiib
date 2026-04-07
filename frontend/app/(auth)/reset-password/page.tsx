'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { validateEmail } from '@/lib/utils/validation'

export default function ResetPasswordPage() {
  const { requestPasswordReset, isLoading, error, clearError } = useAuth()
  const [email, setEmail] = useState('')
  const [tenantId, setTenantId] = useState('')
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setSuccess(false)
    clearError()

    // Validation
    if (!email || !tenantId) {
      setFormError('All fields are required')
      return
    }

    if (!validateEmail(email)) {
      setFormError('Please enter a valid email address')
      return
    }

    try {
      await requestPasswordReset(email, tenantId)
      setSuccess(true)
      setEmail('')
      setTenantId('')
    } catch (err: any) {
      setFormError(err.message || 'Failed to request password reset')
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
      <h1 className="text-3xl font-bold text-center mb-2 text-primary-700 dark:text-primary-300">
        Reset Password
      </h1>
      <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
        Enter your email to receive a password reset link
      </p>

      {success && (
        <div className="mb-4 p-4 bg-success-50 dark:bg-success-900 border border-success-200 dark:border-success-700 rounded text-success-700 dark:text-success-200">
          Password reset link has been sent to your email. Please check your inbox.
        </div>
      )}

      {(formError || error) && (
        <div className="mb-4 p-4 bg-danger-50 dark:bg-danger-900 border border-danger-200 dark:border-danger-700 rounded text-danger-700 dark:text-danger-200">
          {formError || error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="tenantId" className="block text-sm font-medium mb-1">
            Organization ID
          </label>
          <input
            id="tenantId"
            type="text"
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            placeholder="Enter your organization ID"
            disabled={isLoading}
            className="w-full"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            disabled={isLoading}
            className="w-full"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition-colors"
        >
          {isLoading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          Remember your password?{' '}
          <Link href="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
            Login here
          </Link>
        </p>
      </div>
    </div>
  )
}
