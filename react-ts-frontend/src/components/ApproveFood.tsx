import React, { useState } from "react";
import { Food, Ingredient, MacroTable } from "../interfaces";
import { renderTable } from "../utils/utils";

interface ApproveFoodProps {
  food: Food;
  accessToken: string | null;
  userId: number | undefined;
  ingredients: Ingredient[];
  onApprove: (updatedFood: Food) => void;
}

const ApproveFood: React.FC<ApproveFoodProps> = ({ food, accessToken, userId, ingredients, onApprove }) => {
  const [isUserApproved, setIsUserApproved] = useState<boolean>(() =>
    food.approved_supervisors != null
      ? food.approved_supervisors.some((supervisorId) => supervisorId === userId)
      : false
  );
  const [approvedCount, setApprovedCount] = useState<number>(food.approved_supervisors_count ?? 0);

  // Map ingredient IDs to their names
  const getIngredientNames = (ingredientIds: number[]): string => {
    return ingredientIds
      .map((id) => {
        const ingredient = ingredients.find((ing) => ing.id === id);
        return ingredient ? ingredient.name : `Unknown Ingredient (ID: ${id})`;
      })
      .join(", ");
  };

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

        // After successful approval, update the local state to trigger re-render
        setIsUserApproved(true);
        setApprovedCount((prev) => prev + 1);
        onApprove(updatedFood);
      } else {
        const errorData = await response.json();
        alert(errorData.detail || "Failed to approve food");
      }
    } catch (error) {
      console.error("Error approving food:", error);
    }
  };

  const renderApprovalStatus = () => {
    if (!accessToken) {
      return <p>Please log in to approve</p>;
    }

    if (isUserApproved) {
      return <p>✓ Already approved</p>;
    }

    return <button onClick={handleApprove}>Approve</button>;
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
            <p>
              <strong>Restaurant:</strong> {food.restaurant_name}
            </p>
            <p>
                <strong>Serving size:</strong> {food.serving_size}
            </p>

            <div>
              <span>{food.is_organic ? "✓" : "✗"} Organic</span>
              <span>{food.is_gluten_free ? "✓" : "✗"} Gluten-Free</span>
              <span>{food.is_alcohol_free ? "✓" : "✗"} Alcohol-Free</span>
              <span>{food.is_lactose_free ? "✓" : "✗"} Lactose-Free</span>
            </div>

            <p>
              <strong>Ingredients:</strong> {getIngredientNames(food.ingredients)}
            </p>

            <h4>Macros</h4>
            {renderTable(food.macro_table)}

            <p>
              <strong>Approved by:</strong> {approvedCount} supervisor{approvedCount !== 1 ? "s" : ""}
            </p>

            <div>{renderApprovalStatus()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApproveFood;