'use client'

import { PracticeSetResult } from '@/lib/types/practice'

interface ScoreDisplayProps {
  result: PracticeSetResult
}

export function ScoreDisplay({ result }: ScoreDisplayProps) {
  const percentage = result.score
  const isHighScore = percentage >= 80
  const isPassingScore = percentage >= 50
  
  // Determine color based on score
  const getScoreColor = () => {
    if (percentage >= 80) return 'text-green-600 dark:text-green-400'
    if (percentage >= 50) return 'text-blue-600 dark:text-blue-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getScoreBgColor = () => {
    if (percentage >= 80) return 'bg-green-50 dark:bg-green-900/20'
    if (percentage >= 50) return 'bg-blue-50 dark:bg-blue-900/20'
    return 'bg-red-50 dark:bg-red-900/20'
  }

  const getScoreBorderColor = () => {
    if (percentage >= 80) return 'border-green-200 dark:border-green-800'
    if (percentage >= 50) return 'border-blue-200 dark:border-blue-800'
    return 'border-red-200 dark:border-red-800'
  }

  const getScoreMessage = () => {
    if (percentage >= 80) return 'Excellent! Great job!'
    if (percentage >= 50) return 'Good effort! Keep practicing!'
    return 'Keep practicing to improve!'
  }

  return (
    <div
      className={`${getScoreBgColor()} border ${getScoreBorderColor()} rounded-lg p-8`}
      role="region"
      aria-label="Score display"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Score Percentage */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative w-32 h-32 mb-4">
            <svg className="w-full h-full" viewBox="0 0 120 120">
              {/* Background circle */}
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-gray-300 dark:text-gray-600"
              />
              {/* Progress circle */}
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={`${(percentage / 100) * 339.29} 339.29`}
                strokeLinecap="round"
                className={getScoreColor()}
                style={{
                  transform: 'rotate(-90deg)',
                  transformOrigin: '60px 60px',
                  transition: 'stroke-dasharray 0.5s ease',
                }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className={`text-4xl font-bold ${getScoreColor()}`}>
                  {percentage}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">%</div>
              </div>
            </div>
          </div>
          <p className={`text-lg font-semibold ${getScoreColor()}`}>
            {getScoreMessage()}
          </p>
        </div>

        {/* Correct/Incorrect Count */}
        <div className="flex flex-col justify-center space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900/30">
                <svg
                  className="h-6 w-6 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Correct Answers
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {result.correct_count}/{result.total_questions}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-red-100 dark:bg-red-900/30">
                <svg
                  className="h-6 w-6 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Incorrect Answers
              </p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {result.total_questions - result.correct_count}/{result.total_questions}
              </p>
            </div>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="flex flex-col justify-center space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Time Taken
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.floor(result.time_taken / 60)}:{String(result.time_taken % 60).padStart(2, '0')}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Status
            </p>
            <p
              className={`text-lg font-bold ${
                isPassingScore
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {isPassingScore ? '✓ Passed' : '✗ Failed'}
            </p>
          </div>

          {isHighScore && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                🎉 Outstanding performance!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
