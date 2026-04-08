import React from 'react'
import { render, screen } from '@testing-library/react'
import { LoadingSpinner, LoadingSkeleton } from '../LoadingSpinner'

describe('LoadingSpinner', () => {
  it('should render spinner with default size', () => {
    const { container } = render(<LoadingSpinner />)

    const spinner = container.querySelector('[role="status"]')
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveClass('w-8', 'h-8')
  })

  it('should render spinner with small size', () => {
    const { container } = render(<LoadingSpinner size="sm" />)

    const spinner = container.querySelector('[role="status"]')
    expect(spinner).toHaveClass('w-4', 'h-4')
  })

  it('should render spinner with large size', () => {
    const { container } = render(<LoadingSpinner size="lg" />)

    const spinner = container.querySelector('[role="status"]')
    expect(spinner).toHaveClass('w-12', 'h-12')
  })

  it('should render loading text', () => {
    render(<LoadingSpinner text="Loading..." />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('should render full screen spinner', () => {
    const { container } = render(<LoadingSpinner fullScreen={true} />)

    const fullScreenDiv = container.querySelector('.fixed')
    expect(fullScreenDiv).toBeInTheDocument()
    expect(fullScreenDiv).toHaveClass('inset-0', 'z-50')
  })

  it('should have proper accessibility attributes', () => {
    const { container } = render(<LoadingSpinner />)

    const spinner = container.querySelector('[role="status"]')
    expect(spinner).toHaveAttribute('aria-label', 'Loading')
  })

  it('should have animation class', () => {
    const { container } = render(<LoadingSpinner />)

    const spinner = container.querySelector('[role="status"]')
    expect(spinner).toHaveClass('animate-spin')
  })

  it('should have dark mode support', () => {
    const { container } = render(<LoadingSpinner fullScreen={true} />)

    const fullScreenDiv = container.querySelector('.fixed')
    expect(fullScreenDiv).toHaveClass('dark:bg-gray-900')
  })
})

describe('LoadingSkeleton', () => {
  it('should render single skeleton by default', () => {
    const { container } = render(<LoadingSkeleton />)

    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons).toHaveLength(1)
  })

  it('should render multiple skeletons', () => {
    const { container } = render(<LoadingSkeleton count={3} />)

    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons).toHaveLength(3)
  })

  it('should render with default height', () => {
    const { container } = render(<LoadingSkeleton />)

    const skeleton = container.querySelector('.animate-pulse')
    expect(skeleton).toHaveClass('h-4')
  })

  it('should render with custom height', () => {
    const { container } = render(<LoadingSkeleton height="h-8" />)

    const skeleton = container.querySelector('.animate-pulse')
    expect(skeleton).toHaveClass('h-8')
  })

  it('should have proper spacing', () => {
    const { container } = render(<LoadingSkeleton count={2} />)

    const wrapper = container.firstChild
    expect(wrapper).toHaveClass('space-y-3')
  })

  it('should have dark mode support', () => {
    const { container } = render(<LoadingSkeleton />)

    const skeleton = container.querySelector('.animate-pulse')
    expect(skeleton).toHaveClass('dark:bg-gray-700')
  })

  it('should have rounded corners', () => {
    const { container } = render(<LoadingSkeleton />)

    const skeleton = container.querySelector('.animate-pulse')
    expect(skeleton).toHaveClass('rounded')
  })
})
