import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiClient, DashboardMetricsResponse } from '../services/api'
import LoadingSkeleton from '../components/LoadingSkeleton'
import '../styles/Dashboard.css'

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetricsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPaper, setSelectedPaper] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const PAPERS = [
    { id: 'JAIIB_IE_IFS', name: 'IE & IFS' },
    { id: 'JAIIB_PPB', name: 'PPB' },
    { id: 'JAIIB_AFB', name: 'AFB' },
    { id: 'JAIIB_RBWM', name: 'RBWM' },
  ]

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await apiClient.getDashboardMetrics()
        setMetrics(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMetrics()
  }, [retryCount])

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
  }

  const getPaperStats = (paperId: string) => {
    return metrics?.paper_stats[paperId] || null
  }

  const getPerformanceColor = (score: number): string => {
    if (score >= 75) return 'excellent'
    if (score >= 50) return 'good'
    if (score >= 25) return 'fair'
    return 'poor'
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Dashboard</h1>
          <p className="subtitle">Your JAIIB-CAIIB Exam Preparation</p>
        </div>
        <div className="header-right">
          <span className="user-info">
            <span className="user-icon">👤</span>
            <span className="user-name">{user?.full_name}</span>
          </span>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-content">
        {/* Error State */}
        {error && (
          <div className="error-banner">
            <div className="error-content">
              <span className="error-icon">⚠️</span>
              <div className="error-text">
                <p className="error-message">{error}</p>
                <button onClick={handleRetry} className="btn-retry">
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <LoadingSkeleton type="dashboard" />
        ) : metrics ? (
          <>
            {/* Welcome Section */}
            <div className="welcome-section">
              <h2>Welcome back, {user?.full_name}! 👋</h2>
              <p>
                You've completed {metrics.total_practice_sets} practice sets with an average score
                of {metrics.average_score.toFixed(1)}%
              </p>
            </div>

            {/* Overall Stats */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📚</div>
                <div className="stat-content">
                  <span className="stat-label">Total Practice Sets</span>
                  <span className="stat-value">{metrics.total_practice_sets}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <span className="stat-label">Average Score</span>
                  <span className="stat-value">{metrics.average_score.toFixed(1)}%</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🎯</div>
                <div className="stat-content">
                  <span className="stat-label">Best Score</span>
                  <span className="stat-value">
                    {Math.max(...Object.values(metrics.paper_stats).map((p) => p.highest_score), 0)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Paper-wise Performance */}
            <section className="papers-section">
              <h2>Paper-wise Performance</h2>
              <div className="papers-grid">
                {PAPERS.map((paper) => {
                  const stats = getPaperStats(paper.id)
                  return (
                    <div
                      key={paper.id}
                      className={`paper-card ${stats ? getPerformanceColor(stats.average_score) : ''}`}
                    >
                      <div className="paper-header">
                        <h3>{paper.name}</h3>
                        {stats && (
                          <span className="paper-score">{stats.average_score.toFixed(1)}%</span>
                        )}
                      </div>
                      {stats ? (
                        <div className="paper-stats">
                          <div className="paper-stat">
                            <span className="label">Practice Sets</span>
                            <span className="value">{stats.practice_count}</span>
                          </div>
                          <div className="paper-stat">
                            <span className="label">Highest Score</span>
                            <span className="value">{stats.highest_score}%</span>
                          </div>
                          <button
                            onClick={() => navigate('/practice')}
                            className="btn-practice"
                          >
                            Practice Now
                          </button>
                        </div>
                      ) : (
                        <div className="paper-empty">
                          <p>No practice sets yet</p>
                          <button
                            onClick={() => navigate('/practice')}
                            className="btn-start"
                          >
                            Start Practicing
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Recent Results */}
            {metrics.recent_scores.length > 0 && (
              <section className="recent-section">
                <h2>Recent Results</h2>
                <div className="recent-list">
                  {metrics.recent_scores.slice(0, 5).map((score) => (
                    <div key={score.score_id} className="recent-item">
                      <div className="recent-left">
                        <span className="recent-paper">{score.paper}</span>
                        <span className="recent-time">
                          {new Date(score.created_at * 1000).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="recent-right">
                        <span className={`recent-score ${getPerformanceColor(score.score)}`}>
                          {score.score}%
                        </span>
                        <span className="recent-time">{Math.floor(score.time_taken / 60)}m</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Quick Actions */}
            <section className="actions-section">
              <h2>Quick Actions</h2>
              <div className="actions-grid">
                <button onClick={() => navigate('/practice')} className="action-card primary">
                  <div className="action-icon">📝</div>
                  <h3>Start Practice</h3>
                  <p>Begin a new practice session</p>
                </button>
                <button onClick={() => setSelectedPaper('all')} className="action-card">
                  <div className="action-icon">📈</div>
                  <h3>View Analytics</h3>
                  <p>Detailed performance analysis</p>
                </button>
                <button onClick={() => navigate('/')} className="action-card">
                  <div className="action-icon">📚</div>
                  <h3>Study Materials</h3>
                  <p>Access learning resources</p>
                </button>
              </div>
            </section>
          </>
        ) : null}
      </main>
    </div>
  )
}
