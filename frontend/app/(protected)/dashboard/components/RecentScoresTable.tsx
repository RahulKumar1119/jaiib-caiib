'use client'

import React, { useState, useMemo } from 'react'
import { Score } from '@/lib/types/score'
import { formatScore, formatPaperName, formatDateTime } from '@/lib/utils/formatting'

interface RecentScoresTableProps {
  scores: Score[]
  itemsPerPage?: number
}

export function RecentScoresTable({ scores, itemsPerPage = 10 }: RecentScoresTableProps) {
  const [currentPage, setCurrentPage] = useState(1)

  const paginatedScores = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return scores.slice(startIndex, endIndex)
  }, [scores, currentPage, itemsPerPage])

  const totalPages = Math.ceil(scores.length / itemsPerPage)

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }

  if (!scores || scores.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
        <p className="text-gray-600 dark:text-gray-400">No recent scores available</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      {/* Mobile Card View */}
      <div className="block sm:hidden">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {paginatedScores.map((score) => (
            <div key={score.score_id} className="p-4 space-y-2">
              <div className="flex justify-between items-start">
                <span className="font-semibold text-gray-900 dark:text-white text-sm">
                  {formatPaperName(score.paper)}
                </span>
                <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                  {formatScore(score.score)}
                </span>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <p>Correct: {score.correct_count}/{score.total_questions}</p>
                <p>Time: {Math.floor(score.time_taken / 60)}m {score.time_taken % 60}s</p>
                <p>{formatDateTime(score.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                Paper
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                Score
              </th>
              <th className="hidden md:table-cell px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                Correct Answers
              </th>
              <th className="hidden lg:table-cell px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                Time Taken
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                Date & Time
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedScores.map((score) => (
              <tr key={score.score_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-gray-900 dark:text-white">
                  {formatPaperName(score.paper)}
                </td>
                <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                  {formatScore(score.score)}
                </td>
                <td className="hidden md:table-cell px-4 sm:px-6 py-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {score.correct_count}/{score.total_questions}
                </td>
                <td className="hidden lg:table-cell px-4 sm:px-6 py-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {Math.floor(score.time_taken / 60)}m {score.time_taken % 60}s
                </td>
                <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {formatDateTime(score.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="bg-gray-50 dark:bg-gray-700 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, scores.length)} of {scores.length}
          </div>
          <div className="flex gap-1 sm:gap-2 flex-wrap justify-center">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="px-2 sm:px-4 py-1 sm:py-2 border border-gray-300 dark:border-gray-600 rounded text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Prev
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const page = i + 1
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-2 sm:px-3 py-1 sm:py-2 rounded text-xs sm:text-sm font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-primary-600 text-white'
                        : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    {page}
                  </button>
                )
              })}
              {totalPages > 5 && <span className="text-gray-600 dark:text-gray-400 text-xs">...</span>}
            </div>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="px-2 sm:px-4 py-1 sm:py-2 border border-gray-300 dark:border-gray-600 rounded text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
