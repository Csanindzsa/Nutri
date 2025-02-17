import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "./theme";
import { BrowserRouter as Router } from "react-router-dom";

const rootElement = document.getElementById("root") as HTMLElement;

//fix issue idk
ReactDOM.render(
  <Router>
    <React.StrictMode>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </React.StrictMode>
  </Router>,
  rootElement
);
