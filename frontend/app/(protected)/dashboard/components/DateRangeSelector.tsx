'use client'

import React, { useState } from 'react'

export interface DateRange {
  startDate: Date
  endDate: Date
}

interface DateRangeSelectorProps {
  onDateRangeChange: (range: DateRange) => void
}

export function DateRangeSelector({
  onDateRangeChange,
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
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
      <label htmlFor="date-range" className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
        Date Range:
      </label>
      <select
        id="date-range"
        value={selectedRange}
        onChange={(e) => handleRangeChange(e.target.value)}
        className="w-full sm:w-auto px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[44px] sm:min-h-auto"
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
