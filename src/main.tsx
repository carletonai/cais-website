import React from "react";
import ReactDOM from "react-dom/client";
import { MotionConfig } from "framer-motion";
import App from "./app/App";
import "./app/globals.css";
import "@fontsource-variable/inter";
import "@fontsource-variable/space-grotesk";
// Labels only use latin at two weights, so only those files are bundled.
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-500.css";

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
