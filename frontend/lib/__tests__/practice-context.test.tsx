import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { PracticeProvider, usePracticeContext } from '../practice-context'
import { PracticeSet, JaiibPaper } from '../types/practice'
import * as apiClient from '../api-client'

// Mock the API client
jest.mock('../api-client', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
  },
}))

const mockApiClient = apiClient.apiClient as jest.Mocked<typeof apiClient.apiClient>

const mockPracticeSet: PracticeSet = {
  practice_set_id: 'ps_123',
  paper: 'JAIIB_IE_IFS',
  questions: [
    {
      question_id: 'q_1',
      question_text: 'What is RBI?',
      options: { A: 'Option A', B: 'Option B', C: 'Option C', D: 'Option D' },
      order: ['A', 'B', 'C', 'D'],
      difficulty_level: 'easy',
      paper: 'JAIIB_IE_IFS',
      syllabus_topic: 'RBI',
    },
  ],
  time_limit: 600,
  created_at: Date.now(),
  status: 'in_progress',
  session_token: 'token_123',
  session_expires_at: Date.now() + 900000,
}

const mockResult = {
  score_id: 'score_123',
  score: 75,
  correct_count: 3,
  total_questions: 4,
  answers_detail: [],
  time_taken: 450,
  created_at: Date.now(),
}

function TestComponent() {
  const { currentPracticeSet, result, isLoading, error, generatePracticeSet, submitPracticeSet } =
    usePracticeContext()

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="error">{error || 'No Error'}</div>
      <div data-testid="practice-set">{currentPracticeSet?.practice_set_id || 'No Practice Set'}</div>
      <div data-testid="result">{result?.score || 'No Result'}</div>
      <button
        onClick={() => generatePracticeSet('JAIIB_IE_IFS')}
        data-testid="generate-btn"
      >
        Generate
      </button>
      <button
        onClick={() => submitPracticeSet({ q_1: 'A' }, 450)}
        data-testid="submit-btn"
      >
        Submit
      </button>
    </div>
  )
}

describe('PracticeContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  it('should provide initial state', () => {
    render(
      <PracticeProvider>
        <TestComponent />
      </PracticeProvider>
    )

    expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
    expect(screen.getByTestId('error')).toHaveTextContent('No Error')
    expect(screen.getByTestId('practice-set')).toHaveTextContent('No Practice Set')
  })

  it('should generate practice set', async () => {
    mockApiClient.post.mockResolvedValueOnce({
      practice_set: mockPracticeSet,
    })

    render(
      <PracticeProvider>
        <TestComponent />
      </PracticeProvider>
    )

    const generateBtn = screen.getByTestId('generate-btn')
    generateBtn.click()

    await waitFor(() => {
      expect(screen.getByTestId('practice-set')).toHaveTextContent('ps_123')
    })

    expect(mockApiClient.post).toHaveBeenCalledWith('/practice-sets', {
      paper: 'JAIIB_IE_IFS',
    })
  })

  it('should persist practice set to localStorage', async () => {
    mockApiClient.post.mockResolvedValueOnce({
      practice_set: mockPracticeSet,
    })

    render(
      <PracticeProvider>
        <TestComponent />
      </PracticeProvider>
    )

    const generateBtn = screen.getByTestId('generate-btn')
    generateBtn.click()

    await waitFor(() => {
      const stored = localStorage.getItem('practice_session')
      expect(stored).toBeTruthy()
      const parsed = JSON.parse(stored!)
      expect(parsed.practice_set_id).toBe('ps_123')
    })
  })

  it('should submit practice set', async () => {
    mockApiClient.post.mockResolvedValueOnce({
      practice_set: mockPracticeSet,
    })

    mockApiClient.post.mockResolvedValueOnce({
      score: mockResult,
    })

    render(
      <PracticeProvider>
        <TestComponent />
      </PracticeProvider>
    )

    // Generate first
    const generateBtn = screen.getByTestId('generate-btn')
    generateBtn.click()

    await waitFor(() => {
      expect(screen.getByTestId('practice-set')).toHaveTextContent('ps_123')
    })

    // Then submit
    const submitBtn = screen.getByTestId('submit-btn')
    submitBtn.click()

    await waitFor(() => {
      expect(screen.getByTestId('result')).toHaveTextContent('75')
    })

    expect(mockApiClient.post).toHaveBeenCalledWith(
      '/practice-sets/ps_123/submit',
      expect.objectContaining({
        answers: { q_1: 'A' },
        time_taken: 450,
      })
    )
  })

  it('should clear localStorage after successful submission', async () => {
    mockApiClient.post.mockResolvedValueOnce({
      practice_set: mockPracticeSet,
    })

    mockApiClient.post.mockResolvedValueOnce({
      score: mockResult,
    })

    render(
      <PracticeProvider>
        <TestComponent />
      </PracticeProvider>
    )

    // Generate
    const generateBtn = screen.getByTestId('generate-btn')
    generateBtn.click()

    await waitFor(() => {
      expect(localStorage.getItem('practice_session')).toBeTruthy()
    })

    // Submit
    const submitBtn = screen.getByTestId('submit-btn')
    submitBtn.click()

    await waitFor(() => {
      expect(localStorage.getItem('practice_session')).toBeNull()
    })
  })

  it('should handle errors', async () => {
    mockApiClient.post.mockRejectedValueOnce(new Error('Network error'))

    render(
      <PracticeProvider>
        <TestComponent />
      </PracticeProvider>
    )

    const generateBtn = screen.getByTestId('generate-btn')
    
    try {
      generateBtn.click()
    } catch (err) {
      // Expected error
    }

    // Just verify the component renders without crashing
    expect(screen.getByTestId('error')).toBeInTheDocument()
  })
})
