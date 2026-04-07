import React from 'react'
import { render, screen } from '@testing-library/react'
import { Timer } from '../Timer'
import { useTimer } from '@/lib/hooks/useTimer'

// Mock the useTimer hook
jest.mock('@/lib/hooks/useTimer')

describe('Timer Component', () => {
  const mockTimer = {
    timeRemaining: 300,
    isRunning: true,
    start: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    reset: jest.fn(),
    getFormattedTime: () => '05:00',
    getPercentage: () => 50,
    getColor: () => 'yellow' as const,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useTimer as jest.Mock).mockReturnValue(mockTimer)
  })

  it('renders timer with formatted time', () => {
    render(<Timer timer={mockTimer} />)

    expect(screen.getByText('05:00')).toBeInTheDocument()
  })

  it('displays green color when time remaining is > 50%', () => {
    const greenTimer = {
      ...mockTimer,
      getColor: () => 'green' as const,
      getPercentage: () => 75,
    }

    const { container } = render(<Timer timer={greenTimer} />)

    const timerDiv = container.querySelector('[class*="text-green"]')
    expect(timerDiv).toBeInTheDocument()
  })

  it('displays yellow color when time remaining is between 10-50%', () => {
    const yellowTimer = {
      ...mockTimer,
      getColor: () => 'yellow' as const,
      getPercentage: () => 30,
    }

    const { container } = render(<Timer timer={yellowTimer} />)

    const timerDiv = container.querySelector('[class*="text-yellow"]')
    expect(timerDiv).toBeInTheDocument()
  })

  it('displays red color when time remaining is < 10%', () => {
    const redTimer = {
      ...mockTimer,
      getColor: () => 'red' as const,
      getPercentage: () => 5,
    }

    const { container } = render(<Timer timer={redTimer} />)

    const timerDiv = container.querySelector('[class*="text-red"]')
    expect(timerDiv).toBeInTheDocument()
  })

  it('displays warning message when time is running low (yellow)', () => {
    const yellowTimer = {
      ...mockTimer,
      getColor: () => 'yellow' as const,
    }

    render(<Timer timer={yellowTimer} />)

    expect(screen.getByText('Time is running low!')).toBeInTheDocument()
  })

  it('displays critical warning message when time is critical (red)', () => {
    const redTimer = {
      ...mockTimer,
      getColor: () => 'red' as const,
    }

    render(<Timer timer={redTimer} />)

    expect(screen.getByText('Hurry up! Less than 1 minute left!')).toBeInTheDocument()
  })

  it('does not display warning message when time is green', () => {
    const greenTimer = {
      ...mockTimer,
      getColor: () => 'green' as const,
    }

    render(<Timer timer={greenTimer} />)

    expect(screen.queryByText('Time is running low!')).not.toBeInTheDocument()
    expect(screen.queryByText('Hurry up! Less than 1 minute left!')).not.toBeInTheDocument()
  })

  it('displays progress bar with correct width', () => {
    const timer = {
      ...mockTimer,
      getPercentage: () => 50,
    }

    render(<Timer timer={timer} />)

    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '300')
    expect(progressBar).toHaveAttribute('aria-valuemin', '0')
    expect(progressBar).toHaveAttribute('aria-valuemax', '600')
  })

  it('has proper accessibility attributes', () => {
    render(<Timer timer={mockTimer} />)

    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-label')
  })

  it('updates progress bar color based on time remaining', () => {
    const greenTimer = {
      ...mockTimer,
      getColor: () => 'green' as const,
    }

    const { rerender, container } = render(<Timer timer={greenTimer} />)

    let coloredDiv = container.querySelector('[class*="bg-green"]')
    expect(coloredDiv).toBeInTheDocument()

    const yellowTimer = {
      ...mockTimer,
      getColor: () => 'yellow' as const,
    }

    rerender(<Timer timer={yellowTimer} />)

    coloredDiv = container.querySelector('[class*="bg-yellow"]')
    expect(coloredDiv).toBeInTheDocument()
  })

  it('displays time remaining label', () => {
    render(<Timer timer={mockTimer} />)

    expect(screen.getByText('Time Remaining')).toBeInTheDocument()
  })

  it('formats time correctly in MM:SS format', () => {
    const timer = {
      ...mockTimer,
      getFormattedTime: () => '10:45',
    }

    render(<Timer timer={timer} />)

    expect(screen.getByText('10:45')).toBeInTheDocument()
  })
})
