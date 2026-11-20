import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router";
import { AppProviders, AppShell } from "./app/App";
import "./app/globals.css";
import "@fontsource-variable/inter";
import "@fontsource-variable/space-grotesk";
// Labels only use latin at two weights, so only those files are bundled.
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-500.css";

const rootElement = document.getElementById("root");

/** "/events/" and "/events" are the same page. */
const normalize = (path: string) => path.replace(/\/+$/, "") || "/";

if (rootElement) {
  // scripts/prerender-routes.mjs writes each page's HTML into #root, with the
  // path it rendered and the time it rendered at. React adopts that HTML
  // (hydration) when it is this page's, starting the clock at the build time
  // so the first render matches it. A URL served another page's file (an old
  // event slug rewritten to index.html) or the dev server's empty #root is
  // rendered from scratch instead.
  const { path, renderedAt } = rootElement.dataset;
  const prerendered =
    rootElement.hasChildNodes() &&
    path !== undefined &&
    normalize(path) === normalize(window.location.pathname);
  const app = (
    <React.StrictMode>
      <AppProviders
        now={prerendered && renderedAt ? new Date(renderedAt) : undefined}
      >
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </AppProviders>
    </React.StrictMode>
  );
  if (prerendered) {
    ReactDOM.hydrateRoot(rootElement, app);
  } else {
    rootElement.replaceChildren();
    ReactDOM.createRoot(rootElement).render(app);
  }
} else {
  console.error("Root element not found");
}
