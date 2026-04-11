import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/Dashboard.css'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    // Fetch user data
    fetch('/api/user/profile', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setUser(data))
      .catch(() => navigate('/login'))
      .finally(() => setIsLoading(false))
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  if (isLoading) {
    return <div className="loading">Loading your dashboard</div>
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="dashboard-header-actions">
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>
      <main className="dashboard-content">
        <div className="dashboard-welcome">
          <h2>Welcome back, {user?.name || 'User'}! 👋</h2>
          <p>Your JAIIB-CAIIB exam preparation portal. Start practicing and ace your exams.</p>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="dashboard-card-icon">📚</div>
            <h3>Practice Tests</h3>
            <p>Take full-length practice exams and track your progress with detailed analytics.</p>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-card-icon">📊</div>
            <h3>Performance Analytics</h3>
            <p>View your performance metrics, weak areas, and improvement suggestions.</p>
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
