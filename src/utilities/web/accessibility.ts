import AxeBuilder from "@axe-core/playwright";
import { Page } from "@playwright/test";
import { AxeResults } from "axe-core"; // Import the type for Axe results

export async function runAccessibilityScan(page: Page): Promise<AxeResults> {
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags([
      "wcag2a",
      "wcag2aa",
      "wcag21a",
      "wcag21aa",
      "wcag22a",
      "wcag22aa",
    ])
    .analyze();
  return accessibilityScanResults;
}
