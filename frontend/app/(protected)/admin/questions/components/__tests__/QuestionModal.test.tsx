import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuestionModal } from '../QuestionModal'
import { AdminQuestion } from '../../page'

describe('QuestionModal Component', () => {
  const mockQuestion: AdminQuestion = {
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
  }

  const mockOnClose = jest.fn()
  const mockOnSave = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockOnSave.mockResolvedValue(undefined)
  })

  describe('Add Mode', () => {
    it('should display Add New Question title when question is null', () => {
      render(<QuestionModal question={null} onClose={mockOnClose} onSave={mockOnSave} />)

      expect(screen.getByText('Add New Question')).toBeInTheDocument()
    })

    it('should display Create Question button when adding', () => {
      render(<QuestionModal question={null} onClose={mockOnClose} onSave={mockOnSave} />)

      expect(screen.getByText('Create Question')).toBeInTheDocument()
    })

    it('should have empty form fields when adding', () => {
      render(<QuestionModal question={null} onClose={mockOnClose} onSave={mockOnSave} />)

      const questionInput = screen.getByPlaceholderText('Enter the question text...')
      expect((questionInput as HTMLTextAreaElement).value).toBe('')
    })
  })

  describe('Edit Mode', () => {
    it('should display Edit Question title when question is provided', () => {
      render(<QuestionModal question={mockQuestion} onClose={mockOnClose} onSave={mockOnSave} />)

      expect(screen.getByText('Edit Question')).toBeInTheDocument()
    })

    it('should display Update Question button when editing', () => {
      render(<QuestionModal question={mockQuestion} onClose={mockOnClose} onSave={mockOnSave} />)

      expect(screen.getByText('Update Question')).toBeInTheDocument()
    })

    it('should populate form fields with existing question data', () => {
      render(<QuestionModal question={mockQuestion} onClose={mockOnClose} onSave={mockOnSave} />)

      const questionInput = screen.getByDisplayValue('What is the primary function of RBI?')
      expect(questionInput).toBeInTheDocument()

      const optionAInput = screen.getByDisplayValue('Monetary policy')
      expect(optionAInput).toBeInTheDocument()

      const optionBInput = screen.getByDisplayValue('Fiscal policy')
      expect(optionBInput).toBeInTheDocument()
    })
  })

  describe('Form Fields', () => {
    it('should render all required form fields', () => {
      render(<QuestionModal question={null} onClose={mockOnClose} onSave={mockOnSave} />)

      expect(screen.getByPlaceholderText('Enter the question text...')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter option A...')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter option B...')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter option C...')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter option D...')).toBeInTheDocument()
    })

    it('should render select fields for paper, difficulty, and status', () => {
      render(<QuestionModal question={null} onClose={mockOnClose} onSave={mockOnSave} />)

      const selects = screen.getAllByRole('combobox')
      expect(selects.length).toBeGreaterThan(0)
    })

    it('should render correct answer select field', () => {
      render(<QuestionModal question={null} onClose={mockOnClose} onSave={mockOnSave} />)

      const selects = screen.getAllByRole('combobox')
      expect(selects.length).toBeGreaterThan(0)
    })

    it('should render syllabus topic input field', () => {
      render(<QuestionModal question={null} onClose={mockOnClose} onSave={mockOnSave} />)

      expect(screen.getByPlaceholderText('Enter syllabus topic...')).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should show error when question text is empty', async () => {
      render(<QuestionModal question={null} onClose={mockOnClose} onSave={mockOnSave} />)

      const submitButton = screen.getByText('Create Question')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Question text is required')).toBeInTheDocument()
      })
    })

    it('should show error when question text is less than 10 characters', async () => {
      render(<QuestionModal question={null} onClose={mockOnClose} onSave={mockOnSave} />)

      const questionInput = screen.getByPlaceholderText('Enter the question text...')
      fireEvent.change(questionInput, { target: { value: 'Short' } })

      const submitButton = screen.getByText('Create Question')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Question text must be at least 10 characters')).toBeInTheDocument()
      })
    })

    it('should show error when option is empty', async () => {
      render(<QuestionModal question={null} onClose={mockOnClose} onSave={mockOnSave} />)

      const questionInput = screen.getByPlaceholderText('Enter the question text...')
      fireEvent.change(questionInput, { target: { value: 'Valid question text here' } })

      const submitButton = screen.getByText('Create Question')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Option A is required')).toBeInTheDocument()
      })
    })

    it('should show error when options are not unique', async () => {
      render(<QuestionModal question={null} onClose={mockOnClose} onSave={mockOnSave} />)

      const questionInput = screen.getByPlaceholderText('Enter the question text...')
      fireEvent.change(questionInput, { target: { value: 'Valid question text here' } })

      const optionAInput = screen.getByPlaceholderText('Enter option A...')
      const optionBInput = screen.getByPlaceholderText('Enter option B...')
      const optionCInput = screen.getByPlaceholderText('Enter option C...')
      const optionDInput = screen.getByPlaceholderText('Enter option D...')

      fireEvent.change(optionAInput, { target: { value: 'Same option' } })
      fireEvent.change(optionBInput, { target: { value: 'Same option' } })
      fireEvent.change(optionCInput, { target: { value: 'Option C' } })
      fireEvent.change(optionDInput, { target: { value: 'Option D' } })

      const submitButton = screen.getByText('Create Question')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('All options must be unique')).toBeInTheDocument()
      })
    })

    it('should clear error when field is corrected', async () => {
      render(<QuestionModal question={null} onClose={mockOnClose} onSave={mockOnSave} />)

      const questionInput = screen.getByPlaceholderText('Enter the question text...')
      fireEvent.change(questionInput, { target: { value: 'Short' } })

      const submitButton = screen.getByText('Create Question')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Question text must be at least 10 characters')).toBeInTheDocument()
      })

      fireEvent.change(questionInput, { target: { value: 'Valid question text here' } })

      await waitFor(() => {
        expect(screen.queryByText('Question text must be at least 10 characters')).not.toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('should call onSave with form data when valid', async () => {
      render(<QuestionModal question={null} onClose={mockOnClose} onSave={mockOnSave} />)

      const questionInput = screen.getByPlaceholderText('Enter the question text...')
      const optionAInput = screen.getByPlaceholderText('Enter option A...')
      const optionBInput = screen.getByPlaceholderText('Enter option B...')
      const optionCInput = screen.getByPlaceholderText('Enter option C...')
      const optionDInput = screen.getByPlaceholderText('Enter option D...')

      fireEvent.change(questionInput, { target: { value: 'Valid question text here' } })
      fireEvent.change(optionAInput, { target: { value: 'Option A' } })
      fireEvent.change(optionBInput, { target: { value: 'Option B' } })
      fireEvent.change(optionCInput, { target: { value: 'Option C' } })
      fireEvent.change(optionDInput, { target: { value: 'Option D' } })

      const submitButton = screen.getByText('Create Question')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            question_text: 'Valid question text here',
            option_a: 'Option A',
            option_b: 'Option B',
            option_c: 'Option C',
            option_d: 'Option D',
          })
        )
      })
    })

    it('should show loading state during submission', async () => {
      mockOnSave.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(undefined), 100))
      )

      render(<QuestionModal question={null} onClose={mockOnClose} onSave={mockOnSave} />)

      const questionInput = screen.getByPlaceholderText('Enter the question text...')
      const optionAInput = screen.getByPlaceholderText('Enter option A...')
      const optionBInput = screen.getByPlaceholderText('Enter option B...')
      const optionCInput = screen.getByPlaceholderText('Enter option C...')
      const optionDInput = screen.getByPlaceholderText('Enter option D...')

      fireEvent.change(questionInput, { target: { value: 'Valid question text here' } })
      fireEvent.change(optionAInput, { target: { value: 'Option A' } })
      fireEvent.change(optionBInput, { target: { value: 'Option B' } })
      fireEvent.change(optionCInput, { target: { value: 'Option C' } })
      fireEvent.change(optionDInput, { target: { value: 'Option D' } })

      const submitButton = screen.getByText('Create Question')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeInTheDocument()
      })
    })
  })

  describe('Modal Actions', () => {
    it('should call onClose when Cancel button is clicked', () => {
      render(<QuestionModal question={null} onClose={mockOnClose} onSave={mockOnSave} />)

      const cancelButton = screen.getByText('Cancel')
      fireEvent.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should call onClose when close button (X) is clicked', () => {
      render(<QuestionModal question={null} onClose={mockOnClose} onSave={mockOnSave} />)

      const closeButton = screen.getByText('✕')
      fireEvent.click(closeButton)

      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('Form Field Changes', () => {
    it('should update form state when question text changes', () => {
      render(<QuestionModal question={null} onClose={mockOnClose} onSave={mockOnSave} />)

      const questionInput = screen.getByPlaceholderText('Enter the question text...')
      fireEvent.change(questionInput, { target: { value: 'New question text' } })

      expect((questionInput as HTMLTextAreaElement).value).toBe('New question text')
    })

    it('should update form state when option changes', () => {
      render(<QuestionModal question={null} onClose={mockOnClose} onSave={mockOnSave} />)

      const optionAInput = screen.getByPlaceholderText('Enter option A...')
      fireEvent.change(optionAInput, { target: { value: 'New option A' } })

      expect((optionAInput as HTMLInputElement).value).toBe('New option A')
    })

    it('should allow form submission with valid data', async () => {
      render(<QuestionModal question={null} onClose={mockOnClose} onSave={mockOnSave} />)

      const questionInput = screen.getByPlaceholderText('Enter the question text...')
      const optionAInput = screen.getByPlaceholderText('Enter option A...')
      const optionBInput = screen.getByPlaceholderText('Enter option B...')
      const optionCInput = screen.getByPlaceholderText('Enter option C...')
      const optionDInput = screen.getByPlaceholderText('Enter option D...')

      fireEvent.change(questionInput, { target: { value: 'Valid question text here' } })
      fireEvent.change(optionAInput, { target: { value: 'Option A' } })
      fireEvent.change(optionBInput, { target: { value: 'Option B' } })
      fireEvent.change(optionCInput, { target: { value: 'Option C' } })
      fireEvent.change(optionDInput, { target: { value: 'Option D' } })

      const submitButton = screen.getByText('Create Question')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      render(<QuestionModal question={null} onClose={mockOnClose} onSave={mockOnSave} />)

      expect(screen.getByText('Question Text *')).toBeInTheDocument()
      expect(screen.getByText('Option A *')).toBeInTheDocument()
      expect(screen.getByText('Option B *')).toBeInTheDocument()
      expect(screen.getByText('Option C *')).toBeInTheDocument()
      expect(screen.getByText('Option D *')).toBeInTheDocument()
      expect(screen.getByText('Correct Answer *')).toBeInTheDocument()
      expect(screen.getByText('Paper *')).toBeInTheDocument()
      expect(screen.getByText('Difficulty *')).toBeInTheDocument()
      expect(screen.getByText('Status *')).toBeInTheDocument()
    })

    it('should have proper heading hierarchy', () => {
      render(<QuestionModal question={null} onClose={mockOnClose} onSave={mockOnSave} />)

      const heading = screen.getByText('Add New Question')
      expect(heading.tagName).toBe('H2')
    })
  })

  describe('Modal Styling', () => {
    it('should have modal overlay', () => {
      const { container } = render(<QuestionModal question={null} onClose={mockOnClose} onSave={mockOnSave} />)

      const overlay = container.querySelector('.fixed.inset-0.bg-black')
      expect(overlay).toBeInTheDocument()
    })

    it('should have modal content container', () => {
      const { container } = render(<QuestionModal question={null} onClose={mockOnClose} onSave={mockOnSave} />)

      const modalContent = container.querySelector('.bg-white.dark\\:bg-gray-800.rounded-lg')
      expect(modalContent).toBeInTheDocument()
    })
  })

  describe('Edit Mode Specific', () => {
    it('should populate all fields when editing', () => {
      render(<QuestionModal question={mockQuestion} onClose={mockOnClose} onSave={mockOnSave} />)

      expect(screen.getByDisplayValue('What is the primary function of RBI?')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Monetary policy')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Fiscal policy')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Trade policy')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Foreign policy')).toBeInTheDocument()
      expect(screen.getByDisplayValue('RBI Functions')).toBeInTheDocument()
    })

    it('should call onSave with updated data when editing', async () => {
      render(<QuestionModal question={mockQuestion} onClose={mockOnClose} onSave={mockOnSave} />)

      const questionInput = screen.getByDisplayValue('What is the primary function of RBI?')
      fireEvent.change(questionInput, { target: { value: 'Updated question text' } })

      const submitButton = screen.getByText('Update Question')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            question_text: 'Updated question text',
          })
        )
      })
    })
  })
})
