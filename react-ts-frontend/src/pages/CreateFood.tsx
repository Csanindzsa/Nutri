import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Restaurant, Food, Ingredient, MacroTable } from '../interfaces';

interface CreateFoodProps {
  accessToken: string | null;
  restaurants: Restaurant[];
  ingredients: Ingredient[];
  onCreateFood: (newFood: Food) => void;
}

const CreateFood: React.FC<CreateFoodProps> = ({ accessToken, restaurants, ingredients, onCreateFood }) => {
  const navigate = useNavigate();
  // Keep track of the actual numeric values in the state
  const [formData, setFormData] = useState({
    name: '',
    restaurant: null as number | null,
    ingredients: [] as number[],
    macro_table: {
      energy_kcal: 0,
      fat: 0,
      saturated_fat: 0,
      carbohydrates: 0,
      sugars: 0,
      protein: 0,
      fiber: 0,
      salt: 0,
    },
    is_organic: false,
    is_gluten_free: false,
    is_alcohol_free: false,
    is_lactose_free: false,
    serving_size: 0,
  });
  
  // Separate state for input display values (can be empty strings)
  const [inputValues, setInputValues] = useState({
    energy_kcal: '',
    fat: '',
    saturated_fat: '',
    carbohydrates: '',
    sugars: '',
    protein: '',
    fiber: '',
    salt: '',
    serving_size: '',
  });
  
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'serving_size') {
      // Update both the display value and the actual value
      setInputValues(prev => ({
        ...prev,
        [name]: value,
      }));
      
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? 0 : Number(value),
      }));
    } else if (type === 'checkbox') {
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
    
    // Update the display value (can be empty string)
    setInputValues(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Update the actual numeric value in formData (use 0 if empty)
    setFormData(prev => ({
      ...prev,
      macro_table: {
        ...prev.macro_table,
        [name]: value === '' ? 0 : parseFloat(value),
      },
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
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
  
    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('restaurant', String(formData.restaurant));
    formData.ingredients.forEach(ingredientId => {
      formDataToSend.append('ingredients', String(ingredientId));
    });
    formDataToSend.append('macro_table', JSON.stringify(formData.macro_table));
    formDataToSend.append('is_organic', String(formData.is_organic));
    formDataToSend.append('is_gluten_free', String(formData.is_gluten_free));
    formDataToSend.append('is_alcohol_free', String(formData.is_alcohol_free));
    formDataToSend.append('is_lactose_free', String(formData.is_lactose_free));
    formDataToSend.append('serving_size', String(formData.serving_size));
    
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
              value={inputValues.energy_kcal}
              onChange={handleMacroChange}
            />
          </div>
          <div>
            <label>Fat (per 100g):</label>
            <input
              type="number"
              name="fat"
              value={inputValues.fat}
              onChange={handleMacroChange}
            />
          </div>
          <div>
            <label>Saturated Fat (per 100g):</label>
            <input
              type="number"
              name="saturated_fat"
              value={inputValues.saturated_fat}
              onChange={handleMacroChange}
            />
          </div>
          <div>
            <label>Carbohydrates (per 100g):</label>
            <input
              type="number"
              name="carbohydrates"
              value={inputValues.carbohydrates}
              onChange={handleMacroChange}
            />
          </div>
          <div>
            <label>Sugars (per 100g):</label>
            <input
              type="number"
              name="sugars"
              value={inputValues.sugars}
              onChange={handleMacroChange}
            />
          </div>
          <div>
            <label>Protein (per 100g):</label>
            <input
              type="number"
              name="protein"
              value={inputValues.protein}
              onChange={handleMacroChange}
            />
          </div>
          <div>
            <label>Fiber (per 100g):</label>
            <input
              type="number"
              name="fiber"
              value={inputValues.fiber}
              onChange={handleMacroChange}
            />
          </div>
          <div>
            <label>Salt (per 100g):</label>
            <input
              type="number"
              name="salt"
              value={inputValues.salt}
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
            value={inputValues.serving_size}
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