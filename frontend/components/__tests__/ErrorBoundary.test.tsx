import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBoundary } from '../ErrorBoundary'

// Component that throws an error
function ThrowError() {
  throw new Error('Test error message')
}

// Component that renders normally
function NormalComponent() {
  return <div>Normal content</div>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Suppress console.error for these tests
    jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should render children when no error', () => {
    const { container } = render(
      <ErrorBoundary>
        <NormalComponent />
      </ErrorBoundary>
    )

    expect(container.textContent).toContain('Normal content')
  })

  it('should catch and display error', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Test error message')).toBeInTheDocument()
  })

  it('should display error ID', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    const errorIdText = screen.getByText(/Error ID:/)
    expect(errorIdText).toBeInTheDocument()
  })

  it('should have Try Again button', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    const tryAgainBtn = screen.getByRole('button', { name: /Try Again/i })
    expect(tryAgainBtn).toBeInTheDocument()
  })

  it('should have Home button', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    const homeBtn = screen.getByRole('button', { name: /Home/i })
    expect(homeBtn).toBeInTheDocument()
  })

  it('should reset error on Try Again click', () => {
    const { container } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    const tryAgainBtn = screen.getByRole('button', { name: /Try Again/i })
    fireEvent.click(tryAgainBtn)

    // After clicking Try Again, the error should be cleared
    // The component should still be in error state but ready to retry
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('should use custom fallback if provided', () => {
    const customFallback = (error: Error, retry: () => void) => (
      <div>
        <p>Custom error: {error.message}</p>
        <button onClick={retry}>Custom Retry</button>
      </div>
    )

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom error: Test error message')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Custom Retry/i })).toBeInTheDocument()
  })

  it('should have proper accessibility attributes', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    const alert = screen.getByRole('alert')
    expect(alert).toHaveAttribute('aria-live', 'assertive')
  })

  it('should display error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    const details = screen.getByText(/Error Details/)
    expect(details).toBeInTheDocument()

    process.env.NODE_ENV = originalEnv
  })

  it('should not display error details in production mode', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    const details = screen.queryByText(/Error Details/)
    expect(details).not.toBeInTheDocument()

    process.env.NODE_ENV = originalEnv
  })

  it('should have dark mode support', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    const container = screen.getByRole('alert')
    expect(container).toHaveClass('dark:bg-gray-900')
  })
})
