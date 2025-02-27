import React from "react";
import { Link } from "react-router-dom";

const AccountDeleted: React.FC = () => {
  return (
    <div className="account-deleted-container">
      <h2>Account Deleted</h2>
      
      <div className="success-message">
        <p>Your account has been successfully deleted.</p>
        <p>All your personal data has been removed from our system.</p>
      </div>
      
      <div className="next-steps">
        <p>What would you like to do next?</p>
        <div className="button-group">
          <Link to="/" className="button">
            Return to Home
          </Link>
          <Link to="/register" className="button">
            Create a New Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AccountDeleted;