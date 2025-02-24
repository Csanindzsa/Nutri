import React, { useState, useEffect } from "react";
import { Food } from "../interfaces";
import "../assets/css/ApprovableFoods.css";
import { Link, useNavigate } from "react-router-dom";
import ApproveFood from "../components/ApproveFood";

interface ApprovableFoodsProps {
  accessToken: string | null;
  userId: number | undefined;
}

const ApprovableFoods: React.FC<ApprovableFoodsProps> = ({ accessToken, userId }) => {
  const [foods, setFoods] = useState<Food[]>([]); // Array of Food objects
  const navigate = useNavigate();

  useEffect(() => {
    console.log("useEffect ran");
    const fetchApprovableFoods = async () => {
      if (!accessToken) {
        console.log("access token not found");
        return;
      }

      try {
        const response = await fetch("http://localhost:8000/foods/approvable/", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log(data);
          setFoods(data); // Set the array of approvable foods
        } else {
          console.error("Failed to fetch approvable foods");
        }
      } catch (error) {
        console.error("Error fetching approvable foods:", error);
      }
    };

    fetchApprovableFoods();
  }, [accessToken]);

  // Function to update the approved status of a food item
  const handleFoodApproval = (foodId: number, updatedFood: Food) => {
    setFoods((prevFoods) =>
      prevFoods.map((food) =>
        food.id === foodId ? { ...food, ...updatedFood } : food
      )
    );
  };

  return (
    <div className="approvable-foods">
      <h1>Foods Pending Approval</h1>
      <div className="foods-grid">
        {foods.map((food) => (
          <div key={food.id} className="food-card">
            <ApproveFood
              food={food}
              accessToken={accessToken}
              userId={userId} // Replace with the actual user ID from your app
              onApprove={(updatedFood) => handleFoodApproval(food.id, updatedFood)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApprovableFoods;