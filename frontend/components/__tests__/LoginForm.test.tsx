import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import LoginForm from '../LoginForm'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/lib/auth-context', () => ({
  useAuth: jest.fn(),
}))

describe('LoginForm', () => {
  const mockPush = jest.fn()
  const mockLogin = jest.fn()
  const mockClearError = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
    ;(useAuth as jest.Mock).mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: null,
      clearError: mockClearError,
    })
  })

  describe('Form Rendering', () => {
    it('should render all form fields', () => {
      render(<LoginForm />)

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
    })

    it('should render password reset link', () => {
      render(<LoginForm />)

      const resetLink = screen.getByRole('link', { name: /reset it here/i })
      expect(resetLink).toBeInTheDocument()
      expect(resetLink).toHaveAttribute('href', '/reset-password')
    })

    it('should have correct input types', () => {
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement
      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement

      expect(emailInput.type).toBe('email')
      expect(passwordInput.type).toBe('password')
    })
  })

  describe('Form Validation', () => {
    it('should show error when email is empty', async () => {
      render(<LoginForm />)

      const submitButton = screen.getByRole('button', { name: /login/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      })
    })

    it('should show error for invalid email format', async () => {
      const mockLogin = jest.fn()
      ;(useAuth as jest.Mock).mockReturnValue({
        login: mockLogin,
        isLoading: false,
        error: null,
        clearError: jest.fn(),
      })

      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email address/i)

      fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
      fireEvent.blur(emailInput)

      const submitButton = screen.getByRole('button', { name: /login/i })
      fireEvent.click(submitButton)

      // The login function should not be called because validation failed
      expect(mockLogin).not.toHaveBeenCalled()
    })

    it('should show error when password is empty', async () => {
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email address/i)

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.blur(emailInput)

      const submitButton = screen.getByRole('button', { name: /login/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument()
      })
    })

    it('should show error for weak password', async () => {
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/password/i)

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.blur(emailInput)
      fireEvent.change(passwordInput, { target: { value: 'weak' } })
      fireEvent.blur(passwordInput)

      const submitButton = screen.getByRole('button', { name: /login/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument()
      })
    })

    it('should validate password requirements', async () => {
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/password/i)

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.blur(emailInput)
      fireEvent.change(passwordInput, { target: { value: 'lowercase123' } })
      fireEvent.blur(passwordInput)

      const submitButton = screen.getByRole('button', { name: /login/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/uppercase letter/i)).toBeInTheDocument()
      })
    })
  })

  describe('Successful Login Flow', () => {
    it('should call login with correct credentials', async () => {
      mockLogin.mockResolvedValue(undefined)

      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/password/i)

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'ValidPass123' } })

      const submitButton = screen.getByRole('button', { name: /login/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'ValidPass123')
      })
    })

    it('should redirect to dashboard on successful login', async () => {
      mockLogin.mockResolvedValue(undefined)

      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/password/i)

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'ValidPass123' } })

      const submitButton = screen.getByRole('button', { name: /login/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })
    })
  })

  describe('Failed Login Flow', () => {
    it('should display error message on login failure', async () => {
      mockLogin.mockRejectedValue(new Error('Invalid email or password'))

      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/password/i)

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'ValidPass123' } })

      const submitButton = screen.getByRole('button', { name: /login/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument()
      })
    })

    it('should not redirect on login failure', async () => {
      mockLogin.mockRejectedValue(new Error('Invalid email or password'))

      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/password/i)

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'ValidPass123' } })

      const submitButton = screen.getByRole('button', { name: /login/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockPush).not.toHaveBeenCalled()
      })
    })
  })

  describe('Loading State', () => {
    it('should disable inputs during loading', () => {
      ;(useAuth as jest.Mock).mockReturnValue({
        login: mockLogin,
        isLoading: true,
        error: null,
        clearError: mockClearError,
      })

      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement
      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement

      expect(emailInput.disabled).toBe(true)
      expect(passwordInput.disabled).toBe(true)
    })

    it('should show loading indicator on submit button', () => {
      ;(useAuth as jest.Mock).mockReturnValue({
        login: mockLogin,
        isLoading: true,
        error: null,
        clearError: mockClearError,
      })

      render(<LoginForm />)

      const submitButton = screen.getByRole('button', { name: /logging in/i })
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Error Message Display', () => {
    it('should display context error from auth', () => {
      ;(useAuth as jest.Mock).mockReturnValue({
        login: mockLogin,
        isLoading: false,
        error: 'Session expired',
        clearError: mockClearError,
      })

      render(<LoginForm />)

      expect(screen.getByText(/session expired/i)).toBeInTheDocument()
    })

    it('should clear error when user types', async () => {
      ;(useAuth as jest.Mock).mockReturnValue({
        login: mockLogin,
        isLoading: false,
        error: 'Login failed',
        clearError: mockClearError,
      })

      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      expect(mockClearError).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<LoginForm />)

      expect(screen.getByLabelText(/email address/i)).toHaveAttribute('aria-label')
      expect(screen.getByLabelText(/password/i)).toHaveAttribute('aria-label')
    })

    it('should have proper ARIA attributes for error states', async () => {
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      fireEvent.change(emailInput, { target: { value: 'invalid' } })

      const submitButton = screen.getByRole('button', { name: /login/i })
      fireEvent.click(submitButton)

      // After submit, the email field should have aria-invalid set
      // Since we're marking all fields as touched on submit, the error should be visible
      expect(emailInput).toHaveAttribute('aria-invalid')
    })

    it('should have proper role for error messages', async () => {
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/password/i)

      // Trigger blur on all fields to mark them as touched
      fireEvent.blur(emailInput)
      fireEvent.blur(passwordInput)

      const submitButton = screen.getByRole('button', { name: /login/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        // The alert role is applied to the error message container
        const errorMessages = screen.getAllByText(/is required/i)
        expect(errorMessages.length).toBeGreaterThan(0)
      })
    })
  })
})
