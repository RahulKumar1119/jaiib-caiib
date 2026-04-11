/**
 * Practice Set Component
 * Main component for displaying and managing practice sessions
 */

import React, { useState, useEffect } from 'react'
import { apiClient, PracticeSetResponse, ScoreResponse } from '../services/api'
import Timer from './Timer'
import Question, { QuestionData } from './Question'
import '../styles/PracticeSet.css'

interface PracticeSetProps {
  practiceSetId: string
  onComplete: (score: ScoreResponse) => void
  onCancel: () => void
}

type SessionState = 'loading' | 'active' | 'submitted' | 'error'

export const PracticeSet: React.FC<PracticeSetProps> = ({
  practiceSetId,
  onComplete,
  onCancel,
}) => {
  const [state, setState] = useState<SessionState>('loading')
  const [practiceSet, setPracticeSet] = useState<PracticeSetResponse | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load practice set on mount
  useEffect(() => {
    const loadPracticeSet = async () => {
      try {
        setState('loading')
        const data = await apiClient.getPracticeSet(practiceSetId)
        setPracticeSet(data)
        setState('active')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load practice set')
        setState('error')
      }
    }

    loadPracticeSet()
  }, [practiceSetId])

  const handleAnswerSelect = (answer: string) => {
    const currentQuestion = practiceSet?.questions[currentQuestionIndex]
    if (currentQuestion) {
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.question_id]: answer,
      }))
    }
  }

  const handleNextQuestion = () => {
    if (practiceSet && currentQuestionIndex < practiceSet.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
    }
  }

  const handleTimeUp = async () => {
    await submitPracticeSet()
  }

  const submitPracticeSet = async () => {
    if (isSubmitting || !practiceSet) return

    setIsSubmitting(true)
    try {
      setState('submitted')
      const score = await apiClient.submitPracticeSet(practiceSetId, answers)
      onComplete(score)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit practice set')
      setState('error')
      setIsSubmitting(false)
    }
  }

  if (state === 'loading') {
    return (
      <div className="practice-set-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading practice set...</p>
        </div>
      </div>
    )
  }

  if (state === 'error' || !practiceSet) {
    return (
      <div className="practice-set-container">
        <div className="error-state">
          <h2>Error</h2>
          <p>{error || 'Failed to load practice set'}</p>
          <button onClick={onCancel} className="btn-secondary">
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const currentQuestion = practiceSet.questions[currentQuestionIndex] as QuestionData
  const selectedAnswer = answers[currentQuestion.question_id] || null
  const answeredCount = Object.keys(answers).length
  const totalQuestions = practiceSet.questions.length

  return (
    <div className="practice-set-container">
      <div className="practice-set-header">
        <div className="header-left">
          <h1>Practice Set - {practiceSet.paper}</h1>
          <p className="progress-text">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </p>
        </div>
        <Timer
          initialSeconds={practiceSet.time_limit_seconds}
          onTimeUp={handleTimeUp}
          isActive={state === 'active'}
        />
      </div>

      <div className="practice-set-content">
        <div className="question-section">
          <Question
            question={currentQuestion}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={totalQuestions}
            selectedAnswer={selectedAnswer}
            onAnswerSelect={handleAnswerSelect}
          />
        </div>

        <div className="practice-set-sidebar">
          <div className="progress-card">
            <h3>Progress</h3>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
              ></div>
            </div>
            <p className="progress-text">
              {answeredCount} of {totalQuestions} answered
            </p>
          </div>

          <div className="questions-grid">
            <h3>Questions</h3>
            <div className="grid">
              {practiceSet.questions.map((q, index) => (
                <button
                  key={q.question_id}
                  className={`grid-item ${
                    index === currentQuestionIndex ? 'active' : ''
                  } ${answers[q.question_id] ? 'answered' : ''}`}
                  onClick={() => setCurrentQuestionIndex(index)}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="practice-set-footer">
        <button
          onClick={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0}
          className="btn-secondary"
        >
          ← Previous
        </button>

        <div className="footer-center">
          <button onClick={onCancel} className="btn-outline">
            Exit Practice
          </button>
        </div>

        {currentQuestionIndex === totalQuestions - 1 ? (
          <button
            onClick={submitPracticeSet}
            disabled={isSubmitting}
            className="btn-primary"
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        ) : (
          <button
            onClick={handleNextQuestion}
            disabled={currentQuestionIndex === totalQuestions - 1}
            className="btn-primary"
          >
            Next →
          </button>
        )}
      </div>

      {error && (
        <div className="error-banner">
          <p>{error}</p>
        </div>
      )}
    </div>
  )
}

export default PracticeSet
