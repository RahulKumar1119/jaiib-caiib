import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PracticeSetUI } from '../PracticeSetUI'
import { PracticeSet } from '@/lib/types/practice'

describe('PracticeSetUI Component', () => {
  const mockPracticeSet: PracticeSet = {
    practice_set_id: 'ps_123',
    paper: 'JAIIB_IE_IFS',
    questions: [
      {
        question_id: 'q_1',
        question_text: 'What is the primary function of RBI?',
        options: {
          A: 'Central banking',
          B: 'Commercial banking',
          C: 'Investment banking',
          D: 'Retail banking',
        },
        order: ['A', 'B', 'C', 'D'],
        difficulty_level: 'medium',
        paper: 'JAIIB_IE_IFS',
        syllabus_topic: 'RBI Functions',
      },
      {
        question_id: 'q_2',
        question_text: 'What is monetary policy?',
        options: {
          A: 'Government spending',
          B: 'Money supply management',
          C: 'Tax policy',
          D: 'Trade policy',
        },
        order: ['B', 'A', 'D', 'C'],
        difficulty_level: 'medium',
        paper: 'JAIIB_IE_IFS',
        syllabus_topic: 'Monetary Policy',
      },
      {
        question_id: 'q_3',
        question_text: 'Define inflation?',
        options: {
          A: 'Decrease in prices',
          B: 'Increase in prices',
          C: 'Stable prices',
          D: 'Price fluctuation',
        },
        order: ['C', 'D', 'A', 'B'],
        difficulty_level: 'easy',
        paper: 'JAIIB_IE_IFS',
        syllabus_topic: 'Inflation',
      },
      {
        question_id: 'q_4',
        question_text: 'What is fiscal policy?',
        options: {
          A: 'Interest rate policy',
          B: 'Government revenue and spending',
          C: 'Exchange rate policy',
          D: 'Credit policy',
        },
        order: ['D', 'C', 'B', 'A'],
        difficulty_level: 'hard',
        paper: 'JAIIB_IE_IFS',
        syllabus_topic: 'Fiscal Policy',
      },
    ],
    time_limit: 600,
    created_at: Date.now(),
    status: 'in_progress',
    session_token: 'token_123',
    session_expires_at: Date.now() + 900000,
  }

  const mockOnAnswerChange = jest.fn()
  const mockOnSubmit = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders practice set UI with first question', () => {
    render(
      <PracticeSetUI
        practiceSet={mockPracticeSet}
        userAnswers={{}}
        onAnswerChange={mockOnAnswerChange}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
        hasSubmitted={false}
      />
    )

    expect(screen.getByText('What is the primary function of RBI?')).toBeInTheDocument()
  })

  it('displays progress indicator with current question number', () => {
    render(
      <PracticeSetUI
        practiceSet={mockPracticeSet}
        userAnswers={{}}
        onAnswerChange={mockOnAnswerChange}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
        hasSubmitted={false}
      />
    )

    expect(screen.getByText('Question 1 of 4')).toBeInTheDocument()
  })

  it('displays all answer options for current question', () => {
    render(
      <PracticeSetUI
        practiceSet={mockPracticeSet}
        userAnswers={{}}
        onAnswerChange={mockOnAnswerChange}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
        hasSubmitted={false}
      />
    )

    expect(screen.getByText('Central banking')).toBeInTheDocument()
    expect(screen.getByText('Commercial banking')).toBeInTheDocument()
    expect(screen.getByText('Investment banking')).toBeInTheDocument()
    expect(screen.getByText('Retail banking')).toBeInTheDocument()
  })

  it('calls onAnswerChange when an option is selected', () => {
    render(
      <PracticeSetUI
        practiceSet={mockPracticeSet}
        userAnswers={{}}
        onAnswerChange={mockOnAnswerChange}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
        hasSubmitted={false}
      />
    )

    const optionA = screen.getByLabelText(/Option A: Central banking/)
    fireEvent.click(optionA)

    expect(mockOnAnswerChange).toHaveBeenCalledWith('q_1', 'A')
  })

  it('navigates to next question when Next button is clicked', () => {
    render(
      <PracticeSetUI
        practiceSet={mockPracticeSet}
        userAnswers={{}}
        onAnswerChange={mockOnAnswerChange}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
        hasSubmitted={false}
      />
    )

    const nextButton = screen.getByLabelText('Go to next question')
    fireEvent.click(nextButton)

    expect(screen.getByText('What is monetary policy?')).toBeInTheDocument()
    expect(screen.getByText('Question 2 of 4')).toBeInTheDocument()
  })

  it('navigates to previous question when Previous button is clicked', () => {
    render(
      <PracticeSetUI
        practiceSet={mockPracticeSet}
        userAnswers={{}}
        onAnswerChange={mockOnAnswerChange}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
        hasSubmitted={false}
      />
    )

    const nextButton = screen.getByLabelText('Go to next question')
    fireEvent.click(nextButton)

    const prevButton = screen.getByLabelText('Go to previous question')
    fireEvent.click(prevButton)

    expect(screen.getByText('What is the primary function of RBI?')).toBeInTheDocument()
    expect(screen.getByText('Question 1 of 4')).toBeInTheDocument()
  })

  it('disables Previous button on first question', () => {
    render(
      <PracticeSetUI
        practiceSet={mockPracticeSet}
        userAnswers={{}}
        onAnswerChange={mockOnAnswerChange}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
        hasSubmitted={false}
      />
    )

    const prevButton = screen.getByLabelText('Go to previous question')
    expect(prevButton).toBeDisabled()
  })

  it('disables Next button on last question', () => {
    render(
      <PracticeSetUI
        practiceSet={mockPracticeSet}
        userAnswers={{}}
        onAnswerChange={mockOnAnswerChange}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
        hasSubmitted={false}
      />
    )

    // Navigate to last question
    const nextButton = screen.getByLabelText('Go to next question')
    fireEvent.click(nextButton)
    fireEvent.click(nextButton)
    fireEvent.click(nextButton)

    expect(screen.getByLabelText('Go to next question')).toBeDisabled()
  })

  it('displays question navigation dots', () => {
    render(
      <PracticeSetUI
        practiceSet={mockPracticeSet}
        userAnswers={{}}
        onAnswerChange={mockOnAnswerChange}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
        hasSubmitted={false}
      />
    )

    const dots = screen.getAllByRole('button', { name: /Go to question/ })
    expect(dots).toHaveLength(4)
  })

  it('navigates to question when dot is clicked', () => {
    render(
      <PracticeSetUI
        practiceSet={mockPracticeSet}
        userAnswers={{}}
        onAnswerChange={mockOnAnswerChange}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
        hasSubmitted={false}
      />
    )

    const questionDot = screen.getByLabelText('Go to question 3')
    fireEvent.click(questionDot)

    expect(screen.getByText('Define inflation?')).toBeInTheDocument()
    expect(screen.getByText('Question 3 of 4')).toBeInTheDocument()
  })

  it('displays answered count', () => {
    render(
      <PracticeSetUI
        practiceSet={mockPracticeSet}
        userAnswers={{ q_1: 'A', q_2: 'B' }}
        onAnswerChange={mockOnAnswerChange}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
        hasSubmitted={false}
      />
    )

    expect(screen.getByText('2 of 4 answered')).toBeInTheDocument()
  })

  it('displays warning for unanswered questions', () => {
    render(
      <PracticeSetUI
        practiceSet={mockPracticeSet}
        userAnswers={{ q_1: 'A' }}
        onAnswerChange={mockOnAnswerChange}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
        hasSubmitted={false}
      />
    )

    expect(screen.getByText(/Unanswered questions will be marked as incorrect/)).toBeInTheDocument()
  })

  it('calls onSubmit when Submit button is clicked', () => {
    render(
      <PracticeSetUI
        practiceSet={mockPracticeSet}
        userAnswers={{ q_1: 'A', q_2: 'B', q_3: 'B', q_4: 'B' }}
        onAnswerChange={mockOnAnswerChange}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
        hasSubmitted={false}
      />
    )

    const submitButton = screen.getByLabelText('Submit practice set')
    fireEvent.click(submitButton)

    expect(mockOnSubmit).toHaveBeenCalled()
  })

  it('disables Submit button when submitting', () => {
    render(
      <PracticeSetUI
        practiceSet={mockPracticeSet}
        userAnswers={{}}
        onAnswerChange={mockOnAnswerChange}
        onSubmit={mockOnSubmit}
        isSubmitting={true}
        hasSubmitted={false}
      />
    )

    const submitButton = screen.getByLabelText('Submit practice set')
    expect(submitButton).toBeDisabled()
  })

  it('displays Submitted text when already submitted', () => {
    render(
      <PracticeSetUI
        practiceSet={mockPracticeSet}
        userAnswers={{}}
        onAnswerChange={mockOnAnswerChange}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
        hasSubmitted={true}
      />
    )

    expect(screen.getByText('Submitted')).toBeInTheDocument()
  })

  it('highlights selected answer option', () => {
    render(
      <PracticeSetUI
        practiceSet={mockPracticeSet}
        userAnswers={{ q_1: 'A' }}
        onAnswerChange={mockOnAnswerChange}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
        hasSubmitted={false}
      />
    )

    const selectedOption = screen.getByLabelText(/Option A: Central banking/)
    expect(selectedOption.closest('label')).toHaveClass('border-primary-600')
  })

  it('displays syllabus topic for question', () => {
    render(
      <PracticeSetUI
        practiceSet={mockPracticeSet}
        userAnswers={{}}
        onAnswerChange={mockOnAnswerChange}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
        hasSubmitted={false}
      />
    )

    expect(screen.getByText('RBI Functions')).toBeInTheDocument()
  })

  it('has proper accessibility attributes', () => {
    render(
      <PracticeSetUI
        practiceSet={mockPracticeSet}
        userAnswers={{}}
        onAnswerChange={mockOnAnswerChange}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
        hasSubmitted={false}
      />
    )

    const options = screen.getAllByRole('radio')
    expect(options.length).toBeGreaterThan(0)
    options.forEach((option) => {
      expect(option).toHaveAttribute('aria-label')
    })
  })

  it('marks answered questions with green dot', () => {
    render(
      <PracticeSetUI
        practiceSet={mockPracticeSet}
        userAnswers={{ q_1: 'A', q_2: 'B' }}
        onAnswerChange={mockOnAnswerChange}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
        hasSubmitted={false}
      />
    )

    const dots = screen.getAllByRole('button', { name: /Go to question/ })
    // First dot should be primary (current)
    expect(dots[0]).toHaveClass('bg-primary-600')
    // Second dot should be green (answered)
    expect(dots[1]).toHaveClass('bg-green-500')
    // Last two dots should be gray (not answered)
    expect(dots[2]).toHaveClass('bg-gray-200')
    expect(dots[3]).toHaveClass('bg-gray-200')
  })
})
