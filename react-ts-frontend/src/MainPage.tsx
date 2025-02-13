import React, { useEffect } from 'react';
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

  // Filter foods based on selected restaurants and selected ingredients
  const filteredFoods = foods.filter(food => 
    selectedRestaurants.includes(food.restaurant) &&
    food.ingredients.every(ingredientId => selectedIngredients.includes(ingredientId))
  );

  return (
    <React.Fragment>
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
          <div key={food.id}>
            <h3>{food.name}</h3>
            <p>Restaurant: {restaurants.find(r => r.id === food.restaurant)?.name}</p>
            <p>Ingredients: {food.ingredients.map(i => ingredients.find(ing => ing.id === i)?.name).join(', ')}</p>
          </div>
        ))}
      </div>
    </React.Fragment>
  );
};

export default MainPage;