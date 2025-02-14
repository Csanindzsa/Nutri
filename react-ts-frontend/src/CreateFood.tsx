import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Restaurant, Food, Ingredient } from './interfaces';

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
      calories: '',
      protein: '',
      carbs: '',
      fats: ''
    },
    is_organic: false,
    is_gluten_free: false,
    is_alcohol_free: false,
    is_lactose_free: false
  });
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleMacroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      macro_table: {
        ...prev.macro_table,
        [name]: value
      }
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
            <label>Calories:</label>
            <input
              type="number"
              name="calories"
              value={formData.macro_table.calories}
              onChange={handleMacroChange}
            />
          </div>
          <div>
            <label>Protein (g):</label>
            <input
              type="number"
              name="protein"
              value={formData.macro_table.protein}
              onChange={handleMacroChange}
            />
          </div>
          <div>
            <label>Carbs (g):</label>
            <input
              type="number"
              name="carbs"
              value={formData.macro_table.carbs}
              onChange={handleMacroChange}
            />
          </div>
          <div>
            <label>Fats (g):</label>
            <input
              type="number"
              name="fats"
              value={formData.macro_table.fats}
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