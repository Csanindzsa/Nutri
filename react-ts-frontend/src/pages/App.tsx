import React, { useState, useEffect, useRef } from "react";
import { Route, Routes, Link, useNavigate } from "react-router-dom";
import Register from "./Register";
import Login from "./Login";
import ConfirmEmail from "./ConfirmEmail";
import MainPage from "./MainPage";
import CreateFood from "./CreateFood";
import { Restaurant, Food, Ingredient, ExactLocation } from "../interfaces";
import ApprovableFoods from "./ApprovableFoods";
import ApproveRemovals from "./ApproveRemovals";
// import ApproveFood from "./ApproveFood";

// Function to decode JWT token
const decodeToken = (token: string) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload;
  } catch (err) {
    console.error("Error decoding token:", err);
    return null;
  }
};

const refreshAccessToken = async (refreshToken: string | null) => {
  if (!refreshToken) return null;

  try {
    const response = await fetch("http://localhost:8000/token/refresh/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.access;
    } else {
      return null;
    }
  } catch (err) {
    console.error("Error refreshing access token:", err);
    return null;
  }
};

const App = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [userData, setUserData] = useState<{
    user_id?: number;
    username?: string;
    email?: string;
  }>({});
  const [restaurants, setRestaurants] = useState<Array<Restaurant>>([]);
  const [exactLocations, setExactLocations] = useState<ExactLocation[]>([]);
  const [ingredients, setIngredients] = useState<Array<Ingredient>>([]);
  const [foods, setFoods] = useState<Array<Food>>([]);
  const [selectedRestaurants, setSelectedRestaurants] = useState<number[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<number[]>([]);
  const isDataLoaded = useRef(false); // Track if data has been loaded
  const navigate = useNavigate();

  useEffect(() => {
    const storedAccessToken = localStorage.getItem("access_token");
    const storedRefreshToken = localStorage.getItem("refresh_token");

    if (storedAccessToken && storedRefreshToken) {
      setAccessToken(storedAccessToken);
      setRefreshToken(storedRefreshToken);
      const decoded = decodeToken(storedAccessToken);
      if (decoded) {
        setUserData({
          user_id: decoded.user_id,
          username: decoded.username,
          email: decoded.email,
        });
      }
      refreshAccessToken(storedRefreshToken).then((newAccessToken) => {
        if (newAccessToken) {
          setAccessToken(newAccessToken);
          localStorage.setItem("access_token", newAccessToken);
          const newDecoded = decodeToken(newAccessToken);
          if (newDecoded) {
            setUserData({
              user_id: newDecoded.user_id,
              username: newDecoded.username,
              email: newDecoded.email,
            });
          }
        } else {
          navigate("/login");
        }
      });
    }
  }, [navigate]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (refreshToken) {
        refreshAccessToken(refreshToken).then((newAccessToken) => {
          if (newAccessToken) {
            setAccessToken(newAccessToken);
            localStorage.setItem("access_token", newAccessToken);
            const newDecoded = decodeToken(newAccessToken);
            console.log("decoded token: ", newDecoded);
            if (newDecoded) {
              setUserData({
                user_id: newDecoded.user_id,
                username: newDecoded.username,
                email: newDecoded.email,
              });
            }
          } else {
            navigate("/login");
          }
        });
      }
    }, 300000);

    return () => clearInterval(intervalId);
  }, [refreshToken, navigate]);

  // Fetch data only if it hasn't been loaded before
  useEffect(() => {
    if (!isDataLoaded.current) {
      const fetchData = async () => {
        try {
          const [restaurantsResponse, foodsResponse, ingredientsResponse] =
            await Promise.all([
              fetch("http://localhost:8000/restaurants/"),
              fetch("http://localhost:8000/foods/"),
              fetch("http://localhost:8000/ingredients/"),
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

          // Initialize selectedRestaurants only if it is empty
          if (selectedRestaurants.length === 0) {
            setSelectedRestaurants(
              restaurantsData.map((r: Restaurant) => r.id)
            );
          }

          // Initialize selectedIngredients only if it is empty
          if (selectedIngredients.length === 0) {
            setSelectedIngredients(
              ingredientsData.map((i: Ingredient) => i.id)
            );
          }

          isDataLoaded.current = true; // Mark data as loaded
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      };

      fetchData();
    }
  }, [selectedRestaurants, selectedIngredients]);

  const handleApprove = async (foodId: number) => {
    if (!accessToken) return;

    try {
      const response = await fetch(
        `http://localhost:8000/food/${foodId}/accept/`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ is_approved: 1 }),
        }
      );

      if (response.ok) {
        // console.log("Food approved successfully");
        // alert("Food approved successfully");
        navigate("/approvable-foods");
        setFoods((prevFoods) =>
          prevFoods.map((food) =>
            food.id === foodId
              ? {
                  ...food,
                  approved_supervisors_count:
                    (food.approved_supervisors_count ?? 0) + 1,
                  is_approved: 1,
                }
              : food
          )
        );
      } else {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          alert(errorData.detail || "Failed to approve food");
        } catch (e) {
          console.error("Error parsing JSON:", e);
          alert("Failed to approve food");
        }
      }
    } catch (error) {
      console.error("Error approving food:", error);
    }
  };

  return (
    <div>
      <h2>Account:</h2>
      {accessToken ? (
        <div>
          <p>
            <strong>User ID:</strong> {userData.user_id}
          </p>
          <p>
            <strong>Username:</strong> {userData.username}
          </p>
          <p>
            <strong>Email:</strong> {userData.email}
          </p>
        </div>
      ) : (
        <p>Please log in to see your account details.</p>
      )}

      <h2>Debug-links:</h2>
      <nav>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/register">Register</Link>
          </li>
          <li>
            <Link to="/login">Login</Link>
          </li>
          <li>
            <Link to="/create-food">Create Food</Link>
          </li>
          <li>
            <Link to="/approvable-foods">Approvable Foods</Link>
          </li>
          <li>
            <Link to="/approve-removals">Approve Removals</Link>
          </li>
        </ul>
      </nav>

      <Routes>
        <Route
          path="/"
          element={
            <MainPage
              accessToken={accessToken}
              restaurants={restaurants}
              setRestaurants={setRestaurants}
              ingredients={ingredients}
              setIngredients={setIngredients}
              foods={foods}
              setFoods={setFoods}
              exactLocations={exactLocations}
              setExactLocations={setExactLocations}
              selectedRestaurants={selectedRestaurants}
              setSelectedRestaurants={setSelectedRestaurants}
              selectedIngredients={selectedIngredients}
              setSelectedIngredients={setSelectedIngredients}
            />
          }
        />
        <Route
          path="/create-food"
          element={
            <CreateFood
              accessToken={accessToken}
              restaurants={restaurants}
              ingredients={ingredients}
              onCreateFood={(newFood) =>
                setFoods((prevFoods) => [...prevFoods, newFood])
              }
            />
          }
        />
        <Route path="/register" element={<Register />} />
        <Route
          path="/login"
          element={
            <Login
              setAccessToken={setAccessToken}
              setRefreshToken={setRefreshToken}
            />
          }
        />
        <Route path="/confirm-email/:token" element={<ConfirmEmail />} />
        <Route
          path="/approvable-foods"
          element={<ApprovableFoods userId={userData.user_id} accessToken={accessToken} />}
        />
        {/* <Route
          path="/approve-food/:foodId"
          element={<ApproveFood handleApprove={handleApprove} />}
        /> */}
        <Route
          path="/approve-removals" // Step 2: Define the new route
          element={<ApproveRemovals accessToken={accessToken} userId={userData.user_id}/>} // Step 3: Pass accessToken
        />
      </Routes>
    </div>
  );
};

export default App;
