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
  setExactLocations
}) => {
  
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await fetch('http://localhost:8000/restaurants/');
        if (!response.ok) throw new Error('Failed to fetch restaurants');
        const data: Restaurant[] = await response.json();
        setRestaurants(data);
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
      } catch (error) {
        console.error('Error fetching foods:', error);
      }
    };

    fetchRestaurants();
    fetchFoods();
  }, [setRestaurants, setFoods]); // Dependencies to ensure re-fetching only when necessary

  return (
  <React.Fragment>
    <div className="restaurants-tab">
      {restaurants.map(r=><span>{r.name}</span>)}
    </div>
    <div className="ingredients-filter">
      
    </div>
    
  </React.Fragment>


  );
};

export default MainPage;
