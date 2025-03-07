/* eslint-disable */

import { Page, TestInfo, test } from "@playwright/test";

/**
 * Adds annotations to the test information.
 *
 * @param {TestInfo} testInfo - The test information object.
 * @param {string} testKey - The Xray test key.
 * @param {string} testSummary - The summary of the test.
 * @param {string} requirements - The requirements associated with the test.
 * @param {string} testDescription - The description of the test.
 */
export function addTestAnnotations(
  testInfo: TestInfo,
  testKey: string,
  testSummary: string,
  testDescription: string
) {
  testInfo.annotations.push({ type: "test_key", description: testKey });
  testInfo.annotations.push({ type: "test_summary", description: testSummary });

  testInfo.annotations.push({
    type: "test_description",
    description: testDescription,
  });
}

/**
 * Captures a full-page screenshot and attaches it to the test information.
 *
 * @param {Page} page - The Playwright page object.
 * @param {TestInfo} testInfo - The test information object.
 */
export async function captureAndAttachScreenshot(
  page: Page,
  testInfo: TestInfo
) {
  const sanitizedTestName = testInfo.title.replace(/\s+/g, "_");
  const screenshotPath = testInfo.outputPath(`${sanitizedTestName}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  testInfo.attachments.push({
    name: `${sanitizedTestName}.png`,
    path: screenshotPath,
    contentType: "image/png",
  });
}

export function step(stepName?: string) {
  return function (target: Function, context: ClassMemberDecoratorContext) {
    return function replacementMethod(this: any, ...args: any) {
      const name =
        stepName || `${this.constructor.name}.${context.name as string}`;
      return test.step(name, async () => {
        return await target.call(this, ...args);
      });
    };
  };
}
