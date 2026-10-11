import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import reactRefresh from "eslint-plugin-react-refresh";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import globals from "globals";

// ESLint's own recommended rules are applied directly above the React
// presets; passing React's config here, as before, silently replaced them.
const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended,
});

export default [
  js.configs.recommended,
  // The React presets come first so the project's own rules below win.
  ...compat.config({
    extends: [
      "plugin:react/recommended",
      "plugin:react/jsx-runtime",
      "plugin:react-hooks/recommended",
    ],
    ignorePatterns: ["dist"],
  }),
  {
    files: ["**/*.{js,mjs,cjs,jsx,ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    settings: {
      react: {
        version: "19.3",
      },
    },
    plugins: {
      "react-refresh": reactRefresh,
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      "react/jsx-no-target-blank": "off",
      // Base rule is off in favour of the TS-aware one, which understands
      // type-only usage and destructuring holes.
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      semi: ["error", "always"],
    },
  },
  {
    // TypeScript resolves names; no-undef only sees its types as unknown.
    files: ["**/*.{ts,tsx}"],
    rules: { "no-undef": "off" },
  },
  {
    files: ["**/*.test.{ts,tsx}", "src/setupTests.ts", "__mocks__/**"],
    languageOptions: { globals: globals.jest },
  },
  {
    files: ["**/*.cjs"],
    languageOptions: { sourceType: "commonjs" },
  },
  {
    // Vendored shadcn/ui primitives: these intentionally export variant
    // helpers and Radix aliases alongside components. Keeping them as
    // upstream ships them matters more than fast-refresh granularity in
    // files nobody edits during development.
    files: ["src/components/ui/**"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
];
