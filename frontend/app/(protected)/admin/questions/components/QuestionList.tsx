'use client'

import React, { useState, useMemo } from 'react'
import { AdminQuestion } from '../page'
import { formatPaperName } from '@/lib/utils/formatting'

interface QuestionListProps {
  questions: AdminQuestion[]
  onEdit: (question: AdminQuestion) => void
  onDelete: (id: string) => void
  deleteConfirmId: string | null
  onConfirmDelete: (id: string) => void
  onCancelDelete: () => void
  itemsPerPage?: number
}

export function QuestionList({
  questions,
  onEdit,
  onDelete,
  deleteConfirmId,
  onConfirmDelete,
  onCancelDelete,
  itemsPerPage = 10,
}: QuestionListProps) {
  const [currentPage, setCurrentPage] = useState(1)

  const paginatedQuestions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return questions.slice(startIndex, endIndex)
  }, [questions, currentPage, itemsPerPage])

  const totalPages = Math.ceil(questions.length / itemsPerPage)

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success-100 dark:bg-success-900 text-success-800 dark:text-success-200'
      case 'inactive':
        return 'bg-warning-100 dark:bg-warning-900 text-warning-800 dark:text-warning-200'
      case 'archived':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
    }
  }

  const getDifficultyBadgeColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
      case 'medium':
        return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200'
      case 'hard':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
    }
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
        <p className="text-gray-600 dark:text-gray-400">No questions found</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      {/* Mobile Card View */}
      <div className="block sm:hidden">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {paginatedQuestions.map((question) => (
            <div key={question.question_id} className="p-3 space-y-2">
              <p className="text-xs sm:text-sm text-gray-900 dark:text-white font-medium line-clamp-2">
                {question.question_text}
              </p>
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  {formatPaperName(question.paper)}
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${getDifficultyBadgeColor(
                    question.difficulty_level
                  )}`}
                >
                  {question.difficulty_level.charAt(0).toUpperCase() + question.difficulty_level.slice(1)}
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusBadgeColor(
                    question.status
                  )}`}
                >
                  {question.status.charAt(0).toUpperCase() + question.status.slice(1)}
                </span>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => onEdit(question)}
                  className="flex-1 px-2 py-1 text-xs bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-200 rounded hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors min-h-[36px] flex items-center justify-center"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(question.question_id)}
                  className="flex-1 px-2 py-1 text-xs bg-danger-100 dark:bg-danger-900 text-danger-700 dark:text-danger-200 rounded hover:bg-danger-200 dark:hover:bg-danger-800 transition-colors min-h-[36px] flex items-center justify-center"
                >
                  Delete
                </button>
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
                Question
              </th>
              <th className="hidden md:table-cell px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                Paper
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                Difficulty
              </th>
              <th className="hidden lg:table-cell px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                Status
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedQuestions.map((question) => (
              <tr key={question.question_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 dark:text-white max-w-xs truncate">
                  {question.question_text}
                </td>
                <td className="hidden md:table-cell px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {formatPaperName(question.paper)}
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                  <span
                    className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${getDifficultyBadgeColor(
                      question.difficulty_level
                    )}`}
                  >
                    {question.difficulty_level.charAt(0).toUpperCase() + question.difficulty_level.slice(1)}
                  </span>
                </td>
                <td className="hidden lg:table-cell px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                  <span
                    className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                      question.status
                    )}`}
                  >
                    {question.status.charAt(0).toUpperCase() + question.status.slice(1)}
                  </span>
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm space-x-1 sm:space-x-2">
                  <button
                    onClick={() => onEdit(question)}
                    className="inline-block px-2 sm:px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-200 rounded hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors text-xs min-h-[32px] flex items-center"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(question.question_id)}
                    className="inline-block px-2 sm:px-3 py-1 bg-danger-100 dark:bg-danger-900 text-danger-700 dark:text-danger-200 rounded hover:bg-danger-200 dark:hover:bg-danger-800 transition-colors text-xs min-h-[32px] flex items-center"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 max-w-sm w-full">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
              Delete Question?
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
              Are you sure you want to delete this question? This action cannot be undone.
            </p>
            <div className="flex gap-3 sm:gap-4 justify-end">
              <button
                onClick={onCancelDelete}
                className="px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors min-h-[40px] flex items-center justify-center"
              >
                Cancel
              </button>
              <button
                onClick={() => onConfirmDelete(deleteConfirmId)}
                className="px-3 sm:px-4 py-2 bg-danger-600 text-white rounded-lg text-xs sm:text-sm hover:bg-danger-700 transition-colors min-h-[40px] flex items-center justify-center"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="bg-gray-50 dark:bg-gray-700 px-3 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, questions.length)} of {questions.length}
          </div>
          <div className="flex gap-1 sm:gap-2 flex-wrap justify-center">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="px-2 sm:px-4 py-1 sm:py-2 border border-gray-300 dark:border-gray-600 rounded text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[36px] flex items-center justify-center"
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
                    className={`px-2 sm:px-3 py-1 sm:py-2 rounded text-xs sm:text-sm font-medium transition-colors min-h-[36px] flex items-center justify-center ${
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
              className="px-2 sm:px-4 py-1 sm:py-2 border border-gray-300 dark:border-gray-600 rounded text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[36px] flex items-center justify-center"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
