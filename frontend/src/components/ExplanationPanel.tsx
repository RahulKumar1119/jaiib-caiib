/**
 * Explanation Panel Component
 * Displays AI-generated explanations for questions with RBI/IIBF citations
 */

import React, { useState, useEffect } from 'react'
import { apiClient, ExplanationResponse, ApiError } from '../services/api'
import '../styles/ExplanationPanel.css'

interface ExplanationPanelProps {
  questionId: string
  questionText: string
  correctAnswer: string
  userAnswer: string
  isCorrect: boolean
  onClose: () => void
}

type ExplanationState = 'loading' | 'loaded' | 'error'

export const ExplanationPanel: React.FC<ExplanationPanelProps> = ({
  questionId,
  questionText,
  correctAnswer,
  userAnswer,
  isCorrect,
  onClose,
}) => {
  const [state, setState] = useState<ExplanationState>('loading')
  const [explanation, setExplanation] = useState<ExplanationResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchExplanation = async () => {
      try {
        setState('loading')
        const data = await apiClient.getExplanation(questionId)
        setExplanation(data)
        setState('loaded')
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Failed to load explanation'
        setError(message)
        setState('error')
      }
    }

    fetchExplanation()
  }, [questionId])

  return (
    <div className="explanation-panel-overlay">
      <div className="explanation-panel">
        <div className="explanation-header">
          <h2>Explanation</h2>
          <button className="close-button" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="explanation-content">
          {/* Question Section */}
          <div className="explanation-section">
            <h3>Question</h3>
            <p className="question-text">{questionText}</p>
          </div>

          {/* Answer Status */}
          <div className={`answer-status ${isCorrect ? 'correct' : 'incorrect'}`}>
            <div className="status-icon">{isCorrect ? '✓' : '✗'}</div>
            <div className="status-content">
              <div className="status-title">{isCorrect ? 'Correct Answer' : 'Incorrect Answer'}</div>
              <div className="status-message">
                {isCorrect
                  ? 'Great job! You selected the correct answer.'
                  : `You selected ${userAnswer}, but the correct answer is ${correctAnswer}.`}
              </div>
            </div>
          </div>

          {/* Explanation Content */}
          {state === 'loading' && (
            <div className="explanation-loading">
              <div className="spinner"></div>
              <p>Loading explanation...</p>
            </div>
          )}

          {state === 'loaded' && explanation && (
            <>
              <div className="explanation-section">
                <h3>Explanation</h3>
                <div className="explanation-text">
                  {explanation.explanation_text}
                </div>
              </div>

              {/* RBI Norms */}
              {explanation.rbi_norms && explanation.rbi_norms.length > 0 && (
                <div className="explanation-section">
                  <h3>RBI Norms & Guidelines</h3>
                  <ul className="norms-list">
                    {explanation.rbi_norms.map((norm, index) => (
                      <li key={index}>
                        <span className="norm-icon">📋</span>
                        {norm}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* IIBF Norms */}
              {explanation.iibf_norms && explanation.iibf_norms.length > 0 && (
                <div className="explanation-section">
                  <h3>IIBF Guidelines</h3>
                  <ul className="norms-list">
                    {explanation.iibf_norms.map((norm, index) => (
                      <li key={index}>
                        <span className="norm-icon">📚</span>
                        {norm}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Key Takeaway */}
              <div className="explanation-section key-takeaway">
                <h3>Key Takeaway</h3>
                <p>
                  The correct answer is <strong>{correctAnswer}</strong>. Remember this concept for
                  similar questions in the exam.
                </p>
              </div>
            </>
          )}

          {state === 'error' && (
            <div className="explanation-error">
              <div className="error-icon">⚠️</div>
              <p>{error}</p>
              <button onClick={onClose} className="btn-secondary">
                Close
              </button>
            </div>
          )}
        </div>

        <div className="explanation-footer">
          <button onClick={onClose} className="btn-primary">
            Got it!
          </button>
        </div>
      </div>
    </div>
  )
}

export default ExplanationPanel
