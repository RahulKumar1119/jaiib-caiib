'use client'

import { useState, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import { useNotification } from '@/lib/notification-context'

interface ExplanationPanelProps {
  questionId: string
}

interface Explanation {
  explanation_id: string
  question_id: string
  correct_answer: string
  explanation_text: string
  rbi_norms?: string[]
  iibf_norms?: string[]
  generated_at: number
  model: string
}

export function ExplanationPanel({ questionId }: ExplanationPanelProps) {
  const { addNotification } = useNotification()
  const [explanation, setExplanation] = useState<Explanation | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  const handleExplain = useCallback(async () => {
    if (explanation) {
      setIsExpanded(!isExpanded)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await apiClient.post<{
        success: boolean
        explanation: Explanation
        error?: string
      }>('/explanations', {
        question_id: questionId,
      })

      if (response.success && response.explanation) {
        setExplanation(response.explanation)
        setIsExpanded(true)
        addNotification('Explanation loaded successfully', 'success')
      } else {
        throw new Error(response.error || 'Failed to generate explanation')
      }
    } catch (err: any) {
      const errorMessage =
        err.message === 'Explanation service temporarily unavailable. Please try again later.'
          ? err.message
          : 'Explanation service temporarily unavailable. Please try again later.'
      setError(errorMessage)
      addNotification(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }, [questionId, explanation, isExpanded, addNotification])

  return (
    <div className="space-y-3">
      {/* Explain Button */}
      <button
        onClick={handleExplain}
        disabled={isLoading}
        className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        aria-label={explanation ? 'Toggle explanation' : 'Generate explanation'}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-5 w-5"
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
            <span>Generating explanation...</span>
          </>
        ) : explanation ? (
          <>
            <svg
              className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
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
            <span>{isExpanded ? 'Hide' : 'Show'} Explanation</span>
          </>
        ) : (
          <>
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Explain</span>
          </>
        )}
      </button>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          <button
            onClick={handleExplain}
            disabled={isLoading}
            className="mt-2 text-sm font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Explanation Content */}
      {isExpanded && explanation && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-4">
          {/* Correct Answer */}
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Correct Answer:
            </p>
            <p className="text-base font-bold text-green-600 dark:text-green-400">
              {explanation.correct_answer}
            </p>
          </div>

          {/* Explanation Text */}
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Explanation:
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {explanation.explanation_text}
            </p>
          </div>

          {/* RBI Norms */}
          {explanation.rbi_norms && explanation.rbi_norms.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                RBI Norms & Guidelines:
              </p>
              <ul className="space-y-1">
                {explanation.rbi_norms.map((norm, index) => (
                  <li
                    key={index}
                    className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"
                  >
                    <span className="text-primary-600 dark:text-primary-400 font-bold mt-0.5">
                      •
                    </span>
                    <span>{norm}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* IIBF Norms */}
          {explanation.iibf_norms && explanation.iibf_norms.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                IIBF Standards & Guidelines:
              </p>
              <ul className="space-y-1">
                {explanation.iibf_norms.map((norm, index) => (
                  <li
                    key={index}
                    className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"
                  >
                    <span className="text-primary-600 dark:text-primary-400 font-bold mt-0.5">
                      •
                    </span>
                    <span>{norm}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Generated Info */}
          <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Generated by {explanation.model} on{' '}
              {new Date(explanation.generated_at * 1000).toLocaleDateString()}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
