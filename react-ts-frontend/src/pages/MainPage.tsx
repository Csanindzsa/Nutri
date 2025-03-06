import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Restaurant, Food, Ingredient, ExactLocation } from "../interfaces";
import WelcomeSection from "../components/WelcomeSection";
import { Box } from "@mui/material"; // Remove Container import
import {API_BASE_URL} from "../config/environment";

// Fix interface to match all possible props
interface MainPageProps {
  restaurants: Restaurant[];
  ingredients: Ingredient[];
  foods: Food[];
  selectedRestaurants: number[];
  setSelectedRestaurants: React.Dispatch<React.SetStateAction<number[]>>;
  selectedIngredients: number[];
  setSelectedIngredients: React.Dispatch<React.SetStateAction<number[]>>;
  // Optional props with defaults
  accessToken?: string | null;
  setRestaurants?: React.Dispatch<React.SetStateAction<Restaurant[]>>;
  setIngredients?: React.Dispatch<React.SetStateAction<Ingredient[]>>;
  setFoods?: React.Dispatch<React.SetStateAction<Food[]>>;
  exactLocations?: ExactLocation[];
  setExactLocations?: React.Dispatch<React.SetStateAction<ExactLocation[]>>;
}

const MainPage: React.FC<MainPageProps> = ({
  restaurants,
  ingredients,
  foods,
  selectedRestaurants,
  setSelectedRestaurants,
  selectedIngredients,
  setSelectedIngredients,
  // Optional props with defaults
  accessToken,
  setRestaurants = () => {},
  setIngredients = () => {},
  setFoods = () => {},
  exactLocations = [],
  setExactLocations = () => {},
}) => {
  const isDataLoaded = React.useRef(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Clean up URL parameters if needed
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.has("success")) {
      navigate("/", { replace: true });
    }
  }, [location, navigate]);

  // Fetch data only if needed and the setter functions are provided
  useEffect(() => {
    if (!isDataLoaded.current && setRestaurants && setFoods && setIngredients) {
      const fetchData = async () => {
        try {
          const [restaurantsResponse, foodsResponse, ingredientsResponse] =
            await Promise.all([
              fetch(`${API_BASE_URL}/restaurants/`),
              fetch(`${API_BASE_URL}/foods/`),
              fetch(`${API_BASE_URL}/ingredients/`),
            ]);

          if (
            !restaurantsResponse.ok ||
            !foodsResponse.ok ||
            !ingredientsResponse.ok
          ) {
            throw new Error("Failed to fetch data");
          }

          const restaurantsData = await restaurantsResponse.json();
          const foodsData = await foodsResponse.json();
          const ingredientsData = await ingredientsResponse.json();

          setRestaurants(restaurantsData);
          setFoods(foodsData);
          setIngredients(ingredientsData);

          isDataLoaded.current = true;
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      };

      fetchData();
    }
  }, [setRestaurants, setFoods, setIngredients]);

  return (
    // Remove the Container component to allow full width
    <Box sx={{ width: "100%" }}>
      {/* WelcomeSection will now have full width */}
      <WelcomeSection restaurants={restaurants || []} />
    </Box>
  );
};

export default MainPage;
