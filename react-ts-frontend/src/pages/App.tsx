import React, { useState, useEffect, useRef } from "react";
import {
  Route,
  Routes,
  Link,
  useNavigate,
  useParams,
  useLocation,
  LinkProps as RouterLinkProps, // Add this import
} from "react-router-dom";
import Register from "./Register";
import Login from "./Login";
import ConfirmEmail from "./ConfirmEmail";
import MainPage from "./MainPage";
import CreateFood from "./CreateFood";
import { Restaurant, Food, Ingredient, ExactLocation } from "../interfaces";
import ApprovableFoods from "./ApprovableFoods";
import ApproveRemovals from "./ApproveRemovals";
import ApproveUpdates from "./ApproveUpdates";
import EditUser from "./EditUser";
import DeleteUser from "./DeleteUser";
import AccountDeleted from "./AccountDeleted";
import FoodList from "./FoodList";
import ApproveFood from "../components/ApproveFood";
import ViewFood from "../components/ViewFood";
import Approvals from "./Approvals";
import NotFound from "./NotFound";
import Forbidden from "./Forbidden";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
  Container,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { styled } from "@mui/material/styles";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import EditIcon from "@mui/icons-material/Edit";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import { Helmet } from "react-helmet";
import MuiAlert from "@mui/material/Alert";

// Import ButtonProps for the type definition
import { ButtonProps } from "@mui/material/Button";

// Import the logo image
import logoImage from "../assets/images/logo.png";

// Add these imports for background components
import { BackgroundProvider } from "../contexts/BackgroundContext";
// Remove this line:
// import BackgroundSettings from "../components/BackgroundSettings";
import Restaurants from "./Restaurants"; // Add this import
import EditFood from "./EditFood"; // Add this import

// Transparent logo container
const LogoContainer = styled("div")({
  marginRight: "16px",
  display: "flex",
  alignItems: "center",
});

// Styling for the transparent logo
const Logo = styled("img")({
  height: "40px",
  filter: "drop-shadow(0px 0px 1px rgba(0,0,0,0.2))", // subtle shadow to help with white parts
  background: "transparent", // ensures background is transparent
});

// Define type that combines ButtonProps, React Router LinkProps, and component prop
type StyledButtonProps = ButtonProps & {
  component?: React.ElementType;
  to?: RouterLinkProps["to"];
};

