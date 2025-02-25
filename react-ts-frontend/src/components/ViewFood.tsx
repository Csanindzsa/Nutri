import React, { useState } from "react";
import { Food, Ingredient, Restaurant, MacroTable, MacroDetail } from "../interfaces";

interface ViewFoodProps {
  food: Food;
  restaurants: Restaurant[];
  ingredients: Ingredient[];
  is_approval: boolean;
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
  salt: "Salt",
};

const order = [
  "energy_kcal",
  "fat",
  "saturated_fat",
  "carbohydrates",
  "sugars",
  "protein",
  "fiber",
  "salt",
];

const renderTable = (data: Record<string, any>) => {
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
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<Partial<Food>>({
    name: food.name,
    serving_size: food.serving_size,
    macro_table: food.macro_table,
    is_organic: food.is_organic,
    is_gluten_free: food.is_gluten_free,
    is_alcohol_free: food.is_alcohol_free,
    is_lactose_free: food.is_lactose_free,
    image: food.image,
    ingredients: food.ingredients,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleProposeRemoval = async () => {
    try {
      const response = await fetch(`http://localhost:8000/food/${food.id}/propose-removal/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to propose removal.");
      }

      const data = await response.json();
      alert(data.message);
    } catch (error) {
      console.error("Error proposing removal:", error);
      alert(error);
    }
  };

  const handleProposeChange = async () => {
    const formDataToSend = new FormData();
    formDataToSend.append("food_id", food.id.toString());
    formDataToSend.append("name", formData.name || "");
    formDataToSend.append("serving_size", formData.serving_size?.toString() || "");
    formDataToSend.append("is_organic", formData.is_organic?.toString() || "false");
    formDataToSend.append("is_gluten_free", formData.is_gluten_free?.toString() || "false");
    formDataToSend.append("is_alcohol_free", formData.is_alcohol_free?.toString() || "false");
    formDataToSend.append("is_lactose_free", formData.is_lactose_free?.toString() || "false");
    formDataToSend.append("macro_table", JSON.stringify(formData.macro_table));
    formData.ingredients?.forEach((ing) => formDataToSend.append("new_ingredients", ing.toString()));
    if (imageFile) {
      formDataToSend.append("new_image", imageFile);
    }

    try {
      const response = await fetch("http://localhost:8000/food-changes/create/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to propose change.");
      }

      const data = await response.json();
      alert(data.message);
      setIsFormOpen(false);
    } catch (error) {
      console.error("Error proposing change:", error);
      alert(error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else if (name === "ingredients") {
      const selectedIngredients = Array.from(
        (e.target as HTMLSelectElement).selectedOptions,
        (option) => parseInt(option.value)
      );
      setFormData((prev) => ({
        ...prev,
        ingredients: selectedIngredients,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleMacroChange = (key: keyof MacroTable, field: keyof MacroDetail, value: string) => {
    setFormData((prev) => {
      // Ensure macro_table is defined and initialize it if not
      const currentMacroTable = prev.macro_table || {
        energy_kcal: 0,
        fat: { per100g: 0, percentage: 0 },
        saturated_fat: { per100g: 0, percentage: 0 },
        carbohydrates: { per100g: 0, percentage: 0 },
        sugars: { per100g: 0, percentage: 0 },
        protein: { per100g: 0, percentage: 0 },
        fiber: { per100g: 0, percentage: 0 },
        salt: { per100g: 0, percentage: 0 },
      };

      // Ensure the nested object for the key exists
      const currentMacroDetail = (currentMacroTable[key] || { per100g: 0, percentage: 0 }) as MacroDetail;

      // Update the specific field in the nested object
      const updatedMacroDetail = {
        ...currentMacroDetail,
        [field]: parseFloat(value) || 0,
      };

      // Update the macro_table with the new nested object
      const updatedMacroTable = {
        ...currentMacroTable,
        [key]: updatedMacroDetail,
      };

      return {
        ...prev,
        macro_table: updatedMacroTable,
      };
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const renderMacroForm = () => {
    const macroTable = formData.macro_table || {
      energy_kcal: 0,
      fat: { per100g: 0, percentage: 0 },
      saturated_fat: { per100g: 0, percentage: 0 },
      carbohydrates: { per100g: 0, percentage: 0 },
      sugars: { per100g: 0, percentage: 0 },
      protein: { per100g: 0, percentage: 0 },
      fiber: { per100g: 0, percentage: 0 },
      salt: { per100g: 0, percentage: 0 },
    };
  
    return (
      <div>
        <h4>Edit Macros</h4>
        {order.map((key) => {
          const value = macroTable[key as keyof MacroTable];
  
          if (key === "energy_kcal") {
            // Handle energy_kcal separately (it's a number)
            return (
              <div key={key}>
                <h5>{nutrientLabels[key] || key}</h5>
                <div>
                  <label>Energy (kcal):</label>
                  <input
                    type="number"
                    value={value as number || ""}
                    onChange={(e) => handleMacroChange(key, "energy_kcal" as keyof MacroDetail, e.target.value)}
                  />
                </div>
              </div>
            );
          } else {
            // Handle other fields (they are MacroDetail objects)
            const macroDetail = value as MacroDetail;
            return (
              <div key={key}>
                <h5>{nutrientLabels[key] || key}</h5>
                <div>
                  <label>Per 100g:</label>
                  <input
                    type="number"
                    value={macroDetail.per100g || ""}
                    onChange={(e) => handleMacroChange(key as keyof MacroTable, "per100g", e.target.value)}
                  />
                </div>
                <div>
                  <label>Percentage:</label>
                  <input
                    type="number"
                    value={macroDetail.percentage || ""}
                    onChange={(e) => handleMacroChange(key as keyof MacroTable, "percentage", e.target.value)}
                  />
                </div>
              </div>
            );
          }
        })}
      </div>
    );
  };

  const renderForm = () => (
    <div style={{ marginTop: "10px", border: "1px solid #ddd", padding: "10px", borderRadius: "8px" }}>
      <h4>Propose Changes</h4>
      <div>
        <label>Name:</label>
        <input
          type="text"
          name="name"
          value={formData.name || ""}
          onChange={handleInputChange}
        />
      </div>
      <div>
        <label>Serving Size (grams):</label>
        <input
          type="number"
          name="serving_size"
          value={formData.serving_size || ""}
          onChange={handleInputChange}
        />
      </div>
      <div>
        <label>Organic:</label>
        <input
          type="checkbox"
          name="is_organic"
          checked={formData.is_organic || false}
          onChange={handleInputChange}
        />
      </div>
      <div>
        <label>Gluten-Free:</label>
        <input
          type="checkbox"
          name="is_gluten_free"
          checked={formData.is_gluten_free || false}
          onChange={handleInputChange}
        />
      </div>
      <div>
        <label>Alcohol-Free:</label>
        <input
          type="checkbox"
          name="is_alcohol_free"
          checked={formData.is_alcohol_free || false}
          onChange={handleInputChange}
        />
      </div>
      <div>
        <label>Lactose-Free:</label>
        <input
          type="checkbox"
          name="is_lactose_free"
          checked={formData.is_lactose_free || false}
          onChange={handleInputChange}
        />
      </div>
      <div>
        <label>Image:</label>
        <input
          type="file"
          name="image"
          onChange={handleImageChange}
        />
      </div>
      <div>
        <label>Ingredients:</label>
        <select
          name="ingredients"
          multiple
          value={formData.ingredients?.map((i) => i.toString()) || []}
          onChange={handleInputChange}
        >
          {ingredients.map((ing) => (
            <option key={ing.id} value={ing.id}>
              {ing.name}
            </option>
          ))}
        </select>
      </div>
      {renderMacroForm()}
      <button onClick={handleProposeChange}>Submit Changes</button>
      <button onClick={() => setIsFormOpen(false)} style={{ marginLeft: "10px" }}>
        Cancel
      </button>
    </div>
  );

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

      {!is_approval && (
        <>
          <button onClick={() => setIsFormOpen(true)}>Propose Change</button>
          <button onClick={handleProposeRemoval} style={{ marginLeft: "10px" }}>
            Propose Removal
          </button>
        </>
      )}

      {isFormOpen && renderForm()}
    </div>
  );
};

export default ViewFood;