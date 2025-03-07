import AxeBuilder from "@axe-core/playwright";
import { Page } from "@playwright/test";

export async function runAccessibilityScan(page: Page) {
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
