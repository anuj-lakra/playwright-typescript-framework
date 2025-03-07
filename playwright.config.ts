import { defineConfig, devices } from "@playwright/test";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import dotenv from "dotenv";
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

/**
 * Configuration options for Xray integration.
 *
 * @property {boolean} embedAnnotationsAsProperties - Determines if annotations should be embedded as properties.
 * @property {string[]} textContentAnnotations - Specifies which annotations should be treated as text content.
 * @property {string} embedAttachmentsAsProperty - Defines the property name for embedding attachments.
 * @property {string} outputFile - Path to the output file for the Xray report.
 */
const xrayOptions = {
  embedAnnotationsAsProperties: true,
  textContentAnnotations: ["test_description"],
  embedAttachmentsAsProperty: "testrun_evidence",
  outputFile: "test-results/xray-report.xml",
};

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./tests",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  // Retry failed tests on CI up to 2 times
  retries: process.env.CI ? 2 : 0,
  // Fail the build after 10 failures on CI
  maxFailures: process.env.CI ? 5 : 10,
  /* Opt out of parallel tests on CI. */

  workers: process.env.CI ? 3 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    process.env.CI ? ["blob"] : ["html", { open: "never" }],
    ["@xray-app/playwright-junit-reporter", xrayOptions],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
    launchOptions: {
      args: ["--start-maximized"], // Start browser maximized
    },
    acceptDownloads: true,
    video: "on-first-retry",
    screenshot: "on",
    contextOptions: {
      permissions: ["clipboard-read", "clipboard-write"],
    },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "ui-tests",
      testDir: "./tests/ui",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://127.0.0.1:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
