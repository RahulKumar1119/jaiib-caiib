import React from 'react'

interface AnalyticsExportProps {
  onExport: () => Promise<void>
  isExporting: boolean
}

export function AnalyticsExport({ onExport, isExporting }: AnalyticsExportProps) {
  return (
    <button
      onClick={onExport}
      disabled={isExporting}
      className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {isExporting ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          Exporting...
        </>
      ) : (
        <>
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2m0 0v-8m0 8l-6-4m6 4l6-4"
            />
          </svg>
          Export CSV
        </>
      )}
    </button>
  )
}
