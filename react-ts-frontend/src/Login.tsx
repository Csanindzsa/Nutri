import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface LoginProps {
  setAccessToken: React.Dispatch<React.SetStateAction<string | null>>
  setRefreshToken: React.Dispatch<React.SetStateAction<string | null>>
}

const Login: React.FC<LoginProps> = ({ setAccessToken, setRefreshToken }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    const payload = { email, password }

    try {
      const response = await fetch('http://localhost:8000/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const data = await response.json()
        const accessToken = data.access
        const refreshToken = data.refresh

        // Store tokens in state and localStorage
        setAccessToken(accessToken)
        setRefreshToken(refreshToken)

        localStorage.setItem('access_token', accessToken)
        localStorage.setItem('refresh_token', refreshToken)

        alert('Login successful!')
        navigate('/')  // Redirect to home after successful login
      } else {
        const data = await response.json()
        setError(data.detail || 'Invalid email or password.')
      }
    } catch (err) {
      setError('An error occurred while connecting to the server.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  )
}

export default Login