// Navigation link styling - Updated with combined type
const NavLink = styled(Button)<StyledButtonProps>(({ theme }) => ({
  color: "#ffffff",
  marginRight: theme.spacing(2),
  fontWeight: 500,
  "&:hover": {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
}));

// Auth buttons with slightly different styling - Updated with combined type
const AuthButton = styled(Button)<StyledButtonProps>(({ theme }) => ({
  color: "#ffffff",
  borderColor: "#ffffff",
  marginLeft: theme.spacing(1),
  "&:hover": {
    borderColor: "#ffffff",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
}));

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

const Navbar = ({
  userData,
  handleLogout,
}: {
  userData: any;
  handleLogout: () => void;
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mainMenuAnchor, setMainMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const navigate = useNavigate();

  const handleMainMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMainMenuAnchor(event.currentTarget);
  };

  const handleMainMenuClose = () => {
    setMainMenuAnchor(null);
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  // Navigation items with conditional Create Food - only show when logged in
  const navItems = [
    { name: "Home", path: "/" },
    { name: "Restaurants", path: "/restaurants" }, // Add Restaurants page
    { name: "Foods", path: "/foods" },
    // Only include Create Food if user is logged in
    ...(userData.username
      ? [{ name: "Create Food", path: "/create-food" }]
      : []),
  ];

  // Conditional navigation items based on user role
  if (userData.username) {
    // Replace the three separate approval links with a single entry
    navItems.push({ name: "Approvals", path: "/approvals" });
  }

  // Update the mobile menu navigation logic
  const handleNavigation = (path: string) => {
    handleMainMenuClose();
    // All navigation from navbar is considered valid
    navigate(path);
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: "#FF8C00" }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          {/* Fix the logo path */}
          <LogoContainer>
            <Logo src={logoImage} alt="Nutri Logo" />
          </LogoContainer>

          {/* Website Name */}
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: isMobile ? 1 : 0,
              color: "#fff",
              fontWeight: 600,
              display: { xs: "block", sm: "block" },
            }}
          >
            Nutri
          </Typography>

          {isMobile ? (
            <>
              {/* Mobile menu */}
              <Box sx={{ flexGrow: 1 }} />
              <IconButton
                size="large"
                edge="end"
                color="inherit"
                aria-label="menu"
                onClick={handleMainMenuOpen}
              >
                <MenuIcon />
              </IconButton>
              <Menu
                anchorEl={mainMenuAnchor}
                open={Boolean(mainMenuAnchor)}
                onClose={handleMainMenuClose}
                anchorOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                keepMounted
              >
                {navItems.map((item) => (
                  <MenuItem
                    key={item.name}
                    onClick={() => handleNavigation(item.path)}
                  >
                    {item.name}
                  </MenuItem>
                ))}

                {userData.username ? (
                  [
                    <MenuItem
                      key="profile"
                      onClick={() => {
                        handleMainMenuClose();
                        navigate("/edit-user");
                      }}
                    >
                      <EditIcon fontSize="small" sx={{ mr: 1 }} />
                      Edit Profile
                    </MenuItem>,
                    <MenuItem
                      key="logout"
                      onClick={() => {
                        handleMainMenuClose();
                        handleLogout();
                      }}
                    >
                      <ExitToAppIcon fontSize="small" sx={{ mr: 1 }} />
                      Logout
                    </MenuItem>,
                  ]
                ) : (
                  <>
                    <MenuItem
                      onClick={() => {
                        handleMainMenuClose();
                        navigate("/login");
                      }}
                    >
                      Login
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        handleMainMenuClose();
                        navigate("/register");
                      }}
                    >
                      Register
                    </MenuItem>
                  </>
                )}
              </Menu>
            </>
          ) : (
            <>
              {/* Desktop navigation on the left */}
              <Box sx={{ flexGrow: 1, display: "flex", marginLeft: 2 }}>
                {navItems.map((item) => (
                  <NavLink
                    key={item.name}
                    component={Link}
                    to={item.path}
                    color="inherit"
                  >
                    {item.name}
                  </NavLink>
                ))}
              </Box>

              {/* Login/Register buttons or user info on the right */}
              <Box sx={{ display: "flex", alignItems: "center" }}>
                {userData.username ? (
                  <>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        cursor: "pointer",
                        mr: 2,
                        "&:hover": {
                          backgroundColor: "rgba(255, 255, 255, 0.1)",
                          borderRadius: 1,
                        },
                        py: 0.5,
                        px: 1,
                      }}
                      onClick={handleUserMenuOpen}
                    >
                      <AccountCircleIcon sx={{ mr: 1 }} />
                      <Typography
                        variant="body1"
                        sx={{
                          color: "#fff",
                          mr: 0.5,
                        }}
                      >
                        {userData.username}
                      </Typography>
                      <ArrowDropDownIcon />
                    </Box>

                    {/* User dropdown menu */}
                    <Menu
                      anchorEl={userMenuAnchor}
                      open={Boolean(userMenuAnchor)}
                      onClose={handleUserMenuClose}
                      anchorOrigin={{
                        vertical: "bottom",
                        horizontal: "right",
                      }}
                      transformOrigin={{
                        vertical: "top",
                        horizontal: "right",
                      }}
                    >
                      <MenuItem
                        onClick={() => {
                          handleUserMenuClose();
                          navigate("/edit-user");
                        }}
                      >
                        <EditIcon fontSize="small" sx={{ mr: 1 }} />
                        Edit Profile
                      </MenuItem>
                    </Menu>

                    <AuthButton
                      variant="outlined"
                      color="inherit"
                      onClick={handleLogout}
                      startIcon={<ExitToAppIcon />}
                    >
                      Logout
                    </AuthButton>
                  </>
                ) : (
                  <>
                    <AuthButton
                      variant="text"
                      color="inherit"
                      component={Link}
                      to="/login"
                    >
                      Login
                    </AuthButton>
                    <AuthButton
                      variant="outlined"
                      color="inherit"
                      component={Link}
                      to="/register"
                    >
                      Register
                    </AuthButton>
                  </>
                )}
              </Box>
            </>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

