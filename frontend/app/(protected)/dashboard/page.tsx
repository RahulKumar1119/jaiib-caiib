'use client'

import { useEffect } from 'react'
import { useDashboard } from '@/lib/hooks/useDashboard'
import { formatScore, formatPaperName } from '@/lib/utils/formatting'
import { JAIIB_PAPERS } from '@/lib/utils/constants'

export default function DashboardPage() {
  const { metrics, selectedPaper, isLoading, error, fetchMetrics, selectPaper } = useDashboard()

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
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

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">No data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Track your progress across all JAIIB papers</p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Total Practice Sets</p>
          <p className="text-4xl font-bold text-primary-600 dark:text-primary-400">
            {metrics.total_practice_sets}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Average Score</p>
          <p className="text-4xl font-bold text-primary-600 dark:text-primary-400">
            {formatScore(metrics.average_score)}
          </p>
        </div>
      </div>

      {/* Paper Stats */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Paper Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {JAIIB_PAPERS.map((paper) => {
            const stats = metrics.paper_stats[paper.id as any]
            if (!stats) return null

            return (
              <div
                key={paper.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => selectPaper(selectedPaper === paper.id ? null : paper.id as any)}
              >
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{paper.shortName}</h3>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600 dark:text-gray-400">
                    Avg: <span className="font-semibold">{formatScore(stats.average_score)}</span>
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Best: <span className="font-semibold">{formatScore(stats.highest_score)}</span>
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Sets: <span className="font-semibold">{stats.practice_count}</span>
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent Scores */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Recent Practice Sets</h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Paper
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {metrics.recent_scores.map((score) => (
                <tr key={score.score_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {formatPaperName(score.paper)}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                    {formatScore(score.score)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {new Date(score.created_at * 1000).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
