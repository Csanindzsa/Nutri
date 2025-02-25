import React, { useState, useEffect } from "react";
import { FoodChange } from "../interfaces";

interface ApproveChangeProps {
  change: FoodChange;
  accessToken: string | null;
  userId: number | undefined;
  onApprove: (updatedChange: FoodChange) => void;
  is_removal: boolean;
}

const ApproveChange: React.FC<ApproveChangeProps> = ({ change, accessToken, userId, onApprove, is_removal }) => {
  const [isUserApproved, setIsUserApproved] = useState<boolean>(false);
  const [approvedCount, setApprovedCount] = useState<number>(change.new_approved_supervisors_count ?? 0);

  // Initialize isUserApproved based on new_approved_supervisors
  useEffect(() => {
    if (change.new_approved_supervisors && userId) {
      setIsUserApproved(change.new_approved_supervisors.includes(userId));
    }
  }, [change.new_approved_supervisors, userId]);

  const handleApprove = async () => {
    if (!accessToken || !userId) return;

    try {
      const response = await fetch(`http://localhost:8000/food-changes/${change.id}/approve-removal/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const updatedChange = await response.json();
        alert(is_removal ? "Removal approved successfully" : "Change approved successfully");

        // Update local state
        setIsUserApproved(true);
        setApprovedCount(updatedChange.new_approved_supervisors_count ?? approvedCount + 1);
        onApprove(updatedChange);
      } else {
        const errorData = await response.json();
        alert(errorData.detail || "Failed to approve change");
      }
    } catch (error) {
      console.error("Error approving change:", error);
    }
  };

  const renderApprovalStatus = () => {
    if (!accessToken) {
      return <p>Please log in to approve</p>;
    }

    if (isUserApproved) {
      return <p>✓ Already approved</p>;
    }

    return <button onClick={handleApprove}>Approve</button>;
  };

  return (
    <div>
      <div>
        <div>
          {change.new_image && (
            <img
              src={change.new_image || "/default-image.jpg"}
              alt={change.new_name}
              className="food-image"
            />
          )}

          <div>
            <p>
              <strong>Name:</strong> {change.new_name}
            </p>
            <p>
              <strong>Restaurant:</strong> {change.new_restaurant_name}
            </p>

            <div>
              <span>{change.new_is_organic ? "✓" : "✗"} Organic</span>
              <span>{change.new_is_gluten_free ? "✓" : "✗"} Gluten-Free</span>
              <span>{change.new_is_alcohol_free ? "✓" : "✗"} Alcohol-Free</span>
              <span>{change.new_is_lactose_free ? "✓" : "✗"} Lactose-Free</span>
            </div>

            <p>
              <strong>Ingredients:</strong> {change.new_ingredients.join(", ")}
            </p>

            <p>
              <strong>Approved by:</strong> {approvedCount} supervisor{approvedCount !== 1 ? "s" : ""}
            </p>

            <div>{renderApprovalStatus()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApproveChange;