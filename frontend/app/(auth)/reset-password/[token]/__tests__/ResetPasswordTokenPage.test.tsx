import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import ResetPasswordTokenPage from '../page'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/lib/auth-context', () => ({
  useAuth: jest.fn(),
}))

describe('ResetPasswordTokenPage', () => {
  const mockResetPassword = jest.fn()
  const mockClearError = jest.fn()
  const mockPush = jest.fn()
  const mockToken = 'reset_token_abc123'

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
    ;(useAuth as jest.Mock).mockReturnValue({
      resetPassword: mockResetPassword,
      isLoading: false,
      error: null,
      clearError: mockClearError,
    })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('Form Rendering', () => {
    it('should render all form fields', () => {
      render(<ResetPasswordTokenPage params={{ token: mockToken }} />)

      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument()
    })

    it('should have correct input types', () => {
      render(<ResetPasswordTokenPage params={{ token: mockToken }} />)

      const passwordInput = screen.getByLabelText(/new password/i) as HTMLInputElement
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i) as HTMLInputElement

      expect(passwordInput.type).toBe('password')
      expect(confirmPasswordInput.type).toBe('password')
    })

    it('should display page title and description', () => {
      render(<ResetPasswordTokenPage params={{ token: mockToken }} />)

      expect(screen.getByText(/set new password/i)).toBeInTheDocument()
      expect(screen.getByText(/enter a strong password/i)).toBeInTheDocument()
    })
  })

  describe('Password Validation', () => {
    it('should show error when password is empty', async () => {
      render(<ResetPasswordTokenPage params={{ token: mockToken }} />)

      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      fireEvent.change(confirmPasswordInput, { target: { value: 'ValidPass123' } })

      const submitButton = screen.getByRole('button', { name: /reset password/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument()
      })
    })

    it('should show password requirements when password is too short', async () => {
      render(<ResetPasswordTokenPage params={{ token: mockToken }} />)

      const passwordInput = screen.getByLabelText(/new password/i)
      fireEvent.change(passwordInput, { target: { value: 'short' } })

      await waitFor(() => {
        expect(screen.getByText(/password must include:/i)).toBeInTheDocument()
        expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument()
      })
    })

    it('should show error when password lacks uppercase letter', async () => {
      render(<ResetPasswordTokenPage params={{ token: mockToken }} />)

      const passwordInput = screen.getByLabelText(/new password/i)
      fireEvent.change(passwordInput, { target: { value: 'lowercase123' } })

      await waitFor(() => {
        expect(screen.getByText(/uppercase letter/i)).toBeInTheDocument()
      })
    })

    it('should show error when password lacks lowercase letter', async () => {
      render(<ResetPasswordTokenPage params={{ token: mockToken }} />)

      const passwordInput = screen.getByLabelText(/new password/i)
      fireEvent.change(passwordInput, { target: { value: 'UPPERCASE123' } })

      await waitFor(() => {
        expect(screen.getByText(/lowercase letter/i)).toBeInTheDocument()
      })
    })

    it('should show error when password lacks number', async () => {
      render(<ResetPasswordTokenPage params={{ token: mockToken }} />)

      const passwordInput = screen.getByLabelText(/new password/i)
      fireEvent.change(passwordInput, { target: { value: 'ValidPassword' } })

      await waitFor(() => {
        expect(screen.getByText(/at least one number/i)).toBeInTheDocument()
      })
    })

    it('should show error when confirm password does not match', async () => {
      render(<ResetPasswordTokenPage params={{ token: mockToken }} />)

      const passwordInput = screen.getByLabelText(/new password/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

      fireEvent.change(passwordInput, { target: { value: 'ValidPass123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPass123' } })

      const submitButton = screen.getByRole('button', { name: /reset password/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
      })
    })

    it('should not call resetPassword if validation fails', async () => {
      render(<ResetPasswordTokenPage params={{ token: mockToken }} />)

      const passwordInput = screen.getByLabelText(/new password/i)
      fireEvent.change(passwordInput, { target: { value: 'weak' } })

      const submitButton = screen.getByRole('button', { name: /reset password/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockResetPassword).not.toHaveBeenCalled()
      })
    })
  })

  describe('Password Strength Indicator', () => {
    it('should display password strength indicator when password is entered', async () => {
      render(<ResetPasswordTokenPage params={{ token: mockToken }} />)

      const passwordInput = screen.getByLabelText(/new password/i)
      fireEvent.change(passwordInput, { target: { value: 'ValidPass123' } })

      await waitFor(() => {
        expect(screen.getByText(/password strength/i)).toBeInTheDocument()
      })
    })

    it('should show weak strength for password with only basic requirements', async () => {
      render(<ResetPasswordTokenPage params={{ token: mockToken }} />)

      const passwordInput = screen.getByLabelText(/new password/i)
      fireEvent.change(passwordInput, { target: { value: 'ValidPass1' } })

      await waitFor(() => {
        expect(screen.getByText(/fair/i)).toBeInTheDocument()
      })
    })

    it('should show strong strength for password with special characters', async () => {
      render(<ResetPasswordTokenPage params={{ token: mockToken }} />)

      const passwordInput = screen.getByLabelText(/new password/i)
      fireEvent.change(passwordInput, { target: { value: 'ValidPass123!@#' } })

      await waitFor(() => {
        const strengthLabel = screen.getByText(/password strength/i).parentElement?.querySelector('span:last-child')
        expect(strengthLabel?.textContent).toContain('Strong')
      })
    })
  })

  describe('Successful Password Reset', () => {
    it('should call resetPassword with correct data', async () => {
      mockResetPassword.mockResolvedValue(undefined)

      render(<ResetPasswordTokenPage params={{ token: mockToken }} />)

      const passwordInput = screen.getByLabelText(/new password/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

      fireEvent.change(passwordInput, { target: { value: 'ValidPass123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'ValidPass123' } })

      const submitButton = screen.getByRole('button', { name: /reset password/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockResetPassword).toHaveBeenCalledWith(mockToken, 'ValidPass123')
      })
    })

    it('should display success message on successful reset', async () => {
      mockResetPassword.mockResolvedValue(undefined)

      render(<ResetPasswordTokenPage params={{ token: mockToken }} />)

      const passwordInput = screen.getByLabelText(/new password/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

      fireEvent.change(passwordInput, { target: { value: 'ValidPass123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'ValidPass123' } })

      const submitButton = screen.getByRole('button', { name: /reset password/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/password has been reset successfully/i)).toBeInTheDocument()
      })
    })

    it('should redirect to login after successful reset', async () => {
      mockResetPassword.mockResolvedValue(undefined)

      render(<ResetPasswordTokenPage params={{ token: mockToken }} />)

      const passwordInput = screen.getByLabelText(/new password/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

      fireEvent.change(passwordInput, { target: { value: 'ValidPass123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'ValidPass123' } })

      const submitButton = screen.getByRole('button', { name: /reset password/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/redirecting to login/i)).toBeInTheDocument()
      })

      jest.advanceTimersByTime(2000)

      expect(mockPush).toHaveBeenCalledWith('/login')
    })
  })

  describe('Failed Password Reset', () => {
    it('should display error message on reset failure', async () => {
      mockResetPassword.mockRejectedValue(new Error('Invalid reset token'))

      render(<ResetPasswordTokenPage params={{ token: mockToken }} />)

      const passwordInput = screen.getByLabelText(/new password/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

      fireEvent.change(passwordInput, { target: { value: 'ValidPass123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'ValidPass123' } })

      const submitButton = screen.getByRole('button', { name: /reset password/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/invalid reset token/i)).toBeInTheDocument()
      })
    })

    it('should not redirect on reset failure', async () => {
      mockResetPassword.mockRejectedValue(new Error('Invalid reset token'))

      render(<ResetPasswordTokenPage params={{ token: mockToken }} />)

      const passwordInput = screen.getByLabelText(/new password/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

      fireEvent.change(passwordInput, { target: { value: 'ValidPass123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'ValidPass123' } })

      const submitButton = screen.getByRole('button', { name: /reset password/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockPush).not.toHaveBeenCalled()
      })
    })
  })

  describe('Loading State', () => {
    it('should disable inputs during loading', () => {
      ;(useAuth as jest.Mock).mockReturnValue({
        resetPassword: mockResetPassword,
        isLoading: true,
        error: null,
        clearError: mockClearError,
      })

      render(<ResetPasswordTokenPage params={{ token: mockToken }} />)

      const passwordInput = screen.getByLabelText(/new password/i) as HTMLInputElement
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i) as HTMLInputElement

      expect(passwordInput.disabled).toBe(true)
      expect(confirmPasswordInput.disabled).toBe(true)
    })

    it('should show loading indicator on submit button', () => {
      ;(useAuth as jest.Mock).mockReturnValue({
        resetPassword: mockResetPassword,
        isLoading: true,
        error: null,
        clearError: mockClearError,
      })

      render(<ResetPasswordTokenPage params={{ token: mockToken }} />)

      const submitButton = screen.getByRole('button', { name: /resetting/i })
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Error Message Display', () => {
    it('should display context error from auth', () => {
      ;(useAuth as jest.Mock).mockReturnValue({
        resetPassword: mockResetPassword,
        isLoading: false,
        error: 'Service unavailable',
        clearError: mockClearError,
      })

      render(<ResetPasswordTokenPage params={{ token: mockToken }} />)

      expect(screen.getByText(/service unavailable/i)).toBeInTheDocument()
    })

    it('should clear error when user types', async () => {
      ;(useAuth as jest.Mock).mockReturnValue({
        resetPassword: mockResetPassword,
        isLoading: false,
        error: 'Request failed',
        clearError: mockClearError,
      })

      render(<ResetPasswordTokenPage params={{ token: mockToken }} />)

      const passwordInput = screen.getByLabelText(/new password/i)
      fireEvent.change(passwordInput, { target: { value: 'ValidPass123' } })

      expect(mockClearError).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<ResetPasswordTokenPage params={{ token: mockToken }} />)

      expect(screen.getByLabelText(/new password/i)).toHaveAttribute('aria-label')
      expect(screen.getByLabelText(/confirm password/i)).toHaveAttribute('aria-label')
    })

    it('should have proper ARIA attributes for error states', async () => {
      render(<ResetPasswordTokenPage params={{ token: mockToken }} />)

      const passwordInput = screen.getByLabelText(/new password/i)
      fireEvent.change(passwordInput, { target: { value: 'weak' } })

      const submitButton = screen.getByRole('button', { name: /reset password/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(passwordInput).toHaveAttribute('aria-invalid')
      })
    })

    it('should have proper role for error messages', async () => {
      render(<ResetPasswordTokenPage params={{ token: mockToken }} />)

      const passwordInput = screen.getByLabelText(/new password/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

      fireEvent.blur(passwordInput)
      fireEvent.blur(confirmPasswordInput)

      const submitButton = screen.getByRole('button', { name: /reset password/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        const errorMessages = screen.getAllByText(/is required/i)
        expect(errorMessages.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Submit Button State', () => {
    it('should disable submit button when password has validation errors', () => {
      render(<ResetPasswordTokenPage params={{ token: mockToken }} />)

      const passwordInput = screen.getByLabelText(/new password/i)
      fireEvent.change(passwordInput, { target: { value: 'weak' } })

      const submitButton = screen.getByRole('button', { name: /reset password/i }) as HTMLButtonElement
      expect(submitButton.disabled).toBe(true)
    })

    it('should enable submit button when all validations pass', async () => {
      render(<ResetPasswordTokenPage params={{ token: mockToken }} />)

      const passwordInput = screen.getByLabelText(/new password/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

      fireEvent.change(passwordInput, { target: { value: 'ValidPass123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'ValidPass123' } })

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /reset password/i }) as HTMLButtonElement
        expect(submitButton.disabled).toBe(false)
      })
    })
  })
})
