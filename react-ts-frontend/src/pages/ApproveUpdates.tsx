import React, { useEffect, useState } from "react";
import { FoodChange, Ingredient } from "../interfaces";
import ApproveChange from "../components/ApproveChange";

interface ApproveUpdatesProps {
  accessToken: string | null;
  userId: number | undefined;
  ingredients: Ingredient[];
}

const ApproveUpdates: React.FC<ApproveUpdatesProps> = ({ accessToken, userId, ingredients }) => {
  const [updates, setUpdates] = useState<FoodChange[]>([]);

  useEffect(() => {
    const fetchUpdates = async () => {
      if (!accessToken) return;

      try {
        const response = await fetch("http://localhost:8000/food-changes/updates/", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (response.ok) {
          const data = await response.json();
          setUpdates(data);
        } else {
          console.error("Failed to fetch food updates");
        }
      } catch (error) {
        console.error("Error fetching food updates:", error);
      }
    };

    fetchUpdates();
  }, [accessToken]);

  const handleApprove = (updatedChange: FoodChange) => {
    setUpdates((prevUpdates) =>
      prevUpdates.map((change) => (change.id === updatedChange.id ? updatedChange : change))
    );
  };

  return (
    <div>
      <h2>Approve Food Updates</h2>
      {updates.length === 0 ? (
        <p>No pending food updates.</p>
      ) : (
        <ul>
          {updates.map((change) => (
            <li key={change.id}>
              <ApproveChange
                change={change}
                accessToken={accessToken}
                userId={userId}
                onApprove={handleApprove}
                ingredients={ingredients}
                is_removal={false} // Set is_removal to false for all updates
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ApproveUpdates;