'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api-client'
import { JaiibPaper, DifficultyLevel } from '@/lib/types/practice'
import { JAIIB_PAPERS, DIFFICULTY_LEVELS } from '@/lib/utils/constants'
import { QuestionList } from './components/QuestionList'
import { QuestionModal } from './components/QuestionModal'
import { useNotification } from '@/lib/hooks/useNotification'

export interface AdminQuestion {
  question_id: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: 'A' | 'B' | 'C' | 'D'
  paper: JaiibPaper
  difficulty_level: DifficultyLevel
  status: 'active' | 'inactive' | 'archived'
  version: number
  created_at: number
  updated_at: number
  syllabus_topic?: string
}

export default function QuestionManagementPage() {
  const [questions, setQuestions] = useState<AdminQuestion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')
  const [filterPaper, setFilterPaper] = useState<JaiibPaper | ''>('')
  const [filterDifficulty, setFilterDifficulty] = useState<DifficultyLevel | ''>('')
  const [filterStatus, setFilterStatus] = useState<'active' | 'inactive' | 'archived' | ''>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<AdminQuestion | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const { addNotification } = useNotification()

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await apiClient.get<{ questions: AdminQuestion[] }>('/admin/questions')
      setQuestions(response.questions || [])
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load questions'
      setError(errorMessage)
      addNotification(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch = q.question_text.toLowerCase().includes(searchText.toLowerCase())
    const matchesPaper = !filterPaper || q.paper === filterPaper
    const matchesDifficulty = !filterDifficulty || q.difficulty_level === filterDifficulty
    const matchesStatus = !filterStatus || q.status === filterStatus
    return matchesSearch && matchesPaper && matchesDifficulty && matchesStatus
  })

  const handleAddQuestion = () => {
    setEditingQuestion(null)
    setIsModalOpen(true)
  }

  const handleEditQuestion = (question: AdminQuestion) => {
    setEditingQuestion(question)
    setIsModalOpen(true)
  }

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      await apiClient.delete(`/admin/questions/${questionId}`)
      setQuestions(questions.filter((q) => q.question_id !== questionId))
      setDeleteConfirmId(null)
      addNotification('Question deleted successfully', 'success')
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete question'
      addNotification(errorMessage, 'error')
    }
  }

  const handleSaveQuestion = async (questionData: Omit<AdminQuestion, 'question_id' | 'version' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingQuestion) {
        // Update existing question
        const response = await apiClient.put<{ question: AdminQuestion }>(
          `/admin/questions/${editingQuestion.question_id}`,
          questionData
        )
        setQuestions(
          questions.map((q) => (q.question_id === editingQuestion.question_id ? response.question : q))
        )
        addNotification('Question updated successfully', 'success')
      } else {
        // Create new question
        const response = await apiClient.post<{ question: AdminQuestion }>(
          '/admin/questions',
          questionData
        )
        setQuestions([...questions, response.question])
        addNotification('New practice questions available!', 'success')
      }
      setIsModalOpen(false)
      setEditingQuestion(null)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to save question'
      addNotification(errorMessage, 'error')
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="space-y-1 sm:space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Question Management</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Manage JAIIB exam questions</p>
      </div>

      {/* Add Question Button */}
      <div className="flex justify-end">
        <button
          onClick={handleAddQuestion}
          className="px-4 sm:px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-auto flex items-center justify-center"
        >
          + Add Question
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-6 space-y-3 sm:space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Search */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
              Search Question
            </label>
            <input
              type="text"
              placeholder="Search..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs sm:text-sm min-h-[44px] sm:min-h-auto"
            />
          </div>

          {/* Paper Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
              Paper
            </label>
            <select
              value={filterPaper}
              onChange={(e) => setFilterPaper(e.target.value as JaiibPaper | '')}
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs sm:text-sm min-h-[44px] sm:min-h-auto"
            >
              <option value="">All Papers</option>
              {JAIIB_PAPERS.map((paper) => (
                <option key={paper.id} value={paper.id}>
                  {paper.shortName}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
              Difficulty
            </label>
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value as DifficultyLevel | '')}
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs sm:text-sm min-h-[44px] sm:min-h-auto"
            >
              <option value="">All Levels</option>
              {DIFFICULTY_LEVELS.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'active' | 'inactive' | 'archived' | '')}
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs sm:text-sm min-h-[44px] sm:min-h-auto"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchText('')
                setFilterPaper('')
                setFilterDifficulty('')
                setFilterStatus('')
              }}
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-xs sm:text-sm min-h-[44px] sm:min-h-auto"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Question List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Loading questions...</p>
        </div>
      ) : error ? (
        <div className="bg-danger-50 dark:bg-danger-900 border border-danger-200 dark:border-danger-700 rounded p-4 text-danger-700 dark:text-danger-200 text-sm">
          {error}
        </div>
      ) : (
        <QuestionList
          questions={filteredQuestions}
          onEdit={handleEditQuestion}
          onDelete={(id) => setDeleteConfirmId(id)}
          deleteConfirmId={deleteConfirmId}
          onConfirmDelete={handleDeleteQuestion}
          onCancelDelete={() => setDeleteConfirmId(null)}
        />
      )}

      {/* Question Modal */}
      {isModalOpen && (
        <QuestionModal
          question={editingQuestion}
          onClose={() => {
            setIsModalOpen(false)
            setEditingQuestion(null)
          }}
          onSave={handleSaveQuestion}
        />
      )}
    </div>
  )
}
