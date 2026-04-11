/**
 * Question Component
 * Displays a single MCQ with options
 */

import React from 'react'
import '../styles/Question.css'

export interface QuestionData {
  question_id: string
  question_text: string
  options: {
    A: string
    B: string
    C: string
    D: string
  }
  order: string[]
}

interface QuestionProps {
  question: QuestionData
  questionNumber: number
  totalQuestions: number
  selectedAnswer: string | null
  onAnswerSelect: (answer: string) => void
  isReview?: boolean
  correctAnswer?: string
  userAnswer?: string
}

export const Question: React.FC<QuestionProps> = ({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  onAnswerSelect,
  isReview = false,
  correctAnswer,
  userAnswer,
}) => {
  const getOptionClass = (option: string): string => {
    if (!isReview) {
      return selectedAnswer === option ? 'option-selected' : ''
    }

    // Review mode
    if (option === correctAnswer) {
      return 'option-correct'
    }

    if (option === userAnswer && userAnswer !== correctAnswer) {
      return 'option-incorrect'
    }

    return ''
  }

  const isAnswerCorrect = userAnswer === correctAnswer

  return (
    <div className="question-container">
      <div className="question-header">
        <h2 className="question-number">
          Question {questionNumber} of {totalQuestions}
        </h2>
        {isReview && (
          <div className={`question-status ${isAnswerCorrect ? 'correct' : 'incorrect'}`}>
            {isAnswerCorrect ? '✓ Correct' : '✗ Incorrect'}
          </div>
        )}
      </div>

      <div className="question-text">
        <p>{question.question_text}</p>
      </div>

      <div className="options-container">
        {question.order.map((option) => (
          <button
            key={option}
            className={`option-button ${getOptionClass(option)}`}
            onClick={() => !isReview && onAnswerSelect(option)}
            disabled={isReview}
          >
            <span className="option-label">{option}</span>
            <span className="option-text">{question.options[option as keyof typeof question.options]}</span>
          </button>
        ))}
      </div>

      {isReview && userAnswer && (
        <div className="answer-review">
          <div className="review-item">
            <span className="review-label">Your Answer:</span>
            <span className="review-value">{userAnswer}</span>
          </div>
          <div className="review-item">
            <span className="review-label">Correct Answer:</span>
            <span className="review-value">{correctAnswer}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default Question
