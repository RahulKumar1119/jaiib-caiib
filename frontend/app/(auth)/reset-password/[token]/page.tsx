'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { validatePassword } from '@/lib/utils/validation'

export default function ResetPasswordTokenPage({
  params,
}: {
  params: { token: string }
}) {
  const router = useRouter()
  const { resetPassword, isLoading, error, clearError } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formError, setFormError] = useState('')
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])
  const [success, setSuccess] = useState(false)

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    const validation = validatePassword(value)
    setPasswordErrors(validation.errors)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setSuccess(false)
    clearError()

    // Validation
    if (!password || !confirmPassword) {
      setFormError('All fields are required')
      return
    }

    const validation = validatePassword(password)
    if (!validation.isValid) {
      setFormError('Password does not meet requirements')
      return
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match')
      return
    }

    try {
      await resetPassword(params.token, password)
      setSuccess(true)
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (err: any) {
      setFormError(err.message || 'Failed to reset password')
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
      <h1 className="text-3xl font-bold text-center mb-2 text-primary-700 dark:text-primary-300">
        Set New Password
      </h1>
      <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
        Enter your new password below
      </p>

      {success && (
        <div className="mb-4 p-4 bg-success-50 dark:bg-success-900 border border-success-200 dark:border-success-700 rounded text-success-700 dark:text-success-200">
          Password reset successfully! Redirecting to login...
        </div>
      )}

      {(formError || error) && (
        <div className="mb-4 p-4 bg-danger-50 dark:bg-danger-900 border border-danger-200 dark:border-danger-700 rounded text-danger-700 dark:text-danger-200">
          {formError || error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            New Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            placeholder="••••••••"
            disabled={isLoading}
            className="w-full"
          />
          {passwordErrors.length > 0 && (
            <ul className="mt-2 text-sm text-danger-600 dark:text-danger-400">
              {passwordErrors.map((err, idx) => (
                <li key={idx}>• {err}</li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            disabled={isLoading}
            className="w-full"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || passwordErrors.length > 0}
          className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition-colors"
        >
          {isLoading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    </div>
  )
}
