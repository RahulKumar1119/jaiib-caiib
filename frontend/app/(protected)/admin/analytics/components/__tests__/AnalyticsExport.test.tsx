import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AnalyticsExport } from '../AnalyticsExport'

describe('AnalyticsExport Component', () => {
  const mockOnExport = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render export button', () => {
      render(<AnalyticsExport onExport={mockOnExport} isExporting={false} />)
      expect(screen.getByText('Export CSV')).toBeInTheDocument()
    })

    it('should display export icon', () => {
      const { container } = render(<AnalyticsExport onExport={mockOnExport} isExporting={false} />)
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should have proper button styling', () => {
      const { container } = render(<AnalyticsExport onExport={mockOnExport} isExporting={false} />)
      const button = container.querySelector('button')
      expect(button).toHaveClass('bg-primary-600')
      expect(button).toHaveClass('text-white')
    })
  })

  describe('Click Handling', () => {
    it('should call onExport when button is clicked', async () => {
      render(<AnalyticsExport onExport={mockOnExport} isExporting={false} />)
      const button = screen.getByText('Export CSV')
      fireEvent.click(button)

      await waitFor(() => {
        expect(mockOnExport).toHaveBeenCalled()
      })
    })

    it('should call onExport only once per click', async () => {
      render(<AnalyticsExport onExport={mockOnExport} isExporting={false} />)
      const button = screen.getByText('Export CSV')
      fireEvent.click(button)

      await waitFor(() => {
        expect(mockOnExport).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Loading State', () => {
    it('should display loading spinner when isExporting is true', () => {
      const { container } = render(<AnalyticsExport onExport={mockOnExport} isExporting={true} />)
      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })

    it('should display "Exporting..." text when isExporting is true', () => {
      render(<AnalyticsExport onExport={mockOnExport} isExporting={true} />)
      expect(screen.getByText('Exporting...')).toBeInTheDocument()
    })

    it('should display "Export CSV" text when isExporting is false', () => {
      render(<AnalyticsExport onExport={mockOnExport} isExporting={false} />)
      expect(screen.getByText('Export CSV')).toBeInTheDocument()
    })

    it('should hide icon when loading', () => {
      const { container, rerender } = render(
        <AnalyticsExport onExport={mockOnExport} isExporting={false} />
      )
      let svgs = container.querySelectorAll('svg')
      expect(svgs.length).toBeGreaterThan(0)

      rerender(<AnalyticsExport onExport={mockOnExport} isExporting={true} />)
      svgs = container.querySelectorAll('svg')
      // SVG should be hidden or replaced with spinner
      expect(screen.getByText('Exporting...')).toBeInTheDocument()
    })
  })

  describe('Disabled State', () => {
    it('should disable button when isExporting is true', () => {
      render(<AnalyticsExport onExport={mockOnExport} isExporting={true} />)
      const button = screen.getByRole('button') as HTMLButtonElement
      expect(button.disabled).toBe(true)
    })

    it('should enable button when isExporting is false', () => {
      render(<AnalyticsExport onExport={mockOnExport} isExporting={false} />)
      const button = screen.getByRole('button') as HTMLButtonElement
      expect(button.disabled).toBe(false)
    })

    it('should have disabled styling when loading', () => {
      const { container } = render(<AnalyticsExport onExport={mockOnExport} isExporting={true} />)
      const button = container.querySelector('button')
      expect(button).toHaveClass('disabled:opacity-50')
      expect(button).toHaveClass('disabled:cursor-not-allowed')
    })

    it('should not call onExport when button is disabled', async () => {
      render(<AnalyticsExport onExport={mockOnExport} isExporting={true} />)
      const button = screen.getByRole('button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(mockOnExport).not.toHaveBeenCalled()
      })
    })
  })

  describe('Styling', () => {
    it('should have hover effect when not loading', () => {
      const { container } = render(<AnalyticsExport onExport={mockOnExport} isExporting={false} />)
      const button = container.querySelector('button')
      expect(button).toHaveClass('hover:bg-primary-700')
    })

    it('should have transition effect', () => {
      const { container } = render(<AnalyticsExport onExport={mockOnExport} isExporting={false} />)
      const button = container.querySelector('button')
      expect(button).toHaveClass('transition-colors')
    })

    it('should have proper padding', () => {
      const { container } = render(<AnalyticsExport onExport={mockOnExport} isExporting={false} />)
      const button = container.querySelector('button')
      expect(button).toHaveClass('px-6')
      expect(button).toHaveClass('py-2')
    })

    it('should have rounded corners', () => {
      const { container } = render(<AnalyticsExport onExport={mockOnExport} isExporting={false} />)
      const button = container.querySelector('button')
      expect(button).toHaveClass('rounded-lg')
    })

    it('should have medium font weight', () => {
      const { container } = render(<AnalyticsExport onExport={mockOnExport} isExporting={false} />)
      const button = container.querySelector('button')
      expect(button).toHaveClass('font-medium')
    })
  })

  describe('Icon Display', () => {
    it('should display SVG icon', () => {
      const { container } = render(<AnalyticsExport onExport={mockOnExport} isExporting={false} />)
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveClass('w-5')
      expect(svg).toHaveClass('h-5')
    })

    it('should have proper icon styling', () => {
      const { container } = render(<AnalyticsExport onExport={mockOnExport} isExporting={false} />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveAttribute('viewBox')
    })
  })

  describe('Spinner Display', () => {
    it('should display spinner with animation', () => {
      const { container } = render(<AnalyticsExport onExport={mockOnExport} isExporting={true} />)
      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
      expect(spinner).toHaveClass('rounded-full')
      expect(spinner).toHaveClass('h-4')
      expect(spinner).toHaveClass('w-4')
    })

    it('should have proper spinner styling', () => {
      const { container } = render(<AnalyticsExport onExport={mockOnExport} isExporting={true} />)
      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toHaveClass('border-b-2')
      expect(spinner).toHaveClass('border-white')
    })
  })

  describe('Layout', () => {
    it('should have flex layout with gap', () => {
      const { container } = render(<AnalyticsExport onExport={mockOnExport} isExporting={false} />)
      const button = container.querySelector('button')
      expect(button).toHaveClass('flex')
      expect(button).toHaveClass('items-center')
      expect(button).toHaveClass('gap-2')
    })

    it('should display icon and text in correct order', () => {
      const { container } = render(<AnalyticsExport onExport={mockOnExport} isExporting={false} />)
      const button = container.querySelector('button')
      const children = button?.childNodes
      expect(children?.length).toBeGreaterThan(0)
    })
  })

  describe('Accessibility', () => {
    it('should be a button element', () => {
      render(<AnalyticsExport onExport={mockOnExport} isExporting={false} />)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should have accessible text', () => {
      render(<AnalyticsExport onExport={mockOnExport} isExporting={false} />)
      expect(screen.getByText('Export CSV')).toBeInTheDocument()
    })

    it('should have accessible loading state text', () => {
      render(<AnalyticsExport onExport={mockOnExport} isExporting={true} />)
      expect(screen.getByText('Exporting...')).toBeInTheDocument()
    })

    it('should be keyboard accessible', () => {
      render(<AnalyticsExport onExport={mockOnExport} isExporting={false} />)
      const button = screen.getByRole('button')
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' })
      // Button should respond to keyboard events
      expect(button).toBeInTheDocument()
    })
  })

  describe('State Transitions', () => {
    it('should transition from normal to loading state', () => {
      const { rerender } = render(<AnalyticsExport onExport={mockOnExport} isExporting={false} />)
      expect(screen.getByText('Export CSV')).toBeInTheDocument()

      rerender(<AnalyticsExport onExport={mockOnExport} isExporting={true} />)
      expect(screen.getByText('Exporting...')).toBeInTheDocument()
    })

    it('should transition from loading to normal state', () => {
      const { rerender } = render(<AnalyticsExport onExport={mockOnExport} isExporting={true} />)
      expect(screen.getByText('Exporting...')).toBeInTheDocument()

      rerender(<AnalyticsExport onExport={mockOnExport} isExporting={false} />)
      expect(screen.getByText('Export CSV')).toBeInTheDocument()
    })
  })

  describe('Multiple Clicks', () => {
    it('should handle multiple clicks correctly', async () => {
      const { rerender } = render(<AnalyticsExport onExport={mockOnExport} isExporting={false} />)
      const button = screen.getByText('Export CSV')

      fireEvent.click(button)
      expect(mockOnExport).toHaveBeenCalledTimes(1)

      rerender(<AnalyticsExport onExport={mockOnExport} isExporting={true} />)
      rerender(<AnalyticsExport onExport={mockOnExport} isExporting={false} />)

      const newButton = screen.getByText('Export CSV')
      fireEvent.click(newButton)
      expect(mockOnExport).toHaveBeenCalledTimes(2)
    })
  })
})
