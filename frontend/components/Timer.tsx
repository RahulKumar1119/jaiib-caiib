'use client'

import { useTimer } from '@/lib/hooks/useTimer'

interface TimerProps {
  timer: ReturnType<typeof useTimer>
}

export function Timer({ timer }: TimerProps) {
  const color = timer.getColor()
  const formattedTime = timer.getFormattedTime()
  const percentage = timer.getPercentage()

  // Determine color classes based on time remaining
  const getColorClasses = () => {
    switch (color) {
      case 'green':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      case 'yellow':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
      case 'red':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
    }
  }

  const getProgressBarColor = () => {
    switch (color) {
      case 'green':
        return 'bg-green-600'
      case 'yellow':
        return 'bg-yellow-600'
      case 'red':
        return 'bg-red-600'
      default:
        return 'bg-gray-600'
    }
  }

  return (
    <div className={`rounded-lg border p-6 ${getColorClasses()}`}>
      <div className="flex flex-col items-center gap-3">
        {/* Timer Display */}
        <div className="text-center">
          <p className="text-sm font-semibold opacity-75 mb-1">Time Remaining</p>
          <p className="text-4xl font-bold font-mono">{formattedTime}</p>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-xs">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${getProgressBarColor()} transition-all duration-1000`}
              style={{ width: `${percentage}%` }}
              role="progressbar"
              aria-valuenow={timer.timeRemaining}
              aria-valuemin={0}
              aria-valuemax={600}
              aria-label={`Time remaining: ${formattedTime}`}
            />
          </div>
        </div>

        {/* Status Message */}
        {color === 'yellow' && (
          <p className="text-sm font-semibold">Time is running low!</p>
        )}
        {color === 'red' && (
          <p className="text-sm font-semibold animate-pulse">Hurry up! Less than 1 minute left!</p>
        )}
      </div>
    </div>
  )
}
