'use client'

import React, { useState, useEffect } from 'react'
import { AdminQuestion } from '../page'
import { JaiibPaper, DifficultyLevel } from '@/lib/types/practice'
import { JAIIB_PAPERS, DIFFICULTY_LEVELS } from '@/lib/utils/constants'

interface QuestionModalProps {
  question: AdminQuestion | null
  onClose: () => void
  onSave: (question: Omit<AdminQuestion, 'question_id' | 'version' | 'created_at' | 'updated_at'>) => Promise<void>
}

export function QuestionModal({ question, onClose, onSave }: QuestionModalProps) {
  const [formData, setFormData] = useState({
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A' as 'A' | 'B' | 'C' | 'D',
    paper: 'JAIIB_IE_IFS' as JaiibPaper,
    difficulty_level: 'medium' as DifficultyLevel,
    status: 'active' as 'active' | 'inactive' | 'archived',
    syllabus_topic: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (question) {
      setFormData({
        question_text: question.question_text,
        option_a: question.option_a,
        option_b: question.option_b,
        option_c: question.option_c,
        option_d: question.option_d,
        correct_answer: question.correct_answer,
        paper: question.paper,
        difficulty_level: question.difficulty_level,
        status: question.status,
        syllabus_topic: question.syllabus_topic || '',
      })
    }
  }, [question])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.question_text.trim()) {
      newErrors.question_text = 'Question text is required'
    } else if (formData.question_text.trim().length < 10) {
      newErrors.question_text = 'Question text must be at least 10 characters'
    }

    if (!formData.option_a.trim()) {
      newErrors.option_a = 'Option A is required'
    }
    if (!formData.option_b.trim()) {
      newErrors.option_b = 'Option B is required'
    }
    if (!formData.option_c.trim()) {
      newErrors.option_c = 'Option C is required'
    }
    if (!formData.option_d.trim()) {
      newErrors.option_d = 'Option D is required'
    }

    // Check for unique options
    const options = [formData.option_a, formData.option_b, formData.option_c, formData.option_d]
    if (new Set(options).size !== options.length) {
      newErrors.options = 'All options must be unique'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSave(formData)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {question ? 'Edit Question' : 'Add New Question'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Question Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Question Text *
            </label>
            <textarea
              name="question_text"
              value={formData.question_text}
              onChange={handleChange}
              placeholder="Enter the question text..."
              rows={3}
              className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.question_text ? 'border-danger-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.question_text && (
              <p className="text-danger-600 dark:text-danger-400 text-sm mt-1">{errors.question_text}</p>
            )}
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['option_a', 'option_b', 'option_c', 'option_d'].map((option, index) => (
              <div key={option}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Option {String.fromCharCode(65 + index)} *
                </label>
                <input
                  type="text"
                  name={option}
                  value={formData[option as keyof typeof formData]}
                  onChange={handleChange}
                  placeholder={`Enter option ${String.fromCharCode(65 + index)}...`}
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors[option] ? 'border-danger-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors[option] && (
                  <p className="text-danger-600 dark:text-danger-400 text-sm mt-1">{errors[option]}</p>
                )}
              </div>
            ))}
          </div>

          {errors.options && (
            <p className="text-danger-600 dark:text-danger-400 text-sm">{errors.options}</p>
          )}

          {/* Correct Answer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Correct Answer *
            </label>
            <select
              name="correct_answer"
              value={formData.correct_answer}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="A">Option A</option>
              <option value="B">Option B</option>
              <option value="C">Option C</option>
              <option value="D">Option D</option>
            </select>
          </div>

          {/* Paper, Difficulty, Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Paper *
              </label>
              <select
                name="paper"
                value={formData.paper}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {JAIIB_PAPERS.map((paper) => (
                  <option key={paper.id} value={paper.id}>
                    {paper.shortName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Difficulty *
              </label>
              <select
                name="difficulty_level"
                value={formData.difficulty_level}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {DIFFICULTY_LEVELS.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Syllabus Topic */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Syllabus Topic
            </label>
            <input
              type="text"
              name="syllabus_topic"
              value={formData.syllabus_topic}
              onChange={handleChange}
              placeholder="Enter syllabus topic..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Saving...' : question ? 'Update Question' : 'Create Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
