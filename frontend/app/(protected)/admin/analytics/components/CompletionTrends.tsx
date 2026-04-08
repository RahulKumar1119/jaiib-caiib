import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { JAIIB_PAPERS } from '@/lib/utils/constants'

interface CompletionTrendsProps {
  data: Array<{
    date: string
    total_completions: number
    paper_breakdown: Record<string, number>
  }>
}

const PAPER_COLORS: Record<string, string> = {
  JAIIB_IE_IFS: '#3b82f6',
  JAIIB_PPB: '#10b981',
  JAIIB_AFB: '#f59e0b',
  JAIIB_RBWM: '#ef4444',
}

export function CompletionTrends({ data }: CompletionTrendsProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Practice Set Completion Trends</h2>
        <p className="text-gray-600 dark:text-gray-400">No trend data available</p>
      </div>
    )
  }

  // Transform data for chart
  const chartData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    total: item.total_completions,
    ...item.paper_breakdown,
  }))

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Practice Set Completion Trends</h2>
      <div className="w-full h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              name="Total Completions"
            />
            {JAIIB_PAPERS.map((paper) => (
              <Line
                key={paper.id}
                type="monotone"
                dataKey={paper.id}
                stroke={PAPER_COLORS[paper.id] || '#6b7280'}
                strokeWidth={1.5}
                dot={false}
                name={paper.shortName}
                opacity={0.7}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
