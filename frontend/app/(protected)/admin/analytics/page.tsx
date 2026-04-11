'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api-client'
import { formatScore } from '@/lib/utils/formatting'
import { JAIIB_PAPERS } from '@/lib/utils/constants'
import { AnalyticsMetrics } from './components/AnalyticsMetrics'
import { CompletionTrends } from './components/CompletionTrends'
import { MissedQuestions } from './components/MissedQuestions'
import { AnalyticsExport } from './components/AnalyticsExport'
import { DateRangeSelector, DateRange } from '@/app/(protected)/dashboard/components/DateRangeSelector'

export interface AnalyticsData {
  total_logins_30d: number
  average_scores_per_paper: Record<string, number>
  completion_trends: Array<{
    date: string
    total_completions: number
    paper_breakdown: Record<string, number>
  }>
  most_missed_questions: Array<{
    question_id: string
    question_text: string
    paper: string
    average_score: number
    times_attempted: number
  }>
}

export default function AdminAnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRange | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const fetchAnalytics = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (dateRange) {
        params.append('startDate', dateRange.startDate.toISOString())
        params.append('endDate', dateRange.endDate.toISOString())
      }
      const response = await apiClient.get<AnalyticsData>(
        `/admin/analytics?${params.toString()}`
      )
      setAnalyticsData(response)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load analytics'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const params = new URLSearchParams()
      if (dateRange) {
        params.append('startDate', dateRange.startDate.toISOString())
        params.append('endDate', dateRange.endDate.toISOString())
      }
      const response = await apiClient.get(
        `/admin/analytics/export?${params.toString()}`,
        { responseType: 'blob' }
      )
      
      // Create a blob URL and trigger download
      const blob = (response as any).data as Blob
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `analytics-${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      link.parentNode?.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to export analytics'
      setError(errorMessage)
    } finally {
      setIsExporting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-danger-50 dark:bg-danger-900 border border-danger-200 dark:border-danger-700 rounded p-4 text-danger-700 dark:text-danger-200">
        {error}
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">No analytics data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-8 px-4 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-0">
        <div className="space-y-1 sm:space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-xs sm:text-base text-gray-600 dark:text-gray-400">View platform-wide engagement and performance metrics</p>
        </div>
        <AnalyticsExport onExport={handleExport} isExporting={isExporting} />
      </div>

      {/* Date Range Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Filter by Date Range</h2>
        <DateRangeSelector onDateRangeChange={setDateRange} />
      </div>

      {/* User Engagement Metrics */}
      <AnalyticsMetrics totalLogins={analyticsData.total_logins_30d} />

      {/* Average Scores Per Paper */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">Average Scores Per Paper</h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          {JAIIB_PAPERS.map((paper) => {
            const avgScore = analyticsData.average_scores_per_paper[paper.id] || 0
            return (
              <div
                key={paper.id}
                className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900 dark:to-primary-800 rounded-lg p-3 sm:p-6 min-h-[120px] sm:min-h-[140px] flex flex-col justify-center"
              >
                <h3 className="font-semibold text-xs sm:text-base text-gray-900 dark:text-white mb-1 sm:mb-2">{paper.shortName}</h3>
                <p className="text-2xl sm:text-3xl font-bold text-primary-600 dark:text-primary-400">
                  {formatScore(avgScore)}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">Average Score</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Practice Set Completion Trends */}
      <CompletionTrends data={analyticsData.completion_trends} />

      {/* Most Frequently Missed Questions */}
      <MissedQuestions questions={analyticsData.most_missed_questions} />
    </div>
  )
}
