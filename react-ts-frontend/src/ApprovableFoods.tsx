import React, { useState, useEffect } from "react";
import { Food } from "./interfaces";
import "./assets/css/ApprovableFoods.css";
import { Link } from "react-router-dom";

interface ApprovableFoodsProps {
  accessToken: string | null;
}

const ApprovableFoods: React.FC<ApprovableFoodsProps> = ({ accessToken }) => {
  const [foods, setFoods] = useState<Food[]>([]);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  useEffect(() => {
    const fetchApprovableFoods = async () => {
      if (!accessToken) return;

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

  const handleApprove = async (foodId: number) => {
    if (!accessToken) return;

    try {
      const response = await fetch(
        `http://localhost:8000/food/${foodId}/accept/`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        setFoods((prevFoods) =>
          prevFoods.map((food) =>
            food.id === foodId
              ? {
                  ...food,
                  approved_supervisors_count:
                    (food.approved_supervisors_count ?? 0) + 1,
                }
              : food
          )
        );
      } else {
        const errorData = await response.json();
        alert(errorData.detail || "Failed to approve food");
      }
    } catch (error) {
      console.error("Error approving food:", error);
    }
  };

  const toggleDropdown = (foodId: number) => {
    console.log(`Toggling dropdown for food ID: ${foodId}`);
    setOpenDropdownId((prevId) => (prevId === foodId ? null : foodId));
  };

  return (
    <div className="approvable-foods">
      <h1>Foods Pending Approval</h1>
      <div className="foods-grid">
        {foods.map((food) => (
          <div key={food.id} className="food-card">
            <Link to={`/approve-food/${food.id}`}>
              <button className="food-trigger">
                <span>{food.name}</span>
              </button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApprovableFoods;
