import { test as baseTest } from "@playwright/test";
import { PlaywrightDocsPage } from "../page-objects/playwright-docs/playwright-docs-page";

type PlaywrightDocsFixtures = {
  playwrightDocsPage: PlaywrightDocsPage;
};

export const test = baseTest.extend<PlaywrightDocsFixtures>({
  playwrightDocsPage: async ({ page }, use) => {
    const playwrightDocsPage = new PlaywrightDocsPage(page);
    await use(playwrightDocsPage);
  },
});

export { expect } from "@playwright/test";