import React, { useState, useEffect } from 'react'
import { Route, Routes, Link, useNavigate } from 'react-router-dom'
import Register from './Register'
import Login from './Login'  // Import the new Login component
import ConfirmEmail from './ConfirmEmail'

// A utility function to refresh the access token
const refreshAccessToken = async (refreshToken: string | null) => {
  if (!refreshToken) return null

  try {
    const response = await fetch('http://localhost:8000/token/refresh/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    })

    if (response.ok) {
      const data = await response.json()
      return data.access
    } else {
      return null
    }
  } catch (err) {
    console.error('Error refreshing access token:', err)
    return null
  }
}

const App = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState<string | null>(null)
  const navigate = useNavigate()

  // Try to refresh the access token when the app loads
  useEffect(() => {
    const storedAccessToken = localStorage.getItem('access_token')
    const storedRefreshToken = localStorage.getItem('refresh_token')

    if (storedAccessToken && storedRefreshToken) {
      setAccessToken(storedAccessToken)
      setRefreshToken(storedRefreshToken)

      // Attempt to refresh the access token using the refresh token
      refreshAccessToken(storedRefreshToken).then((newAccessToken) => {
        if (newAccessToken) {
          setAccessToken(newAccessToken)
          localStorage.setItem('access_token', newAccessToken)  // Update the token in localStorage
        } else {
          // If the refresh token is invalid, redirect to login
          navigate('/login')
        }
      })
    }
  }, [navigate])

  // Set up an interval to refresh the access token every 5 minutes (300,000 ms)
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (refreshToken) {
        refreshAccessToken(refreshToken).then((newAccessToken) => {
          if (newAccessToken) {
            setAccessToken(newAccessToken)
            localStorage.setItem('access_token', newAccessToken)  // Update the token in localStorage
          } else {
            navigate('/login')  // Redirect to login if the refresh token is no longer valid
          }
        })
      }
    }, 300000) // 300,000 ms = 5 minutes

    // Cleanup the interval when the component is unmounted or when refreshToken changes
    return () => clearInterval(intervalId)
  }, [refreshToken, navigate])

  return (
    <div>
      <nav>
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/register">Register</Link></li>
          <li><Link to="/login">Login</Link></li>  {/* Add login link */}
        </ul>
      </nav>

      <Routes>
        <Route path="/" element={<h1>Home Page</h1>} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login setAccessToken={setAccessToken} setRefreshToken={setRefreshToken} />} />  {/* Pass setter functions */}
        <Route path="/confirm-email/:token" element={<ConfirmEmail />} />
      </Routes>
    </div>
  )
}

export default App
