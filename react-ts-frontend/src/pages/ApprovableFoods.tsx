import React, { useState, useEffect } from "react";
import { Food } from "../interfaces";
import "../assets/css/ApprovableFoods.css";
import { Link, useNavigate } from "react-router-dom";
import ApproveFood from "../components/ApproveFood";

interface ApprovableFoodsProps {
  accessToken: string | null;
}


const ApprovableFoods: React.FC<ApprovableFoodsProps> = ({ accessToken }) => {
  const [foods, setFoods] = useState<Food[]>([]);
  // const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {

    console.log("useffect ran");
    const fetchApprovableFoods = async () => {
      if (!accessToken){
        console.log("access token not found");
        return;
      };

      try {
        const response = await fetch(
          "http://localhost:8000/foods/approvable/",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (response.ok) {
          
          const data = await response.json();
          console.log(data);
          setFoods(data);
        } else {
          console.error("Failed to fetch approvable foods");
        }
      } catch (error) {
        console.error("Error fetching approvable foods:", error);
      }
    };

    fetchApprovableFoods();
  }, [accessToken]);


  return (
    <div className="approvable-foods">
      <h1>Foods Pending Approval</h1>
      <div className="foods-grid">
        {foods.map((food) => (
          <div key={food.id} className="food-card">
            <ApproveFood food={food} accessToken={accessToken}  />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApprovableFoods;
