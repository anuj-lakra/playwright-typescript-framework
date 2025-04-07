export default {
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  moduleNameMapper: {
    "^@utilities/(.*)$": "<rootDir>/src/utilities/$1", // Map `@utilities` to the correct folder
  },
  testEnvironment: "node",
  testMatch: [
    "**/src/utilities/**/*.test.ts", // Match tests in utilities
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    "src/utilities/**/*.ts", // Collect coverage for utilities
    "!**/node_modules/**",
    "!**/*.d.ts",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
};
