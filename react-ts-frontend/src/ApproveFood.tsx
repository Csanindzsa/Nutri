import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Food } from "./interfaces";

interface ApproveFoodProps {
  handleApprove: (foodId: number) => void;
}

const ApproveFood: React.FC<ApproveFoodProps> = ({ handleApprove }) => {
  const { id } = useParams<{ id: string }>();
  const [food, setFood] = useState<Food | null>(null);

  useEffect(() => {
    const fetchFood = async () => {
      try {
        const response = await fetch(`http://localhost:8000/food/${id}/`);
        if (response.ok) {
          const data = await response.json();
          setFood(data);
        } else {
          console.error("Failed to fetch food details");
        }
      } catch (error) {
        console.error("Error fetching food details:", error);
      }
    };

    fetchFood();
  }, [id]);

  if (!food) {
    return <div>Loading...</div>;
  }

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
            <li key={ingredientId}>Ingredient ID: {ingredientId}</li>
          ))}
        </ul>
        {food.image && (
          <img src={food.image} alt={food.name} className="food-image" />
        )}
        <button
          className="approve-button"
          onClick={() => handleApprove(food.id)}
        >
          Approve Food
        </button>
      </div>
    </div>
  );
};

export default ApproveFood;
