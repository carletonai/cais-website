// Tests run on Ottawa time, like the club: "today", "tomorrow" and which day
// an event falls on must not depend on where the tests run (CI is in UTC).
process.env.TZ = "America/Toronto";

module.exports = {
  testEnvironment: "jsdom",
  // Load packages' development builds, as React itself runs under Jest:
  // React Router 8 serves its dev build (and its dev-only warnings, such as
  // "No routes matched location") only under this condition, where 7.x always
  // did. "browser" is jsdom's default; Radix's dev-only warnings come on too.
  testEnvironmentOptions: {
    customExportConditions: ["browser", "development"],
  },
  // The project's own babel-jest, not the copy jest-config bundles: that one
  // is paired with jest's internal @babel/core 7, which loads the Babel 8
  // presets as empty objects and leaves TypeScript and JSX untransformed.
  transform: {
    "^.+\\.(ts|tsx|js|jsx|mjs)$": require.resolve("babel-jest"),
  },
  // These packages ship only ES modules, so they go through babel rather
  // than being skipped with the rest of node_modules: react-hotkeys-hook 5,
  // and React Router 8 with its two dependencies (babel.config.cjs also
  // rewrites the `import.meta` React Router reads).
  transformIgnorePatterns: [
    "/node_modules/(?!.*(react-hotkeys-hook|react-router|@remix-run/route-pattern|cookie-es))",
  ],
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "<rootDir>/__mocks__/styleMock.js",
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
      "<rootDir>/__mocks__/fileMock.js",
    "^react-social-icons$": "<rootDir>/__mocks__/react-social-icons.js",
    "^lucide-react$": "<rootDir>/__mocks__/lucide-react.js",
    "^@/(.*)$": "<rootDir>/src/$1",
    "^framer-motion$": "<rootDir>/__mocks__/framer-motion.js",
  },
  testMatch: ["<rootDir>/src/**/*.{test,spec}.{ts,tsx}"],
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],
};
