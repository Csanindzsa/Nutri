import React from "react";
import { Food } from "../interfaces";

interface ApproveFoodProps {
  food: Food;
  accessToken: string | null;
}

const ApproveFood: React.FC<ApproveFoodProps> = ({ food, accessToken,  }) => {
  const handleApprove = async () => {
    if (!accessToken) return;

    try {
      const response = await fetch(`http://localhost:8000/food/${food.id}/accept/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify( (food.approved_supervisors_count == null) ? { is_approved: 1 } : { is_approved: food.approved_supervisors_count+1 }),
      });

      if (response.ok) {
        alert("Food approved successfully");
        food.approved_supervisors_count += 1;
      } else {
        const errorData = await response.json();
        alert(errorData.detail || "Failed to approve food");
      }
    } catch (error) {
      console.error("Error approving food:", error);
    }
  };

  return (
    <div className="approve-food-card">
      <img src={food.image || "default-image.jpg"} alt={food.name} className="food-image" />
      <h3>{food.name}</h3>
      <p><strong>Restaurant:</strong> {food.restaurant_name}</p>
      <p><strong>Organic:</strong> {food.is_organic ? "Yes" : "No"}</p>
      <p><strong>Gluten-Free:</strong> {food.is_gluten_free ? "Yes" : "No"}</p>
      <p><strong>Alcohol-Free:</strong> {food.is_alcohol_free ? "Yes" : "No"}</p>
      <p><strong>Lactose-Free:</strong> {food.is_lactose_free ? "Yes" : "No"}</p>
      <p><strong>Approved supervisors: {food.approved_supervisors_count}</strong></p>
      <button
        className="approve-button"
        onClick={handleApprove}
        disabled={!accessToken}
      >
        Approve
      </button>
    </div>
  );
};

export default ApproveFood;
