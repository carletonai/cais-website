import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "node:url";
import svgr from "vite-plugin-svgr";

// __dirname is unavailable under vite's native config loader, and
// import.meta.dirname needs Node 20.11+; this form works on both.
const projectRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [svgr(), react()],
    base: "/",
    // Injected as a constant rather than read through import.meta.env so the
    // same source parses under babel-jest, which transforms to CJS.
    define: {
      __GOOGLE_CALENDAR_ID__: JSON.stringify(env.VITE_GOOGLE_CALENDAR_ID ?? ""),
    },
    build: {
      rolldownOptions: {
        output: {
          // Keep the framework in its own chunk: it changes far less often
          // than the app, so repeat visitors keep it cached across deploys.
          advancedChunks: {
            groups: [
              {
                name: "react-vendor",
                test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              },
            ],
          },
        },
      },
    },
    css: {
      postcss: "./postcss.config.cjs",
    },
    resolve: {
      alias: {
        "@": path.resolve(projectRoot, "./src"),
      },
    },
  };
});
