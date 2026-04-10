import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { ErrorProvider, useError } from '../error-context'
import { AppError } from '../utils/api-error-handler'

// Test component that uses the error context
function TestComponent() {
  const { errors, setError, clearError, addError, clearAllErrors, getLatestError } = useError()

  return (
    <div>
      <div data-testid="error-count">{errors.length}</div>
      <div data-testid="latest-error">{getLatestError()?.message || 'none'}</div>

      <button
        onClick={() =>
          setError({
            id: 'test-1',
            type: 'validation',
            severity: 'warning',
            message: 'Test error',
            timestamp: Date.now(),
          })
        }
        data-testid="set-error-btn"
      >
        Set Error
      </button>

      <button
        onClick={() =>
          addError({
            id: 'test-2',
            type: 'network',
            severity: 'warning',
            message: 'Network error',
            timestamp: Date.now(),
          })
        }
        data-testid="add-error-btn"
      >
        Add Error
      </button>

      <button
        onClick={() => clearError('test-1')}
        data-testid="clear-error-btn"
      >
        Clear Error
      </button>

      <button
        onClick={() => clearAllErrors()}
        data-testid="clear-all-btn"
      >
        Clear All
      </button>
    </div>
  )
}

describe('ErrorContext', () => {
  it('should provide error context', () => {
    render(
      <ErrorProvider>
        <TestComponent />
      </ErrorProvider>
    )

    expect(screen.getByTestId('error-count')).toHaveTextContent('0')
  })

  it('should set error', async () => {
    render(
      <ErrorProvider>
        <TestComponent />
      </ErrorProvider>
    )

    const setErrorBtn = screen.getByTestId('set-error-btn')
    setErrorBtn.click()

    await waitFor(() => {
      expect(screen.getByTestId('error-count')).toHaveTextContent('1')
      expect(screen.getByTestId('latest-error')).toHaveTextContent('Test error')
    })
  })

  it('should add error', async () => {
    render(
      <ErrorProvider>
        <TestComponent />
      </ErrorProvider>
    )

    const addErrorBtn = screen.getByTestId('add-error-btn')
    addErrorBtn.click()

    await waitFor(() => {
      expect(screen.getByTestId('error-count')).toHaveTextContent('1')
      expect(screen.getByTestId('latest-error')).toHaveTextContent('Network error')
    })
  })

  it('should clear specific error', async () => {
    render(
      <ErrorProvider>
        <TestComponent />
      </ErrorProvider>
    )

    const setErrorBtn = screen.getByTestId('set-error-btn')
    setErrorBtn.click()

    await waitFor(() => {
      expect(screen.getByTestId('error-count')).toHaveTextContent('1')
    })

    const clearErrorBtn = screen.getByTestId('clear-error-btn')
    clearErrorBtn.click()

    await waitFor(() => {
      expect(screen.getByTestId('error-count')).toHaveTextContent('0')
    })
  })

  it('should clear all errors', async () => {
    render(
      <ErrorProvider>
        <TestComponent />
      </ErrorProvider>
    )

    const addErrorBtn = screen.getByTestId('add-error-btn')
    addErrorBtn.click()
    addErrorBtn.click()

    await waitFor(() => {
      expect(screen.getByTestId('error-count')).toHaveTextContent('2')
    })

    const clearAllBtn = screen.getByTestId('clear-all-btn')
    clearAllBtn.click()

    await waitFor(() => {
      expect(screen.getByTestId('error-count')).toHaveTextContent('0')
    })
  })

  it('should replace error of same type', async () => {
    render(
      <ErrorProvider>
        <TestComponent />
      </ErrorProvider>
    )

    const setErrorBtn = screen.getByTestId('set-error-btn')
    setErrorBtn.click()

    await waitFor(() => {
      expect(screen.getByTestId('error-count')).toHaveTextContent('1')
    })

    // Set another validation error (should replace)
    setErrorBtn.click()

    await waitFor(() => {
      expect(screen.getByTestId('error-count')).toHaveTextContent('1')
    })
  })

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useError must be used within an ErrorProvider')

    consoleSpy.mockRestore()
  })
})
