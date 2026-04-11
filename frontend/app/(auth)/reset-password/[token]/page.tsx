'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { validatePassword } from '@/lib/utils/validation'

interface FormErrors {
  password?: string
  confirmPassword?: string
  submit?: string
}

interface PasswordStrength {
  score: number
  label: string
  color: string
}

export default function ResetPasswordTokenPage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string
  const { resetPassword, isLoading, error, clearError } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])
  const [success, setSuccess] = useState(false)

  // Clear errors when user starts typing
  useEffect(() => {
    if (error) {
      clearError()
    }
  }, [password, confirmPassword, error, clearError])

  // Update password validation errors as user types
  useEffect(() => {
    if (password) {
      const validation = validatePassword(password)
      setPasswordErrors(validation.errors)
    } else {
      setPasswordErrors([])
    }
  }, [password])

  const getPasswordStrength = (): PasswordStrength => {
    if (!password) {
      return { score: 0, label: '', color: '' }
    }

    const validation = validatePassword(password)
    if (!validation.isValid) {
      return { score: 1, label: 'Weak', color: 'text-red-600 dark:text-red-400' }
    }

    // Check for additional strength indicators
    let score = 2
    if (password.length >= 12) score++
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++

    if (score >= 4) {
      return { score: 4, label: 'Strong', color: 'text-green-600 dark:text-green-400' }
    } else if (score >= 3) {
      return { score: 3, label: 'Good', color: 'text-blue-600 dark:text-blue-400' }
    } else {
      return { score: 2, label: 'Fair', color: 'text-yellow-600 dark:text-yellow-400' }
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!password) {
      newErrors.password = 'Password is required'
    } else {
      const validation = validatePassword(password)
      if (!validation.isValid) {
        newErrors.password = 'Password does not meet requirements'
      }
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setSuccess(false)

    // Mark all fields as touched to show validation errors
    setTouched({
      password: true,
      confirmPassword: true,
    })

    if (!validateForm()) {
      return
    }

    try {
      await resetPassword(token, password)
      setSuccess(true)
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (err: any) {
      setErrors({
        submit: err.message || 'Failed to reset password',
      })
    }
  }

  const passwordStrength = getPasswordStrength()

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md mx-auto">
      <h1 className="text-3xl font-bold text-center mb-2 text-primary-700 dark:text-primary-300">
        Set New Password
      </h1>
      <p className="text-center text-gray-600 dark:text-gray-400 mb-8 text-sm">
        Enter a strong password to secure your account
      </p>

      {/* Success Message */}
      {success && (
        <div
          className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-200 text-sm"
          role="alert"
        >
          <p className="font-semibold mb-1">Success!</p>
          <p>Your password has been reset successfully. Redirecting to login...</p>
        </div>
      )}

      {/* Error Message */}
      {(errors.submit || error) && (
        <div
          className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-200 text-sm"
          role="alert"
        >
          {errors.submit || error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Password Field */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            New Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => handleBlur('password')}
            placeholder="••••••••"
            disabled={isLoading || success}
            autoComplete="new-password"
            aria-label="New password"
            aria-invalid={!!errors.password}
            aria-describedby={
              errors.password
                ? 'password-error'
                : passwordErrors.length > 0
                  ? 'password-requirements'
                  : undefined
            }
            className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors ${
              errors.password && touched.password
                ? 'border-red-500 dark:border-red-400 focus:ring-red-500'
                : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'
            } focus:outline-none focus:ring-2`}
          />

          {/* Password Strength Indicator */}
          {password && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Password Strength
                </span>
                {passwordStrength.label && (
                  <span className={`text-xs font-semibold ${passwordStrength.color}`}>
                    {passwordStrength.label}
                  </span>
                )}
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    passwordStrength.score === 1
                      ? 'w-1/4 bg-red-500'
                      : passwordStrength.score === 2
                        ? 'w-2/4 bg-yellow-500'
                        : passwordStrength.score === 3
                          ? 'w-3/4 bg-blue-500'
                          : 'w-full bg-green-500'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Password Requirements */}
          {passwordErrors.length > 0 && (
            <div
              id="password-requirements"
              className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
              <p className="text-xs font-semibold text-red-700 dark:text-red-200 mb-2">
                Password must include:
              </p>
              <ul className="space-y-1 text-xs text-red-600 dark:text-red-300">
                {passwordErrors.map((err, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>{err}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {errors.password && touched.password && (
            <p id="password-error" className="mt-2 text-sm text-red-600 dark:text-red-400">
              {errors.password}
            </p>
          )}
        </div>

        {/* Confirm Password Field */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onBlur={() => handleBlur('confirmPassword')}
            placeholder="••••••••"
            disabled={isLoading || success}
            autoComplete="new-password"
            aria-label="Confirm password"
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
            className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors ${
              errors.confirmPassword && touched.confirmPassword
                ? 'border-red-500 dark:border-red-400 focus:ring-red-500'
                : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'
            } focus:outline-none focus:ring-2`}
          />
          {errors.confirmPassword && touched.confirmPassword && (
            <p id="confirmPassword-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || success || passwordErrors.length > 0}
          aria-busy={isLoading}
          className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Resetting...</span>
            </>
          ) : (
            'Reset Password'
          )}
        </button>
      </form>
    </div>
  )
}
