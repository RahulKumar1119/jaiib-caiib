/**
 * Score Display Component
 * Shows practice set results with detailed breakdown and explanations
 */

import React, { useState } from 'react'
import { ScoreResponse } from '../services/api'
import Question, { QuestionData } from './Question'
import ExplanationPanel from './ExplanationPanel'
import '../styles/ScoreDisplay.css'

interface ScoreDisplayProps {
  score: ScoreResponse
  questions: QuestionData[]
  onRetry: () => void
  onDashboard: () => void
}

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
  score,
  questions,
  onRetry,
  onDashboard,
}) => {
  const [showReview, setShowReview] = useState(false)
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0)
  const [selectedExplanation, setSelectedExplanation] = useState<{
    questionId: string
    questionText: string
    correctAnswer: string
    userAnswer: string
    isCorrect: boolean
  } | null>(null)

  const percentage = (score.correct_count / score.total_questions) * 100
  const getScoreColor = (): string => {
    if (percentage >= 75) return 'excellent'
    if (percentage >= 50) return 'good'
    if (percentage >= 25) return 'fair'
    return 'poor'
  }

  const getScoreMessage = (): string => {
    if (percentage >= 75) return '🎉 Excellent performance!'
    if (percentage >= 50) return '👍 Good effort! Keep practicing.'
    if (percentage >= 25) return '💪 Keep working on these topics.'
    return '📚 Review the concepts and try again.'
  }

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}m ${secs}s`
  }

  const handleExplanationClick = (questionId: string) => {
    const currentQuestion = questions.find((q) => q.question_id === questionId)
    const answer = score.answers[questionId]

    if (currentQuestion && answer) {
      setSelectedExplanation({
        questionId,
        questionText: currentQuestion.question_text,
        correctAnswer: answer.correct_answer,
        userAnswer: answer.user_answer,
        isCorrect: answer.is_correct,
      })
    }
  }

  if (showReview) {
    const currentQuestion = questions[currentReviewIndex]
    const answer = score.answers[currentQuestion.question_id]

    return (
      <div className="score-display-container">
        <div className="review-header">
          <h2>Answer Review</h2>
          <p>
            Question {currentReviewIndex + 1} of {questions.length}
          </p>
        </div>

        <div className="review-content">
          <Question
            question={currentQuestion}
            questionNumber={currentReviewIndex + 1}
            totalQuestions={questions.length}
            selectedAnswer={null}
            onAnswerSelect={() => {}}
            isReview={true}
            correctAnswer={answer.correct_answer}
            userAnswer={answer.user_answer}
          />

          <button
            onClick={() => handleExplanationClick(currentQuestion.question_id)}
            className="btn-explanation"
          >
            💡 Get Explanation
          </button>
        </div>

        <div className="review-footer">
          <button
            onClick={() => setCurrentReviewIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentReviewIndex === 0}
            className="btn-secondary"
          >
            ← Previous
          </button>

          <button onClick={() => setShowReview(false)} className="btn-outline">
            Back to Results
          </button>

          <button
            onClick={() =>
              setCurrentReviewIndex((prev) =>
                Math.min(questions.length - 1, prev + 1)
              )
            }
            disabled={currentReviewIndex === questions.length - 1}
            className="btn-secondary"
          >
            Next →
          </button>
        </div>

        {selectedExplanation && (
          <ExplanationPanel
            questionId={selectedExplanation.questionId}
            questionText={selectedExplanation.questionText}
            correctAnswer={selectedExplanation.correctAnswer}
            userAnswer={selectedExplanation.userAnswer}
            isCorrect={selectedExplanation.isCorrect}
            onClose={() => setSelectedExplanation(null)}
          />
        )}
      </div>
    )
  }

  return (
    <div className="score-display-container">
      <div className="score-card">
        <div className={`score-circle ${getScoreColor()}`}>
          <div className="score-value">{score.score}</div>
          <div className="score-label">Score</div>
        </div>

        <div className="score-details">
          <h2>Practice Set Complete!</h2>
          <p className="score-message">{getScoreMessage()}</p>

          <div className="score-stats">
            <div className="stat">
              <span className="stat-label">Correct Answers</span>
              <span className="stat-value">
                {score.correct_count}/{score.total_questions}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Percentage</span>
              <span className="stat-value">{percentage.toFixed(1)}%</span>
            </div>
            <div className="stat">
              <span className="stat-label">Time Taken</span>
              <span className="stat-value">{formatTime(score.time_taken)}</span>
            </div>
          </div>

          <div className="score-breakdown">
            <h3>Performance Breakdown</h3>
            <div className="breakdown-items">
              {Object.entries(score.answers).map(([questionId, answer], index) => (
                <button
                  key={questionId}
                  className={`breakdown-item ${answer.is_correct ? 'correct' : 'incorrect'}`}
                  onClick={() => handleExplanationClick(questionId)}
                  title="Click to view explanation"
                >
                  <span className="breakdown-icon">
                    {answer.is_correct ? '✓' : '✗'}
                  </span>
                  <span className="breakdown-text">Q{index + 1}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="score-insights">
            <h3>Performance Insights</h3>
            <div className="insights-content">
              {percentage >= 75 && (
                <p>
                  🌟 Outstanding! You're well-prepared for the exam. Focus on the questions you
                  missed to achieve perfection.
                </p>
              )}
              {percentage >= 50 && percentage < 75 && (
                <p>
                  📈 Good progress! Review the incorrect answers and strengthen your weak areas
                  before the exam.
                </p>
              )}
              {percentage >= 25 && percentage < 50 && (
                <p>
                  🎯 Keep practicing! Focus on understanding the concepts behind each question.
                  Review the explanations carefully.
                </p>
              )}
              {percentage < 25 && (
                <p>
                  💪 Don't give up! Start with the basics and gradually increase difficulty.
                  Review all explanations thoroughly.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="score-actions">
        <button onClick={() => setShowReview(true)} className="btn-secondary">
          Review Answers
        </button>
        <button onClick={onRetry} className="btn-primary">
          Try Another Set
        </button>
        <button onClick={onDashboard} className="btn-outline">
          Back to Dashboard
        </button>
      </div>

      {selectedExplanation && (
        <ExplanationPanel
          questionId={selectedExplanation.questionId}
          questionText={selectedExplanation.questionText}
          correctAnswer={selectedExplanation.correctAnswer}
          userAnswer={selectedExplanation.userAnswer}
          isCorrect={selectedExplanation.isCorrect}
          onClose={() => setSelectedExplanation(null)}
        />
      )}
    </div>
  )
}

export default ScoreDisplay
