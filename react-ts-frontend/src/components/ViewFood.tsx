import React from "react";
import { Food, Ingredient, Restaurant } from "../interfaces";

interface ViewFoodProps {
  food: Food;
  restaurants: Restaurant[];
  ingredients: Ingredient[];
}

const renderTable = (data: Record<string, any>) => {
  return (
    <table border={1} style={{ width: "100%", marginTop: "10px" }}>
      <tbody>
        {Object.entries(data).map(([key, value]) => (
          <tr key={key}>
            <td style={{ fontWeight: "bold", padding: "5px" }}>{key}</td>
            <td style={{ padding: "5px" }}>
              {typeof value === "object" && value !== null ? renderTable(value) : value.toString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const ViewFood: React.FC<ViewFoodProps> = ({ food, restaurants, ingredients }) => {
  console.log("macro table: ", food.macro_table);
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
      {/* <p>Calories: {food.calories}</p> */}
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
      <button onClick={() => alert("Propose Change Clicked")}>Propose Change</button>
      <button onClick={() => alert("Propose Removal Clicked")} style={{ marginLeft: "10px" }}>Propose Removal</button>
    </div>
  );
};

export default ViewFood;
