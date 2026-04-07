import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-primary-700 dark:text-primary-300 mb-4">
            JAIIB-CAIIB Exam Prep Portal
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Master your banking certifications with interactive practice sets and AI-powered explanations
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-semibold mb-2">4 JAIIB Papers</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Practice for all four JAIIB papers: IE & IFS, PPB, AFB, and RBWM
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="text-4xl mb-4">⏱️</div>
            <h3 className="text-xl font-semibold mb-2">Timed Sessions</h3>
            <p className="text-gray-600 dark:text-gray-400">
              10-minute practice sets with real-time countdown timer
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold mb-2">AI Explanations</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Get detailed explanations with RBI and IIBF norm citations
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="px-8 py-3 bg-secondary-600 hover:bg-secondary-700 text-white font-semibold rounded-lg transition-colors"
          >
            Register
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">160+</div>
            <p className="text-gray-600 dark:text-gray-400">Questions</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">4</div>
            <p className="text-gray-600 dark:text-gray-400">Papers</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">100%</div>
            <p className="text-gray-600 dark:text-gray-400">Accurate</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">24/7</div>
            <p className="text-gray-600 dark:text-gray-400">Available</p>
          </div>
        </div>
      </div>
    </main>
  )
}
