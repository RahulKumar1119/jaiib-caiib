import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ErrorDisplay } from '../ErrorDisplay'
import { AppError } from '../../lib/utils/api-error-handler'

describe('ErrorDisplay', () => {
  const mockError: AppError = {
    id: 'test-error',
    type: 'validation',
    severity: 'warning',
    message: 'This is a test error',
    timestamp: Date.now(),
  }

  it('should render error message', () => {
    render(<ErrorDisplay error={mockError} />)

    expect(screen.getByText('This is a test error')).toBeInTheDocument()
  })

  it('should render error details if provided', () => {
    const errorWithDetails: AppError = {
      ...mockError,
      details: 'Additional error details',
    }

    render(<ErrorDisplay error={errorWithDetails} />)

    expect(screen.getByText('Additional error details')).toBeInTheDocument()
  })

  it('should call onDismiss when dismiss button clicked', () => {
    const onDismiss = jest.fn()

    render(<ErrorDisplay error={mockError} onDismiss={onDismiss} />)

    const dismissBtn = screen.getByRole('button', { name: /Dismiss error/i })
    fireEvent.click(dismissBtn)

    expect(onDismiss).toHaveBeenCalled()
  })

  it('should call onRetry when retry button clicked', () => {
    const onRetry = jest.fn()
    const networkError: AppError = {
      ...mockError,
      type: 'network',
    }

    render(<ErrorDisplay error={networkError} onRetry={onRetry} />)

    const retryBtn = screen.getByRole('button', { name: /Retry/i })
    fireEvent.click(retryBtn)

    expect(onRetry).toHaveBeenCalled()
  })

  it('should show retry button for retryable errors', () => {
    const networkError: AppError = {
      ...mockError,
      type: 'network',
      statusCode: undefined,
    }

    render(<ErrorDisplay error={networkError} onRetry={() => {}} />)

    const retryBtn = screen.getByRole('button', { name: /Retry/i })
    expect(retryBtn).toBeInTheDocument()
  })

  it('should not show retry button for non-retryable errors', () => {
    const authError: AppError = {
      ...mockError,
      type: 'auth',
    }

    const { container } = render(<ErrorDisplay error={authError} />)

    const retryBtn = container.querySelector('button[aria-label="Retry operation"]')
    expect(retryBtn).toBeNull()
  })

  it('should not show retry button when showRetry is false', () => {
    const networkError: AppError = {
      ...mockError,
      type: 'network',
    }

    const { container } = render(<ErrorDisplay error={networkError} showRetry={false} />)

    const retryBtn = container.querySelector('button[aria-label="Retry operation"]')
    expect(retryBtn).toBeNull()
  })

  it('should auto-dismiss non-critical errors', async () => {
    jest.useFakeTimers()
    const onDismiss = jest.fn()

    render(<ErrorDisplay error={mockError} onDismiss={onDismiss} />)

    jest.advanceTimersByTime(5000)

    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalled()
    })

    jest.useRealTimers()
  })

  it('should not auto-dismiss critical errors', async () => {
    jest.useFakeTimers()
    const onDismiss = jest.fn()
    const criticalError: AppError = {
      ...mockError,
      severity: 'critical',
    }

    render(<ErrorDisplay error={criticalError} onDismiss={onDismiss} />)

    jest.advanceTimersByTime(5000)

    expect(onDismiss).not.toHaveBeenCalled()

    jest.useRealTimers()
  })

  it('should have proper accessibility attributes', () => {
    render(<ErrorDisplay error={mockError} />)

    const alert = screen.getByRole('alert')
    expect(alert).toHaveAttribute('aria-live', 'polite')
  })

  it('should have assertive aria-live for critical errors', () => {
    const criticalError: AppError = {
      ...mockError,
      severity: 'critical',
    }

    render(<ErrorDisplay error={criticalError} />)

    const alert = screen.getByRole('alert')
    expect(alert).toHaveAttribute('aria-live', 'assertive')
  })

  it('should display correct icon for critical error', () => {
    const criticalError: AppError = {
      ...mockError,
      severity: 'critical',
    }

    const { container } = render(<ErrorDisplay error={criticalError} />)

    // Check for error icon (X in circle)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('should display correct icon for warning error', () => {
    const warningError: AppError = {
      ...mockError,
      severity: 'warning',
    }

    const { container } = render(<ErrorDisplay error={warningError} />)

    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('should display correct icon for info error', () => {
    const infoError: AppError = {
      ...mockError,
      severity: 'info',
    }

    const { container } = render(<ErrorDisplay error={infoError} />)

    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('should have dark mode support', () => {
    const { container } = render(<ErrorDisplay error={mockError} />)

    const errorDiv = container.firstChild
    expect(errorDiv).toHaveClass('dark:bg-yellow-900/20')
  })
})
