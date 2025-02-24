import React from "react";
import { Food } from "../interfaces";

interface ApproveFoodProps {
  food: Food;
  accessToken: string | null;
  userId: number;
  onApprove: (updatedFood: Food) => void;
}

const ApproveFood: React.FC<ApproveFoodProps> = ({ food, accessToken, userId, onApprove }) => {
  const handleApprove = async () => {
    if (!accessToken) return;

    try {
      const response = await fetch(`http://localhost:8000/food/${food.id}/accept/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_approved: (food.approved_supervisors_count ?? 0) + 1 }),
      });

      if (response.ok) {
        const updatedFood = await response.json();
        alert("Food approved successfully");
        onApprove(updatedFood);
      } else {
        const errorData = await response.json();
        alert(errorData.detail || "Failed to approve food");
      }
    } catch (error) {
      console.error("Error approving food:", error);
    }
  };

  const hasUserApproved = Array.isArray(food.approved_supervisors) && food.approved_supervisors.some(supervisor => supervisor.id === userId);

  const renderApprovalStatus = () => {
    if (!accessToken) {
      return <p>Please log in to approve</p>;
    }
    
    if (hasUserApproved) {
      return <p>✓ Already approved</p>;
    }
    
    return (
      <button 
        onClick={handleApprove}
      >
        Approve
      </button>
    );
  };

  return (
    <div>
      <div>
        <h2>{food.name}</h2>
        
        <div>
          <img 
            src={food.image || "/default-image.jpg"} 
            alt={food.name} 
            className="food-image"
          />
          
          <div>
            <p><strong>Restaurant:</strong> {food.restaurant_name}</p>
            
            <div>
              <div>
                <span>
                  {food.is_organic ? "✓" : "✗"} Organic
                </span>
              </div>
              <div>
                <span>
                  {food.is_gluten_free ? "✓" : "✗"} Gluten-Free
                </span>
              </div>
              <div>
                <span>
                  {food.is_alcohol_free ? "✓" : "✗"} Alcohol-Free
                </span>
              </div>
              <div>
                <span>
                  {food.is_lactose_free ? "✓" : "✗"} Lactose-Free
                </span>
              </div>
            </div>

            <p>
              <strong>Approved by:</strong> {food.approved_supervisors_count} supervisor{food.approved_supervisors_count !== 1 ? 's' : ''}
            </p>

            <div>
              {renderApprovalStatus()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApproveFood;