import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

const ConfirmEmail = () => {
  const { /*uidb64,*/ token } = useParams<{ /*uidb64: string;*/ token: string }>()
  const navigate = useNavigate()

  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  // Function to handle email confirmation request
  const confirmEmail = async () => {
    try {
      const response = await fetch('http://localhost:8000/confirm-email/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
        //   uidb64, // Send the user ID in base64
          token,  // Send the token
        }),
      })

      if (response.ok) {
        setMessage('Congratulations! You can login now!')
        setIsSuccess(true)
        // Optionally, you could redirect to the login page
        setTimeout(() => navigate('/login'), 3000)
      } else {
        const data = await response.json()
        setMessage(data.detail || 'Something went wrong. Please try again.')
      }
    } catch (error) {
      setMessage('An error occurred while verifying your email.')
    }
  }

  useEffect(() => {
    // Confirm the email when the component mounts
    if (token) {
      confirmEmail()
    }
  }, [token])

  return (
    <div>
      <h2>Email Confirmation</h2>
      <p>{message}</p>
      {isSuccess && <p>Redirecting to login...</p>}
    </div>
  )
}

export default ConfirmEmail
