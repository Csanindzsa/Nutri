import React from "react";
import {
  Box,
  Typography,
  Slider,
  IconButton,
  Popover,
  Paper,
  Tooltip,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import { useBackground } from "../contexts/BackgroundContext";

const BackgroundSettings: React.FC = () => {
  const { setBackgroundOpacity, setBackgroundSize, opacity, backgroundSize } =
    useBackground();
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(
    null
  );

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? "background-settings-popover" : undefined;

  // Background size options
  const handleSizeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBackgroundSize(event.target.value);
  };

  return (
    <>
      <Tooltip title="Background Settings">
        <IconButton
          aria-describedby={id}
          onClick={handleClick}
          sx={{
            position: "fixed",
            bottom: 20,
            right: 20,
            bgcolor: "rgba(255,255,255,0.8)",
            "&:hover": {
              bgcolor: "rgba(255,255,255,0.95)",
            },
            zIndex: 1000,
          }}
        >
          <SettingsIcon />
        </IconButton>
      </Tooltip>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Paper sx={{ p: 2, width: 280 }}>
          {/* Opacity control */}
          <Typography variant="subtitle2" gutterBottom>
            Background Opacity ({Math.round(opacity * 100)}%)
          </Typography>
          <Slider
            value={opacity}
            min={0.05}
            max={0.5}
            step={0.01}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
            onChange={(_, value) => setBackgroundOpacity(value as number)}
          />

          {/* Background size options */}
          <FormControl sx={{ mt: 3 }}>
            <FormLabel component="legend">Background Size</FormLabel>
            <RadioGroup
              value={backgroundSize}
              onChange={handleSizeChange}
              name="background-size-options"
            >
              <FormControlLabel
                value="cover"
                control={<Radio size="small" />}
                label="Fill Screen (Cover)"
              />
              <FormControlLabel
                value="contain"
                control={<Radio size="small" />}
                label="Fit Screen (Contain)"
              />
              <FormControlLabel
                value="100%"
                control={<Radio size="small" />}
                label="100% (Original Size)"
              />
              <FormControlLabel
                value="200%"
                control={<Radio size="small" />}
                label="200% (Double Size)"
              />
            </RadioGroup>
          </FormControl>
        </Paper>
      </Popover>
    </>
  );
};

export default BackgroundSettings;
