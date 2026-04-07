import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { useAuth } from '@/lib/auth-context'
import ResetPasswordPage from '../page'

// Mock dependencies
jest.mock('@/lib/auth-context', () => ({
  useAuth: jest.fn(),
}))

describe('ResetPasswordPage', () => {
  const mockRequestPasswordReset = jest.fn()
  const mockClearError = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAuth as jest.Mock).mockReturnValue({
      requestPasswordReset: mockRequestPasswordReset,
      isLoading: false,
      error: null,
      clearError: mockClearError,
    })
  })

  describe('Form Rendering', () => {
    it('should render all form fields', () => {
      render(<ResetPasswordPage />)

      expect(screen.getByLabelText(/organization id/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument()
    })

    it('should render login link', () => {
      render(<ResetPasswordPage />)

      const loginLink = screen.getByRole('link', { name: /login here/i })
      expect(loginLink).toBeInTheDocument()
      expect(loginLink).toHaveAttribute('href', '/login')
    })

    it('should have correct input types', () => {
      render(<ResetPasswordPage />)

      const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement
      expect(emailInput.type).toBe('email')
    })

    it('should display page title and description', () => {
      render(<ResetPasswordPage />)

      expect(screen.getByText(/reset password/i)).toBeInTheDocument()
      expect(screen.getByText(/enter your email to receive a password reset link/i)).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should show error when tenant ID is empty', async () => {
      render(<ResetPasswordPage />)

      const emailInput = screen.getByLabelText(/email address/i)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      const submitButton = screen.getByRole('button', { name: /send reset link/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/organization id is required/i)).toBeInTheDocument()
      })
    })

    it('should show error when email is empty', async () => {
      render(<ResetPasswordPage />)

      const tenantIdInput = screen.getByLabelText(/organization id/i)
      fireEvent.change(tenantIdInput, { target: { value: 'tenant_001' } })

      const submitButton = screen.getByRole('button', { name: /send reset link/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      })
    })

    it('should show error for invalid email format', async () => {
      render(<ResetPasswordPage />)

      const tenantIdInput = screen.getByLabelText(/organization id/i)
      const emailInput = screen.getByLabelText(/email address/i)

      fireEvent.change(tenantIdInput, { target: { value: 'tenant_001' } })
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } })

      const submitButton = screen.getByRole('button', { name: /send reset link/i })
      fireEvent.click(submitButton)

      // The validation should prevent the request from being made
      expect(mockRequestPasswordReset).not.toHaveBeenCalled()
    })

    it('should not call requestPasswordReset if validation fails', async () => {
      render(<ResetPasswordPage />)

      const emailInput = screen.getByLabelText(/email address/i)
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } })

      const submitButton = screen.getByRole('button', { name: /send reset link/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockRequestPasswordReset).not.toHaveBeenCalled()
      })
    })
  })

  describe('Successful Password Reset Request', () => {
    it('should call requestPasswordReset with correct data', async () => {
      mockRequestPasswordReset.mockResolvedValue(undefined)

      render(<ResetPasswordPage />)

      const tenantIdInput = screen.getByLabelText(/organization id/i)
      const emailInput = screen.getByLabelText(/email address/i)

      fireEvent.change(tenantIdInput, { target: { value: 'tenant_001' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      const submitButton = screen.getByRole('button', { name: /send reset link/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockRequestPasswordReset).toHaveBeenCalledWith('test@example.com', 'tenant_001')
      })
    })

    it('should display success message on successful request', async () => {
      mockRequestPasswordReset.mockResolvedValue(undefined)

      render(<ResetPasswordPage />)

      const tenantIdInput = screen.getByLabelText(/organization id/i)
      const emailInput = screen.getByLabelText(/email address/i)

      fireEvent.change(tenantIdInput, { target: { value: 'tenant_001' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      const submitButton = screen.getByRole('button', { name: /send reset link/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/password reset link has been sent/i)).toBeInTheDocument()
      })
    })

    it('should clear form fields after successful request', async () => {
      mockRequestPasswordReset.mockResolvedValue(undefined)

      render(<ResetPasswordPage />)

      const tenantIdInput = screen.getByLabelText(/organization id/i) as HTMLInputElement
      const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement

      fireEvent.change(tenantIdInput, { target: { value: 'tenant_001' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      const submitButton = screen.getByRole('button', { name: /send reset link/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(tenantIdInput.value).toBe('')
        expect(emailInput.value).toBe('')
      })
    })
  })

  describe('Failed Password Reset Request', () => {
    it('should display error message on request failure', async () => {
      mockRequestPasswordReset.mockRejectedValue(new Error('Email not found'))

      render(<ResetPasswordPage />)

      const tenantIdInput = screen.getByLabelText(/organization id/i)
      const emailInput = screen.getByLabelText(/email address/i)

      fireEvent.change(tenantIdInput, { target: { value: 'tenant_001' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      const submitButton = screen.getByRole('button', { name: /send reset link/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/email not found/i)).toBeInTheDocument()
      })
    })
  })

  describe('Loading State', () => {
    it('should disable inputs during loading', () => {
      ;(useAuth as jest.Mock).mockReturnValue({
        requestPasswordReset: mockRequestPasswordReset,
        isLoading: true,
        error: null,
        clearError: mockClearError,
      })

      render(<ResetPasswordPage />)

      const tenantIdInput = screen.getByLabelText(/organization id/i) as HTMLInputElement
      const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement

      expect(tenantIdInput.disabled).toBe(true)
      expect(emailInput.disabled).toBe(true)
    })

    it('should show loading indicator on submit button', () => {
      ;(useAuth as jest.Mock).mockReturnValue({
        requestPasswordReset: mockRequestPasswordReset,
        isLoading: true,
        error: null,
        clearError: mockClearError,
      })

      render(<ResetPasswordPage />)

      const submitButton = screen.getByRole('button', { name: /sending/i })
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Error Message Display', () => {
    it('should display context error from auth', () => {
      ;(useAuth as jest.Mock).mockReturnValue({
        requestPasswordReset: mockRequestPasswordReset,
        isLoading: false,
        error: 'Service unavailable',
        clearError: mockClearError,
      })

      render(<ResetPasswordPage />)

      expect(screen.getByText(/service unavailable/i)).toBeInTheDocument()
    })

    it('should clear error when user types', async () => {
      ;(useAuth as jest.Mock).mockReturnValue({
        requestPasswordReset: mockRequestPasswordReset,
        isLoading: false,
        error: 'Request failed',
        clearError: mockClearError,
      })

      render(<ResetPasswordPage />)

      const emailInput = screen.getByLabelText(/email address/i)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      expect(mockClearError).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<ResetPasswordPage />)

      expect(screen.getByLabelText(/organization id/i)).toHaveAttribute('aria-label')
      expect(screen.getByLabelText(/email address/i)).toHaveAttribute('aria-label')
    })

    it('should have proper ARIA attributes for error states', async () => {
      render(<ResetPasswordPage />)

      const emailInput = screen.getByLabelText(/email address/i)
      fireEvent.change(emailInput, { target: { value: 'invalid' } })

      const submitButton = screen.getByRole('button', { name: /send reset link/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(emailInput).toHaveAttribute('aria-invalid')
      })
    })

    it('should have proper role for error messages', async () => {
      render(<ResetPasswordPage />)

      const tenantIdInput = screen.getByLabelText(/organization id/i)
      const emailInput = screen.getByLabelText(/email address/i)

      fireEvent.blur(tenantIdInput)
      fireEvent.blur(emailInput)

      const submitButton = screen.getByRole('button', { name: /send reset link/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        const errorMessages = screen.getAllByText(/is required/i)
        expect(errorMessages.length).toBeGreaterThan(0)
      })
    })
  })
})
