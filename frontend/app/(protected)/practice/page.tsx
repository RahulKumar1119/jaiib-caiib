'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { JAIIB_PAPERS, DIFFICULTY_LEVELS } from '@/lib/utils/constants'
import { usePracticeSet } from '@/lib/hooks/usePracticeSet'
import { useNotification } from '@/lib/notification-context'
import { JaiibPaper, DifficultyLevel } from '@/lib/types/practice'

export default function PracticePage() {
  const router = useRouter()
  const { generatePracticeSet, isLoading, error, clearError } = usePracticeSet()
  const { addNotification } = useNotification()
  
  const [selectedPaper, setSelectedPaper] = useState<JaiibPaper | null>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('medium')

  const handleStartPractice = async (paper: JaiibPaper) => {
    try {
      clearError()
      setSelectedPaper(paper)
      await generatePracticeSet(paper)
      // Navigate to the practice session page
      router.push(`/practice/${paper}`)
    } catch (err) {
      addNotification('Failed to start practice. Please try again.', 'error')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Practice Sets
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Select a JAIIB paper to start practicing. Each practice set contains 4 questions with a 10-minute timer.
          </p>
        </div>

        {/* Difficulty Level Selector */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <label 
            htmlFor="difficulty-select"
            className="block text-sm font-semibold text-gray-900 dark:text-white mb-3"
          >
            Difficulty Level (Optional)
          </label>
          <select
            id="difficulty-select"
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value as DifficultyLevel)}
            className="w-full md:w-48 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            aria-label="Select difficulty level for practice"
          >
            {DIFFICULTY_LEVELS.map((level) => (
              <option key={level.id} value={level.id}>
                {level.label}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Choose your preferred difficulty level. This helps tailor questions to your skill level.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div 
            className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            role="alert"
            aria-live="polite"
          >
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Paper Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {JAIIB_PAPERS.map((paper) => (
            <div
              key={paper.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden"
            >
              <div className="p-6">
                {/* Paper Title */}
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {paper.shortName}
                </h2>
                
                {/* Paper Full Name */}
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  {paper.name}
                </h3>
                
                {/* Paper Description */}
                <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  {paper.description}
                </p>

                {/* Paper Info */}
                <div className="mb-6 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p>
                    <span className="font-semibold">Questions per set:</span> 4
                  </p>
                  <p>
                    <span className="font-semibold">Time limit:</span> 10 minutes
                  </p>
                  <p>
                    <span className="font-semibold">Difficulty:</span> {selectedDifficulty}
                  </p>
                </div>

                {/* Start Practice Button */}
                <button
                  onClick={() => handleStartPractice(paper.id as JaiibPaper)}
                  disabled={isLoading && selectedPaper === paper.id}
                  aria-label={`Start practice for ${paper.name}`}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors duration-200 ${
                    isLoading && selectedPaper === paper.id
                      ? 'bg-gray-400 dark:bg-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600 text-white'
                  }`}
                >
                  {isLoading && selectedPaper === paper.id ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Starting...
                    </span>
                  ) : (
                    'Start Practice'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-3">
            How Practice Sets Work
          </h3>
          <ul className="space-y-2 text-blue-800 dark:text-blue-300 text-sm">
            <li className="flex items-start">
              <span className="mr-3 font-bold">•</span>
              <span>Each practice set contains 4 randomly selected questions from the selected paper</span>
            </li>
            <li className="flex items-start">
              <span className="mr-3 font-bold">•</span>
              <span>You have 10 minutes to complete the practice set</span>
            </li>
            <li className="flex items-start">
              <span className="mr-3 font-bold">•</span>
              <span>Your score is calculated immediately after submission</span>
            </li>
            <li className="flex items-start">
              <span className="mr-3 font-bold">•</span>
              <span>You can view detailed explanations for each question after completion</span>
            </li>
            <li className="flex items-start">
              <span className="mr-3 font-bold">•</span>
              <span>Your progress is tracked on your dashboard</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
