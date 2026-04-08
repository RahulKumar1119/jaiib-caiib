import React, { useState } from 'react'
import { formatPaperName } from '@/lib/utils/formatting'

interface MissedQuestionsProps {
  questions: Array<{
    question_id: string
    question_text: string
    paper: string
    average_score: number
    times_attempted: number
  }>
}

export function MissedQuestions({ questions }: MissedQuestionsProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  if (!questions || questions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Most Frequently Missed Questions</h2>
        <p className="text-gray-600 dark:text-gray-400">No missed questions data available</p>
      </div>
    )
  }

  const totalPages = Math.ceil(questions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedQuestions = questions.slice(startIndex, startIndex + itemsPerPage)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Most Frequently Missed Questions</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Question</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Paper</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">Avg Score</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">Attempts</th>
            </tr>
          </thead>
          <tbody>
            {paginatedQuestions.map((question, index) => (
              <tr
                key={question.question_id}
                className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <td className="py-4 px-4">
                  <div className="flex items-start gap-3">
                    <span className="text-gray-500 dark:text-gray-400 font-medium min-w-fit">
                      {startIndex + index + 1}.
                    </span>
                    <p className="text-gray-900 dark:text-white text-sm line-clamp-2">
                      {question.question_text}
                    </p>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className="text-gray-600 dark:text-gray-400 text-sm">
                    {formatPaperName(question.paper)}
                  </span>
                </td>
                <td className="py-4 px-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          question.average_score >= 70
                            ? 'bg-green-500'
                            : question.average_score >= 50
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${question.average_score}%` }}
                      ></div>
                    </div>
                    <span className="text-gray-900 dark:text-white font-semibold text-sm min-w-fit">
                      {question.average_score.toFixed(1)}%
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="text-gray-900 dark:text-white font-semibold">
                    {question.times_attempted}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-2 rounded-lg transition-colors ${
                currentPage === page
                  ? 'bg-primary-600 text-white'
                  : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
