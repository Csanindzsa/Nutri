import React, { useState, useEffect } from 'react';
import { Food, Ingredient } from './interfaces';
import './assets/ApprovableFoods.css';

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
        const response = await fetch('http://localhost:8000/foods/approvable/', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setFoods(data);
        } else {
          console.error('Failed to fetch approvable foods');
        }
      } catch (error) {
        console.error('Error fetching approvable foods:', error);
      }
    };

    fetchApprovableFoods();
  }, [accessToken]);

  const handleApprove = async (foodId: number) => {
    if (!accessToken) return;

    try {
      const response = await fetch(`http://localhost:8000/food/${foodId}/accept/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        setFoods(prevFoods => 
          prevFoods.map(food => 
            food.id === foodId 
              ? { ...food, approved_supervisors_count: (food.approved_supervisors_count ?? 0) + 1 }
              : food
          )
        );
      } else {
        const errorData = await response.json();
        alert(errorData.detail || 'Failed to approve food');
      }
    } catch (error) {
      console.error('Error approving food:', error);
    }
  };

  const toggleDropdown = (foodId: number) => {
    setOpenDropdownId((prevId) => (prevId === foodId ? null : foodId));
  };

  return (
    <div className="approvable-foods">
      <h1>Foods Pending Approval</h1>
      <div className="foods-grid">
        {foods.map((food) => (
          <div key={food.id} className="food-card">
            <button 
              className="food-trigger"
              onClick={() => toggleDropdown(food.id)}
            >
              <span>{food.name}</span>
            </button>
            {openDropdownId === food.id && (
              <div className="food-dropdown">
                <div className="food-details">
                  <p><strong>Name:</strong> {food.name}</p>
                  <p><strong>Restaurant:</strong> {food.restaurant_name}</p>
                  <p><strong>Approvals:</strong> {food.approved_supervisors_count ?? 0}</p>
                  <p><strong>Organic:</strong> {food.is_organic ? 'Yes' : 'No'}</p>
                  <p><strong>Gluten-Free:</strong> {food.is_gluten_free ? 'Yes' : 'No'}</p>
                  <p><strong>Alcohol-Free:</strong> {food.is_alcohol_free ? 'Yes' : 'No'}</p>
                  <p><strong>Lactose-Free:</strong> {food.is_lactose_free ? 'Yes' : 'No'}</p>
                  <p><strong>Macro Table:</strong></p>
                  <ul>
                    {Object.entries(food.macro_table).map(([key, value]) => (
                      <li key={key}><strong>{key}:</strong> {value}</li>
                    ))}
                  </ul>
                  <p><strong>Ingredients:</strong></p>
                  <ul>
                    {food.ingredients.map((ingredientId) => (
                      <li key={ingredientId}>Ingredient ID: {ingredientId}</li>
                    ))}
                  </ul>
                  {food.image && <img src={food.image} alt={food.name} className="food-image" />}
                  <button 
                    className="approve-button"
                    onClick={() => handleApprove(food.id)}
                  >
                    Approve Food
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApprovableFoods;