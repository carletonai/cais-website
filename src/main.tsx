import React from "react";
import ReactDOM from "react-dom/client";
import { MotionConfig } from "framer-motion";
import App from "./app/App";
import "./app/globals.css";
import "@fontsource-variable/inter";
import "@fontsource-variable/manrope";

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      {/* 2.3.3 Animation from Interactions — framer-motion drives these from
          JS, so the CSS prefers-reduced-motion block cannot reach them. */}
      <MotionConfig reducedMotion="user">
        <App />
      </MotionConfig>
    </React.StrictMode>,
  );
} else {
  console.error("Root element not found");
}
