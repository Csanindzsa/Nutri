import React, { useState, useEffect } from 'react'
import { Route, Routes, Link, useNavigate } from 'react-router-dom'
import Register from './Register'
import Login from './Login'
import ConfirmEmail from './ConfirmEmail'
import MainPage from './MainPage'
import { Restaurant, Food, Ingredient, ExactLocation } from "./interfaces"

// Function to decode JWT token
const decodeToken = (token: string) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload
  } catch (err) {
    console.error('Error decoding token:', err)
    return null
  }
}

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
  const [userData, setUserData] = useState<{ user_id?: string; username?: string; email?: string }>({})
  const [restaurants, setRestaurants] = useState<Array<Restaurant>>([])
  const [exactLocations, setExactLocations] = useState<ExactLocation[]>([])
  const [ingredients, setIngredients] = useState<Array<Ingredient>>([])
  const [foods, setFoods] = useState<Array<Food>>([])
  const [selectedRestaurants, setSelectedRestaurants] = useState<number[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    const storedAccessToken = localStorage.getItem('access_token')
    const storedRefreshToken = localStorage.getItem('refresh_token')

    if (storedAccessToken && storedRefreshToken) {
      setAccessToken(storedAccessToken)
      setRefreshToken(storedRefreshToken)
      const decoded = decodeToken(storedAccessToken)
      if (decoded) {
        setUserData({ user_id: decoded.user_id, username: decoded.username, email: decoded.email })
      }
      refreshAccessToken(storedRefreshToken).then((newAccessToken) => {
        if (newAccessToken) {
          setAccessToken(newAccessToken)
          localStorage.setItem('access_token', newAccessToken)
          const newDecoded = decodeToken(newAccessToken)
          if (newDecoded) {
            setUserData({ user_id: newDecoded.user_id, username: newDecoded.username, email: newDecoded.email })
          }
        } else {
          navigate('/login')
        }
      })
    }
  }, [navigate])

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (refreshToken) {
        refreshAccessToken(refreshToken).then((newAccessToken) => {
          if (newAccessToken) {
            setAccessToken(newAccessToken)
            localStorage.setItem('access_token', newAccessToken)
            const newDecoded = decodeToken(newAccessToken)
            if (newDecoded) {
              setUserData({ user_id: newDecoded.user_id, username: newDecoded.username, email: newDecoded.email })
            }
          } else {
            navigate('/login')
          }
        })
      }
    }, 300000)

    return () => clearInterval(intervalId)
  }, [refreshToken, navigate])

  useEffect(() => {
    setSelectedRestaurants(restaurants.map(restaurant => restaurant.id));
  }, [restaurants]);

  return (
    <div>
      <h2>Account:</h2>
      {accessToken ? (
        <div>
          <p><strong>User ID:</strong> {userData.user_id}</p>
          <p><strong>Username:</strong> {userData.username}</p>
          <p><strong>Email:</strong> {userData.email}</p>
        </div>
      ) : (
        <p>Please log in to see your account details.</p>
      )}

      <h2>Debug-links:</h2>
      <nav>
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/register">Register</Link></li>
          <li><Link to="/login">Login</Link></li>
        </ul>
      </nav>

      <Routes>
        <Route path="/" element={<MainPage accessToken={accessToken} restaurants={restaurants} setRestaurants={setRestaurants} ingredients={ingredients} setIngredients={setIngredients} foods={foods} setFoods={setFoods} exactLocations={exactLocations} setExactLocations={setExactLocations} selectedRestaurants={selectedRestaurants} setSelectedRestaurants={setSelectedRestaurants} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login setAccessToken={setAccessToken} setRefreshToken={setRefreshToken} />} />
        <Route path="/confirm-email/:token" element={<ConfirmEmail />} />
      </Routes>
    </div>
  )
}

export default App
