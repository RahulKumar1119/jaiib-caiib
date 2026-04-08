import React from 'react'
import { render, screen } from '@testing-library/react'
import { QuestionList } from '../QuestionList'
import { AdminQuestion } from '../../page'

describe('Admin Questions - Responsive Layout Tests', () => {
  const mockQuestions: AdminQuestion[] = [
    {
      question_id: 'q_1',
      question_text: 'What is the primary function of RBI?',
      option_a: 'Option A',
      option_b: 'Option B',
      option_c: 'Option C',
      option_d: 'Option D',
      correct_answer: 'A',
      paper: 'JAIIB_IE_IFS',
      difficulty_level: 'medium',
      status: 'active',
      version: 1,
      created_at: Math.floor(Date.now() / 1000),
      updated_at: Math.floor(Date.now() / 1000),
    },
    {
      question_id: 'q_2',
      question_text: 'What is the minimum capital requirement for banks?',
      option_a: 'Option A',
      option_b: 'Option B',
      option_c: 'Option C',
      option_d: 'Option D',
      correct_answer: 'B',
      paper: 'JAIIB_PPB',
      difficulty_level: 'hard',
      status: 'active',
      version: 1,
      created_at: Math.floor(Date.now() / 1000),
      updated_at: Math.floor(Date.now() / 1000),
    },
  ]

  const mockHandlers = {
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    onConfirmDelete: jest.fn(),
    onCancelDelete: jest.fn(),
  }

  describe('Mobile Card View', () => {
    it('should render mobile card view on small screens', () => {
      const { container } = render(
        <QuestionList
          questions={mockQuestions}
          deleteConfirmId={null}
          {...mockHandlers}
        />
      )
      const mobileView = container.querySelector('.block.sm\\:hidden')
      expect(mobileView).toBeInTheDocument()
    })

    it('should display question text in mobile cards', () => {
      render(
        <QuestionList
          questions={mockQuestions}
          deleteConfirmId={null}
          {...mockHandlers}
        />
      )
      const elements = screen.getAllByText('What is the primary function of RBI?')
      expect(elements.length).toBeGreaterThan(0)
    })

    it('should display badges in mobile view', () => {
      const { container } = render(
        <QuestionList
          questions={mockQuestions}
          deleteConfirmId={null}
          {...mockHandlers}
        />
      )
      const badges = container.querySelectorAll('[class*="rounded-full"]')
      expect(badges.length).toBeGreaterThan(0)
    })

    it('should have touch-friendly button sizes on mobile', () => {
      const { container } = render(
        <QuestionList
          questions={mockQuestions}
          deleteConfirmId={null}
          {...mockHandlers}
        />
      )
      const buttons = container.querySelectorAll('button')
      buttons.forEach((button) => {
        expect(button.className).toMatch(/min-h-\[32px\]|min-h-\[36px\]|min-h-\[40px\]/)
      })
    })

    it('should stack action buttons vertically on mobile', () => {
      const { container } = render(
        <QuestionList
          questions={mockQuestions}
          deleteConfirmId={null}
          {...mockHandlers}
        />
      )
      const mobileView = container.querySelector('.block.sm\\:hidden')
      const buttonContainer = mobileView?.querySelector('.flex.gap-2')
      expect(buttonContainer).toBeInTheDocument()
    })
  })

  describe('Desktop Table View', () => {
    it('should render desktop table view on larger screens', () => {
      const { container } = render(
        <QuestionList
          questions={mockQuestions}
          deleteConfirmId={null}
          {...mockHandlers}
        />
      )
      const desktopView = container.querySelector('.hidden.sm\\:block')
      expect(desktopView).toBeInTheDocument()
    })

    it('should display table headers', () => {
      render(
        <QuestionList
          questions={mockQuestions}
          deleteConfirmId={null}
          {...mockHandlers}
        />
      )
      expect(screen.getByText('Question')).toBeInTheDocument()
      expect(screen.getByText('Difficulty')).toBeInTheDocument()
    })

    it('should hide columns on smaller breakpoints', () => {
      const { container } = render(
        <QuestionList
          questions={mockQuestions}
          deleteConfirmId={null}
          {...mockHandlers}
        />
      )
      const hiddenColumns = container.querySelectorAll('.hidden.md\\:table-cell, .hidden.lg\\:table-cell')
      expect(hiddenColumns.length).toBeGreaterThan(0)
    })

    it('should have responsive padding on table cells', () => {
      const { container } = render(
        <QuestionList
          questions={mockQuestions}
          deleteConfirmId={null}
          {...mockHandlers}
        />
      )
      const cells = container.querySelectorAll('td, th')
      cells.forEach((cell) => {
        expect(cell.className).toMatch(/px-4|px-6/)
      })
    })
  })

  describe('Responsive Breakpoints', () => {
    it('should render correctly at mobile breakpoint (375px)', () => {
      global.innerWidth = 375
      const { container } = render(
        <QuestionList
          questions={mockQuestions}
          deleteConfirmId={null}
          {...mockHandlers}
        />
      )
      const mobileView = container.querySelector('.block.sm\\:hidden')
      expect(mobileView).toBeInTheDocument()
    })

    it('should render correctly at tablet breakpoint (768px)', () => {
      global.innerWidth = 768
      const { container } = render(
        <QuestionList
          questions={mockQuestions}
          deleteConfirmId={null}
          {...mockHandlers}
        />
      )
      const desktopView = container.querySelector('.hidden.sm\\:block')
      expect(desktopView).toBeInTheDocument()
    })

    it('should render correctly at desktop breakpoint (1920px)', () => {
      global.innerWidth = 1920
      const { container } = render(
        <QuestionList
          questions={mockQuestions}
          deleteConfirmId={null}
          {...mockHandlers}
        />
      )
      const desktopView = container.querySelector('.hidden.sm\\:block')
      expect(desktopView).toBeInTheDocument()
    })
  })

  describe('No Horizontal Scrolling', () => {
    it('should not have horizontal scrolling on mobile', () => {
      const { container } = render(
        <QuestionList
          questions={mockQuestions}
          deleteConfirmId={null}
          {...mockHandlers}
        />
      )
      const mobileView = container.querySelector('.block.sm\\:hidden')
      expect(mobileView?.className).not.toMatch(/overflow-x-auto/)
    })

    it('should have proper width constraints', () => {
      const { container } = render(
        <QuestionList
          questions={mockQuestions}
          deleteConfirmId={null}
          {...mockHandlers}
        />
      )
      const wrapper = container.querySelector('.w-full')
      expect(wrapper).toBeInTheDocument()
    })
  })

  describe('Touch Event Handling', () => {
    it('should have touch-friendly button sizes', () => {
      const { container } = render(
        <QuestionList
          questions={mockQuestions}
          deleteConfirmId={null}
          {...mockHandlers}
        />
      )
      const buttons = container.querySelectorAll('button')
      buttons.forEach((button) => {
        expect(button.className).toMatch(/min-h-\[32px\]|min-h-\[36px\]|min-h-\[40px\]/)
      })
    })

    it('should have active state for touch interactions', () => {
      const { container } = render(
        <QuestionList
          questions={mockQuestions}
          deleteConfirmId={null}
          {...mockHandlers}
        />
      )
      const buttons = container.querySelectorAll('button')
      buttons.forEach((button) => {
        expect(button.className).toMatch(/active:|hover:/)
      })
    })
  })

  describe('Modal Responsiveness', () => {
    it('should render responsive delete confirmation modal', () => {
      const { container } = render(
        <QuestionList
          questions={mockQuestions}
          deleteConfirmId="q_1"
          {...mockHandlers}
        />
      )
      const modal = container.querySelector('.fixed.inset-0')
      expect(modal).toBeInTheDocument()
    })

    it('should have responsive padding on modal', () => {
      const { container } = render(
        <QuestionList
          questions={mockQuestions}
          deleteConfirmId="q_1"
          {...mockHandlers}
        />
      )
      const modal = container.querySelector('.fixed.inset-0')
      expect(modal?.className).toMatch(/p-4/)
    })

    it('should have responsive modal content width', () => {
      const { container } = render(
        <QuestionList
          questions={mockQuestions}
          deleteConfirmId="q_1"
          {...mockHandlers}
        />
      )
      const modalContent = container.querySelector('.max-w-sm')
      expect(modalContent).toBeInTheDocument()
    })

    it('should have responsive button layout in modal', () => {
      const { container } = render(
        <QuestionList
          questions={mockQuestions}
          deleteConfirmId="q_1"
          {...mockHandlers}
        />
      )
      const buttonContainer = container.querySelector('.flex.gap-3')
      expect(buttonContainer).toBeInTheDocument()
    })
  })

  describe('Pagination Responsiveness', () => {
    const manyQuestions = Array.from({ length: 25 }, (_, i) => ({
      ...mockQuestions[0],
      question_id: `q_${i}`,
    }))

    it('should render pagination controls responsively', () => {
      const { container } = render(
        <QuestionList
          questions={manyQuestions}
          deleteConfirmId={null}
          itemsPerPage={10}
          {...mockHandlers}
        />
      )
      const pagination = container.querySelector('.flex.flex-col.sm\\:flex-row')
      expect(pagination).toBeInTheDocument()
    })

    it('should have responsive pagination button sizes', () => {
      const { container } = render(
        <QuestionList
          questions={manyQuestions}
          deleteConfirmId={null}
          itemsPerPage={10}
          {...mockHandlers}
        />
      )
      const paginationButtons = container.querySelectorAll('.flex.gap-1 button')
      paginationButtons.forEach((button) => {
        expect(button.className).toMatch(/min-h-\[36px\]/)
      })
    })

    it('should stack pagination info vertically on mobile', () => {
      const { container } = render(
        <QuestionList
          questions={manyQuestions}
          deleteConfirmId={null}
          itemsPerPage={10}
          {...mockHandlers}
        />
      )
      const paginationContainer = container.querySelector('.flex.flex-col.sm\\:flex-row')
      expect(paginationContainer).toBeInTheDocument()
    })
  })

  describe('Text Readability', () => {
    it('should have readable font sizes on mobile', () => {
      render(
        <QuestionList
          questions={mockQuestions}
          deleteConfirmId={null}
          {...mockHandlers}
        />
      )
      const questionTexts = screen.getAllByText('What is the primary function of RBI?')
      expect(questionTexts.length).toBeGreaterThan(0)
      // Check that at least one has readable font size
      const hasReadableSize = questionTexts.some((text) =>
        text.className.match(/text-xs|text-sm/)
      )
      expect(hasReadableSize).toBe(true)
    })

    it('should have proper contrast for text', () => {
      const { container } = render(
        <QuestionList
          questions={mockQuestions}
          deleteConfirmId={null}
          {...mockHandlers}
        />
      )
      const darkModeElements = container.querySelectorAll('[class*="dark:"]')
      expect(darkModeElements.length).toBeGreaterThan(0)
    })

    it('should truncate long question text appropriately', () => {
      render(
        <QuestionList
          questions={mockQuestions}
          deleteConfirmId={null}
          {...mockHandlers}
        />
      )
      const questionCells = screen.getAllByText('What is the primary function of RBI?')
      expect(questionCells.length).toBeGreaterThan(0)
      // Check that at least one has truncate or line-clamp class
      const hasProperClass = questionCells.some((cell) =>
        cell.className.match(/truncate|line-clamp/)
      )
      expect(hasProperClass).toBe(true)
    })
  })

  describe('Accessibility on Mobile', () => {
    it('should have proper button labels', () => {
      render(
        <QuestionList
          questions={mockQuestions}
          deleteConfirmId={null}
          {...mockHandlers}
        />
      )
      const editButtons = screen.queryAllByText('Edit')
      expect(editButtons.length).toBeGreaterThan(0)
    })

    it('should have semantic table structure', () => {
      const { container } = render(
        <QuestionList
          questions={mockQuestions}
          deleteConfirmId={null}
          {...mockHandlers}
        />
      )
      const table = container.querySelector('table')
      expect(table).toBeInTheDocument()
      const thead = table?.querySelector('thead')
      expect(thead).toBeInTheDocument()
    })

    it('should have proper heading hierarchy in modal', () => {
      const { container } = render(
        <QuestionList
          questions={mockQuestions}
          deleteConfirmId="q_1"
          {...mockHandlers}
        />
      )
      const heading = container.querySelector('h3')
      expect(heading).toBeInTheDocument()
    })
  })

  describe('Form Input Responsiveness', () => {
    it('should have responsive input sizing', () => {
      const { container } = render(
        <QuestionList
          questions={mockQuestions}
          deleteConfirmId={null}
          {...mockHandlers}
        />
      )
      const inputs = container.querySelectorAll('input, select')
      inputs.forEach((input) => {
        expect(input.className).toMatch(/min-h-\[44px\]|min-h-\[40px\]/)
      })
    })
  })
})
