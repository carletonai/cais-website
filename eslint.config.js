import { FlatCompat } from "@eslint/eslintrc";
import react from "eslint-plugin-react";
import reactRefresh from "eslint-plugin-react-refresh";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: react.configs.recommended,
});

export default [
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
        browser: true,
        es2020: true,
      },
    },
    settings: {
      react: {
        version: "18.2",
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
    // Vendored shadcn/ui primitives: these intentionally export variant
    // helpers and Radix aliases alongside components. Keeping them as
    // upstream ships them matters more than fast-refresh granularity in
    // files nobody edits during development.
    files: ["src/components/ui/**"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
  ...compat.config({
    extends: [
      "eslint:recommended",
      "plugin:react/recommended",
      "plugin:react/jsx-runtime",
      "plugin:react-hooks/recommended",
    ],
    ignorePatterns: ["dist", ".eslintrc.cjs"],
  }),
];
