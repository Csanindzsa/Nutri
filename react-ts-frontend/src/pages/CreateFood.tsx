import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Restaurant, Food, Ingredient, MacroTable, MacroDetail } from '../interfaces';

interface CreateFoodProps {
  accessToken: string | null;
  restaurants: Restaurant[];
  ingredients: Ingredient[];
  onCreateFood: (newFood: Food) => void;
}

const CreateFood: React.FC<CreateFoodProps> = ({ accessToken, restaurants, ingredients, onCreateFood }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    restaurant: null as number | null,
    ingredients: [] as number[],
    macro_table: {
      energy_kcal: 0,
      fat: { per100g: 0, percentage: 0 },
      saturated_fat: { per100g: 0, percentage: 0 },
      carbohydrates: { per100g: 0, percentage: 0 },
      sugars: { per100g: 0, percentage: 0 },
      protein: { per100g: 0, percentage: 0 },
      fiber: { per100g: 0, percentage: 0 },
      salt: { per100g: 0, percentage: 0 },
    },
    is_organic: false,
    is_gluten_free: false,
    is_alcohol_free: false,
    is_lactose_free: false,
    serving_size: 0, // Add serving_size field
  });
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleMacroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
  
    if (name === 'energy_kcal') {
      setFormData(prev => ({
        ...prev,
        macro_table: {
          ...prev.macro_table,
          [name]: parseFloat(value) || 0, // Ensure the value is a number
        },
      }));
    } else {
      const [macroKey, detailKey] = name.split('.'); // Split the name into macroKey and detailKey
  
      setFormData(prev => ({
        ...prev,
        macro_table: {
          ...prev.macro_table,
          [macroKey]: {
            ...(prev.macro_table[macroKey as keyof MacroTable] as MacroDetail), // Explicitly assert as MacroDetail
            [detailKey]: parseFloat(value) || 0, // Ensure the value is a number
          },
        },
      }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const calculatePercentages = (macroTable: MacroTable): MacroTable => {
    const totalPer100g =
      macroTable.fat.per100g +
      macroTable.saturated_fat.per100g +
      macroTable.carbohydrates.per100g +
      macroTable.sugars.per100g +
      macroTable.protein.per100g +
      macroTable.fiber.per100g +
      macroTable.salt.per100g;

    return {
      ...macroTable,
      fat: {
        ...macroTable.fat,
        percentage: totalPer100g === 0 ? 0 : macroTable.fat.per100g,
      },
      saturated_fat: {
        ...macroTable.saturated_fat,
        percentage: totalPer100g === 0 ? 0 : macroTable.saturated_fat.per100g,
      },
      carbohydrates: {
        ...macroTable.carbohydrates,
        percentage: totalPer100g === 0 ? 0 : macroTable.carbohydrates.per100g,
      },
      sugars: {
        ...macroTable.sugars,
        percentage: totalPer100g === 0 ? 0 : macroTable.sugars.per100g,
      },
      protein: {
        ...macroTable.protein,
        percentage: totalPer100g === 0 ? 0 : macroTable.protein.per100g,
      },
      fiber: {
        ...macroTable.fiber,
        percentage: totalPer100g === 0 ? 0 : macroTable.fiber.per100g,
      },
      salt: {
        ...macroTable.salt,
        percentage: totalPer100g === 0 ? 0 : macroTable.salt.per100g,
      },
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
  
    if (!accessToken) {
      setError('Please log in to create a food item');
      return;
    }
  
    if (!formData.restaurant || formData.ingredients.length === 0) {
      setError('Please fill in all required fields and select at least one ingredient.');
      return;
    }
  
    // Calculate percentages before submitting
    const macroTableWithPercentages = calculatePercentages(formData.macro_table);
  
    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('restaurant', String(formData.restaurant));
    formData.ingredients.forEach(ingredientId => {
      formDataToSend.append('ingredients', String(ingredientId));
    });
    formDataToSend.append('macro_table', JSON.stringify(macroTableWithPercentages));
    formDataToSend.append('is_organic', String(formData.is_organic));
    formDataToSend.append('is_gluten_free', String(formData.is_gluten_free));
    formDataToSend.append('is_alcohol_free', String(formData.is_alcohol_free));
    formDataToSend.append('is_lactose_free', String(formData.is_lactose_free));
    formDataToSend.append('serving_size', String(formData.serving_size)); // Add serving_size to FormData
    
    if (image) {
      formDataToSend.append('image', image);
    }
  
    try {
      const response = await fetch('http://localhost:8000/foods/create/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formDataToSend,
      });
  
      if (response.ok) {
        const createdFood = await response.json();
        onCreateFood(createdFood);
        navigate('/?success=true');
      } else if (response.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else {
        const errorData = await response.json().catch(() => null);
        setError(errorData?.detail || 'Failed to create food. Please try again.');
      }
    } catch (error) {
      console.error('Error creating food:', error);
      setError('An error occurred while creating the food. Please check your connection and try again.');
    }
  };

  return (
    <div>
      <h2>Create New Food</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Food Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </div>

        <div>
          <label>Select Restaurant:</label>
          <select
            name="restaurant"
            value={formData.restaurant || ''}
            onChange={e => setFormData(prev => ({ ...prev, restaurant: Number(e.target.value) }))}
            required
          >
            <option value="" disabled>Select a restaurant</option>
            {restaurants.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        <div>
          <h3>Macro Table</h3>
          <div>
            <label>Energy (kcal) per 100g:</label>
            <input
              type="number"
              name="energy_kcal"
              value={formData.macro_table.energy_kcal}
              onChange={handleMacroChange}
            />
          </div>
          <div>
            <label>Fat (per 100g):</label>
            <input
              type="number"
              name="fat.per100g"
              value={formData.macro_table.fat.per100g}
              onChange={handleMacroChange}
            />
          </div>
          <div>
            <label>Saturated Fat (per 100g):</label>
            <input
              type="number"
              name="saturated_fat.per100g"
              value={formData.macro_table.saturated_fat.per100g}
              onChange={handleMacroChange}
            />
          </div>
          <div>
            <label>Carbohydrates (per 100g):</label>
            <input
              type="number"
              name="carbohydrates.per100g"
              value={formData.macro_table.carbohydrates.per100g}
              onChange={handleMacroChange}
            />
          </div>
          <div>
            <label>Sugars (per 100g):</label>
            <input
              type="number"
              name="sugars.per100g"
              value={formData.macro_table.sugars.per100g}
              onChange={handleMacroChange}
            />
          </div>
          <div>
            <label>Protein (per 100g):</label>
            <input
              type="number"
              name="protein.per100g"
              value={formData.macro_table.protein.per100g}
              onChange={handleMacroChange}
            />
          </div>
          <div>
            <label>Fiber (per 100g):</label>
            <input
              type="number"
              name="fiber.per100g"
              value={formData.macro_table.fiber.per100g}
              onChange={handleMacroChange}
            />
          </div>
          <div>
            <label>Salt (per 100g):</label>
            <input
              type="number"
              name="salt.per100g"
              value={formData.macro_table.salt.per100g}
              onChange={handleMacroChange}
            />
          </div>
        </div>

        <div>
          <h3>Dietary Information</h3>
          <div>
            <label>
              <input
                type="checkbox"
                name="is_organic"
                checked={formData.is_organic}
                onChange={handleInputChange}
              />
              Organic
            </label>
          </div>
          <div>
            <label>
              <input
                type="checkbox"
                name="is_gluten_free"
                checked={formData.is_gluten_free}
                onChange={handleInputChange}
              />
              Gluten Free
            </label>
          </div>
          <div>
            <label>
              <input
                type="checkbox"
                name="is_alcohol_free"
                checked={formData.is_alcohol_free}
                onChange={handleInputChange}
              />
              Alcohol Free
            </label>
          </div>
          <div>
            <label>
              <input
                type="checkbox"
                name="is_lactose_free"
                checked={formData.is_lactose_free}
                onChange={handleInputChange}
              />
              Lactose Free
            </label>
          </div>
        </div>

        <div>
          <label>Serving Size (grams):</label>
          <input
            type="number"
            name="serving_size"
            value={formData.serving_size}
            onChange={handleInputChange}
            required
          />
        </div>

        <div>
          <label>Select Ingredients:</label>
          {ingredients.map(ingredient => (
            <div key={ingredient.id}>
              <label>
                <input
                  type="checkbox"
                  checked={formData.ingredients.includes(ingredient.id)}
                  onChange={() => {
                    setFormData(prev => ({
                      ...prev,
                      ingredients: prev.ingredients.includes(ingredient.id)
                        ? prev.ingredients.filter(id => id !== ingredient.id)
                        : [...prev.ingredients, ingredient.id]
                    }));
                  }}
                />
                {ingredient.name}
              </label>
            </div>
          ))}
        </div>

        <div>
          <label>Food Image:</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />
        </div>

        <div style={{ marginTop: '20px' }}>
          <button type="submit" disabled={!accessToken}>
            {accessToken ? 'Create Food' : 'Please Log In to Create Food'}
          </button>
          {error && (
            <p style={{ color: 'red', marginTop: '8px' }}>{error}</p>
          )}
        </div>
      </form>
    </div>
  );
};

export default CreateFood;