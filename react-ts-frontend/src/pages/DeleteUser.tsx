import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface DeleteUserProps {
  accessToken: string | null;
  setAccessToken: React.Dispatch<React.SetStateAction<string | null>>;
  setRefreshToken: React.Dispatch<React.SetStateAction<string | null>>;
  setUserData: React.Dispatch<React.SetStateAction<{
    user_id?: number;
    username?: string;
    email?: string;
  }>>;
}

const DeleteUser: React.FC<DeleteUserProps> = ({ 
  accessToken, 
  setAccessToken, 
  setRefreshToken, 
  setUserData 
}) => {
  const [confirmation, setConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login if no access token
    if (!accessToken) {
      navigate("/login");
    }
  }, [accessToken, navigate]);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (confirmation !== "DELETE") {
      setError("Please type DELETE to confirm account deletion");
      return;
    }
    
    setIsDeleting(true);
    setError("");
    
    try {
      const response = await fetch("http://localhost:8000/users/delete/", {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${accessToken}`
        }
      });
      
      if (response.ok) {
        // Clear all auth tokens and user data
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        setAccessToken(null);
        setRefreshToken(null);
        setUserData({});
        
        // Redirect to a post-deletion page or home
        navigate("/account-deleted");
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Failed to delete account. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="delete-user-container">
      <h2>Delete Account</h2>
      
      <div className="warning-box">
        <h3>⚠️ Warning: This action cannot be undone</h3>
        <p>
          Deleting your account will permanently remove all your data and 
          information from our system. This includes your profile, settings, 
          and all content you've created.
        </p>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleDelete}>
        <div className="form-group">
          <label htmlFor="confirmation">
            To confirm, please type <strong>DELETE</strong> in the box below:
          </label>
          <input
            type="text"
            id="confirmation"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder="Type DELETE to confirm"
          />
        </div>
        
        <div className="form-actions">
          <button 
            type="submit" 
            className="delete-button" 
            disabled={isDeleting || confirmation !== "DELETE"}
          >
            {isDeleting ? "Deleting..." : "Permanently Delete My Account"}
          </button>
          <button 
            type="button" 
            onClick={() => navigate("/")} 
            disabled={isDeleting}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default DeleteUser;