import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { apiClient } from '../services/api'
import '../styles/Register.css'

export default function Register() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.full_name.trim()) {
      setError('Full name is required')
      return
    }

    if (!formData.email.trim()) {
      setError('Email is required')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (!/[A-Z]/.test(formData.password)) {
      setError('Password must contain at least one uppercase letter')
      return
    }

    if (!/[a-z]/.test(formData.password)) {
      setError('Password must contain at least one lowercase letter')
      return
    }

    if (!/[0-9]/.test(formData.password)) {
      setError('Password must contain at least one number')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)

    try {
      const response = await apiClient.register(
        formData.full_name,
        formData.email,
        formData.password,
        formData.confirmPassword
      )

      if (response.success) {
        // Redirect to login page after successful registration
        navigate('/login', { state: { message: 'Registration successful! Please log in.' } })
      } else {
        setError(response.error || 'Registration failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="register-container">
      <div className="register-box">
        <h1>Create Account</h1>
        <p>Join JAIIB-CAIIB Exam Prep Platform</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="full_name">Full Name</label>
            <input
              id="full_name"
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
            <small>At least 8 characters with uppercase, lowercase, and number</small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <div className="error">{error}</div>}

          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="register-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  )
}
