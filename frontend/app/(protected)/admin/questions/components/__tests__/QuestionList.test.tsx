import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { QuestionList } from '../QuestionList'
import { AdminQuestion } from '../../page'

describe('QuestionList Component', () => {
  const mockQuestions: AdminQuestion[] = [
    {
      question_id: 'q_001',
      question_text: 'What is the primary function of RBI?',
      option_a: 'Monetary policy',
      option_b: 'Fiscal policy',
      option_c: 'Trade policy',
      option_d: 'Foreign policy',
      correct_answer: 'A',
      paper: 'JAIIB_IE_IFS',
      difficulty_level: 'medium',
      status: 'active',
      version: 1,
      created_at: 1704067200,
      updated_at: 1704067200,
      syllabus_topic: 'RBI Functions',
    },
    {
      question_id: 'q_002',
      question_text: 'What is the minimum capital requirement for banks?',
      option_a: '100 crore',
      option_b: '200 crore',
      option_c: '300 crore',
      option_d: '400 crore',
      correct_answer: 'B',
      paper: 'JAIIB_PPB',
      difficulty_level: 'hard',
      status: 'active',
      version: 1,
      created_at: 1704067200,
      updated_at: 1704067200,
      syllabus_topic: 'Capital Requirements',
    },
  ]

  const mockOnEdit = jest.fn()
  const mockOnDelete = jest.fn()
  const mockOnConfirmDelete = jest.fn()
  const mockOnCancelDelete = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Table Rendering', () => {
    it('should render table with questions', () => {
      render(
        <QuestionList
          questions={mockQuestions}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          deleteConfirmId={null}
          onConfirmDelete={mockOnConfirmDelete}
          onCancelDelete={mockOnCancelDelete}
        />
      )

      expect(screen.getByText('What is the primary function of RBI?')).toBeInTheDocument()
      expect(screen.getByText('What is the minimum capital requirement for banks?')).toBeInTheDocument()
    })

    it('should render table headers', () => {
      render(
        <QuestionList
          questions={mockQuestions}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          deleteConfirmId={null}
          onConfirmDelete={mockOnConfirmDelete}
          onCancelDelete={mockOnCancelDelete}
        />
      )

      expect(screen.getByText('Question')).toBeInTheDocument()
      expect(screen.getByText('Paper')).toBeInTheDocument()
      expect(screen.getByText('Difficulty')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
      expect(screen.getByText('Actions')).toBeInTheDocument()
    })

    it('should display paper names', () => {
      render(
        <QuestionList
          questions={mockQuestions}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          deleteConfirmId={null}
          onConfirmDelete={mockOnConfirmDelete}
          onCancelDelete={mockOnCancelDelete}
        />
      )

      expect(screen.getByText('Indian Economy & Indian Financial System')).toBeInTheDocument()
      expect(screen.getByText('Principles and Practices of Banking')).toBeInTheDocument()
    })

    it('should display difficulty levels with proper capitalization', () => {
      render(
        <QuestionList
          questions={mockQuestions}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          deleteConfirmId={null}
          onConfirmDelete={mockOnConfirmDelete}
          onCancelDelete={mockOnCancelDelete}
        />
      )

      expect(screen.getByText('Medium')).toBeInTheDocument()
      expect(screen.getByText('Hard')).toBeInTheDocument()
    })

    it('should display status badges', () => {
      render(
        <QuestionList
          questions={mockQuestions}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          deleteConfirmId={null}
          onConfirmDelete={mockOnConfirmDelete}
          onCancelDelete={mockOnCancelDelete}
        />
      )

      const activeStatuses = screen.getAllByText('Active')
      expect(activeStatuses.length).toBeGreaterThan(0)
    })
  })

  describe('Edit Button', () => {
    it('should render Edit button for each question', () => {
      render(
        <QuestionList
          questions={mockQuestions}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          deleteConfirmId={null}
          onConfirmDelete={mockOnConfirmDelete}
          onCancelDelete={mockOnCancelDelete}
        />
      )

      const editButtons = screen.getAllByText('Edit')
      expect(editButtons.length).toBe(2)
    })

    it('should call onEdit when Edit button is clicked', () => {
      render(
        <QuestionList
          questions={mockQuestions}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          deleteConfirmId={null}
          onConfirmDelete={mockOnConfirmDelete}
          onCancelDelete={mockOnCancelDelete}
        />
      )

      const editButtons = screen.getAllByText('Edit')
      fireEvent.click(editButtons[0])

      expect(mockOnEdit).toHaveBeenCalledWith(mockQuestions[0])
    })
  })

  describe('Delete Button', () => {
    it('should render Delete button for each question', () => {
      render(
        <QuestionList
          questions={mockQuestions}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          deleteConfirmId={null}
          onConfirmDelete={mockOnConfirmDelete}
          onCancelDelete={mockOnCancelDelete}
        />
      )

      const deleteButtons = screen.getAllByText('Delete')
      expect(deleteButtons.length).toBe(2)
    })

    it('should call onDelete when Delete button is clicked', () => {
      render(
        <QuestionList
          questions={mockQuestions}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          deleteConfirmId={null}
          onConfirmDelete={mockOnConfirmDelete}
          onCancelDelete={mockOnCancelDelete}
        />
      )

      const deleteButtons = screen.getAllByText('Delete')
      fireEvent.click(deleteButtons[0])

      expect(mockOnDelete).toHaveBeenCalledWith('q_001')
    })
  })

  describe('Delete Confirmation Dialog', () => {
    it('should display confirmation dialog when deleteConfirmId is set', () => {
      render(
        <QuestionList
          questions={mockQuestions}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          deleteConfirmId="q_001"
          onConfirmDelete={mockOnConfirmDelete}
          onCancelDelete={mockOnCancelDelete}
        />
      )

      expect(screen.getByText('Delete Question?')).toBeInTheDocument()
      expect(
        screen.getByText('Are you sure you want to delete this question? This action cannot be undone.')
      ).toBeInTheDocument()
    })

    it('should call onConfirmDelete when Delete button in dialog is clicked', () => {
      render(
        <QuestionList
          questions={mockQuestions}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          deleteConfirmId="q_001"
          onConfirmDelete={mockOnConfirmDelete}
          onCancelDelete={mockOnCancelDelete}
        />
      )

      const deleteButtons = screen.getAllByRole('button', { name: 'Delete' })
      const confirmButton = deleteButtons[deleteButtons.length - 1] // Get the last Delete button (from dialog)
      fireEvent.click(confirmButton)

      expect(mockOnConfirmDelete).toHaveBeenCalledWith('q_001')
    })

    it('should call onCancelDelete when Cancel button in dialog is clicked', () => {
      render(
        <QuestionList
          questions={mockQuestions}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          deleteConfirmId="q_001"
          onConfirmDelete={mockOnConfirmDelete}
          onCancelDelete={mockOnCancelDelete}
        />
      )

      const cancelButton = screen.getByRole('button', { name: 'Cancel' })
      fireEvent.click(cancelButton)

      expect(mockOnCancelDelete).toHaveBeenCalled()
    })

    it('should not display confirmation dialog when deleteConfirmId is null', () => {
      render(
        <QuestionList
          questions={mockQuestions}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          deleteConfirmId={null}
          onConfirmDelete={mockOnConfirmDelete}
          onCancelDelete={mockOnCancelDelete}
        />
      )

      expect(screen.queryByText('Delete Question?')).not.toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('should display empty state message when no questions', () => {
      render(
        <QuestionList
          questions={[]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          deleteConfirmId={null}
          onConfirmDelete={mockOnConfirmDelete}
          onCancelDelete={mockOnCancelDelete}
        />
      )

      expect(screen.getByText('No questions found')).toBeInTheDocument()
    })
  })

  describe('Pagination', () => {
    it('should display pagination controls when there are more than 10 questions', () => {
      const manyQuestions = Array.from({ length: 15 }, (_, i) => ({
        ...mockQuestions[0],
        question_id: `q_${i}`,
        question_text: `Question ${i}`,
      }))

      render(
        <QuestionList
          questions={manyQuestions}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          deleteConfirmId={null}
          onConfirmDelete={mockOnConfirmDelete}
          onCancelDelete={mockOnCancelDelete}
          itemsPerPage={10}
        />
      )

      expect(screen.getByText('Previous')).toBeInTheDocument()
      expect(screen.getByText('Next')).toBeInTheDocument()
    })

    it('should display pagination info', () => {
      const manyQuestions = Array.from({ length: 15 }, (_, i) => ({
        ...mockQuestions[0],
        question_id: `q_${i}`,
        question_text: `Question ${i}`,
      }))

      render(
        <QuestionList
          questions={manyQuestions}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          deleteConfirmId={null}
          onConfirmDelete={mockOnConfirmDelete}
          onCancelDelete={mockOnCancelDelete}
          itemsPerPage={10}
        />
      )

      expect(screen.getByText(/Showing 1 to 10 of 15 results/)).toBeInTheDocument()
    })

    it('should navigate to next page', () => {
      const manyQuestions = Array.from({ length: 15 }, (_, i) => ({
        ...mockQuestions[0],
        question_id: `q_${i}`,
        question_text: `Question ${i}`,
      }))

      render(
        <QuestionList
          questions={manyQuestions}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          deleteConfirmId={null}
          onConfirmDelete={mockOnConfirmDelete}
          onCancelDelete={mockOnCancelDelete}
          itemsPerPage={10}
        />
      )

      expect(screen.getByText('Question 0')).toBeInTheDocument()

      const nextButton = screen.getByText('Next')
      fireEvent.click(nextButton)

      expect(screen.getByText('Question 10')).toBeInTheDocument()
      expect(screen.queryByText('Question 0')).not.toBeInTheDocument()
    })

    it('should navigate to previous page', () => {
      const manyQuestions = Array.from({ length: 15 }, (_, i) => ({
        ...mockQuestions[0],
        question_id: `q_${i}`,
        question_text: `Question ${i}`,
      }))

      render(
        <QuestionList
          questions={manyQuestions}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          deleteConfirmId={null}
          onConfirmDelete={mockOnConfirmDelete}
          onCancelDelete={mockOnCancelDelete}
          itemsPerPage={10}
        />
      )

      const nextButton = screen.getByText('Next')
      fireEvent.click(nextButton)

      expect(screen.getByText('Question 10')).toBeInTheDocument()

      const prevButton = screen.getByText('Previous')
      fireEvent.click(prevButton)

      expect(screen.getByText('Question 0')).toBeInTheDocument()
    })

    it('should disable Previous button on first page', () => {
      const manyQuestions = Array.from({ length: 15 }, (_, i) => ({
        ...mockQuestions[0],
        question_id: `q_${i}`,
        question_text: `Question ${i}`,
      }))

      render(
        <QuestionList
          questions={manyQuestions}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          deleteConfirmId={null}
          onConfirmDelete={mockOnConfirmDelete}
          onCancelDelete={mockOnCancelDelete}
          itemsPerPage={10}
        />
      )

      const prevButton = screen.getByText('Previous')
      expect(prevButton).toBeDisabled()
    })

    it('should disable Next button on last page', () => {
      const manyQuestions = Array.from({ length: 15 }, (_, i) => ({
        ...mockQuestions[0],
        question_id: `q_${i}`,
        question_text: `Question ${i}`,
      }))

      render(
        <QuestionList
          questions={manyQuestions}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          deleteConfirmId={null}
          onConfirmDelete={mockOnConfirmDelete}
          onCancelDelete={mockOnCancelDelete}
          itemsPerPage={10}
        />
      )

      const nextButton = screen.getByText('Next')
      fireEvent.click(nextButton)

      expect(nextButton).toBeDisabled()
    })

    it('should allow clicking on page numbers', () => {
      const manyQuestions = Array.from({ length: 25 }, (_, i) => ({
        ...mockQuestions[0],
        question_id: `q_${i}`,
        question_text: `Question ${i}`,
      }))

      render(
        <QuestionList
          questions={manyQuestions}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          deleteConfirmId={null}
          onConfirmDelete={mockOnConfirmDelete}
          onCancelDelete={mockOnCancelDelete}
          itemsPerPage={10}
        />
      )

      const page2Button = screen.getByRole('button', { name: '2' })
      fireEvent.click(page2Button)

      expect(screen.getByText('Question 10')).toBeInTheDocument()
    })
  })

  describe('Status Badge Colors', () => {
    it('should display active status with success color', () => {
      render(
        <QuestionList
          questions={mockQuestions}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          deleteConfirmId={null}
          onConfirmDelete={mockOnConfirmDelete}
          onCancelDelete={mockOnCancelDelete}
        />
      )

      const activeStatuses = screen.getAllByText('Active')
      expect(activeStatuses[0]).toHaveClass('bg-success-100')
    })

    it('should display inactive status with warning color', () => {
      const inactiveQuestion: AdminQuestion = {
        ...mockQuestions[0],
        question_id: 'q_003',
        status: 'inactive',
      }

      render(
        <QuestionList
          questions={[inactiveQuestion]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          deleteConfirmId={null}
          onConfirmDelete={mockOnConfirmDelete}
          onCancelDelete={mockOnCancelDelete}
        />
      )

      const inactiveStatus = screen.getByText('Inactive')
      expect(inactiveStatus).toHaveClass('bg-warning-100')
    })

    it('should display archived status with gray color', () => {
      const archivedQuestion: AdminQuestion = {
        ...mockQuestions[0],
        question_id: 'q_004',
        status: 'archived',
      }

      render(
        <QuestionList
          questions={[archivedQuestion]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          deleteConfirmId={null}
          onConfirmDelete={mockOnConfirmDelete}
          onCancelDelete={mockOnCancelDelete}
        />
      )

      const archivedStatus = screen.getByText('Archived')
      expect(archivedStatus).toHaveClass('bg-gray-100')
    })
  })

  describe('Difficulty Badge Colors', () => {
    it('should display easy difficulty with blue color', () => {
      const easyQuestion: AdminQuestion = {
        ...mockQuestions[0],
        question_id: 'q_005',
        difficulty_level: 'easy',
      }

      render(
        <QuestionList
          questions={[easyQuestion]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          deleteConfirmId={null}
          onConfirmDelete={mockOnConfirmDelete}
          onCancelDelete={mockOnCancelDelete}
        />
      )

      const easyDifficulty = screen.getByText('Easy')
      expect(easyDifficulty).toHaveClass('bg-blue-100')
    })

    it('should display medium difficulty with orange color', () => {
      render(
        <QuestionList
          questions={mockQuestions}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          deleteConfirmId={null}
          onConfirmDelete={mockOnConfirmDelete}
          onCancelDelete={mockOnCancelDelete}
        />
      )

      const mediumDifficulty = screen.getByText('Medium')
      expect(mediumDifficulty).toHaveClass('bg-orange-100')
    })

    it('should display hard difficulty with red color', () => {
      render(
        <QuestionList
          questions={mockQuestions}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          deleteConfirmId={null}
          onConfirmDelete={mockOnConfirmDelete}
          onCancelDelete={mockOnCancelDelete}
        />
      )

      const hardDifficulty = screen.getByText('Hard')
      expect(hardDifficulty).toHaveClass('bg-red-100')
    })
  })

  describe('Accessibility', () => {
    it('should have semantic table structure', () => {
      const { container } = render(
        <QuestionList
          questions={mockQuestions}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          deleteConfirmId={null}
          onConfirmDelete={mockOnConfirmDelete}
          onCancelDelete={mockOnCancelDelete}
        />
      )

      const table = container.querySelector('table')
      expect(table).toBeInTheDocument()

      const thead = table?.querySelector('thead')
      expect(thead).toBeInTheDocument()

      const tbody = table?.querySelector('tbody')
      expect(tbody).toBeInTheDocument()
    })

    it('should have proper button labels', () => {
      render(
        <QuestionList
          questions={mockQuestions}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          deleteConfirmId={null}
          onConfirmDelete={mockOnConfirmDelete}
          onCancelDelete={mockOnCancelDelete}
        />
      )

      expect(screen.getAllByText('Edit').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Delete').length).toBeGreaterThan(0)
    })
  })
})
