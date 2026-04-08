import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Toast } from '../Toast'

describe('Toast Component', () => {
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('Rendering', () => {
    it('should render toast with success type', () => {
      render(
        <Toast
          id="test-1"
          type="success"
          message="Success message"
          onClose={mockOnClose}
        />
      )
      expect(screen.getByText('Success message')).toBeInTheDocument()
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('should render toast with error type', () => {
      render(
        <Toast
          id="test-2"
          type="error"
          message="Error message"
          onClose={mockOnClose}
        />
      )
      expect(screen.getByText('Error message')).toBeInTheDocument()
    })

    it('should render toast with warning type', () => {
      render(
        <Toast
          id="test-3"
          type="warning"
          message="Warning message"
          onClose={mockOnClose}
        />
      )
      expect(screen.getByText('Warning message')).toBeInTheDocument()
    })

    it('should render toast with info type', () => {
      render(
        <Toast
          id="test-4"
          type="info"
          message="Info message"
          onClose={mockOnClose}
        />
      )
      expect(screen.getByText('Info message')).toBeInTheDocument()
    })

    it('should display correct icon for each type', () => {
      const { rerender } = render(
        <Toast
          id="test-5"
          type="success"
          message="Test"
          onClose={mockOnClose}
        />
      )
      expect(screen.getByText('✓')).toBeInTheDocument()

      rerender(
        <Toast
          id="test-6"
          type="error"
          message="Test"
          onClose={mockOnClose}
        />
      )
      expect(screen.getByText('✕')).toBeInTheDocument()

      rerender(
        <Toast
          id="test-7"
          type="warning"
          message="Test"
          onClose={mockOnClose}
        />
      )
      expect(screen.getByText('⚠')).toBeInTheDocument()

      rerender(
        <Toast
          id="test-8"
          type="info"
          message="Test"
          onClose={mockOnClose}
        />
      )
      expect(screen.getByText('ℹ')).toBeInTheDocument()
    })
  })

  describe('Close Button', () => {
    it('should render close button', () => {
      render(
        <Toast
          id="test-9"
          type="success"
          message="Test"
          onClose={mockOnClose}
        />
      )
      const closeButton = screen.getByLabelText('Close notification')
      expect(closeButton).toBeInTheDocument()
    })

    it('should call onClose when close button is clicked', async () => {
      render(
        <Toast
          id="test-10"
          type="success"
          message="Test"
          onClose={mockOnClose}
        />
      )
      const closeButton = screen.getByLabelText('Close notification')
      fireEvent.click(closeButton)

      jest.advanceTimersByTime(300)
      expect(mockOnClose).toHaveBeenCalledWith('test-10')
    })
  })

  describe('Auto-dismiss', () => {
    it('should auto-dismiss after default duration', () => {
      render(
        <Toast
          id="test-11"
          type="success"
          message="Test"
          duration={5000}
          onClose={mockOnClose}
        />
      )

      jest.advanceTimersByTime(5000)
      jest.advanceTimersByTime(300)

      expect(mockOnClose).toHaveBeenCalledWith('test-11')
    })

    it('should auto-dismiss after custom duration', () => {
      render(
        <Toast
          id="test-12"
          type="success"
          message="Test"
          duration={3000}
          onClose={mockOnClose}
        />
      )

      jest.advanceTimersByTime(3000)
      jest.advanceTimersByTime(300)

      expect(mockOnClose).toHaveBeenCalledWith('test-12')
    })

    it('should not auto-dismiss if duration is 0', () => {
      render(
        <Toast
          id="test-13"
          type="success"
          message="Test"
          duration={0}
          onClose={mockOnClose}
        />
      )

      jest.advanceTimersByTime(10000)

      expect(mockOnClose).not.toHaveBeenCalled()
    })
  })

  describe('Keyboard Support', () => {
    it('should close on Escape key', () => {
      render(
        <Toast
          id="test-14"
          type="success"
          message="Test"
          onClose={mockOnClose}
        />
      )

      const toast = screen.getByRole('alert')
      fireEvent.keyDown(toast, { key: 'Escape' })

      jest.advanceTimersByTime(300)

      expect(mockOnClose).toHaveBeenCalledWith('test-14')
    })

    it('should not close on other keys', () => {
      render(
        <Toast
          id="test-15"
          type="success"
          message="Test"
          onClose={mockOnClose}
        />
      )

      const toast = screen.getByRole('alert')
      fireEvent.keyDown(toast, { key: 'Enter' })

      expect(mockOnClose).not.toHaveBeenCalled()
    })
  })

  describe('Action Button', () => {
    it('should render action button if provided', () => {
      const mockAction = jest.fn()
      render(
        <Toast
          id="test-16"
          type="success"
          message="Test"
          action={{ label: 'Undo', onClick: mockAction }}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Undo')).toBeInTheDocument()
    })

    it('should call action onClick when clicked', () => {
      const mockAction = jest.fn()
      render(
        <Toast
          id="test-17"
          type="success"
          message="Test"
          action={{ label: 'Undo', onClick: mockAction }}
          onClose={mockOnClose}
        />
      )

      fireEvent.click(screen.getByText('Undo'))
      expect(mockAction).toHaveBeenCalled()
    })

    it('should not render action button if not provided', () => {
      render(
        <Toast
          id="test-18"
          type="success"
          message="Test"
          onClose={mockOnClose}
        />
      )

      expect(screen.queryByText('Undo')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have role="alert"', () => {
      render(
        <Toast
          id="test-19"
          type="success"
          message="Test"
          onClose={mockOnClose}
        />
      )

      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('should have aria-live="polite"', () => {
      render(
        <Toast
          id="test-20"
          type="success"
          message="Test"
          onClose={mockOnClose}
        />
      )

      expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'polite')
    })

    it('should have aria-atomic="true"', () => {
      render(
        <Toast
          id="test-21"
          type="success"
          message="Test"
          onClose={mockOnClose}
        />
      )

      expect(screen.getByRole('alert')).toHaveAttribute('aria-atomic', 'true')
    })

    it('should have close button with aria-label', () => {
      render(
        <Toast
          id="test-22"
          type="success"
          message="Test"
          onClose={mockOnClose}
        />
      )

      expect(screen.getByLabelText('Close notification')).toBeInTheDocument()
    })

    it('should be keyboard focusable', () => {
      render(
        <Toast
          id="test-23"
          type="success"
          message="Test"
          onClose={mockOnClose}
        />
      )

      const toast = screen.getByRole('alert')
      expect(toast).toHaveAttribute('tabIndex', '0')
    })
  })

  describe('Animations', () => {
    it('should have initial visible state', () => {
      const { container } = render(
        <Toast
          id="test-24"
          type="success"
          message="Test"
          onClose={mockOnClose}
        />
      )

      const toastDiv = container.querySelector('[role="alert"]')
      expect(toastDiv).toHaveClass('opacity-100')
    })

    it('should transition to hidden state on close', () => {
      const { container } = render(
        <Toast
          id="test-25"
          type="success"
          message="Test"
          onClose={mockOnClose}
        />
      )

      const closeButton = screen.getByLabelText('Close notification')
      fireEvent.click(closeButton)

      const toastDiv = container.querySelector('[role="alert"]')
      expect(toastDiv).toHaveClass('opacity-0')
    })
  })

  describe('Message Display', () => {
    it('should display long messages', () => {
      const longMessage = 'This is a very long message that should wrap properly in the toast component'
      render(
        <Toast
          id="test-26"
          type="success"
          message={longMessage}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText(longMessage)).toBeInTheDocument()
    })

    it('should handle special characters in message', () => {
      const specialMessage = 'Test & special <characters> "quoted"'
      render(
        <Toast
          id="test-27"
          type="success"
          message={specialMessage}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText(specialMessage)).toBeInTheDocument()
    })
  })
})
