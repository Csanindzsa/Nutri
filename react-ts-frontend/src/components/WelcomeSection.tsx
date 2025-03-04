import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Container,
  Card,
  CardMedia,
  CardContent,
  Paper,
  Grid,
  Button,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { Restaurant } from "../interfaces";
import { red } from "@mui/material/colors";
import { getRestaurantImage } from "../utils/imageUtils";

interface WelcomeSectionProps {
  restaurants: Restaurant[];
}

const WelcomeSection: React.FC<WelcomeSectionProps> = ({ restaurants }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Navigate to foods page with search query as URL parameter
    if (searchTerm.trim()) {
      navigate(`/foods?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate("/foods");
    }
  };

  // New handler to navigate to the food list with restaurant filter
  const handleRestaurantClick = (restaurantId: number) => {
    navigate(`/foods?restaurant=${restaurantId}`);
  };

  return (
    <Box sx={{ width: "100%", position: "relative", overflow: "visible" }}>
      {/* Orange Background Section */}
      <Box
        sx={{
          backgroundColor: "#FF8C00",
          width: "100%",
          position: "relative",
          pt: 10, // Increased top padding to move welcome section lower
          pb: 16,
          zIndex: 1,
        }}
      >
        <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 4, lg: 5 } }}>
          {/* Welcome Header */}
          <Box sx={{ textAlign: "center", mb: 8 }}>
            <Typography
              variant="h2"
              component="h1"
              sx={{
                fontWeight: 700,
                color: "#ffffff",
                textShadow: "1px 1px 3px rgba(0,0,0,0.2)",
                mb: 1,
              }}
            >
              Welcome to Nutri
            </Typography>

            <Typography
              variant="h5"
              sx={{
                color: "rgba(255,255,255,0.9)",
                fontWeight: 400,
              }}
            >
              your dietary aid
            </Typography>
          </Box>

          {/* Search Bar */}
          <Paper
            component="form"
            onSubmit={handleSearch}
            elevation={3}
            sx={{
              p: "2px 4px",
              display: "flex",
              alignItems: "center",
              width: "90%",
              maxWidth: "800px",
              mx: "auto",
              borderRadius: 3,
              backgroundColor: "rgba(255,255,255,0.95)",
              position: "relative",
              zIndex: 2,
              mb: 4, // Added margin bottom to the search bar itself for additional spacing
            }}
          >
            <InputAdornment position="start" sx={{ pl: 2 }}>
              <SearchIcon color="action" />
            </InputAdornment>
            <TextField
              fullWidth
              variant="standard"
              placeholder="Find food"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                disableUnderline: true,
              }}
              sx={{
                ml: 1,
                flex: 1,
                "& .MuiInputBase-input": {
                  py: 1.5,
                  fontSize: "1.1rem",
                },
              }}
            />
          </Paper>
        </Container>
      </Box>

      {/* Wave SVG with "Discover restaurants" overlaid on it */}
      <Box
        sx={{
          position: "relative",
          height: "80px",
          marginTop: "0px",
        }}
      >
        {/* The Wave SVG */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 2,
            transform: "rotate(180deg)",
          }}
        >
          <path
            d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z"
            fill="#FF8C00"
          ></path>
        </svg>

        {/* "Discover restaurants" section positioned on top of the wave */}
        <Box
          sx={{
            position: "absolute",
            top: "0%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            zIndex: 3, // Above the wave
          }}
        >
          <KeyboardArrowDownIcon
            sx={{
              fontSize: 40,
              color: "#ffffff",
              animation: "bounce 2s infinite",
              filter: "drop-shadow(0px 2px 3px rgba(0,0,0,0.2))",
              "@keyframes bounce": {
                "0%, 20%, 50%, 80%, 100%": {
                  transform: "translateY(0)",
                },
                "40%": {
                  transform: "translateY(-10px)",
                },
                "60%": {
                  transform: "translateY(-5px)",
                },
              },
            }}
          />
          <Typography
            variant="h5"
            sx={{
              mt: 1,
              color: "#ffffff",
              fontWeight: 500,
              textAlign: "center",
              textShadow: "0px 2px 3px rgba(0,0,0,0.2)", // Added shadow for better visibility
            }}
          >
            Discover restaurants
          </Typography>
        </Box>
      </Box>

      {/* Space to ensure proper layout after the wave */}
      <Box sx={{ height: "40px" }} />

      {/* Restaurants List with plenty of space after the wave */}
      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 5, mt: 4 }}>
        <Box sx={{ mb: 10, color: "orange" }}>
          <Typography
            variant="h4"
            component="h2"
            sx={{
              mb: 3,
              fontWeight: 600,
            }}
          >
            Popular Restaurants
          </Typography>
          <Grid container spacing={3}>
            {restaurants.slice(0, 4).map((restaurant) => (
              <Grid item xs={12} sm={6} md={3} key={restaurant.id}>
                <Card
                  sx={{
                    height: "100%",
                    cursor: "pointer", // Add pointer cursor to indicate clickability
                    transition: "transform 0.2s",
                    "&:hover": {
                      transform: "scale(1.03)",
                    },
                  }}
                  onClick={() => handleRestaurantClick(restaurant.id)} // Add click handler
                >
                  <CardMedia
                    component="img"
                    height="140"
                    image={getRestaurantImage(
                      restaurant.image,
                      restaurant.imageIsLocal
                    )}
                    alt={restaurant.name}
                  />
                  <CardContent>
                    <Typography gutterBottom variant="h6" component="div">
                      {restaurant.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {restaurant.cuisine || "Various cuisines"}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          {restaurants.length > 4 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
              <Button
                variant="contained"
                onClick={() => navigate("/restaurants")}
                sx={{
                  backgroundColor: "#FF8C00",
                  color: "#ffffff",
                  "&:hover": {
                    backgroundColor: "#e67e00",
                  },
                  fontWeight: 500,
                  px: 4,
                }}
              >
                View All Restaurants
              </Button>
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default WelcomeSection;
