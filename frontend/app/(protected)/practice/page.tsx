'use client'

import Link from 'next/link'
import { JAIIB_PAPERS } from '@/lib/utils/constants'

export default function PracticePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Practice Sets</h1>
        <p className="text-gray-600 dark:text-gray-400">Select a paper to start practicing</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {JAIIB_PAPERS.map((paper) => (
          <Link
            key={paper.id}
            href={`/practice/${paper.id}`}
            className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-6"
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{paper.name}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{paper.description}</p>
            <button className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded">
              Start Practice
            </button>
          </Link>
        ))}
      </div>
    </div>
  )
}
