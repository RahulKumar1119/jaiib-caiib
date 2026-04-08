import React from 'react'

interface AnalyticsMetricsProps {
  totalLogins: number
}

export function AnalyticsMetrics({ totalLogins }: AnalyticsMetricsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">User Engagement</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg p-6">
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Logins (Last 30 Days)</p>
          <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mt-2">{totalLogins}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-lg p-6">
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Active Users</p>
          <p className="text-4xl font-bold text-green-600 dark:text-green-400 mt-2">
            {totalLogins > 0 ? Math.ceil(totalLogins / 5) : 0}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Estimated based on login frequency</p>
        </div>
      </div>
    </div>
  )
}
