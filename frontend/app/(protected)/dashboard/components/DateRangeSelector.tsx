'use client'

import React, { useState } from 'react'

export interface DateRange {
  startDate: Date
  endDate: Date
}

interface DateRangeSelectorProps {
  onDateRangeChange: (range: DateRange) => void
  defaultDays?: number
}

export function DateRangeSelector({
  onDateRangeChange,
  defaultDays = 30,
}: DateRangeSelectorProps) {
  const [selectedRange, setSelectedRange] = useState<string>('30')

  const handleRangeChange = (days: string) => {
    setSelectedRange(days)

    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(days))

    onDateRangeChange({
      startDate,
      endDate,
    })
  }

  const rangeOptions = [
    { label: 'Last 7 Days', value: '7' },
    { label: 'Last 14 Days', value: '14' },
    { label: 'Last 30 Days', value: '30' },
    { label: 'Last 90 Days', value: '90' },
  ]

  return (
    <div className="flex items-center gap-4 mb-6">
      <label htmlFor="date-range" className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Date Range:
      </label>
      <select
        id="date-range"
        value={selectedRange}
        onChange={(e) => handleRangeChange(e.target.value)}
        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        {rangeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
