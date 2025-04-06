// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import playwright from "eslint-plugin-playwright";
import jestPlugin from "eslint-plugin-jest";

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ["*.ts"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json", // Ensure this points to your tsconfig.json
        tsconfigRootDir: ".",
      },
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/await-thenable": "error",
    },
  },
  // Playwright-specific configuration
  {
    files: [
      "tests/**/*.ts",
      "src/fixtures/**/*.ts",
      "src/page-objects/**/*.ts",
    ], // Target Playwright files
    plugins: {
      playwright,
    },
    rules: {
      ...playwright.configs["flat/recommended"].rules, // Apply Playwright rules
    },
  },
  // Jest-specific configuration for utilities
  {
    files: ["src/utilities/**/*.ts"], // Target Jest utility files
    plugins: {
      jest: jestPlugin,
    },
    rules: {
      "jest/expect-expect": "error",
      "jest/no-identical-title": "error",
      "jest/valid-expect": "error",
      "@typescript-eslint/no-explicit-any": "off", // Allow any type in test mocks
    },
  },
  {
    ignores: [
      "playwright-report/",
      "test-results/",
      "coverage/",
      "node_modules/",
      "dist/",
    ],
  }
);
