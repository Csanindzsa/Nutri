import React, { useEffect, useState } from 'react';
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
  setSelectedRestaurants
}) => {
  const [ingredientFoodMap, setIngredientFoodMap] = useState<{ [key: number]: number[] }>({});
  const [selectedIngredients, setSelectedIngredients] = useState<number[]>([]);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await fetch('http://localhost:8000/restaurants/');
        if (!response.ok) throw new Error('Failed to fetch restaurants');
        const data: Restaurant[] = await response.json();
        setRestaurants(data);
        setSelectedRestaurants(data.map(r => r.id)); // Initialize selected restaurants
      } catch (error) {
        console.error('Error fetching restaurants:', error);
      }
    };

    const fetchFoods = async () => {
      try {
        const response = await fetch('http://localhost:8000/foods/');
        if (!response.ok) throw new Error('Failed to fetch foods');
        const data: Food[] = await response.json();
        setFoods(data);
        
        // Create ingredient-food mapping
        const ingredientMap: { [key: number]: number[] } = {};
        data.forEach(food => {
          food.ingredients.forEach(ingredient => {
            if (!ingredientMap[ingredient.id]) {
              ingredientMap[ingredient.id] = [];
            }
            ingredientMap[ingredient.id].push(food.id);
          });
        });
        setIngredientFoodMap(ingredientMap);
      } catch (error) {
        console.error('Error fetching foods:', error);
      }
    };

    const fetchIngredients = async () => {
      try {
        const response = await fetch('http://localhost:8000/ingredients/');
        if (!response.ok) throw new Error('Failed to fetch ingredients');
        const data: Ingredient[] = await response.json();
        setIngredients(data);
        setSelectedIngredients(data.map(i => i.id)); // Initialize selected ingredients
      } catch (error) {
        console.error('Error fetching ingredients:', error);
      }
    };

    fetchRestaurants();
    fetchFoods();
    fetchIngredients();
  }, [setRestaurants, setFoods, setIngredients, setSelectedRestaurants]);

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
        ? prevSelected.filter(iid => iid !== id)
        : [...prevSelected, id]
    );
  };

  // Filter foods based on selected restaurants and ingredients
  const filteredFoods = foods.filter(food => 
    selectedRestaurants.includes(food.restaurant) &&
    food.ingredients.every(ingredient => selectedIngredients.includes(ingredient.id))
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

      <div className="ingredients-filter">
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
            <p>Ingredients: {food.ingredients.map(i => i.name).join(', ')}</p>
          </div>
        ))}
      </div>
    </React.Fragment>
  );
};

export default MainPage;
