import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Food } from "./interfaces";
import { Ingredient } from "./interfaces";

interface ApproveFoodProps {
  handleApprove: (id: number) => void;
}

const ApproveFood: React.FC<ApproveFoodProps> = ({ handleApprove }) => {
  const { foodId } = useParams<{ foodId: string }>();
  const [food, setFood] = useState<Food | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!foodId) {
      console.error("No foodId parameter found in the URL");
      return;
    }

    const id = Number(foodId); // Convert foodId to number

    if (isNaN(id)) {
      console.error("Invalid foodId parameter, not a number:", foodId);
      return;
    }

    const fetchFood = async () => {
      try {
        console.log(`Fetching food details for ID: ${id}`);
        const response = await fetch(`http://localhost:8000/foods/${id}/`);
        if (response.ok) {
          const data = await response.json();
          setFood(data);
        } else {
          console.error("Failed to fetch food details", response.status);
        }
      } catch (error) {
        console.error("Error fetching food details:", error);
      }
    };

    const fetchIngredients = async () => {
      try {
        const response = await fetch(`http://localhost:8000/ingredients/`);
        if (response.ok) {
          const data = await response.json();
          setIngredients(data);
        } else {
          console.error("Failed to fetch ingredients", response.status);
        }
      } catch (error) {
        console.error("Error fetching ingredients:", error);
      }
    };

    fetchFood();
    fetchIngredients();
  }, [foodId]);

  if (!food) {
    return <div>Loading...</div>;
  }

  const getIngredientName = (id: number) => {
    const ingredient = ingredients.find((ingredient) => ingredient.id === id);
    return ingredient ? ingredient.name : "Unknown";
  };

  const handleApproveAndRedirect = async (id: number) => {
    try {
      const response = await fetch(
        `http://localhost:8000/foods/${id}/accept/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ is_approved: 1 }),
        }
      );

      if (response.ok) {
        handleApprove(id);
        console.log("Food approved successfully");
        alert("Food approved successfully");
        navigate("/approvable-foods");
      } else {
        console.error("Failed to approve food", response.status);
      }
    } catch (error) {
      console.error("Error approving food:", error);
    }
  };

  return (
    <div className="food-dropdown" style={{ border: "1px solid red" }}>
      <div className="food-details">
        <p>
          <strong>Name:</strong> {food.name}
        </p>
        <p>
          <strong>Restaurant:</strong> {food.restaurant_name}
        </p>
        <p>
          <strong>Approvals:</strong> {food.approved_supervisors_count ?? 0}
        </p>
        <p>
          <strong>Organic:</strong> {food.is_organic ? "Yes" : "No"}
        </p>
        <p>
          <strong>Gluten-Free:</strong> {food.is_gluten_free ? "Yes" : "No"}
        </p>
        <p>
          <strong>Alcohol-Free:</strong> {food.is_alcohol_free ? "Yes" : "No"}
        </p>
        <p>
          <strong>Lactose-Free:</strong> {food.is_lactose_free ? "Yes" : "No"}
        </p>
        <p>
          <strong>Macro Table:</strong>
        </p>
        <ul>
          {Object.entries(food.macro_table).map(([key, value]) => (
            <li key={key}>
              <strong>{key}:</strong> {value}
            </li>
          ))}
        </ul>
        <p>
          <strong>Ingredients:</strong>
        </p>
        <ul>
          {food.ingredients.map((ingredientId) => (
            <li key={ingredientId}>
              {getIngredientName(ingredientId)} (ID: {ingredientId})
            </li>
          ))}
        </ul>
        {food.image && (
          <img src={food.image} alt={food.name} className="food-image" />
        )}
        <button
          className="approve-button"
          onClick={() => handleApproveAndRedirect(food.id)}
        >
          Approve Food
        </button>
      </div>
    </div>
  );
};

export default ApproveFood;
