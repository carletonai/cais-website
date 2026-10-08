import type { Config } from "tailwindcss";

// Colours, fonts and the type scale live in src/app/globals.css (@theme), so
// they can be re-scoped per surface. This file keeps only what Tailwind v4
// still reads from a JS config.
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // A plain length: the old "hsl(var(--radius) / <alpha-value>)" built an
      // invalid border-radius, so every rounded-lg rendered square.
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
