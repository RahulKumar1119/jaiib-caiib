import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ExplanationPanel } from '../ExplanationPanel'
import { apiClient } from '@/lib/api-client'
import { NotificationProvider } from '@/lib/notification-context'

// Mock the API client
jest.mock('@/lib/api-client', () => ({
  apiClient: {
    post: jest.fn(),
  },
}))

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>

const mockExplanation = {
  explanation_id: 'exp_123',
  question_id: 'q_001',
  correct_answer: 'A',
  explanation_text: 'This is the correct answer because...',
  rbi_norms: ['RBI Act 1934, Section 45', 'RBI Guidelines 2023'],
  iibf_norms: ['IIBF Banking Regulation Guide'],
  generated_at: Math.floor(Date.now() / 1000),
  model: 'claude-4-5-haiku',
}

const renderWithNotification = (component: React.ReactElement) => {
  return render(<NotificationProvider>{component}</NotificationProvider>)
}

describe('ExplanationPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render explain button', () => {
    renderWithNotification(<ExplanationPanel questionId="q_001" />)
    expect(screen.getByRole('button', { name: /Generate explanation/i })).toBeInTheDocument()
  })

  it('should show loading state while fetching explanation', async () => {
    mockApiClient.post.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({ success: true, explanation: mockExplanation })
          }, 100)
        })
    )

    renderWithNotification(<ExplanationPanel questionId="q_001" />)
    const button = screen.getByRole('button', { name: /Generate explanation/i })

    fireEvent.click(button)

    expect(screen.getByText(/Generating explanation/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByText(/Generating explanation/i)).not.toBeInTheDocument()
    })
  })

  it('should display explanation content after loading', async () => {
    mockApiClient.post.mockResolvedValue({
      success: true,
      explanation: mockExplanation,
    })

    renderWithNotification(<ExplanationPanel questionId="q_001" />)
    const button = screen.getByRole('button', { name: /Generate explanation/i })

    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('This is the correct answer because...')).toBeInTheDocument()
    })
  })

  it('should display correct answer', async () => {
    mockApiClient.post.mockResolvedValue({
      success: true,
      explanation: mockExplanation,
    })

    renderWithNotification(<ExplanationPanel questionId="q_001" />)
    const button = screen.getByRole('button', { name: /Generate explanation/i })

    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('A')).toBeInTheDocument()
    })
  })

  it('should display RBI norms', async () => {
    mockApiClient.post.mockResolvedValue({
      success: true,
      explanation: mockExplanation,
    })

    renderWithNotification(<ExplanationPanel questionId="q_001" />)
    const button = screen.getByRole('button', { name: /Generate explanation/i })

    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('RBI Norms & Guidelines:')).toBeInTheDocument()
      expect(screen.getByText('RBI Act 1934, Section 45')).toBeInTheDocument()
      expect(screen.getByText('RBI Guidelines 2023')).toBeInTheDocument()
    })
  })

  it('should display IIBF norms', async () => {
    mockApiClient.post.mockResolvedValue({
      success: true,
      explanation: mockExplanation,
    })

    renderWithNotification(<ExplanationPanel questionId="q_001" />)
    const button = screen.getByRole('button', { name: /Generate explanation/i })

    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('IIBF Standards & Guidelines:')).toBeInTheDocument()
      expect(screen.getByText('IIBF Banking Regulation Guide')).toBeInTheDocument()
    })
  })

  it('should handle API error gracefully', async () => {
    mockApiClient.post.mockRejectedValue(
      new Error('Explanation service temporarily unavailable. Please try again later.')
    )

    renderWithNotification(<ExplanationPanel questionId="q_001" />)
    const button = screen.getByRole('button', { name: /Generate explanation/i })

    fireEvent.click(button)

    await waitFor(() => {
      expect(
        screen.getByText('Explanation service temporarily unavailable. Please try again later.')
      ).toBeInTheDocument()
    })
  })

  it('should show try again button on error', async () => {
    mockApiClient.post.mockRejectedValue(new Error('API Error'))

    renderWithNotification(<ExplanationPanel questionId="q_001" />)
    const button = screen.getByRole('button', { name: /Generate explanation/i })

    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument()
    })
  })

  it('should toggle explanation visibility', async () => {
    mockApiClient.post.mockResolvedValue({
      success: true,
      explanation: mockExplanation,
    })

    renderWithNotification(<ExplanationPanel questionId="q_001" />)
    const button = screen.getByRole('button', { name: /Generate explanation/i })

    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('This is the correct answer because...')).toBeInTheDocument()
    })

    // Click to hide - button text contains "Hide" and "Explanation" on separate lines
    const toggleButton = screen.getByRole('button', { name: /Explanation/i })
    fireEvent.click(toggleButton)

    expect(screen.queryByText('This is the correct answer because...')).not.toBeInTheDocument()

    // Click to show again
    const showButton = screen.getByRole('button', { name: /Explanation/i })
    fireEvent.click(showButton)

    expect(screen.getByText('This is the correct answer because...')).toBeInTheDocument()
  })

  it('should not call API twice for same question', async () => {
    mockApiClient.post.mockResolvedValue({
      success: true,
      explanation: mockExplanation,
    })

    renderWithNotification(<ExplanationPanel questionId="q_001" />)
    const button = screen.getByRole('button', { name: /Generate explanation/i })

    fireEvent.click(button)

    await waitFor(() => {
      expect(mockApiClient.post).toHaveBeenCalledTimes(1)
    })

    // Click again to toggle
    const toggleButton = screen.getByRole('button', { name: /Explanation/i })
    fireEvent.click(toggleButton)

    // Click again to show
    const showButton = screen.getByRole('button', { name: /Explanation/i })
    fireEvent.click(showButton)

    // Should still be called only once
    expect(mockApiClient.post).toHaveBeenCalledTimes(1)
  })

  it('should display generated date', async () => {
    mockApiClient.post.mockResolvedValue({
      success: true,
      explanation: mockExplanation,
    })

    renderWithNotification(<ExplanationPanel questionId="q_001" />)
    const button = screen.getByRole('button', { name: /Generate explanation/i })

    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText(/Generated by claude-4-5-haiku on/i)).toBeInTheDocument()
    })
  })

  it('should handle explanation without norms', async () => {
    const explanationWithoutNorms = {
      ...mockExplanation,
      rbi_norms: [],
      iibf_norms: [],
    }

    mockApiClient.post.mockResolvedValue({
      success: true,
      explanation: explanationWithoutNorms,
    })

    renderWithNotification(<ExplanationPanel questionId="q_001" />)
    const button = screen.getByRole('button', { name: /Generate explanation/i })

    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('This is the correct answer because...')).toBeInTheDocument()
    })

    expect(screen.queryByText('RBI Norms & Guidelines:')).not.toBeInTheDocument()
    expect(screen.queryByText('IIBF Standards & Guidelines:')).not.toBeInTheDocument()
  })
})
