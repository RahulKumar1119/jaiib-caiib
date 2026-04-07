import React from 'react'
import { render, screen } from '@testing-library/react'
import { ScoreDisplay } from '../ScoreDisplay'
import { PracticeSetResult } from '@/lib/types/practice'

describe('ScoreDisplay', () => {
  const mockResult: PracticeSetResult = {
    score_id: 'score_123',
    score: 85,
    correct_count: 3,
    total_questions: 4,
    answers_detail: [],
    time_taken: 450,
    created_at: Date.now() / 1000,
  }

  it('should render score percentage', () => {
    render(<ScoreDisplay result={mockResult} />)
    expect(screen.getByText('85')).toBeInTheDocument()
    expect(screen.getByText('%')).toBeInTheDocument()
  })

  it('should display correct answer count', () => {
    render(<ScoreDisplay result={mockResult} />)
    expect(screen.getByText('3/4')).toBeInTheDocument()
  })

  it('should display incorrect answer count', () => {
    render(<ScoreDisplay result={mockResult} />)
    expect(screen.getByText('1/4')).toBeInTheDocument()
  })

  it('should display time taken in MM:SS format', () => {
    render(<ScoreDisplay result={mockResult} />)
    expect(screen.getByText('7:30')).toBeInTheDocument()
  })

  it('should show passed status for score >= 50', () => {
    render(<ScoreDisplay result={mockResult} />)
    expect(screen.getByText('✓ Passed')).toBeInTheDocument()
  })

  it('should show failed status for score < 50', () => {
    const failedResult = { ...mockResult, score: 25, correct_count: 1 }
    render(<ScoreDisplay result={failedResult} />)
    expect(screen.getByText('✗ Failed')).toBeInTheDocument()
  })

  it('should show excellent message for high score', () => {
    render(<ScoreDisplay result={mockResult} />)
    expect(screen.getByText('Excellent! Great job!')).toBeInTheDocument()
  })

  it('should show good effort message for passing score', () => {
    const passingResult = { ...mockResult, score: 60, correct_count: 2 }
    render(<ScoreDisplay result={passingResult} />)
    expect(screen.getByText('Good effort! Keep practicing!')).toBeInTheDocument()
  })

  it('should show keep practicing message for low score', () => {
    const lowResult = { ...mockResult, score: 25, correct_count: 1 }
    render(<ScoreDisplay result={lowResult} />)
    expect(screen.getByText('Keep practicing to improve!')).toBeInTheDocument()
  })

  it('should show outstanding performance badge for high score', () => {
    render(<ScoreDisplay result={mockResult} />)
    expect(screen.getByText('🎉 Outstanding performance!')).toBeInTheDocument()
  })

  it('should not show outstanding performance badge for low score', () => {
    const lowResult = { ...mockResult, score: 60, correct_count: 2 }
    render(<ScoreDisplay result={lowResult} />)
    expect(screen.queryByText('🎉 Outstanding performance!')).not.toBeInTheDocument()
  })

  it('should have proper accessibility labels', () => {
    render(<ScoreDisplay result={mockResult} />)
    expect(screen.getByRole('region', { name: 'Score display' })).toBeInTheDocument()
  })

  it('should handle perfect score', () => {
    const perfectResult = { ...mockResult, score: 100, correct_count: 4 }
    render(<ScoreDisplay result={perfectResult} />)
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('4/4')).toBeInTheDocument()
  })

  it('should handle zero score', () => {
    const zeroResult = { ...mockResult, score: 0, correct_count: 0 }
    render(<ScoreDisplay result={zeroResult} />)
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByText('0/4')).toBeInTheDocument()
  })
})
