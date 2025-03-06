import React, { useState } from "react";

import {
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Typography,
  TextField,
  SelectChangeEvent, // Add this import for the proper type
} from "@mui/material";
import { updateApiBaseUrl, API_BASE_URL } from "../config/environment";

const predefinedEnvironments = [
  { name: "Development", url: "${API_BASE_URL}" },
  { name: "Testing", url: "http://test-api.example.com" },
  { name: "Production", url: "https://api.production.com" },
  // Add more environments as needed
];

const EnvironmentSwitcher: React.FC = () => {
  const [selectedEnv, setSelectedEnv] = useState(API_BASE_URL);
  const [customEnv, setCustomEnv] = useState("");

  // Fixed the event type to use SelectChangeEvent
  const handleChange = (event: SelectChangeEvent) => {
    setSelectedEnv(event.target.value as string);
  };

  const applyEnvironment = () => {
    const envToApply = selectedEnv === "custom" ? customEnv : selectedEnv;
    updateApiBaseUrl(envToApply);
    alert(
      `API environment changed to: ${envToApply}\nYou may need to refresh the page for changes to take effect.`
    );
  };

  return (
    <Box sx={{ p: 2, border: "1px solid #ccc", borderRadius: 1, mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        API Environment Switcher
      </Typography>

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel id="env-select-label">Select Environment</InputLabel>
        <Select
          labelId="env-select-label"
          value={selectedEnv}
          label="Select Environment"
          onChange={handleChange}
        >
          {predefinedEnvironments.map((env) => (
            <MenuItem key={env.name} value={env.url}>
              {env.name} ({env.url})
            </MenuItem>
          ))}
          <MenuItem value="custom">Custom URL</MenuItem>
        </Select>
      </FormControl>

      {selectedEnv === "custom" && (
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            label="Custom API URL"
            placeholder="Enter API base URL"
            value={customEnv}
            onChange={(e) => setCustomEnv(e.target.value)}
          />
        </Box>
      )}

      <Button variant="contained" onClick={applyEnvironment}>
        Apply Environment
      </Button>
    </Box>
  );
};

export default EnvironmentSwitcher;
