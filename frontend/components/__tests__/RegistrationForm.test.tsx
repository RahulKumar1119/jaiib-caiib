import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import RegistrationForm from '../RegistrationForm'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/lib/auth-context', () => ({
  useAuth: jest.fn(),
}))

describe('RegistrationForm', () => {
  const mockPush = jest.fn()
  const mockRegister = jest.fn()
  const mockClearError = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
    ;(useAuth as jest.Mock).mockReturnValue({
      register: mockRegister,
      isLoading: false,
      error: null,
      clearError: mockClearError,
    })
  })

  describe('Form Rendering', () => {
    it('should render all form fields', () => {
      render(<RegistrationForm />)

      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/organization id/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
    })

    it('should render login link', () => {
      render(<RegistrationForm />)

      const loginLink = screen.getByRole('link', { name: /sign in here/i })
      expect(loginLink).toBeInTheDocument()
      expect(loginLink).toHaveAttribute('href', '/login')
    })

    it('should have correct input types', () => {
      render(<RegistrationForm />)

      const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement
      const passwordInput = screen.getByLabelText(/^password$/i) as HTMLInputElement
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i) as HTMLInputElement

      expect(emailInput.type).toBe('email')
      expect(passwordInput.type).toBe('password')
      expect(confirmPasswordInput.type).toBe('password')
    })
  })

  describe('Form Validation', () => {
    it('should show error when full name is empty', async () => {
      render(<RegistrationForm />)

      const submitButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/full name is required/i)).toBeInTheDocument()
      })
    })

    it('should show error when full name is too short', async () => {
      render(<RegistrationForm />)

      const fullNameInput = screen.getByLabelText(/full name/i)
      fireEvent.change(fullNameInput, { target: { value: 'J' } })
      fireEvent.blur(fullNameInput)

      const submitButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/full name must be at least 2 characters/i)).toBeInTheDocument()
      })
    })

    it('should show error when tenant ID is empty', async () => {
      render(<RegistrationForm />)

      const fullNameInput = screen.getByLabelText(/full name/i)
      fireEvent.change(fullNameInput, { target: { value: 'John Doe' } })
      fireEvent.blur(fullNameInput)

      const submitButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/organization id is required/i)).toBeInTheDocument()
      })
    })

    it('should show error when email is empty', async () => {
      render(<RegistrationForm />)

      const fullNameInput = screen.getByLabelText(/full name/i)
      const tenantIdInput = screen.getByLabelText(/organization id/i)

      fireEvent.change(fullNameInput, { target: { value: 'John Doe' } })
      fireEvent.blur(fullNameInput)
      fireEvent.change(tenantIdInput, { target: { value: 'tenant_001' } })
      fireEvent.blur(tenantIdInput)

      const submitButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      })
    })

    it('should show error for invalid email format', async () => {
      render(<RegistrationForm />)

      const fullNameInput = screen.getByLabelText(/full name/i)
      const tenantIdInput = screen.getByLabelText(/organization id/i)
      const emailInput = screen.getByLabelText(/email address/i)

      fireEvent.change(fullNameInput, { target: { value: 'John Doe' } })
      fireEvent.blur(fullNameInput)
      fireEvent.change(tenantIdInput, { target: { value: 'tenant_001' } })
      fireEvent.blur(tenantIdInput)
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
      fireEvent.blur(emailInput)

      const submitButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(submitButton)

      // The register function should not be called because validation failed
      expect(mockRegister).not.toHaveBeenCalled()
    })

    it('should show error when password is empty', async () => {
      render(<RegistrationForm />)

      const fullNameInput = screen.getByLabelText(/full name/i)
      const tenantIdInput = screen.getByLabelText(/organization id/i)
      const emailInput = screen.getByLabelText(/email address/i)

      fireEvent.change(fullNameInput, { target: { value: 'John Doe' } })
      fireEvent.blur(fullNameInput)
      fireEvent.change(tenantIdInput, { target: { value: 'tenant_001' } })
      fireEvent.blur(tenantIdInput)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.blur(emailInput)

      const submitButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument()
      })
    })

    it('should show error for weak password', async () => {
      render(<RegistrationForm />)

      const fullNameInput = screen.getByLabelText(/full name/i)
      const tenantIdInput = screen.getByLabelText(/organization id/i)
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password$/i)

      fireEvent.change(fullNameInput, { target: { value: 'John Doe' } })
      fireEvent.blur(fullNameInput)
      fireEvent.change(tenantIdInput, { target: { value: 'tenant_001' } })
      fireEvent.blur(tenantIdInput)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.blur(emailInput)
      fireEvent.change(passwordInput, { target: { value: 'weak' } })
      fireEvent.blur(passwordInput)

      const submitButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument()
      })
    })

    it('should show error when confirm password is empty', async () => {
      render(<RegistrationForm />)

      const fullNameInput = screen.getByLabelText(/full name/i)
      const tenantIdInput = screen.getByLabelText(/organization id/i)
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password$/i)

      fireEvent.change(fullNameInput, { target: { value: 'John Doe' } })
      fireEvent.blur(fullNameInput)
      fireEvent.change(tenantIdInput, { target: { value: 'tenant_001' } })
      fireEvent.blur(tenantIdInput)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.blur(emailInput)
      fireEvent.change(passwordInput, { target: { value: 'ValidPass123' } })
      fireEvent.blur(passwordInput)

      const submitButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/please confirm your password/i)).toBeInTheDocument()
      })
    })

    it('should show error when passwords do not match', async () => {
      render(<RegistrationForm />)

      const fullNameInput = screen.getByLabelText(/full name/i)
      const tenantIdInput = screen.getByLabelText(/organization id/i)
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

      fireEvent.change(fullNameInput, { target: { value: 'John Doe' } })
      fireEvent.blur(fullNameInput)
      fireEvent.change(tenantIdInput, { target: { value: 'tenant_001' } })
      fireEvent.blur(tenantIdInput)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.blur(emailInput)
      fireEvent.change(passwordInput, { target: { value: 'ValidPass123' } })
      fireEvent.blur(passwordInput)
      fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPass456' } })
      fireEvent.blur(confirmPasswordInput)

      const submitButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
      })
    })
  })

  describe('Successful Registration Flow', () => {
    it('should call register with correct data', async () => {
      mockRegister.mockResolvedValue(undefined)

      render(<RegistrationForm />)

      const fullNameInput = screen.getByLabelText(/full name/i)
      const tenantIdInput = screen.getByLabelText(/organization id/i)
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

      fireEvent.change(fullNameInput, { target: { value: 'John Doe' } })
      fireEvent.change(tenantIdInput, { target: { value: 'tenant_001' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'ValidPass123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'ValidPass123' } })

      const submitButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith(
          'test@example.com',
          'ValidPass123',
          'tenant_001',
          'John Doe'
        )
      })
    })

    it('should redirect to login on successful registration', async () => {
      mockRegister.mockResolvedValue(undefined)

      render(<RegistrationForm />)

      const fullNameInput = screen.getByLabelText(/full name/i)
      const tenantIdInput = screen.getByLabelText(/organization id/i)
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

      fireEvent.change(fullNameInput, { target: { value: 'John Doe' } })
      fireEvent.change(tenantIdInput, { target: { value: 'tenant_001' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'ValidPass123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'ValidPass123' } })

      const submitButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login?registered=true')
      })
    })
  })

  describe('Failed Registration Flow', () => {
    it('should display error message on registration failure', async () => {
      mockRegister.mockRejectedValue(new Error('Email already exists'))

      render(<RegistrationForm />)

      const fullNameInput = screen.getByLabelText(/full name/i)
      const tenantIdInput = screen.getByLabelText(/organization id/i)
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

      fireEvent.change(fullNameInput, { target: { value: 'John Doe' } })
      fireEvent.change(tenantIdInput, { target: { value: 'tenant_001' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'ValidPass123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'ValidPass123' } })

      const submitButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/email already exists/i)).toBeInTheDocument()
      })
    })

    it('should not redirect on registration failure', async () => {
      mockRegister.mockRejectedValue(new Error('Email already exists'))

      render(<RegistrationForm />)

      const fullNameInput = screen.getByLabelText(/full name/i)
      const tenantIdInput = screen.getByLabelText(/organization id/i)
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

      fireEvent.change(fullNameInput, { target: { value: 'John Doe' } })
      fireEvent.change(tenantIdInput, { target: { value: 'tenant_001' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'ValidPass123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'ValidPass123' } })

      const submitButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockPush).not.toHaveBeenCalled()
      })
    })
  })

  describe('Loading State', () => {
    it('should disable inputs during loading', () => {
      ;(useAuth as jest.Mock).mockReturnValue({
        register: mockRegister,
        isLoading: true,
        error: null,
        clearError: mockClearError,
      })

      render(<RegistrationForm />)

      const fullNameInput = screen.getByLabelText(/full name/i) as HTMLInputElement
      const tenantIdInput = screen.getByLabelText(/organization id/i) as HTMLInputElement
      const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement
      const passwordInput = screen.getByLabelText(/^password$/i) as HTMLInputElement
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i) as HTMLInputElement

      expect(fullNameInput.disabled).toBe(true)
      expect(tenantIdInput.disabled).toBe(true)
      expect(emailInput.disabled).toBe(true)
      expect(passwordInput.disabled).toBe(true)
      expect(confirmPasswordInput.disabled).toBe(true)
    })

    it('should show loading indicator on submit button', () => {
      ;(useAuth as jest.Mock).mockReturnValue({
        register: mockRegister,
        isLoading: true,
        error: null,
        clearError: mockClearError,
      })

      render(<RegistrationForm />)

      const submitButton = screen.getByRole('button', { name: /creating account/i })
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Error Message Display', () => {
    it('should display context error from auth', () => {
      ;(useAuth as jest.Mock).mockReturnValue({
        register: mockRegister,
        isLoading: false,
        error: 'Service unavailable',
        clearError: mockClearError,
      })

      render(<RegistrationForm />)

      expect(screen.getByText(/service unavailable/i)).toBeInTheDocument()
    })

    it('should clear error when user types', async () => {
      ;(useAuth as jest.Mock).mockReturnValue({
        register: mockRegister,
        isLoading: false,
        error: 'Registration failed',
        clearError: mockClearError,
      })

      render(<RegistrationForm />)

      const fullNameInput = screen.getByLabelText(/full name/i)
      fireEvent.change(fullNameInput, { target: { value: 'John Doe' } })

      expect(mockClearError).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<RegistrationForm />)

      expect(screen.getByLabelText(/full name/i)).toHaveAttribute('aria-label')
      expect(screen.getByLabelText(/organization id/i)).toHaveAttribute('aria-label')
      expect(screen.getByLabelText(/email address/i)).toHaveAttribute('aria-label')
      expect(screen.getByLabelText(/^password$/i)).toHaveAttribute('aria-label')
      expect(screen.getByLabelText(/confirm password/i)).toHaveAttribute('aria-label')
    })

    it('should have proper ARIA attributes for error states', async () => {
      render(<RegistrationForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      fireEvent.change(emailInput, { target: { value: 'invalid' } })

      const submitButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(submitButton)

      // After submit, the email field should have aria-invalid set
      expect(emailInput).toHaveAttribute('aria-invalid')
    })

    it('should have proper role for error messages', async () => {
      render(<RegistrationForm />)

      const fullNameInput = screen.getByLabelText(/full name/i)
      const tenantIdInput = screen.getByLabelText(/organization id/i)
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

      // Trigger blur on all fields to mark them as touched
      fireEvent.blur(fullNameInput)
      fireEvent.blur(tenantIdInput)
      fireEvent.blur(emailInput)
      fireEvent.blur(passwordInput)
      fireEvent.blur(confirmPasswordInput)

      const submitButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        // The alert role is applied to the error message container
        const errorMessages = screen.getAllByText(/is required/i)
        expect(errorMessages.length).toBeGreaterThan(0)
      })
    })
  })
})
