import React from "react";
import { Food, Ingredient, Restaurant } from "../interfaces";

interface ViewFoodProps {
  food: Food;
  restaurants: Restaurant[];
  ingredients: Ingredient[];
  is_approval: boolean;  // Add the is_approval prop
}

const formatNumber = (num: number) => {
  const decimalPart = (num % 1) * 10;
  return decimalPart === 0 ? num.toString() : num.toFixed(1);
};

const nutrientLabels: Record<string, string> = {
  energy_kcal: "Energy (kcal / kJ)",
  fat: "Fat",
  saturated_fat: "Saturated Fat",
  carbohydrates: "Carbohydrates",
  sugars: "Sugars",
  protein: "Protein",
  fiber: "Fiber",
  salt: "Salt"
};

const renderTable = (data: Record<string, any>) => {
  const order = [
    "energy_kcal",
    "fat",
    "saturated_fat",
    "carbohydrates",
    "sugars",
    "protein",
    "fiber",
    "salt"
  ];

  return (
    <table border={1} style={{ width: "100%", marginTop: "10px" }}>
      <thead>
        <tr>
          <th style={{ padding: "5px" }}>Nutrient</th>
          <th style={{ padding: "5px" }}>Per 100g</th>
          <th style={{ padding: "5px" }}>Percentage</th>
        </tr>
      </thead>
      <tbody>
        {order.map((key) => {
          const value = data[key];
          if (value !== undefined) {
            return (
              <tr key={key}>
                <td style={{ fontWeight: "bold", padding: "5px" }}>
                  {nutrientLabels[key] || key}
                </td>
                {key === "energy_kcal" ? (
                  <td colSpan={2} style={{ padding: "5px" }}>
                    {formatNumber(value)} kcal / {formatNumber(value * 4.184)} kJ
                  </td>
                ) : (
                  <>
                    <td style={{ padding: "5px" }}>
                      {typeof value.per100g === "number"
                        ? formatNumber(value.per100g)
                        : "-"}
                    </td>
                    <td style={{ padding: "5px" }}>
                      {typeof value.percentage === "number"
                        ? formatNumber(value.percentage) + "%"
                        : "-"}
                    </td>
                  </>
                )}
              </tr>
            );
          }
          return null;
        })}
      </tbody>
    </table>
  );
};

const ViewFood: React.FC<ViewFoodProps> = ({ food, restaurants, ingredients, is_approval }) => {

  const handleProposeRemoval = async () => {
    try {
      const response = await fetch(`http://localhost:8000/food/${food.id}/propose-removal/`, {
        method: "POST",  // HTTP method
        headers: {
          "Content-Type": "application/json",  // Since no body content, just need correct headers
          Authorization: `Bearer ${localStorage.getItem("access_token")}`, // Add Authorization header with JWT token
        },
      });

      if (!response.ok) {
        const data = await response.json();  // Parse error response from backend
        throw new Error(data.error || "Failed to propose removal.");
      }

      const data = await response.json();  // Parse the JSON response
      alert(data.message);  // Display success message from response
    } catch (error) {
      console.error("Error proposing removal:", error);
      alert(error);
    }
  };

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "15px",
        marginBottom: "15px",
      }}
    >
      <h3>{food.name}</h3>
      <div style={{ marginBottom: "10px" }}>
        {food.image ? (
          <img
            src={`${food.image}`}
            alt={food.name}
            style={{
              maxWidth: "200px",
              height: "auto",
              borderRadius: "4px",
            }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
              const noImageText = document.createElement("span");
              noImageText.textContent = "No image available";
              noImageText.style.color = "#666";
              e.currentTarget.parentNode?.appendChild(noImageText);
            }}
          />
        ) : (
          <span style={{ color: "#000" }}>No image available</span>
        )}
      </div>
      <p>
        Restaurant: {restaurants.find((r) => r.id === food.restaurant)?.name}
      </p>
      <p>
        Ingredients: {food.ingredients.map((i) => ingredients.find((ing) => ing.id === i)?.name).join(", ")}
      </p>
      <h4>Macros</h4>
      {renderTable(food.macro_table)}

      {/* Render buttons based on is_approval */}
      {!is_approval && (
        <>
          <button onClick={() => alert("Propose Change Clicked")}>Propose Change</button>
          <button onClick={handleProposeRemoval} style={{ marginLeft: "10px" }}>
            Propose Removal
          </button>
        </>
      )}
    </div>
  );
};

export default ViewFood;
