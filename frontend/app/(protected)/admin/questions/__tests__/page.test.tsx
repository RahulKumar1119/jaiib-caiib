import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import QuestionManagementPage, { AdminQuestion } from '../page'
import { apiClient } from '@/lib/api-client'
import { useNotification } from '@/lib/hooks/useNotification'

// Mock the API client
jest.mock('@/lib/api-client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}))

// Mock the notification hook
jest.mock('@/lib/hooks/useNotification', () => ({
  useNotification: jest.fn(),
}))

describe('QuestionManagementPage', () => {
  const mockShowNotification = jest.fn()

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

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useNotification as jest.Mock).mockReturnValue({
      showNotification: mockShowNotification,
    })
    ;(apiClient.get as jest.Mock).mockResolvedValue({
      questions: mockQuestions,
    })
  })

  describe('Page Rendering', () => {
    it('should render page title and description', async () => {
      render(<QuestionManagementPage />)

      expect(screen.getByText('Question Management')).toBeInTheDocument()
      expect(screen.getByText('Manage JAIIB exam questions')).toBeInTheDocument()
    })

    it('should render Add Question button', async () => {
      render(<QuestionManagementPage />)

      const addButton = screen.getByText('+ Add Question')
      expect(addButton).toBeInTheDocument()
    })

    it('should fetch questions on mount', async () => {
      render(<QuestionManagementPage />)

      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith('/admin/questions')
      })
    })

    it('should display loading state initially', () => {
      ;(apiClient.get as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ questions: [] }), 100))
      )

      render(<QuestionManagementPage />)

      expect(screen.getByText('Loading questions...')).toBeInTheDocument()
    })
  })

  describe('Question List Display', () => {
    it('should display questions in table', async () => {
      render(<QuestionManagementPage />)

      await waitFor(() => {
        expect(screen.getByText('What is the primary function of RBI?')).toBeInTheDocument()
        expect(screen.getByText('What is the minimum capital requirement for banks?')).toBeInTheDocument()
      })
    })

    it('should display question columns', async () => {
      render(<QuestionManagementPage />)

      await waitFor(() => {
        const table = screen.getByRole('table')
        expect(table).toBeInTheDocument()
      })

      // Check for table headers
      const headers = screen.getAllByRole('columnheader')
      expect(headers.length).toBeGreaterThan(0)
    })

    it('should display paper names correctly', async () => {
      render(<QuestionManagementPage />)

      await waitFor(() => {
        expect(screen.getByText('IE & IFS')).toBeInTheDocument()
        expect(screen.getByText('PPB')).toBeInTheDocument()
      })
    })

    it('should display difficulty levels', async () => {
      render(<QuestionManagementPage />)

      await waitFor(() => {
        expect(screen.getByText('Medium')).toBeInTheDocument()
        expect(screen.getByText('Hard')).toBeInTheDocument()
      })
    })

    it('should display status badges', async () => {
      render(<QuestionManagementPage />)

      await waitFor(() => {
        const activeStatuses = screen.getAllByText('Active')
        expect(activeStatuses.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Search Functionality', () => {
    it('should filter questions by search text', async () => {
      render(<QuestionManagementPage />)

      await waitFor(() => {
        expect(screen.getByText('What is the primary function of RBI?')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search by question text...')
      fireEvent.change(searchInput, { target: { value: 'RBI' } })

      await waitFor(() => {
        expect(screen.getByText('What is the primary function of RBI?')).toBeInTheDocument()
        expect(screen.queryByText('What is the minimum capital requirement for banks?')).not.toBeInTheDocument()
      })
    })

    it('should be case-insensitive search', async () => {
      render(<QuestionManagementPage />)

      await waitFor(() => {
        expect(screen.getByText('What is the primary function of RBI?')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search by question text...')
      fireEvent.change(searchInput, { target: { value: 'rbi' } })

      await waitFor(() => {
        expect(screen.getByText('What is the primary function of RBI?')).toBeInTheDocument()
      })
    })

    it('should show no results when search has no matches', async () => {
      render(<QuestionManagementPage />)

      await waitFor(() => {
        expect(screen.getByText('What is the primary function of RBI?')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search by question text...')
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } })

      await waitFor(() => {
        expect(screen.getByText('No questions found')).toBeInTheDocument()
      })
    })
  })

  describe('Filter Functionality', () => {
    it('should display filter controls', async () => {
      render(<QuestionManagementPage />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search by question text...')).toBeInTheDocument()
      })

      expect(screen.getByText('Clear Filters')).toBeInTheDocument()
    })

    it('should search questions by text', async () => {
      render(<QuestionManagementPage />)

      await waitFor(() => {
        expect(screen.getByText('What is the primary function of RBI?')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search by question text...')
      fireEvent.change(searchInput, { target: { value: 'RBI' } })

      await waitFor(() => {
        expect(screen.getByText('What is the primary function of RBI?')).toBeInTheDocument()
      })
    })

    it('should clear all filters', async () => {
      render(<QuestionManagementPage />)

      await waitFor(() => {
        expect(screen.getByText('What is the primary function of RBI?')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search by question text...')
      fireEvent.change(searchInput, { target: { value: 'RBI' } })

      const clearButton = screen.getByText('Clear Filters')
      fireEvent.click(clearButton)

      await waitFor(() => {
        expect((searchInput as HTMLInputElement).value).toBe('')
      })
    })
  })

  describe('Add Question Modal', () => {
    it('should open modal when Add Question button is clicked', async () => {
      render(<QuestionManagementPage />)

      await waitFor(() => {
        expect(screen.getByText('What is the primary function of RBI?')).toBeInTheDocument()
      })

      const addButton = screen.getByText('+ Add Question')
      fireEvent.click(addButton)

      await waitFor(() => {
        expect(screen.getByText('Add New Question')).toBeInTheDocument()
      })
    })

    it('should display form fields in modal', async () => {
      render(<QuestionManagementPage />)

      await waitFor(() => {
        expect(screen.getByText('What is the primary function of RBI?')).toBeInTheDocument()
      })

      const addButton = screen.getByText('+ Add Question')
      fireEvent.click(addButton)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter the question text...')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Enter option A...')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Enter option B...')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Enter option C...')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Enter option D...')).toBeInTheDocument()
      })
    })

    it('should close modal when Cancel button is clicked', async () => {
      render(<QuestionManagementPage />)

      await waitFor(() => {
        expect(screen.getByText('What is the primary function of RBI?')).toBeInTheDocument()
      })

      const addButton = screen.getByText('+ Add Question')
      fireEvent.click(addButton)

      await waitFor(() => {
        expect(screen.getByText('Add New Question')).toBeInTheDocument()
      })

      const cancelButton = screen.getByText('Cancel')
      fireEvent.click(cancelButton)

      await waitFor(() => {
        expect(screen.queryByText('Add New Question')).not.toBeInTheDocument()
      })
    })
  })

  describe('Edit Question Modal', () => {
    it('should open edit modal when Edit button is clicked', async () => {
      render(<QuestionManagementPage />)

      await waitFor(() => {
        expect(screen.getByText('What is the primary function of RBI?')).toBeInTheDocument()
      })

      const editButtons = screen.getAllByText('Edit')
      fireEvent.click(editButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Edit Question')).toBeInTheDocument()
      })
    })

    it('should populate form with existing question data', async () => {
      render(<QuestionManagementPage />)

      await waitFor(() => {
        expect(screen.getByText('What is the primary function of RBI?')).toBeInTheDocument()
      })

      const editButtons = screen.getAllByText('Edit')
      fireEvent.click(editButtons[0])

      await waitFor(() => {
        const questionInput = screen.getByDisplayValue('What is the primary function of RBI?')
        expect(questionInput).toBeInTheDocument()
      })
    })

    it('should update question when form is submitted', async () => {
      ;(apiClient.put as jest.Mock).mockResolvedValue({
        question: {
          ...mockQuestions[0],
          question_text: 'Updated question text',
        },
      })

      render(<QuestionManagementPage />)

      await waitFor(() => {
        expect(screen.getByText('What is the primary function of RBI?')).toBeInTheDocument()
      })

      const editButtons = screen.getAllByText('Edit')
      fireEvent.click(editButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Edit Question')).toBeInTheDocument()
      })

      const updateButton = screen.getByText('Update Question')
      fireEvent.click(updateButton)

      await waitFor(() => {
        expect(apiClient.put).toHaveBeenCalledWith(
          '/admin/questions/q_001',
          expect.objectContaining({
            question_text: 'What is the primary function of RBI?',
          })
        )
      })
    })
  })

  describe('Delete Question', () => {
    it('should show delete confirmation dialog when Delete button is clicked', async () => {
      render(<QuestionManagementPage />)

      await waitFor(() => {
        expect(screen.getByText('What is the primary function of RBI?')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByText('Delete')
      fireEvent.click(deleteButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Delete Question?')).toBeInTheDocument()
      })
    })

    it('should delete question when confirmed', async () => {
      ;(apiClient.delete as jest.Mock).mockResolvedValue({})

      render(<QuestionManagementPage />)

      await waitFor(() => {
        expect(screen.getByText('What is the primary function of RBI?')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByText('Delete')
      fireEvent.click(deleteButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Delete Question?')).toBeInTheDocument()
      })

      const allDeleteButtons = screen.getAllByRole('button', { name: 'Delete' })
      const confirmDeleteButton = allDeleteButtons[allDeleteButtons.length - 1] // Get the last Delete button (from dialog)
      fireEvent.click(confirmDeleteButton)

      await waitFor(() => {
        expect(apiClient.delete).toHaveBeenCalledWith('/admin/questions/q_001')
        expect(mockShowNotification).toHaveBeenCalledWith('Question deleted successfully', 'success')
      })
    })

    it('should cancel delete when Cancel button is clicked', async () => {
      render(<QuestionManagementPage />)

      await waitFor(() => {
        expect(screen.getByText('What is the primary function of RBI?')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByText('Delete')
      fireEvent.click(deleteButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Delete Question?')).toBeInTheDocument()
      })

      const cancelButtons = screen.getAllByRole('button', { name: 'Cancel' })
      const cancelButton = cancelButtons[cancelButtons.length - 1] // Get the last Cancel button (from dialog)
      fireEvent.click(cancelButton)

      await waitFor(() => {
        expect(screen.queryByText('Delete Question?')).not.toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should display error message when fetching questions fails', async () => {
      ;(apiClient.get as jest.Mock).mockRejectedValue(new Error('Failed to load questions'))

      render(<QuestionManagementPage />)

      await waitFor(() => {
        expect(screen.getByText('Failed to load questions')).toBeInTheDocument()
      })
    })

    it('should show notification on delete error', async () => {
      ;(apiClient.delete as jest.Mock).mockRejectedValue(new Error('Failed to delete question'))

      render(<QuestionManagementPage />)

      await waitFor(() => {
        expect(screen.getByText('What is the primary function of RBI?')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByText('Delete')
      fireEvent.click(deleteButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Delete Question?')).toBeInTheDocument()
      })

      const allDeleteButtons = screen.getAllByRole('button', { name: 'Delete' })
      const confirmDeleteButton = allDeleteButtons[allDeleteButtons.length - 1] // Get the last Delete button (from dialog)
      fireEvent.click(confirmDeleteButton)

      await waitFor(() => {
        expect(mockShowNotification).toHaveBeenCalledWith('Failed to delete question', 'error')
      })
    })
  })

  describe('Pagination', () => {
    it('should display pagination controls when there are many questions', async () => {
      const manyQuestions = Array.from({ length: 15 }, (_, i) => ({
        ...mockQuestions[0],
        question_id: `q_${i}`,
        question_text: `Question ${i}`,
      }))

      ;(apiClient.get as jest.Mock).mockResolvedValue({
        questions: manyQuestions,
      })

      render(<QuestionManagementPage />)

      await waitFor(() => {
        expect(screen.getByText('Previous')).toBeInTheDocument()
        expect(screen.getByText('Next')).toBeInTheDocument()
      })
    })

    it('should navigate between pages', async () => {
      const manyQuestions = Array.from({ length: 15 }, (_, i) => ({
        ...mockQuestions[0],
        question_id: `q_${i}`,
        question_text: `Question ${i}`,
      }))

      ;(apiClient.get as jest.Mock).mockResolvedValue({
        questions: manyQuestions,
      })

      render(<QuestionManagementPage />)

      await waitFor(() => {
        expect(screen.getByText('Question 0')).toBeInTheDocument()
      })

      const nextButton = screen.getByText('Next')
      fireEvent.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText('Question 10')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', async () => {
      render(<QuestionManagementPage />)

      const h1 = screen.getByRole('heading', { level: 1 })
      expect(h1).toHaveTextContent('Question Management')
    })

    it('should have semantic table structure', async () => {
      render(<QuestionManagementPage />)

      await waitFor(() => {
        const table = screen.getByRole('table')
        expect(table).toBeInTheDocument()
      })
    })

    it('should have proper form labels', async () => {
      render(<QuestionManagementPage />)

      await waitFor(() => {
        expect(screen.getByText('What is the primary function of RBI?')).toBeInTheDocument()
      })

      const addButton = screen.getByText('+ Add Question')
      fireEvent.click(addButton)

      await waitFor(() => {
        expect(screen.getByText('Question Text *')).toBeInTheDocument()
        expect(screen.getByText('Paper *')).toBeInTheDocument()
        expect(screen.getByText('Difficulty *')).toBeInTheDocument()
        expect(screen.getByText('Status *')).toBeInTheDocument()
      })
    })
  })

  describe('Responsive Design', () => {
    it('should have responsive grid layout for filters', async () => {
      const { container } = render(<QuestionManagementPage />)

      const gridElements = container.querySelectorAll('[class*="grid"]')
      expect(gridElements.length).toBeGreaterThan(0)
    })

    it('should have responsive table layout', async () => {
      const { container } = render(<QuestionManagementPage />)

      await waitFor(() => {
        expect(screen.getByText('What is the primary function of RBI?')).toBeInTheDocument()
      })

      const overflowDiv = container.querySelector('.overflow-x-auto')
      expect(overflowDiv).toBeInTheDocument()
    })
  })
})
