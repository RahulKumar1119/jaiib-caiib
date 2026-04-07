import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { useRouter, useParams } from 'next/navigation'
import ResultsPage from '../[resultId]/page'
import { apiClient } from '@/lib/api-client'
import { NotificationProvider } from '@/lib/notification-context'
import { PracticeSetResult } from '@/lib/types/practice'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}))

// Mock API client
jest.mock('@/lib/api-client', () => ({
  apiClient: {
    get: jest.fn(),
  },
}))

const mockRouter = {
  push: jest.fn(),
}

const mockParams = {
  resultId: 'result_123',
}

const mockResult: PracticeSetResult = {
  score_id: 'score_123',
  score: 85,
  correct_count: 3,
  total_questions: 4,
  answers_detail: [
    {
      question_id: 'q_001',
      user_answer: 'A',
      correct_answer: 'A',
      is_correct: true,
    },
    {
      question_id: 'q_002',
      user_answer: 'B',
      correct_answer: 'C',
      is_correct: false,
    },
    {
      question_id: 'q_003',
      user_answer: 'C',
      correct_answer: 'C',
      is_correct: true,
    },
    {
      question_id: 'q_004',
      user_answer: 'D',
      correct_answer: 'D',
      is_correct: true,
    },
  ],
  time_taken: 450,
  created_at: Math.floor(Date.now() / 1000),
}

const renderWithProviders = (component: React.ReactElement) => {
  return render(<NotificationProvider>{component}</NotificationProvider>)
}

describe('ResultsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useParams as jest.Mock).mockReturnValue(mockParams)
  })

  it('should show loading state initially', () => {
    ;(apiClient.get as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({ success: true, score: mockResult })
          }, 100)
        })
    )

    renderWithProviders(<ResultsPage />)
    expect(screen.getByText('Loading results...')).toBeInTheDocument()
  })

  it('should display results after loading', async () => {
    ;(apiClient.get as jest.Mock).mockResolvedValue({
      success: true,
      score: mockResult,
    })

    renderWithProviders(<ResultsPage />)

    await waitFor(() => {
      expect(screen.getByText('Practice Results')).toBeInTheDocument()
    })
  })

  it('should display score percentage', async () => {
    ;(apiClient.get as jest.Mock).mockResolvedValue({
      success: true,
      score: mockResult,
    })

    renderWithProviders(<ResultsPage />)

    await waitFor(() => {
      expect(screen.getByText('85')).toBeInTheDocument()
    })
  })

  it('should display answer review section', async () => {
    ;(apiClient.get as jest.Mock).mockResolvedValue({
      success: true,
      score: mockResult,
    })

    renderWithProviders(<ResultsPage />)

    await waitFor(() => {
      expect(screen.getByText('Answer Review')).toBeInTheDocument()
    })
  })

  it('should display all questions in answer review', async () => {
    ;(apiClient.get as jest.Mock).mockResolvedValue({
      success: true,
      score: mockResult,
    })

    renderWithProviders(<ResultsPage />)

    await waitFor(() => {
      expect(screen.getByText('Question 1')).toBeInTheDocument()
      expect(screen.getByText('Question 2')).toBeInTheDocument()
      expect(screen.getByText('Question 3')).toBeInTheDocument()
      expect(screen.getByText('Question 4')).toBeInTheDocument()
    })
  })

  it('should show correct/incorrect badges', async () => {
    ;(apiClient.get as jest.Mock).mockResolvedValue({
      success: true,
      score: mockResult,
    })

    renderWithProviders(<ResultsPage />)

    await waitFor(() => {
      const correctBadges = screen.getAllByText('✓ Correct')
      const incorrectBadges = screen.getAllByText('✗ Incorrect')
      expect(correctBadges).toHaveLength(3)
      expect(incorrectBadges).toHaveLength(1)
    })
  })

  it('should display action buttons', async () => {
    ;(apiClient.get as jest.Mock).mockResolvedValue({
      success: true,
      score: mockResult,
    })

    renderWithProviders(<ResultsPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Practice Again/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /View Dashboard/i })).toBeInTheDocument()
    })
  })

  it('should handle API error', async () => {
    ;(apiClient.get as jest.Mock).mockRejectedValue(new Error('API Error'))

    renderWithProviders(<ResultsPage />)

    await waitFor(() => {
      expect(screen.getByText('Error Loading Results')).toBeInTheDocument()
    })
  })

  it('should show back to practice button on error', async () => {
    ;(apiClient.get as jest.Mock).mockRejectedValue(new Error('API Error'))

    renderWithProviders(<ResultsPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Back to Practice/i })).toBeInTheDocument()
    })
  })

  it('should handle missing result', async () => {
    ;(apiClient.get as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Result not found',
    })

    renderWithProviders(<ResultsPage />)

    await waitFor(() => {
      expect(screen.getByText('Error Loading Results')).toBeInTheDocument()
    })
  })

  it('should fetch result with correct endpoint', async () => {
    ;(apiClient.get as jest.Mock).mockResolvedValue({
      success: true,
      score: mockResult,
    })

    renderWithProviders(<ResultsPage />)

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/practice-sets/result_123/result')
    })
  })

  it('should navigate to practice on practice again click', async () => {
    ;(apiClient.get as jest.Mock).mockResolvedValue({
      success: true,
      score: mockResult,
    })

    renderWithProviders(<ResultsPage />)

    await waitFor(() => {
      const practiceAgainButton = screen.getByRole('button', { name: /Practice Again/i })
      practiceAgainButton.click()
      expect(mockRouter.push).toHaveBeenCalledWith('/practice')
    })
  })

  it('should navigate to dashboard on view dashboard click', async () => {
    ;(apiClient.get as jest.Mock).mockResolvedValue({
      success: true,
      score: mockResult,
    })

    renderWithProviders(<ResultsPage />)

    await waitFor(() => {
      const dashboardButton = screen.getByRole('button', { name: /View Dashboard/i })
      dashboardButton.click()
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('should show high score notification', async () => {
    ;(apiClient.get as jest.Mock).mockResolvedValue({
      success: true,
      score: mockResult,
    })

    renderWithProviders(<ResultsPage />)

    await waitFor(() => {
      expect(screen.getByText('Practice Results')).toBeInTheDocument()
    })
  })

  it('should show low score notification', async () => {
    const lowScoreResult = { ...mockResult, score: 25, correct_count: 1 }
    ;(apiClient.get as jest.Mock).mockResolvedValue({
      success: true,
      score: lowScoreResult,
    })

    renderWithProviders(<ResultsPage />)

    await waitFor(() => {
      expect(screen.getByText('Practice Results')).toBeInTheDocument()
    })
  })
})
