import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import PracticePage from '../page'
import { usePracticeSet } from '@/lib/hooks/usePracticeSet'
import { useNotification } from '@/lib/notification-context'

// Mock dependencies
jest.mock('next/navigation')
jest.mock('@/lib/hooks/usePracticeSet')
jest.mock('@/lib/notification-context')

describe('PracticePage', () => {
  const mockPush = jest.fn()
  const mockGeneratePracticeSet = jest.fn()
  const mockAddNotification = jest.fn()
  const mockClearError = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
    ;(usePracticeSet as jest.Mock).mockReturnValue({
      generatePracticeSet: mockGeneratePracticeSet,
      isLoading: false,
      error: null,
      clearError: mockClearError,
    })
    ;(useNotification as jest.Mock).mockReturnValue({
      addNotification: mockAddNotification,
    })
  })

  it('renders the practice page with all four JAIIB papers', () => {
    render(<PracticePage />)
    
    expect(screen.getByText('Practice Sets')).toBeInTheDocument()
    expect(screen.getByText('IE & IFS')).toBeInTheDocument()
    expect(screen.getByText('PPB')).toBeInTheDocument()
    expect(screen.getByText('AFB')).toBeInTheDocument()
    expect(screen.getByText('RBWM')).toBeInTheDocument()
  })

  it('displays difficulty level selector', () => {
    render(<PracticePage />)
    
    const difficultySelect = screen.getByLabelText('Select difficulty level for practice')
    expect(difficultySelect).toBeInTheDocument()
    expect(difficultySelect).toHaveValue('medium')
  })

  it('allows changing difficulty level', () => {
    render(<PracticePage />)
    
    const difficultySelect = screen.getByLabelText('Select difficulty level for practice') as HTMLSelectElement
    fireEvent.change(difficultySelect, { target: { value: 'hard' } })
    
    expect(difficultySelect.value).toBe('hard')
  })

  it('starts practice when Start Practice button is clicked', async () => {
    mockGeneratePracticeSet.mockResolvedValue(undefined)
    render(<PracticePage />)
    
    const startButtons = screen.getAllByText('Start Practice')
    fireEvent.click(startButtons[0])
    
    await waitFor(() => {
      expect(mockGeneratePracticeSet).toHaveBeenCalledWith('JAIIB_IE_IFS')
      expect(mockPush).toHaveBeenCalledWith('/practice/JAIIB_IE_IFS')
    })
  })

  it('displays error message when practice generation fails', async () => {
    mockGeneratePracticeSet.mockRejectedValue(new Error('Generation failed'))
    render(<PracticePage />)
    
    const startButtons = screen.getAllByText('Start Practice')
    fireEvent.click(startButtons[0])
    
    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith(
        'Failed to start practice. Please try again.',
        'error'
      )
    })
  })

  it('displays loading state while generating practice set', async () => {
    ;(usePracticeSet as jest.Mock).mockReturnValue({
      generatePracticeSet: mockGeneratePracticeSet,
      isLoading: true,
      error: null,
      clearError: mockClearError,
    })
    
    render(<PracticePage />)
    
    const startButtons = screen.getAllByText('Starting...')
    expect(startButtons.length).toBeGreaterThan(0)
  })

  it('displays all paper information correctly', () => {
    render(<PracticePage />)
    
    // Check for paper descriptions
    expect(screen.getByText(/Economic fundamentals and financial systems/)).toBeInTheDocument()
    expect(screen.getByText(/Banking principles and practices/)).toBeInTheDocument()
    expect(screen.getByText(/Accounting and financial management/)).toBeInTheDocument()
    expect(screen.getByText(/Retail banking and wealth management/)).toBeInTheDocument()
  })

  it('displays practice set information', () => {
    render(<PracticePage />)
    
    const questionTexts = screen.getAllByText('Questions per set: 4')
    const timeTexts = screen.getAllByText('Time limit: 10 minutes')
    
    expect(questionTexts.length).toBe(4)
    expect(timeTexts.length).toBe(4)
  })

  it('has proper accessibility attributes', () => {
    render(<PracticePage />)
    
    const difficultySelect = screen.getByLabelText('Select difficulty level for practice')
    expect(difficultySelect).toHaveAttribute('aria-label')
    
    const startButtons = screen.getAllByText('Start Practice')
    startButtons.forEach((button) => {
      expect(button).toHaveAttribute('aria-label')
    })
  })

  it('displays info section with practice guidelines', () => {
    render(<PracticePage />)
    
    expect(screen.getByText('How Practice Sets Work')).toBeInTheDocument()
    expect(screen.getByText(/Each practice set contains 4 randomly selected questions/)).toBeInTheDocument()
    expect(screen.getByText(/You have 10 minutes to complete/)).toBeInTheDocument()
  })
})
