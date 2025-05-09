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
import { User, Restaurant, Food, Ingredient } from "../interfaces";
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
import decodeToken from "../utils/decodeToken";
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
import { Helmet, HelmetProvider } from "react-helmet-async"; // Updated import
import MuiAlert from "@mui/material/Alert";

// Add this missing import
import { API_ENDPOINTS, API_BASE_URL } from "../config/environment";

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
import Support from "./Support"; // Add this import
import SupportIcon from "@mui/icons-material/Support"; // Add this import

// import styled from "styled-components";



// Transparent logo container
const LogoContainer = styled("div")({
  marginRight: "16px",
  display: "flex",
  alignItems: "center",
  cursor: "pointer",
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




const refreshAccessToken = async (refreshToken: string | null) => {
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/token/refresh/`, {
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
  if (userData.is_supervisor) {
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
            <Logo src={logoImage} alt="Nutri Logo" onClick={()=>handleNavigation("/")}/>
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
              cursor: "pointer",
            }}
            onClick={()=>handleNavigation("/")}
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
                      key="support"
                      onClick={() => {
                        handleMainMenuClose();
                        navigate("/support");
                      }}
                    >
                      <SupportIcon fontSize="small" sx={{ mr: 1 }} />
                      Support
                    </MenuItem>,
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
                          navigate("/support");
                        }}
                      >
                        <SupportIcon fontSize="small" sx={{ mr: 1 }} />
                        Support
                      </MenuItem>
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
import ProtectedRoute from "../components/ProtectedRoute";

const App = () => {
  // ... existing state declarations and useEffects ...
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [userData, setUserData] = useState<{
    user_id?: number;
    username?: string;
    email?: string;
    is_supervisor?: boolean;
  }>({});
  const [restaurants, setRestaurants] = useState<Array<Restaurant>>([]);
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
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);

  // ... existing useEffects, token refresh logic and data fetching ...

  useEffect(() => {
    console.log("Updated userData:", userData);
  }, [userData]);

  useEffect(() => {
    const validateAndRefreshToken = async () => {
      setCheckingAuth(true);
      const storedAccessToken = localStorage.getItem("access_token");
      const storedRefreshToken = localStorage.getItem("refresh_token");

      if (storedAccessToken && storedRefreshToken) {
        // Set tokens in state first
        setAccessToken(storedAccessToken);
        setRefreshToken(storedRefreshToken);

        try {
          // Try to verify the access token
          const verifyResponse = await fetch(API_ENDPOINTS.tokenVerify, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: storedAccessToken }),
          });

          if (verifyResponse.ok) {
            // Token is valid, decode and set user data
            const decoded = decodeToken(storedAccessToken);
            if (decoded) {
              setUserData({
                user_id: decoded.user_id,
                username: decoded.username,
                email: decoded.email,
                is_supervisor: decoded.is_supervisor,
              });
            }
          } else {
            // Token invalid, try to refresh
            console.log("Access token invalid, attempting refresh...");
            const newAccessToken = await refreshAccessToken(storedRefreshToken);

            if (newAccessToken) {
              // Got new token, update state and localStorage
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
              // Refresh failed, clear tokens
              console.log("Token refresh failed, logging out");
              localStorage.removeItem("access_token");
              localStorage.removeItem("refresh_token");
              setAccessToken(null);
              setRefreshToken(null);
              setUserData({});
            }
          }
        } catch (error) {
          console.error("Error validating token:", error);
          // Clear tokens on error
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          setAccessToken(null);
          setRefreshToken(null);
          setUserData({});
        }
      }

      setCheckingAuth(false);
    };

    validateAndRefreshToken();
  }, []);

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
                is_supervisor: newDecoded.is_supervisor,
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
              fetch(API_ENDPOINTS.restaurants),
              fetch(API_ENDPOINTS.foods),
              fetch(API_ENDPOINTS.ingredients),
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
      const response = await fetch(API_ENDPOINTS.acceptFood(foodId), {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_approved: 1 }),
      });

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
    <HelmetProvider>
      <BackgroundProvider>
        <div className="App">
          <Helmet>
            <title>Nutri - Your Dietary Aid</title>
            <link rel="icon" href="/favicon.ico" />{" "}
            {/* Update this line to use favicon.ico */}
            <meta
              name="description"
              content="Nutri - Your Dietary Aid Application"
            />
            <meta property="og:image" content={logoImage} />
          </Helmet>

          <Navbar userData={userData} handleLogout={handleLogout} />

          <Routes>
            {/* Public routes */}
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
                />
              }
            />
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
            <Route path="/confirm-email/:token" element={<ConfirmEmail />} />
            <Route path="/account-deleted" element={<AccountDeleted />} />
            <Route path="/forbidden" element={<Forbidden />} />
            <Route path="*" element={<NotFound />} />

            {/* Protected routes with authentication check */}
            {/* Edit-user route */}
            <Route
              path="/edit-user"
              element={
                <ProtectedRoute
                  accessToken={accessToken}
                  checkingAuth={checkingAuth}
                >
                  <EditUser
                    accessToken={accessToken}
                    userData={userData}
                    setUserData={setUserData}
                  />
                </ProtectedRoute>
              }
            />

            {/* Delete user route */}
            <Route
              path="/delete-user"
              element={
                <ProtectedRoute
                  accessToken={accessToken}
                  checkingAuth={checkingAuth}
                >
                  <DeleteUser
                    accessToken={accessToken}
                    handleLogout={handleLogout}
                  />
                </ProtectedRoute>
              }
            />

            {/* Create food route */}
            <Route
              path="/create-food"
              element={
                <ProtectedRoute
                  accessToken={accessToken}
                  checkingAuth={checkingAuth}
                >
                  <CreateFood
                    accessToken={accessToken}
                    restaurants={restaurants}
                    ingredients={ingredients}
                    onCreateFood={(newFood) =>
                      setFoods((prevFoods) => [...prevFoods, newFood])
                    }
                  />
                </ProtectedRoute>
              }
            />

            {/* Food approval routes */}
            <Route
              path="/approvals"
              element={
                <ProtectedRoute
                  accessToken={accessToken}
                  checkingAuth={checkingAuth}
                >
                  <Approvals
                    accessToken={accessToken}
                    userId={userData.user_id}
                  />
                </ProtectedRoute>
              }
            />

            <Route
              path="/approvable-foods"
              element={
                <ProtectedRoute
                  accessToken={accessToken}
                  checkingAuth={checkingAuth}
                >
                  <ApprovableFoods
                    accessToken={accessToken}
                    foods={foods}
                    handleApprove={handleApprove}
                  />
                </ProtectedRoute>
              }
            />

            <Route
              path="/approve-removals"
              element={
                <ProtectedRoute
                  accessToken={accessToken}
                  checkingAuth={checkingAuth}
                >
                  <ApproveRemovals
                    accessToken={accessToken}
                    userId={userData.user_id}
                    ingredients={ingredients}
                  />
                </ProtectedRoute>
              }
            />

            <Route
              path="/approve-updates"
              element={
                <ProtectedRoute
                  accessToken={accessToken}
                  checkingAuth={checkingAuth}
                >
                  <ApproveUpdates
                    accessToken={accessToken}
                    userId={userData.user_id}
                    ingredients={ingredients}
                  />
                </ProtectedRoute>
              }
            />

            {/* Food view/edit routes */}
            <Route
              path="/approve-food/:foodId"
              element={
                <ProtectedRoute
                  accessToken={accessToken}
                  checkingAuth={checkingAuth}
                >
                  <ApproveFoodPage
                    accessToken={accessToken}
                    user={userData}
                    ingredients={ingredients}
                    foods={foods}
                    handleApprove={handleApprove}
                    showApproveButton={true}
                  />
                </ProtectedRoute>
              }
            />

            <Route
              path="/food/:foodId"
              element={
                <ViewFoodPage
                  ingredients={ingredients}
                  foods={foods}
                  accessToken={accessToken}
                />
              }
            />

            <Route
              path="/food/:foodId/edit"
              element={
                <ProtectedRoute
                  accessToken={accessToken}
                  checkingAuth={checkingAuth}
                >
                  <EditFood
                    accessToken={accessToken}
                    restaurants={restaurants}
                    ingredients={ingredients}
                    userData={userData} // Pass userData to EditFood component
                    setNotificationMessage={setNotificationMessage} // Pass the notification function
                    onUpdateFood={(updatedFood) => {
                      setFoods((prevFoods) =>
                        prevFoods.map((food) =>
                          food.id === updatedFood.id ? updatedFood : food
                        )
                      );
                    }}
                  />
                </ProtectedRoute>
              }
            />

            {/* Add Support route */}
            <Route
              path="/support"
              element={
                <ProtectedRoute
                  accessToken={accessToken}
                  checkingAuth={checkingAuth}
                >
                  <Support accessToken={accessToken} userData={userData} />
                </ProtectedRoute>
              }
            />
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
        </div>
      </BackgroundProvider>
    </HelmetProvider>
  );
};

// Create a wrapper component to handle fetching the specific food data
const ApproveFoodPage: React.FC<{
  accessToken: string | null;
  user: User | undefined;
  ingredients: Ingredient[];
  foods: Food[];
  handleApprove: (foodId: number) => void;
  showApproveButton?: boolean;
}> = ({
  accessToken,
  user,
  ingredients,
  foods,
  handleApprove,
  showApproveButton = user?.is_supervisor,
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
        const response = await fetch(`${API_BASE_URL}/foods/${foodId}/`);
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
      userId={user?.user_id}
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
        const response = await fetch(`${API_BASE_URL}/foods/${foodId}/`);
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