// Main App component
const App = () => {
  // ... existing state declarations and useEffects ...
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
  const [notificationMessage, setNotificationMessage] = useState<{
    text: string;
    type: "success" | "error" | "info" | "warning";
  } | null>(null);

  // ... existing useEffects, token refresh logic and data fetching ...

  useEffect(() => {
    console.log("Updated userData:", userData);
  }, [userData]);

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
            if (newDecoded) {
              setUserData({
                user_id: newDecoded.user_id,
                username: newDecoded.username,
                email: newDecoded.email,
              });
            }
          }
        });
      }
    }, 300000);

    return () => clearInterval(intervalId);
  }, [refreshToken, navigate]);

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
    if (!accessToken) {
      setNotificationMessage({
        text: "Please log in to approve foods",
        type: "warning",
      });
      return;
    }

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
        // Update foods state
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
        return true;
      } else {
        const errorText = await response.text();
        let errorMessage = "Failed to approve food";

        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.detail || errorMessage;
        } catch (e) {
          console.error("Error parsing JSON:", e);
        }

        setNotificationMessage({ text: errorMessage, type: "error" });
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Error approving food:", error);
      throw error;
    }
  };

  const handleCloseNotification = () => {
    setNotificationMessage(null);
  };

  const handleLogout = () => {
    // Clear tokens and user data
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setAccessToken(null);
    setRefreshToken(null);
    setUserData({});
    navigate("/login");
  };

  return (
    <BackgroundProvider>
      <div className="App">
        <Helmet>
          <title>Nutri - Your Dietary Aid</title>
          <link rel="icon" href={logoImage} />
          <meta
            name="description"
            content="Nutri - Your Dietary Aid Application"
          />
          <meta property="og:image" content={logoImage} />
        </Helmet>

        <Navbar userData={userData} handleLogout={handleLogout} />

        <Routes>
          {/* ... existing routes ... */}
          <Route
            path="/"
            element={
              <MainPage
                foods={foods}
                restaurants={restaurants}
                ingredients={ingredients}
                selectedRestaurants={selectedRestaurants}
                setSelectedRestaurants={setSelectedRestaurants}
                selectedIngredients={selectedIngredients}
                setSelectedIngredients={setSelectedIngredients}
                accessToken={accessToken}
                setRestaurants={setRestaurants}
                setIngredients={setIngredients}
                setFoods={setFoods}
                exactLocations={exactLocations || []}
                setExactLocations={setExactLocations}
              />
            }
          />

          {/* Add Restaurants route */}
          <Route
            path="/restaurants"
            element={<Restaurants restaurants={restaurants} />}
          />

          <Route
            path="/foods"
            element={
              <FoodList
                accessToken={accessToken}
                restaurants={restaurants}
                ingredients={ingredients}
                foods={foods}
                selectedRestaurants={selectedRestaurants}
                setSelectedRestaurants={setSelectedRestaurants}
                selectedIngredients={selectedIngredients}
                setSelectedIngredients={setSelectedIngredients}
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
                setUserData={setUserData}
              />
            }
          />
          <Route path="/confirm-email/:key" element={<ConfirmEmail />} />
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
          <Route
            path="/approvable-foods"
            element={
              <ApprovableFoods
                accessToken={accessToken}
                foods={foods}
                handleApprove={handleApprove}
              />
            }
          />
          <Route
            path="/approve-removals"
            element={
              <ApproveRemovals
                accessToken={accessToken}
                userId={userData.user_id}
                ingredients={ingredients}
              />
            }
          />
          <Route
            path="/approve-updates"
            element={
              <ApproveUpdates
                accessToken={accessToken}
                userId={userData.user_id}
                ingredients={ingredients}
              />
            }
          />
          <Route
            path="/edit-user"
            element={
              <EditUser
                accessToken={accessToken}
                userData={userData}
                setUserData={setUserData}
              />
            }
          />
          <Route
            path="/delete-user"
            element={
              <DeleteUser
                accessToken={accessToken}
                handleLogout={handleLogout}
              />
            }
          />
          <Route path="/account-deleted" element={<AccountDeleted />} />
          <Route
            path="/approve-food/:foodId"
            element={
              <ApproveFoodPage
                accessToken={accessToken}
                userId={userData.user_id}
                ingredients={ingredients}
                foods={foods}
                handleApprove={handleApprove}
                showApproveButton={true}
              />
            }
          />
          <Route
            path="/food/:foodId"
            element={
              <ViewFoodPage
                ingredients={ingredients}
                foods={foods}
                accessToken={accessToken} // Pass accessToken
              />
            }
          />
          <Route
            path="/food/:foodId/edit"
            element={
              <EditFood
                accessToken={accessToken}
                restaurants={restaurants}
                ingredients={ingredients}
                onUpdateFood={(updatedFood) => {
                  // Update the foods state with the edited food
                  setFoods((prevFoods) =>
                    prevFoods.map((food) =>
                      food.id === updatedFood.id ? updatedFood : food
                    )
                  );
                }}
              />
            }
          />
          <Route
            path="/approvals"
            element={
              <Approvals accessToken={accessToken} userId={userData.user_id} />
            }
          />
          <Route path="/forbidden" element={<Forbidden />} />
          <Route path="*" element={<NotFound />} />
        </Routes>

        {/* Global notification system */}
        <Snackbar
          open={!!notificationMessage}
          autoHideDuration={6000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <MuiAlert
            elevation={6}
            variant="filled"
            onClose={handleCloseNotification}
            severity={notificationMessage?.type || "info"}
            sx={{ width: "100%" }}
          >
            {notificationMessage?.text}
          </MuiAlert>
        </Snackbar>

        {/* Remove the BackgroundSettings control below */}
        {/* <BackgroundSettings /> */}
      </div>
    </BackgroundProvider>
  );
};

// Create a wrapper component to handle fetching the specific food data
const ApproveFoodPage: React.FC<{
  accessToken: string | null;
  userId: number | undefined;
  ingredients: Ingredient[];
  foods: Food[];
  handleApprove: (foodId: number) => void;
  showApproveButton?: boolean;
}> = ({
  accessToken,
  userId,
  ingredients,
  foods,
  handleApprove,
  showApproveButton = true,
}) => {
  const { foodId } = useParams<{ foodId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [food, setFood] = useState<Food | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState<boolean>(false);

  // Check for proper navigation or direct link (which is allowed for view)
  useEffect(() => {
    // Allow direct navigation to food details, but require auth for approvals
    if (showApproveButton && !accessToken) {
      navigate("/forbidden"); // Changed from /login to /forbidden
      return;
    }

    setAuthorized(true);

    // Continue with food fetching
    const fetchFoodDetails = async () => {
      if (!foodId) return;

      // First try to find the food in our existing foods array
      const existingFood = foods.find((f) => f.id === parseInt(foodId));

      if (existingFood) {
        setFood(existingFood);
        setLoading(false);
        return;
      }

      // If not found, fetch it from the API
      try {
        const response = await fetch(`http://localhost:8000/foods/${foodId}/`);
        if (response.ok) {
          const foodData = await response.json();
          setFood(foodData);
        } else {
          setError("Food not found");
        }
      } catch (error) {
        console.error("Error fetching food details:", error);
        setError("Failed to load food details");
      } finally {
        setLoading(false);
      }
    };

    if (authorized) {
      fetchFoodDetails();
    }
  }, [foodId, foods, accessToken, showApproveButton, navigate, authorized]);

  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !food) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error || "Food not found"}</Alert>
      </Container>
    );
  }

  return (
    <ApproveFood
      food={food}
      accessToken={accessToken}
      userId={userId}
      ingredients={ingredients}
      onApprove={() => {
        handleApprove(food.id);
      }}
      showApproveButton={showApproveButton}
    />
  );
};

// Create a wrapper component for ViewFood
const ViewFoodPage: React.FC<{
  ingredients: Ingredient[];
  foods: Food[];
  accessToken?: string | null; // Add accessToken prop
}> = ({ ingredients, foods, accessToken }) => {
  const { foodId } = useParams<{ foodId: string }>();
  const [food, setFood] = useState<Food | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFoodDetails = async () => {
      if (!foodId) return;

      // First try to find the food in our existing foods array
      const existingFood = foods.find((f) => f.id === parseInt(foodId));

      if (existingFood) {
        setFood(existingFood);
        setLoading(false);
        return;
      }

      // If not found, fetch it from the API
      try {
        const response = await fetch(`http://localhost:8000/foods/${foodId}/`);
        if (response.ok) {
          const foodData = await response.json();
          setFood(foodData);
        } else {
          setError("Food not found");
        }
      } catch (error) {
        console.error("Error fetching food details:", error);
        setError("Failed to load food details");
      } finally {
        setLoading(false);
      }
    };

    fetchFoodDetails();
  }, [foodId, foods]);

  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !food) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error || "Food not found"}</Alert>
      </Container>
    );
  }

  return (
    <ViewFood food={food} ingredients={ingredients} accessToken={accessToken} />
  ); // Pass accessToken to ViewFood
};

export default App;
