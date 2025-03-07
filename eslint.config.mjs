// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import playwright from "eslint-plugin-playwright";

export default tseslint.config(
  eslint.configs.recommended,
  playwright.configs["flat/recommended"],
  ...tseslint.configs.recommended,
  {
    files: ["*.ts"],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: ".",
      },
    },
    rules: {
      ...playwright.configs["flat/recommended"].rules,
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/await-thenable": "error",
    },
  },
  {
    ignores: ["playwright-report/", "test-results/"],
  }
);
