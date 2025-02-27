import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface EditUserProps {
  accessToken: string | null;
  userData: {
    user_id?: number;
    username?: string;
    email?: string;
  };
  setUserData: React.Dispatch<React.SetStateAction<{
    user_id?: number;
    username?: string;
    email?: string;
  }>>;
  setAccessToken: React.Dispatch<React.SetStateAction<string | null>>;
  setRefreshToken: React.Dispatch<React.SetStateAction<string | null>>;
}

const EditUser: React.FC<EditUserProps> = ({ accessToken, userData, setUserData, setAccessToken, setRefreshToken }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Populate form with current user data
    if (userData) {
      setUsername(userData.username || "");
      setEmail(userData.email || "");
    }
  }, [userData]);

  useEffect(() => {
    // Redirect to login if no access token
    if (!accessToken) {
      navigate("/login");
    }
  }, [accessToken, navigate]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!username.trim()) {
      newErrors.username = "Username is required";
    }
    
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }
    
    if (password && password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    
    if (password && password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setErrors({});
    setSuccessMessage("");
    
    try {
      // Prepare data object
      const userData: Record<string, string> = {};
      
      userData.username = username;
      userData.email = email;
      
      // Only include password if it was provided
      if (password) {
        userData.password = password;
      }
      
      const response = await fetch("http://localhost:8000/users/edit/", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify(userData)
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("returned data: ", data);
        
        // Update the user data in the parent component state
        setUserData(prevData => ({
            ...prevData,
            username: data.user.username,
            email: data.user.email
        }));
        setAccessToken(data.tokens.access);
        setAccessToken(data.tokens.refresh);
        localStorage.setItem("access_token", data.tokens.access);
        localStorage.setItem("refresh_token", data.tokens.refresh);
        //todo: the view should also return 
        // a new access and refresh token as well, with the updated userdata.
        
        // Set success message
        setSuccessMessage("Profile updated successfully");
        
        // Redirect to the root page after successful update
      } else {
        const errorData = await response.json();
        const newErrors: Record<string, string> = {};
        
        // Handle validation errors from the backend
        if (errorData.username) {
          newErrors.username = Array.isArray(errorData.username) 
            ? errorData.username[0] 
            : errorData.username;
        }
        
        if (errorData.email) {
          newErrors.email = Array.isArray(errorData.email) 
            ? errorData.email[0] 
            : errorData.email;
        }
        
        if (errorData.password) {
          newErrors.password = Array.isArray(errorData.password) 
            ? errorData.password[0] 
            : errorData.password;
        }
        
        // Handle generic errors
        if (errorData.detail) {
          newErrors.general = errorData.detail;
        }
        
        setErrors(newErrors);
      }
    } catch (error) {
      console.error("Error updating user:", error);
      setErrors({ general: "An unexpected error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="edit-user-container">
      <h2>Edit Profile</h2>
      
      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}
      
      {errors.general && (
        <div className="error-message">{errors.general}</div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          {errors.username && <div className="error-message">{errors.username}</div>}
        </div>
        
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {errors.email && <div className="error-message">{errors.email}</div>}
        </div>
        
        <div className="form-group">
          <label htmlFor="password">New Password (leave blank to keep current)</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {errors.password && <div className="error-message">{errors.password}</div>}
        </div>
        
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm New Password</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={!password}
          />
          {errors.confirmPassword && <div className="error-message">{errors.confirmPassword}</div>}
        </div>
        
        <div className="form-actions">
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Updating..." : "Update Profile"}
          </button>
          <button type="button" onClick={() => navigate("/")} disabled={isLoading}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditUser;