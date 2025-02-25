import React, { useEffect, useState } from "react";
import { FoodChange, Ingredient } from "../interfaces";
import ApproveChange from "../components/ApproveChange";

interface ApproveRemovalsProps {
    accessToken: string | null; 
    userId: number | undefined; 
    ingredients: Ingredient[];
}

const ApproveRemovals: React.FC<ApproveRemovalsProps> = ({ accessToken, userId, ingredients }) => {
  const [removals, setRemovals] = useState<FoodChange[]>([]);

  useEffect(() => {
    const fetchRemovals = async () => {
      if (!accessToken) return;

      try {
        const response = await fetch("http://localhost:8000/food-changes/deletions/", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (response.ok) {
          const data = await response.json();
          setRemovals(data);
        } else {
          console.error("Failed to fetch food removals");
        }
      } catch (error) {
        console.error("Error fetching food removals:", error);
      }
    };

    fetchRemovals();
  }, [accessToken]);

  const handleApprove = (updatedChange: FoodChange) => {
    setRemovals((prevRemovals) =>
      prevRemovals.map((change) => (change.id === updatedChange.id ? updatedChange : change))
    );
  };

  return (
    <div>
      <h2>Approve Food Removals</h2>
      {removals.length === 0 ? (
        <p>No pending food removals.</p>
      ) : (
        <ul>
          {removals.map((change) => (
            <li key={change.id}>
              <ApproveChange
                change={change}
                accessToken={accessToken}
                userId={userId}
                onApprove={handleApprove}
                ingredients={ingredients}
                is_removal={true} // Set is_removal to true for all removals
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ApproveRemovals;