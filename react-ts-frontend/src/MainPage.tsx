import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Restaurant, Food, Ingredient, ExactLocation } from './interfaces';

interface MainPageProps {
  accessToken: string | null;
  restaurants: Restaurant[];
  setRestaurants: React.Dispatch<React.SetStateAction<Restaurant[]>>;
  ingredients: Ingredient[];
  setIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>;
  foods: Food[];
  setFoods: React.Dispatch<React.SetStateAction<Food[]>>;
  exactLocations: Array<ExactLocation>;
  setExactLocations: React.Dispatch<React.SetStateAction<Array<ExactLocation>>>;
  selectedRestaurants: number[];
  setSelectedRestaurants: React.Dispatch<React.SetStateAction<number[]>>;
  selectedIngredients: number[];
  setSelectedIngredients: React.Dispatch<React.SetStateAction<number[]>>;
}

const MainPage: React.FC<MainPageProps> = ({
  accessToken,
  restaurants,
  setRestaurants,
  ingredients,
  setIngredients,
  foods,
  setFoods,
  exactLocations,
  setExactLocations,
  selectedRestaurants,
  setSelectedRestaurants,
  selectedIngredients,
  setSelectedIngredients,
}) => {
  const [searchParams] = useSearchParams();
  const [showSuccess, setShowSuccess] = useState(false);
  const [isOrganicFilter, setIsOrganicFilter] = useState(false);
  const [isAlcoholFreeFilter, setIsAlcoholFreeFilter] = useState(false);
  const [isGlutenFreeFilter, setIsGlutenFreeFilter] = useState(false);
  const [isLactoseFreeFilter, setIsLactoseFreeFilter] = useState(false);
  const isDataLoaded = React.useRef(false); // Track if data has been loaded

  useEffect(() => {
    if (!isDataLoaded.current) {
      const fetchData = async () => {
        try {
          const [restaurantsResponse, foodsResponse, ingredientsResponse] = await Promise.all([
            fetch('http://localhost:8000/restaurants/'),
            fetch('http://localhost:8000/foods/'),
            fetch('http://localhost:8000/ingredients/'),
          ]);

          if (!restaurantsResponse.ok || !foodsResponse.ok || !ingredientsResponse.ok) {
            throw new Error('Failed to fetch data');
          }

          const restaurantsData = await restaurantsResponse.json();
          const foodsData = await foodsResponse.json();
          const ingredientsData = await ingredientsResponse.json();

          setRestaurants(restaurantsData);
          setFoods(foodsData);
          setIngredients(ingredientsData);

          // Mark data as loaded
          isDataLoaded.current = true;
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      };

      fetchData();
    }
  }, [setRestaurants, setFoods, setIngredients]);

  useEffect(() => {
    // Check for success parameter and show message
    if (searchParams.get('success') === 'true') {
      setShowSuccess(true);
      // Remove success message after 3 seconds
      const timer = setTimeout(() => {
        setShowSuccess(false);
        // Remove the success parameter from URL
        searchParams.delete('success');
        window.history.replaceState({}, '', window.location.pathname);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const toggleRestaurantSelection = (id: number) => {
    setSelectedRestaurants(prevSelected =>
      prevSelected.includes(id)
        ? prevSelected.filter(rid => rid !== id)
        : [...prevSelected, id]
    );
  };

  const toggleIngredientSelection = (id: number) => {
    setSelectedIngredients(prevSelected =>
      prevSelected.includes(id)
        ? prevSelected.filter(iid => iid !== id) // Uncheck the ingredient
        : [...prevSelected, id] // Check the ingredient
    );
  };

  // Filter foods based on selected restaurants, selected ingredients, and additional filters
  const filteredFoods = foods.filter(food => 
    selectedRestaurants.includes(food.restaurant) &&
    food.ingredients.every(ingredientId => selectedIngredients.includes(ingredientId)) &&
    (!isOrganicFilter || food.is_organic) &&
    (!isAlcoholFreeFilter || food.is_alcohol_free) &&
    (!isGlutenFreeFilter || food.is_gluten_free) &&
    (!isLactoseFreeFilter || food.is_lactose_free)
  );

  return (
    <React.Fragment>
      {showSuccess && (
        <div style={{ 
          backgroundColor: '#e6ffe6', 
          padding: '10px', 
          marginBottom: '20px',
          borderRadius: '4px'
        }}>
          Food successfully created!
        </div>
      )}

      {/* Filter Controls */}
      <div className="filters">
        <label>
          <input
            type="checkbox"
            checked={isOrganicFilter}
            onChange={() => setIsOrganicFilter(!isOrganicFilter)}
          />
          Organic
        </label>
        <label>
          <input
            type="checkbox"
            checked={isAlcoholFreeFilter}
            onChange={() => setIsAlcoholFreeFilter(!isAlcoholFreeFilter)}
          />
          Alcohol-Free
        </label>
        <label>
          <input
            type="checkbox"
            checked={isGlutenFreeFilter}
            onChange={() => setIsGlutenFreeFilter(!isGlutenFreeFilter)}
          />
          Gluten-Free
        </label>
        <label>
          <input
            type="checkbox"
            checked={isLactoseFreeFilter}
            onChange={() => setIsLactoseFreeFilter(!isLactoseFreeFilter)}
          />
          Lactose-Free
        </label>
      </div>

      <div className="restaurants-tab">
        {restaurants.map(r => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>{r.name}</span>
            <button onClick={() => toggleRestaurantSelection(r.id)}>
              {selectedRestaurants.includes(r.id) ? '✅' : '❌'}
            </button>
          </div>
        ))}
      </div>

      <div className="ingredients-tab">
        <h3>Ingredients</h3>
        {ingredients.map(ingredient => (
          <div key={ingredient.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>{ingredient.name}</span>
            <button onClick={() => toggleIngredientSelection(ingredient.id)}>
              {selectedIngredients.includes(ingredient.id) ? '✅' : '❌'}
            </button>
          </div>
        ))}
      </div>

      <div className="foods-list">
        {filteredFoods.map(food => (
          <div key={food.id} style={{ 
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '15px'
          }}>
            <h3>{food.name}</h3>
            <div style={{ marginBottom: '10px' }}>
              {food.image ? (
                <img
                  src={`${food.image}`}
                  alt={food.name}
                  style={{
                    maxWidth: '200px',
                    height: 'auto',
                    borderRadius: '4px'
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const noImageText = document.createElement('span');
                    noImageText.textContent = 'No image available';
                    noImageText.style.color = '#666';
                    e.currentTarget.parentNode?.appendChild(noImageText);
                  }}
                />
              ) : (
                <span style={{ color: '#666' }}>No image available</span>
              )}
            </div>
            <p>Restaurant: {restaurants.find(r => r.id === food.restaurant)?.name}</p>
            <p>Ingredients: {food.ingredients.map(i => ingredients.find(ing => ing.id === i)?.name).join(', ')}</p>
          </div>
        ))}
      </div>
    </React.Fragment>
  );
};

export default MainPage;