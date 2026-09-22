module.exports = {
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.(ts|tsx|js|jsx|mjs)$": "babel-jest",
  },
  // react-hotkeys-hook 5 is ESM-only and ships untranspiled, so it has to
  // go through babel rather than being skipped with the rest of node_modules.
  transformIgnorePatterns: ["/node_modules/(?!.*react-hotkeys-hook)"],
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "<rootDir>/__mocks__/styleMock.js",
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
      "<rootDir>/__mocks__/fileMock.js",
    "^react-social-icons$": "<rootDir>/__mocks__/react-social-icons.js",
    "^lucide-react$": "<rootDir>/__mocks__/lucide-react.js",
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@/components/ui/(.*)$": "<rootDir>/__mocks__/ui-components.js",
    "^framer-motion$": "<rootDir>/__mocks__/framer-motion.js",
  },
  testMatch: ["<rootDir>/src/**/*.{test,spec}.{ts,tsx}"],
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],
};
