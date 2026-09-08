import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import svgr from "vite-plugin-svgr";

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
    css: {
      postcss: "./postcss.config.cjs",
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
