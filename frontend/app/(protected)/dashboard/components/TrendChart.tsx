'use client'

import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { TrendDataPoint } from '@/lib/types/score'

interface TrendChartProps {
  data: TrendDataPoint[]
  isLoading?: boolean
}

export function TrendChart({ data, isLoading = false }: TrendChartProps) {
  if (isLoading) {
    return (
      <div className="w-full h-80 flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading chart...</p>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-80 flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg shadow">
        <p className="text-gray-600 dark:text-gray-400">No trend data available</p>
      </div>
    )
  }

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
        Score Trends (Last 30 Days)
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            stroke="#6b7280"
            style={{ fontSize: '11px' }}
            tick={{ fill: '#6b7280' }}
            interval={Math.floor(data.length / 5)}
          />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: '11px' }}
            tick={{ fill: '#6b7280' }}
            domain={[0, 100]}
            width={30}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '12px',
              padding: '8px',
            }}
            formatter={(value: any) => [`${Math.round(value)}%`, 'Average Score']}
            labelStyle={{ color: '#fff' }}
          />
          <Legend wrapperStyle={{ color: '#6b7280', fontSize: '12px' }} />
          <Line
            type="monotone"
            dataKey="average_score"
            stroke="#2563eb"
            strokeWidth={2}
            dot={{ fill: '#2563eb', r: 3 }}
            activeDot={{ r: 5 }}
            name="Average Score"
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
