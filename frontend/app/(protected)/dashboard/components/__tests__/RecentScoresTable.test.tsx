import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { RecentScoresTable } from '../RecentScoresTable'
import { Score } from '@/lib/types/score'

describe('RecentScoresTable', () => {
  const mockScores: Score[] = Array.from({ length: 25 }, (_, i) => ({
    score_id: `score_${i + 1}`,
    user_id: 'user_1',
    practice_set_id: `ps_${i + 1}`,
    paper: ['JAIIB_IE_IFS', 'JAIIB_PPB', 'JAIIB_AFB', 'JAIIB_RBWM'][i % 4] as any,
    score: 50 + Math.random() * 50,
    correct_count: Math.floor(Math.random() * 4) + 1,
    total_questions: 4,
    time_taken: 300 + Math.random() * 300,
    difficulty_avg: 2 + Math.random() * 1,
    performance_trend: ['improving', 'stable', 'declining'][i % 3] as any,
    created_at: Math.floor(Date.now() / 1000) - i * 86400,
  }))

  describe('Table Rendering', () => {
    it('should render table with headers', () => {
      render(<RecentScoresTable scores={mockScores} />)
      expect(screen.getByText('Paper')).toBeInTheDocument()
      expect(screen.getByText('Score')).toBeInTheDocument()
      expect(screen.getByText('Correct Answers')).toBeInTheDocument()
      expect(screen.getByText('Time Taken')).toBeInTheDocument()
      expect(screen.getByText('Date & Time')).toBeInTheDocument()
    })

    it('should render table rows with data', () => {
      render(<RecentScoresTable scores={mockScores} />)
      const table = screen.getByRole('table')
      expect(table).toBeInTheDocument()
    })

    it('should render semantic table structure', () => {
      const { container } = render(<RecentScoresTable scores={mockScores} />)
      const thead = container.querySelector('thead')
      const tbody = container.querySelector('tbody')
      expect(thead).toBeInTheDocument()
      expect(tbody).toBeInTheDocument()
    })
  })

  describe('Pagination', () => {
    it('should display pagination controls when items exceed page size', () => {
      render(<RecentScoresTable scores={mockScores} itemsPerPage={10} />)
      expect(screen.getByText('Previous')).toBeInTheDocument()
      expect(screen.getByText('Next')).toBeInTheDocument()
    })

    it('should display correct number of items per page', () => {
      render(<RecentScoresTable scores={mockScores} itemsPerPage={10} />)
      const rows = screen.getAllByRole('row')
      // +1 for header row
      expect(rows.length).toBe(11)
    })

    it('should display page numbers', () => {
      render(<RecentScoresTable scores={mockScores} itemsPerPage={10} />)
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('should navigate to next page when clicking Next button', () => {
      render(<RecentScoresTable scores={mockScores} itemsPerPage={10} />)
      const nextButton = screen.getByText('Next')
      fireEvent.click(nextButton)

      // Check that page 2 is now active
      const pageButtons = screen.getAllByRole('button')
      const page2Button = pageButtons.find((btn) => btn.textContent === '2')
      expect(page2Button).toHaveClass('bg-primary-600')
    })

    it('should navigate to previous page when clicking Previous button', () => {
      render(<RecentScoresTable scores={mockScores} itemsPerPage={10} />)
      const nextButton = screen.getByText('Next')
      fireEvent.click(nextButton)

      const previousButton = screen.getByText('Previous')
      fireEvent.click(previousButton)

      // Check that page 1 is now active
      const pageButtons = screen.getAllByRole('button')
      const page1Button = pageButtons.find((btn) => btn.textContent === '1')
      expect(page1Button).toHaveClass('bg-primary-600')
    })

    it('should disable Previous button on first page', () => {
      render(<RecentScoresTable scores={mockScores} itemsPerPage={10} />)
      const previousButton = screen.getByText('Previous')
      expect(previousButton).toBeDisabled()
    })

    it('should disable Next button on last page', () => {
      render(<RecentScoresTable scores={mockScores} itemsPerPage={10} />)
      const pageButtons = screen.getAllByRole('button')
      const lastPageButton = pageButtons.find((btn) => btn.textContent === '3')
      fireEvent.click(lastPageButton!)

      const nextButton = screen.getByText('Next')
      expect(nextButton).toBeDisabled()
    })

    it('should display correct pagination info', () => {
      render(<RecentScoresTable scores={mockScores} itemsPerPage={10} />)
      expect(screen.getByText(/Showing 1 to 10 of 25 results/)).toBeInTheDocument()
    })

    it('should update pagination info when navigating pages', () => {
      render(<RecentScoresTable scores={mockScores} itemsPerPage={10} />)
      const nextButton = screen.getByText('Next')
      fireEvent.click(nextButton)

      expect(screen.getByText(/Showing 11 to 20 of 25 results/)).toBeInTheDocument()
    })

    it('should navigate to specific page by clicking page number', () => {
      render(<RecentScoresTable scores={mockScores} itemsPerPage={10} />)
      const pageButtons = screen.getAllByRole('button')
      const page3Button = pageButtons.find((btn) => btn.textContent === '3')
      fireEvent.click(page3Button!)

      expect(screen.getByText(/Showing 21 to 25 of 25 results/)).toBeInTheDocument()
    })
  })

  describe('Data Formatting', () => {
    it('should format scores as percentages', () => {
      const singleScore: Score[] = [
        {
          score_id: 'score_1',
          user_id: 'user_1',
          practice_set_id: 'ps_1',
          paper: 'JAIIB_IE_IFS',
          score: 85,
          correct_count: 3,
          total_questions: 4,
          time_taken: 450,
          difficulty_avg: 2.5,
          performance_trend: 'improving',
          created_at: Math.floor(Date.now() / 1000),
        },
      ]
      render(<RecentScoresTable scores={singleScore} />)
      expect(screen.getByText('85%')).toBeInTheDocument()
    })

    it('should format correct answers as fraction', () => {
      const singleScore: Score[] = [
        {
          score_id: 'score_1',
          user_id: 'user_1',
          practice_set_id: 'ps_1',
          paper: 'JAIIB_IE_IFS',
          score: 75,
          correct_count: 3,
          total_questions: 4,
          time_taken: 450,
          difficulty_avg: 2.5,
          performance_trend: 'improving',
          created_at: Math.floor(Date.now() / 1000),
        },
      ]
      render(<RecentScoresTable scores={singleScore} />)
      expect(screen.getByText('3/4')).toBeInTheDocument()
    })

    it('should format time taken correctly', () => {
      const singleScore: Score[] = [
        {
          score_id: 'score_1',
          user_id: 'user_1',
          practice_set_id: 'ps_1',
          paper: 'JAIIB_IE_IFS',
          score: 75,
          correct_count: 3,
          total_questions: 4,
          time_taken: 450,
          difficulty_avg: 2.5,
          performance_trend: 'improving',
          created_at: Math.floor(Date.now() / 1000),
        },
      ]
      render(<RecentScoresTable scores={singleScore} />)
      expect(screen.getByText('7m 30s')).toBeInTheDocument()
    })

    it('should format paper names correctly', () => {
      const singleScore: Score[] = [
        {
          score_id: 'score_1',
          user_id: 'user_1',
          practice_set_id: 'ps_1',
          paper: 'JAIIB_IE_IFS',
          score: 75,
          correct_count: 3,
          total_questions: 4,
          time_taken: 450,
          difficulty_avg: 2.5,
          performance_trend: 'improving',
          created_at: Math.floor(Date.now() / 1000),
        },
      ]
      render(<RecentScoresTable scores={singleScore} />)
      expect(screen.getByText('Indian Economy & Indian Financial System')).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('should display no data message when scores array is empty', () => {
      render(<RecentScoresTable scores={[]} />)
      expect(screen.getByText('No recent scores available')).toBeInTheDocument()
    })

    it('should not display table when scores are empty', () => {
      const { container } = render(<RecentScoresTable scores={[]} />)
      const table = container.querySelector('table')
      expect(table).not.toBeInTheDocument()
    })

    it('should not display pagination when scores are empty', () => {
      render(<RecentScoresTable scores={[]} />)
      expect(screen.queryByText('Previous')).not.toBeInTheDocument()
      expect(screen.queryByText('Next')).not.toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('should have proper table styling', () => {
      const { container } = render(<RecentScoresTable scores={mockScores} />)
      const table = container.querySelector('table')
      expect(table).toHaveClass('w-full')
    })

    it('should have dark mode support', () => {
      const { container } = render(<RecentScoresTable scores={mockScores} />)
      const darkElements = container.querySelectorAll('[class*="dark:"]')
      expect(darkElements.length).toBeGreaterThan(0)
    })

    it('should have hover effects on rows', () => {
      const { container } = render(<RecentScoresTable scores={mockScores} />)
      const rows = container.querySelectorAll('tbody tr')
      expect(rows[0]).toHaveClass('hover:bg-gray-50')
    })

    it('should have proper header styling', () => {
      const { container } = render(<RecentScoresTable scores={mockScores} />)
      const thead = container.querySelector('thead')
      expect(thead).toHaveClass('bg-gray-50')
    })
  })

  describe('Accessibility', () => {
    it('should have semantic table structure', () => {
      const { container } = render(<RecentScoresTable scores={mockScores} />)
      const table = container.querySelector('table')
      expect(table).toBeInTheDocument()
      expect(container.querySelector('thead')).toBeInTheDocument()
      expect(container.querySelector('tbody')).toBeInTheDocument()
    })

    it('should have proper button labels', () => {
      render(<RecentScoresTable scores={mockScores} itemsPerPage={10} />)
      expect(screen.getByText('Previous')).toBeInTheDocument()
      expect(screen.getByText('Next')).toBeInTheDocument()
    })

    it('should have proper heading hierarchy', () => {
      const { container } = render(<RecentScoresTable scores={mockScores} />)
      const headers = container.querySelectorAll('th')
      expect(headers.length).toBeGreaterThan(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle single score', () => {
      const singleScore: Score[] = [mockScores[0]]
      render(<RecentScoresTable scores={singleScore} />)
      // Pagination should not show for single item
      expect(screen.queryByText(/Showing/)).not.toBeInTheDocument()
    })

    it('should handle exactly one page of scores', () => {
      const tenScores = mockScores.slice(0, 10)
      render(<RecentScoresTable scores={tenScores} itemsPerPage={10} />)
      expect(screen.queryByText('Previous')).not.toBeInTheDocument()
      expect(screen.queryByText('Next')).not.toBeInTheDocument()
    })

    it('should handle custom items per page', () => {
      render(<RecentScoresTable scores={mockScores} itemsPerPage={5} />)
      const rows = screen.getAllByRole('row')
      // +1 for header row
      expect(rows.length).toBe(6)
    })

    it('should handle large number of pages', () => {
      const manyScores = Array.from({ length: 100 }, (_, i) => ({
        ...mockScores[0],
        score_id: `score_${i}`,
      }))
      render(<RecentScoresTable scores={manyScores} itemsPerPage={10} />)
      expect(screen.getByText('10')).toBeInTheDocument()
    })

    it('should handle scores with zero time taken', () => {
      const zeroTimeScore: Score[] = [
        {
          ...mockScores[0],
          time_taken: 0,
        },
      ]
      render(<RecentScoresTable scores={zeroTimeScore} />)
      expect(screen.getByText('0m 0s')).toBeInTheDocument()
    })

    it('should handle scores with maximum time', () => {
      const maxTimeScore: Score[] = [
        {
          ...mockScores[0],
          time_taken: 600,
        },
      ]
      render(<RecentScoresTable scores={maxTimeScore} />)
      expect(screen.getByText('10m 0s')).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('should have responsive table wrapper', () => {
      const { container } = render(<RecentScoresTable scores={mockScores} />)
      const wrapper = container.querySelector('.overflow-x-auto')
      expect(wrapper).toBeInTheDocument()
    })

    it('should have proper padding for mobile', () => {
      const { container } = render(<RecentScoresTable scores={mockScores} />)
      const cells = container.querySelectorAll('td')
      expect(cells[0]).toHaveClass('px-6', 'py-4')
    })
  })
})
