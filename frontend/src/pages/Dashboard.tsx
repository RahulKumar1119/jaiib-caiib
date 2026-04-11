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
    return <div className="dashboard-container">Loading...</div>
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <button onClick={handleLogout}>Logout</button>
      </header>
      <main className="dashboard-content">
        <h2>Welcome, {user?.name || 'User'}</h2>
        <p>Your JAIIB-CAIIB exam preparation portal</p>
      </main>
    </div>
  )
}
