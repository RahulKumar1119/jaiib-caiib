'use client'

import { useEffect, useState } from 'react'
import { useDashboard } from '@/lib/hooks/useDashboard'
import { useNotification } from '@/lib/hooks/useNotification'
import { formatScore, formatPaperName } from '@/lib/utils/formatting'
import { JAIIB_PAPERS } from '@/lib/utils/constants'
import { TrendChart } from './components/TrendChart'
import { DateRangeSelector, DateRange } from './components/DateRangeSelector'
import { RecentScoresTable } from './components/RecentScoresTable'

export default function DashboardPage() {
  const { metrics, selectedPaper, isLoading, error, fetchMetrics, selectPaper } = useDashboard()
  const { warning } = useNotification()
  const [dateRange, setDateRange] = useState<DateRange | null>(null)
  const [inactivityChecked, setInactivityChecked] = useState(false)

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  // Check for inactivity reminder (7 days without practice)
  useEffect(() => {
    if (metrics && !inactivityChecked) {
      const recentScores = metrics.recent_scores
      if (recentScores && recentScores.length > 0) {
        const lastPracticeTime = new Date(recentScores[0].created_at).getTime()
        const now = Date.now()
        const daysSinceLastPractice = (now - lastPracticeTime) / (1000 * 60 * 60 * 24)

        if (daysSinceLastPractice > 7) {
          warning("It's time to practice! Start a new practice session today.")
        }
      } else {
        // No practice sets at all
        warning("It's time to practice! Start a new practice session today.")
      }
      setInactivityChecked(true)
    }
  }, [metrics, inactivityChecked, warning])

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
    <main className="space-y-6 sm:space-y-8 px-4 sm:px-0">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Track your progress across all JAIIB papers</p>
      </header>

      {/* Overall Stats */}
      <section aria-labelledby="overall-stats-heading" className="space-y-3 sm:space-y-4">
        <h2 id="overall-stats-heading" className="sr-only">Overall Statistics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <article className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 min-h-[120px] sm:min-h-[140px] flex flex-col justify-center focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2 dark:focus-within:ring-offset-gray-900">
            <h3 className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">Total Practice Sets</h3>
            <p className="text-3xl sm:text-4xl font-bold text-primary-600 dark:text-primary-400" aria-label={`Total practice sets: ${metrics.total_practice_sets}`}>
              {metrics.total_practice_sets}
            </p>
          </article>
          <article className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 min-h-[120px] sm:min-h-[140px] flex flex-col justify-center focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2 dark:focus-within:ring-offset-gray-900">
            <h3 className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">Average Score</h3>
            <p className="text-3xl sm:text-4xl font-bold text-primary-600 dark:text-primary-400" aria-label={`Average score: ${formatScore(metrics.average_score)}`}>
              {formatScore(metrics.average_score)}
            </p>
          </article>
        </div>
      </section>

      {/* Paper Stats */}
      <section aria-labelledby="paper-performance-heading" className="space-y-3 sm:space-y-4">
        <h2 id="paper-performance-heading" className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Paper Performance</h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4" role="region" aria-label="Paper performance cards">
          {JAIIB_PAPERS.map((paper) => {
            const stats = metrics.paper_stats[paper.id as any]
            if (!stats) return null

            return (
              <button
                key={paper.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4 cursor-pointer hover:shadow-lg transition-shadow active:shadow-md min-h-[140px] sm:min-h-[160px] flex flex-col justify-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                onClick={() => selectPaper(selectedPaper === paper.id ? null : paper.id as any)}
                aria-pressed={selectedPaper === paper.id}
                aria-label={`${paper.shortName}: Average ${formatScore(stats.average_score)}, Best ${formatScore(stats.highest_score)}, ${stats.practice_count} sets completed`}
              >
                <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white mb-2">{paper.shortName}</h3>
                <div className="space-y-1 text-xs sm:text-sm">
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
              </button>
            )
          })}
        </div>
      </section>

      {/* Trends Section */}
      <section aria-labelledby="score-trends-heading" className="space-y-3 sm:space-y-4">
        <h2 id="score-trends-heading" className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Score Trends</h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4">
          <DateRangeSelector onDateRangeChange={setDateRange} defaultDays={30} />
        </div>
        <TrendChart data={metrics.trend_data} isLoading={isLoading} />
      </section>

      {/* Recent Scores */}
      <section aria-labelledby="recent-scores-heading" className="space-y-3 sm:space-y-4">
        <h2 id="recent-scores-heading" className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Recent Practice Sets</h2>
        <RecentScoresTable scores={metrics.recent_scores} itemsPerPage={10} />
      </section>
    </main>
  )
}
