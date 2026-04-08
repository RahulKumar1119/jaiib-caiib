'use client'

import { useState, useCallback } from 'react'
import { PracticeSet } from '@/lib/types/practice'

interface PracticeSetUIProps {
  practiceSet: PracticeSet
  userAnswers: Record<string, string | null>
  onAnswerChange: (questionId: string, answer: string | null) => void
  onSubmit: () => void
  isSubmitting: boolean
  hasSubmitted: boolean
}

export function PracticeSetUI({
  practiceSet,
  userAnswers,
  onAnswerChange,
  onSubmit,
  isSubmitting,
  hasSubmitted,
}: PracticeSetUIProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  const currentQuestion = practiceSet.questions[currentQuestionIndex]
  const totalQuestions = practiceSet.questions.length
  const answeredCount = Object.values(userAnswers).filter((answer) => answer !== null).length

  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }, [currentQuestionIndex])

  const handleNext = useCallback(() => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }, [currentQuestionIndex, totalQuestions])

  const handleQuestionSelect = useCallback((index: number) => {
    setCurrentQuestionIndex(index)
  }, [])

  const getOptionLabel = (option: string): string => {
    return option.toUpperCase()
  }

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6" aria-label="Practice set progress">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              Question <span aria-live="polite">{currentQuestionIndex + 1}</span> of {totalQuestions}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              <span aria-live="polite">{answeredCount}</span> of {totalQuestions} answered
            </p>
          </div>

          {/* Question Navigation Dots */}
          <nav className="flex gap-2 flex-wrap" aria-label="Question navigation">
            {practiceSet.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => handleQuestionSelect(index)}
                className={`w-10 h-10 rounded-full font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
                  index === currentQuestionIndex
                    ? 'bg-primary-600 text-white'
                    : userAnswers[practiceSet.questions[index].question_id]
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
                aria-label={`Go to question ${index + 1}${
                  userAnswers[practiceSet.questions[index].question_id] ? ' (answered)' : ''
                }`}
                aria-current={index === currentQuestionIndex ? 'page' : undefined}
              >
                {index + 1}
              </button>
            ))}
          </nav>
        </div>
      </section>

      {/* Question Card */}
      <article className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 md:p-8">
        {/* Question Text */}
        <div className="mb-8">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {currentQuestion.question_text}
          </h2>
          {currentQuestion.syllabus_topic && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-semibold">Topic:</span> {currentQuestion.syllabus_topic}
            </p>
          )}
        </div>

        {/* Answer Options */}
        <fieldset className="space-y-3 mb-8">
          <legend className="sr-only">Select your answer</legend>
          {currentQuestion.order.map((optionKey) => {
            const optionText = currentQuestion.options[optionKey as keyof typeof currentQuestion.options]
            const isSelected = userAnswers[currentQuestion.question_id] === optionKey

            return (
              <label
                key={optionKey}
                className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2 dark:focus-within:ring-offset-gray-900 ${
                  isSelected
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <input
                  type="radio"
                  name={`question-${currentQuestion.question_id}`}
                  value={optionKey}
                  checked={isSelected}
                  onChange={() => onAnswerChange(currentQuestion.question_id, optionKey)}
                  className="mt-1 w-4 h-4 text-primary-600 cursor-pointer focus:outline-none"
                  aria-label={`Option ${getOptionLabel(optionKey)}: ${optionText}`}
                />
                <div className="ml-4 flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {getOptionLabel(optionKey)}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 mt-1">{optionText}</p>
                </div>
              </label>
            )
          })}
        </fieldset>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
              currentQuestionIndex === 0
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
            aria-label="Go to previous question"
          >
            ← Previous
          </button>

          <button
            onClick={handleNext}
            disabled={currentQuestionIndex === totalQuestions - 1}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
              currentQuestionIndex === totalQuestions - 1
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
            aria-label="Go to next question"
          >
            Next →
          </button>
        </div>
      </article>

      {/* Submit Button */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>
              <span className="font-semibold" aria-live="polite">{answeredCount}</span> of{' '}
              <span className="font-semibold">{totalQuestions}</span> questions answered
            </p>
            {answeredCount < totalQuestions && (
              <p className="text-yellow-600 dark:text-yellow-400 mt-1" role="alert">
                ⚠️ Unanswered questions will be marked as incorrect
              </p>
            )}
          </div>

          <button
            onClick={onSubmit}
            disabled={isSubmitting || hasSubmitted}
            className={`px-8 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
              isSubmitting || hasSubmitted
                ? 'bg-gray-400 dark:bg-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600 text-white'
            }`}
            aria-label="Submit practice set"
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </span>
            ) : hasSubmitted ? (
              'Submitted'
            ) : (
              'Submit Practice Set'
            )}
          </button>
        </div>
      </section>
    </div>
  )
}
