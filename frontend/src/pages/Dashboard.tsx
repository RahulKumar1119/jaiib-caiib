import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiClient, DashboardMetricsResponse } from '../services/api'
import '../styles/Dashboard.css'

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetricsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setIsLoading(true)
        const data = await apiClient.getDashboardMetrics()
        setMetrics(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMetrics()
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  if (isLoading) {
    return <div className="loading">Loading your dashboard</div>
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="dashboard-header-actions">
          <span className="user-name">{user?.full_name}</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>
      <main className="dashboard-content">
        <div className="dashboard-welcome">
          <h2>Welcome back, {user?.full_name || 'User'}! 👋</h2>
          <p>Your JAIIB-CAIIB exam preparation portal. Start practicing and ace your exams.</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {metrics && (
          <div className="dashboard-stats">
            <div className="stat-card">
              <h3>Total Practice Sets</h3>
              <p className="stat-value">{metrics.total_practice_sets}</p>
            </div>
            <div className="stat-card">
              <h3>Average Score</h3>
              <p className="stat-value">{metrics.average_score.toFixed(1)}%</p>
            </div>
          </div>
        )}

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="dashboard-card-icon">📚</div>
            <h3>Practice Tests</h3>
            <p>Take full-length practice exams and track your progress with detailed analytics.</p>
            <button onClick={() => navigate('/practice')}>Start Practice</button>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-card-icon">📊</div>
            <h3>Performance Analytics</h3>
            <p>View your performance metrics, weak areas, and improvement suggestions.</p>
            <button onClick={() => navigate('/analytics')}>View Analytics</button>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-card-icon">🎯</div>
            <h3>Study Materials</h3>
            <p>Access comprehensive study materials and resources for JAIIB and CAIIB exams.</p>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-card-icon">⏱️</div>
            <h3>Time Management</h3>
            <p>Practice with timed tests to improve your speed and accuracy during exams.</p>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-card-icon">🏆</div>
            <h3>Leaderboard</h3>
            <p>Compete with other candidates and see where you stand in the rankings.</p>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-card-icon">💡</div>
            <h3>AI Tutor</h3>
            <p>Get personalized guidance and explanations for difficult concepts from our AI tutor.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
