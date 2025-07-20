/* eslint-disable */

import { Page, TestInfo, test } from "@playwright/test";

/**
 * Adds annotations to the test information.
 *
 * @param {TestInfo} testInfo - The test information object.
 * @param {string} testKey - The Xray test key.
 * @param {string} testSummary - The summary of the test.
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

/**
 * Helper function to wrap methods with test.step
 * @param description - The description of the step that will appear in test reports
 * @param fn - The function to wrap
 * @returns A function that executes within a test step
 */
export function withStep<T extends (...args: any[]) => Promise<any>>(
  description: string,
  fn: T
): T {
  return (async (...args: any[]) => {
    return await test.step(description, async () => {
      return await fn(...args);
    });
  }) as T;
}

/**
 * Step decorator that uses Playwright's built-in test.step functionality
 * Compatible with both legacy and modern TypeScript decorator syntax
 * @param description - The description of the step that will appear in test reports
 */
export function step(description: string) {
  return function (target: any, context: any, descriptor?: any) {
    // Handle modern decorator syntax (Stage 3 decorators)
    if (typeof context === "object" && context.kind === "method") {
      return function (this: any, ...args: any[]) {
        return test.step(description, async () => {
          return await target.apply(this, args);
        });
      };
    }

    // Handle legacy decorator syntax
    const propertyKey = context;
    let methodDescriptor = descriptor;

    if (!methodDescriptor) {
      methodDescriptor = Object.getOwnPropertyDescriptor(target, propertyKey);
    }

    if (!methodDescriptor && target.prototype) {
      methodDescriptor = Object.getOwnPropertyDescriptor(
        target.prototype,
        propertyKey
      );
    }

    if (!methodDescriptor) {
      const property = target[propertyKey];
      if (typeof property === "function") {
        methodDescriptor = {
          value: property,
          writable: true,
          enumerable: false,
          configurable: true,
        };
      }
    }

    if (!methodDescriptor || !methodDescriptor.value) {
      // For legacy decorators, try to define the method wrapper directly
      if (typeof propertyKey === "string" || typeof propertyKey === "symbol") {
        const originalMethod = target[propertyKey];
        if (typeof originalMethod === "function") {
          target[propertyKey] = async function (this: any, ...args: any[]) {
            return await test.step(description, async () => {
              return await originalMethod.apply(this, args);
            });
          };
        }
      }
      return;
    }

    const originalMethod = methodDescriptor.value;

    methodDescriptor.value = async function (this: any, ...args: any[]) {
      return await test.step(description, async () => {
        return await originalMethod.apply(this, args);
      });
    };

    return methodDescriptor;
  };
}
