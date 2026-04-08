import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { MissedQuestions } from '../MissedQuestions'

describe('MissedQuestions Component', () => {
  const mockQuestions = [
    {
      question_id: 'q_001',
      question_text: 'What is the primary function of RBI?',
      paper: 'JAIIB_IE_IFS',
      average_score: 35.5,
      times_attempted: 120,
    },
    {
      question_id: 'q_002',
      question_text: 'Define monetary policy',
      paper: 'JAIIB_IE_IFS',
      average_score: 42.3,
      times_attempted: 105,
    },
    {
      question_id: 'q_003',
      question_text: 'What is inflation?',
      paper: 'JAIIB_PPB',
      average_score: 48.7,
      times_attempted: 98,
    },
  ]

  describe('Rendering', () => {
    it('should render missed questions section', () => {
      render(<MissedQuestions questions={mockQuestions} />)
      expect(screen.getByText('Most Frequently Missed Questions')).toBeInTheDocument()
    })

    it('should display table with question data', () => {
      render(<MissedQuestions questions={mockQuestions} />)
      expect(screen.getByText('What is the primary function of RBI?')).toBeInTheDocument()
      expect(screen.getByText('Define monetary policy')).toBeInTheDocument()
    })

    it('should display table headers', () => {
      render(<MissedQuestions questions={mockQuestions} />)
      expect(screen.getByText('Question')).toBeInTheDocument()
      expect(screen.getByText('Paper')).toBeInTheDocument()
      expect(screen.getByText('Avg Score')).toBeInTheDocument()
      expect(screen.getByText('Attempts')).toBeInTheDocument()
    })

    it('should display average scores', () => {
      render(<MissedQuestions questions={mockQuestions} />)
      expect(screen.getByText('35.5%')).toBeInTheDocument()
      expect(screen.getByText('42.3%')).toBeInTheDocument()
      expect(screen.getByText('48.7%')).toBeInTheDocument()
    })

    it('should display attempt counts', () => {
      render(<MissedQuestions questions={mockQuestions} />)
      expect(screen.getByText('120')).toBeInTheDocument()
      expect(screen.getByText('105')).toBeInTheDocument()
      expect(screen.getByText('98')).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('should display no data message when questions array is empty', () => {
      render(<MissedQuestions questions={[]} />)
      expect(screen.getByText('No missed questions data available')).toBeInTheDocument()
    })

    it('should display no data message when questions is null', () => {
      render(<MissedQuestions questions={null as any} />)
      expect(screen.getByText('No missed questions data available')).toBeInTheDocument()
    })
  })

  describe('Pagination', () => {
    it('should display pagination controls when there are more than 10 questions', () => {
      const manyQuestions = Array.from({ length: 15 }, (_, i) => ({
        question_id: `q_${i}`,
        question_text: `Question ${i}`,
        paper: 'JAIIB_IE_IFS',
        average_score: 50,
        times_attempted: 100,
      }))

      render(<MissedQuestions questions={manyQuestions} />)
      expect(screen.getByText('Previous')).toBeInTheDocument()
      expect(screen.getByText('Next')).toBeInTheDocument()
    })

    it('should not display pagination when there are 10 or fewer questions', () => {
      render(<MissedQuestions questions={mockQuestions} />)
      const previousButton = screen.queryByText('Previous')
      expect(previousButton).not.toBeInTheDocument()
    })

    it('should display page numbers for multiple pages', () => {
      const manyQuestions = Array.from({ length: 25 }, (_, i) => ({
        question_id: `q_${i}`,
        question_text: `Question ${i}`,
        paper: 'JAIIB_IE_IFS',
        average_score: 50,
        times_attempted: 100,
      }))

      render(<MissedQuestions questions={manyQuestions} />)
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('should navigate to next page when next button is clicked', () => {
      const manyQuestions = Array.from({ length: 15 }, (_, i) => ({
        question_id: `q_${i}`,
        question_text: `Question ${i}`,
        paper: 'JAIIB_IE_IFS',
        average_score: 50,
        times_attempted: 100,
      }))

      render(<MissedQuestions questions={manyQuestions} />)
      const nextButton = screen.getByText('Next')
      fireEvent.click(nextButton)

      // Page 2 should be highlighted
      const page2Button = screen.getByText('2')
      expect(page2Button).toHaveClass('bg-primary-600')
    })

    it('should navigate to previous page when previous button is clicked', () => {
      const manyQuestions = Array.from({ length: 15 }, (_, i) => ({
        question_id: `q_${i}`,
        question_text: `Question ${i}`,
        paper: 'JAIIB_IE_IFS',
        average_score: 50,
        times_attempted: 100,
      }))

      render(<MissedQuestions questions={manyQuestions} />)
      const nextButton = screen.getByText('Next')
      fireEvent.click(nextButton)

      const previousButton = screen.getByText('Previous')
      fireEvent.click(previousButton)

      // Page 1 should be highlighted
      const page1Button = screen.getByText('1')
      expect(page1Button).toHaveClass('bg-primary-600')
    })

    it('should disable previous button on first page', () => {
      const manyQuestions = Array.from({ length: 15 }, (_, i) => ({
        question_id: `q_${i}`,
        question_text: `Question ${i}`,
        paper: 'JAIIB_IE_IFS',
        average_score: 50,
        times_attempted: 100,
      }))

      render(<MissedQuestions questions={manyQuestions} />)
      const previousButton = screen.getByText('Previous') as HTMLButtonElement
      expect(previousButton.disabled).toBe(true)
    })

    it('should disable next button on last page', () => {
      const manyQuestions = Array.from({ length: 15 }, (_, i) => ({
        question_id: `q_${i}`,
        question_text: `Question ${i}`,
        paper: 'JAIIB_IE_IFS',
        average_score: 50,
        times_attempted: 100,
      }))

      render(<MissedQuestions questions={manyQuestions} />)
      const nextButton = screen.getByText('Next')
      fireEvent.click(nextButton)

      const nextButtonAfter = screen.getByText('Next') as HTMLButtonElement
      expect(nextButtonAfter.disabled).toBe(true)
    })
  })

  describe('Score Visualization', () => {
    it('should display progress bar for each score', () => {
      const { container } = render(<MissedQuestions questions={mockQuestions} />)
      const progressBars = container.querySelectorAll('[class*="bg-"]')
      expect(progressBars.length).toBeGreaterThan(0)
    })

    it('should color code scores based on performance', () => {
      const { container } = render(<MissedQuestions questions={mockQuestions} />)
      // Low scores should have red color
      const redElements = container.querySelectorAll('[class*="bg-red"]')
      expect(redElements.length).toBeGreaterThan(0)
    })
  })

  describe('Table Structure', () => {
    it('should have semantic table structure', () => {
      render(<MissedQuestions questions={mockQuestions} />)
      const table = screen.getByRole('table')
      expect(table).toBeInTheDocument()

      const thead = table.querySelector('thead')
      expect(thead).toBeInTheDocument()

      const tbody = table.querySelector('tbody')
      expect(tbody).toBeInTheDocument()
    })

    it('should display correct number of rows', () => {
      render(<MissedQuestions questions={mockQuestions} />)
      const rows = screen.getAllByRole('row')
      // 1 header row + 3 data rows
      expect(rows.length).toBe(4)
    })

    it('should display row numbers', () => {
      render(<MissedQuestions questions={mockQuestions} />)
      expect(screen.getByText('1.')).toBeInTheDocument()
      expect(screen.getByText('2.')).toBeInTheDocument()
      expect(screen.getByText('3.')).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('should have dark mode support', () => {
      const { container } = render(<MissedQuestions questions={mockQuestions} />)
      const darkModeElements = container.querySelectorAll('[class*="dark:"]')
      expect(darkModeElements.length).toBeGreaterThan(0)
    })

    it('should have hover effects on rows', () => {
      const { container } = render(<MissedQuestions questions={mockQuestions} />)
      const rows = container.querySelectorAll('tbody tr')
      rows.forEach((row) => {
        expect(row).toHaveClass('hover:bg-gray-50')
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<MissedQuestions questions={mockQuestions} />)
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toHaveTextContent('Most Frequently Missed Questions')
    })

    it('should have semantic table headers', () => {
      render(<MissedQuestions questions={mockQuestions} />)
      const table = screen.getByRole('table')
      const headers = table.querySelectorAll('th')
      expect(headers.length).toBe(4)
    })

    it('should have proper contrast for text', () => {
      const { container } = render(<MissedQuestions questions={mockQuestions} />)
      const textElements = container.querySelectorAll('[class*="text-gray"]')
      expect(textElements.length).toBeGreaterThan(0)
    })
  })

  describe('Data Display', () => {
    it('should display question text truncated if too long', () => {
      const longQuestion = {
        question_id: 'q_long',
        question_text: 'This is a very long question text that should be truncated to prevent layout issues and maintain readability in the table view',
        paper: 'JAIIB_IE_IFS',
        average_score: 50,
        times_attempted: 100,
      }

      const { container } = render(<MissedQuestions questions={[longQuestion]} />)
      const questionCell = container.querySelector('[class*="line-clamp"]')
      expect(questionCell).toBeInTheDocument()
    })

    it('should format paper names correctly', () => {
      render(<MissedQuestions questions={mockQuestions} />)
      // Paper names should be formatted (not raw IDs)
      const paperCells = screen.getAllByText(/Indian Economy|Principles and Practices/)
      expect(paperCells.length).toBeGreaterThan(0)
    })

    it('should display scores with one decimal place', () => {
      render(<MissedQuestions questions={mockQuestions} />)
      expect(screen.getByText('35.5%')).toBeInTheDocument()
      expect(screen.getByText('42.3%')).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('should have responsive table layout', () => {
      const { container } = render(<MissedQuestions questions={mockQuestions} />)
      const tableContainer = container.querySelector('[class*="overflow"]')
      expect(tableContainer).toBeInTheDocument()
    })

    it('should have responsive padding', () => {
      const { container } = render(<MissedQuestions questions={mockQuestions} />)
      const cells = container.querySelectorAll('td, th')
      cells.forEach((cell) => {
        expect(cell).toHaveClass('px-4')
      })
    })
  })
})
