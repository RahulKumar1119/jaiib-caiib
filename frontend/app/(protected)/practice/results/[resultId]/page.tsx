'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { useNotification } from '@/lib/notification-context'
import { PracticeSetResult, AnswerDetail } from '@/lib/types/practice'
import { ScoreDisplay } from '@/components/ScoreDisplay'
import { ExplanationPanel } from '@/components/ExplanationPanel'

export default function ResultsPage() {
  const router = useRouter()
  const params = useParams()
  const { addNotification } = useNotification()
  
  const resultId = params.resultId as string
  
  const [result, setResult] = useState<PracticeSetResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null)

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Fetch the practice set result
        const response = await apiClient.get<{
          success: boolean
          score: PracticeSetResult
          error?: string
        }>(`/practice-sets/${resultId}/result`)
        
        if (response.success && response.score) {
          setResult(response.score)
          
          // Show notification based on score
          if (response.score.score > 80) {
            addNotification(`Great job! You scored ${response.score.score}%`, 'success')
          } else if (response.score.score < 50) {
            addNotification(
              `Keep practicing! You scored ${response.score.score}%. Review the explanations to improve.`,
              'warning'
            )
          }
        } else {
          throw new Error(response.error || 'Failed to load results')
        }
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to load practice set results'
        setError(errorMessage)
        addNotification(errorMessage, 'error')
      } finally {
        setIsLoading(false)
      }
    }

    if (resultId) {
      fetchResult()
    }
  }, [resultId, addNotification])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block">
            <svg
              className="animate-spin h-12 w-12 text-primary-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading results...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">
              Error Loading Results
            </h2>
            <p className="text-red-800 dark:text-red-300 mb-4">{error}</p>
            <button
              onClick={() => router.push('/practice')}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
            >
              Back to Practice
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <p className="text-yellow-800 dark:text-yellow-300">
              Results not found. Please try again.
            </p>
            <button
              onClick={() => router.push('/practice')}
              className="mt-4 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold transition-colors"
            >
              Back to Practice
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Practice Results
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Review your answers and learn from the explanations
          </p>
        </div>

        {/* Score Display */}
        <ScoreDisplay result={result} />

        {/* Answer Review Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Answer Review
          </h2>
          
          <div className="space-y-4">
            {result.answers_detail.map((answer: AnswerDetail, index: number) => (
              <div
                key={answer.question_id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Question Header */}
                <button
                  onClick={() =>
                    setExpandedQuestionId(
                      expandedQuestionId === answer.question_id ? null : answer.question_id
                    )
                  }
                  className="w-full px-6 py-4 flex items-start justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  aria-expanded={expandedQuestionId === answer.question_id}
                  aria-label={`Question ${index + 1}: ${answer.is_correct ? 'Correct' : 'Incorrect'}`}
                >
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Question {index + 1}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          answer.is_correct
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                        }`}
                      >
                        {answer.is_correct ? '✓ Correct' : '✗ Incorrect'}
                      </span>
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform ${
                      expandedQuestionId === answer.question_id ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </button>

                {/* Expanded Content */}
                {expandedQuestionId === answer.question_id && (
                  <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-700/30">
                    {/* Answer Details */}
                    <div className="mb-6 space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          Your Answer:
                        </p>
                        <p
                          className={`text-sm ${
                            answer.is_correct
                              ? 'text-green-700 dark:text-green-300'
                              : 'text-red-700 dark:text-red-300'
                          }`}
                        >
                          {answer.user_answer || 'Not answered'}
                        </p>
                      </div>
                      {!answer.is_correct && (
                        <div>
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Correct Answer:
                          </p>
                          <p className="text-sm text-green-700 dark:text-green-300">
                            {answer.correct_answer}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Explanation Panel */}
                    <ExplanationPanel questionId={answer.question_id} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => router.push('/practice')}
            className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors"
          >
            Practice Again
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors"
          >
            View Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
