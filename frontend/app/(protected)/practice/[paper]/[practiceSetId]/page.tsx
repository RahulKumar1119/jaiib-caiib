'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { usePracticeSet } from '@/lib/hooks/usePracticeSet'
import { useTimer } from '@/lib/hooks/useTimer'
import { useNotification } from '@/lib/notification-context'
import { PracticeSetUI } from '@/components/PracticeSetUI'
import { Timer } from '@/components/Timer'
import { PracticeSet } from '@/lib/types/practice'

export default function PracticeSessionPage() {
  const router = useRouter()
  const params = useParams()
  const { addNotification } = useNotification()
  const { currentPracticeSet, submitPracticeSet, isLoading, error, clearError } = usePracticeSet()
  
  const paper = params.paper as string
  const practiceSetId = params.practiceSetId as string
  
  const [userAnswers, setUserAnswers] = useState<Record<string, string | null>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  
  // Initialize timer with 10 minutes (600 seconds)
  const timer = useTimer(600)

  // Start timer when practice set is loaded
  useEffect(() => {
    if (currentPracticeSet && !timer.isRunning) {
      timer.start()
    }
  }, [currentPracticeSet, timer])

  // Auto-submit when timer reaches 0
  useEffect(() => {
    if (timer.timeRemaining === 0 && !hasSubmitted && currentPracticeSet) {
      handleSubmit()
    }
  }, [timer.timeRemaining, hasSubmitted, currentPracticeSet])

  const handleAnswerChange = useCallback((questionId: string, answer: string | null) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }))
  }, [])

  const handleSubmit = useCallback(async () => {
    if (hasSubmitted || isSubmitting || !currentPracticeSet) {
      return
    }

    setIsSubmitting(true)
    timer.pause()

    try {
      const timeTaken = 600 - timer.timeRemaining
      await submitPracticeSet(userAnswers, timeTaken)
      setHasSubmitted(true)
      addNotification('Practice set submitted successfully!', 'success')
      
      // Redirect to results page after a short delay
      setTimeout(() => {
        router.push(`/practice/results/${currentPracticeSet.practice_set_id}`)
      }, 1500)
    } catch (err) {
      addNotification('Failed to submit practice set. Please try again.', 'error')
      timer.resume()
    } finally {
      setIsSubmitting(false)
    }
  }, [currentPracticeSet, userAnswers, timer, submitPracticeSet, hasSubmitted, isSubmitting, addNotification, router])

  // Show loading state while practice set is being fetched
  if (isLoading && !currentPracticeSet) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block">
            <svg className="animate-spin h-12 w-12 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading practice set...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">Error</h2>
            <p className="text-red-800 dark:text-red-300 mb-4">{error}</p>
            <button
              onClick={() => {
                clearError()
                router.push('/practice')
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
            >
              Back to Practice
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Show practice set UI
  if (!currentPracticeSet) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <p className="text-yellow-800 dark:text-yellow-300">Practice set not found. Please start a new practice session.</p>
            <button
              onClick={() => router.push('/practice')}
              className="mt-4 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold"
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
        {/* Header with Timer */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Practice Session
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {currentPracticeSet.paper.replace(/_/g, ' ')}
            </p>
          </div>
          <Timer timer={timer} />
        </div>

        {/* Practice Set UI */}
        <PracticeSetUI
          practiceSet={currentPracticeSet}
          userAnswers={userAnswers}
          onAnswerChange={handleAnswerChange}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          hasSubmitted={hasSubmitted}
        />
      </div>
    </div>
  )
}
