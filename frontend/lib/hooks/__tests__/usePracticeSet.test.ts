import { renderHook, act, waitFor } from '@testing-library/react'
import { usePracticeSet } from '../usePracticeSet'
import { PracticeProvider } from '../../practice-context'
import * as apiClient from '../../api-client'
import { PracticeSet } from '../../types/practice'

jest.mock('../../api-client', () => ({
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

describe('usePracticeSet', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  it('should generate practice set', async () => {
    mockApiClient.post.mockResolvedValueOnce({
      practice_set: mockPracticeSet,
    })

    const wrapper = ({ children }: any) => <PracticeProvider>{children}</PracticeProvider>
    const { result } = renderHook(() => usePracticeSet(), { wrapper })

    expect(result.current.currentPracticeSet).toBeNull()

    await act(async () => {
      await result.current.generatePracticeSet('JAIIB_IE_IFS')
    })

    await waitFor(() => {
      expect(result.current.currentPracticeSet).toEqual(mockPracticeSet)
    })
  })

  it('should submit practice set', async () => {
    mockApiClient.post.mockResolvedValueOnce({
      practice_set: mockPracticeSet,
    })

    mockApiClient.post.mockResolvedValueOnce({
      score: {
        score_id: 'score_123',
        score: 75,
        correct_count: 3,
        total_questions: 4,
        answers_detail: [],
        time_taken: 450,
        created_at: Date.now(),
      },
    })

    const wrapper = ({ children }: any) => <PracticeProvider>{children}</PracticeProvider>
    const { result } = renderHook(() => usePracticeSet(), { wrapper })

    await act(async () => {
      await result.current.generatePracticeSet('JAIIB_IE_IFS')
    })

    await act(async () => {
      await result.current.submitPracticeSet({ q_1: 'A' }, 450)
    })

    await waitFor(() => {
      expect(result.current.result?.score).toBe(75)
    })
  })

  it('should handle errors', async () => {
    mockApiClient.post.mockRejectedValueOnce(new Error('Network error'))

    const wrapper = ({ children }: any) => <PracticeProvider>{children}</PracticeProvider>
    const { result } = renderHook(() => usePracticeSet(), { wrapper })

    await act(async () => {
      try {
        await result.current.generatePracticeSet('JAIIB_IE_IFS')
      } catch (err) {
        // Expected error
      }
    })

    await waitFor(() => {
      expect(result.current.error).toBe('Network error')
    })
  })

  it('should clear error', async () => {
    mockApiClient.post.mockRejectedValueOnce(new Error('Network error'))

    const wrapper = ({ children }: any) => <PracticeProvider>{children}</PracticeProvider>
    const { result } = renderHook(() => usePracticeSet(), { wrapper })

    await act(async () => {
      try {
        await result.current.generatePracticeSet('JAIIB_IE_IFS')
      } catch (err) {
        // Expected error
      }
    })

    await waitFor(() => {
      expect(result.current.error).toBe('Network error')
    })

    act(() => {
      result.current.clearError()
    })

    expect(result.current.error).toBeNull()
  })
})
