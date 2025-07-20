import { Page, Locator } from "@playwright/test";
import { step } from "@utilities/test-utils";

type PageAction<Params extends unknown[] = [], Return = void> = (
  ...params: Params
) => Promise<Return>;

export interface IPlaywrightDocsPage {
  navigateToHomepage: PageAction;
  searchForTopic: PageAction<[string]>;
  clickSearchResult: PageAction<[string]>;
  verifyPageTitle: PageAction<[string], boolean>;
  verifyAutoWaitingSections: PageAction<[], string[]>;
  getTableOfContentsSections: PageAction<[], string[]>;
  verifySectionContent: PageAction<[string], boolean>;
  getActionabilityChecksTable: PageAction<[], Record<string, any>[]>;
  verifyAutoWaitingFeatures: PageAction<
    [],
    {
      sectionsFound: string[];
      tableData: Record<string, any>[];
      titleVerified: boolean;
    }
  >;
}

export class PlaywrightDocsPage implements IPlaywrightDocsPage {
  private readonly page: Page;
  readonly searchButton: Locator;
  readonly searchBox: Locator;
  readonly pageTitle: Locator;
  readonly tableOfContents: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchButton = page.getByRole("button", {
      name: "Search (Command+K)",
    });
    this.searchBox = page.getByRole("searchbox", { name: "Search" });
    this.pageTitle = page.locator("h1");
    // Target the table of contents using its specific class
    this.tableOfContents = page.locator(".table-of-contents");
  }

  @step("Navigate to Playwright homepage")
  async navigateToHomepage(): Promise<void> {
    await this.page.goto("https://playwright.dev/");
  }

  @step("Search for topic")
  async searchForTopic(searchTerm: string): Promise<void> {
    await this.searchButton.click();
    await this.searchBox.fill(searchTerm);
  }

  @step("Click search result")
  async clickSearchResult(resultText: string): Promise<void> {
    const searchResult = this.page.getByRole("link", {
      name: resultText,
      exact: true,
    });
    await searchResult.click();
  }

  @step("Verify page title")
  async verifyPageTitle(expectedTitle: string): Promise<boolean> {
    const title = await this.pageTitle.textContent();
    return title?.trim() === expectedTitle;
  }

  @step("Verify Auto-waiting sections are present")
  async verifyAutoWaitingSections(): Promise<string[]> {
    const expectedSections = [
      "Introduction",
      "Forcing actions",
      "Assertions",
      "Visible",
      "Stable",
      "Enabled",
      "Editable",
      "Receives Events",
    ];

    const foundSections: string[] = [];

    // Wait for the specific table of contents container
    await this.page.waitForSelector(".table-of-contents", { state: "visible" });

    // Find the table of contents using its specific class
    const tocContainer = this.page.locator(".table-of-contents");

    for (const section of expectedSections) {
      const sectionLink = tocContainer.getByRole("link", {
        name: section,
        exact: true,
      });

      if (await sectionLink.isVisible()) {
        foundSections.push(section);
      }
    }

    return foundSections;
  }

  @step("Get table of contents sections")
  async getTableOfContentsSections(): Promise<string[]> {
    // Wait for the table of contents to be visible
    await this.tableOfContents.waitFor({ state: "visible" });

    const tocLinks = this.tableOfContents.getByRole("link");
    const sections = await tocLinks.allTextContents();
    return sections.filter((section) => section.trim().length > 0);
  }

  @step("Verify section content is visible")
  async verifySectionContent(sectionName: string): Promise<boolean> {
    // Look for headings that contain the section name text
    // Using hasText with exact section name to handle Docusaurus anchor links
    const heading = this.page.getByRole("heading", {
      name: new RegExp(`${sectionName}`, "i"),
    });

    // Alternative approach: look for any heading element containing the text
    const headingByText = this.page.locator(`h1, h2, h3, h4, h5, h6`).filter({
      hasText: sectionName,
    });

    // Check if either locator finds a visible element
    try {
      const headingVisible = await heading.first().isVisible({ timeout: 5000 });
      if (headingVisible) return true;
    } catch (error) {
      // Continue to alternative approach
    }

    try {
      const headingByTextVisible = await headingByText.first().isVisible({
        timeout: 5000,
      });
      return headingByTextVisible;
    } catch (error) {
      return false;
    }
  }

  @step("Get actionability checks table")
  async getActionabilityChecksTable(): Promise<Record<string, any>[]> {
    // Wait for the table to be visible first
    await this.page.waitForSelector("table", { state: "visible" });

    const table = this.page.locator("table").first();
    const rows = table.locator("tbody tr");
    const rowCount = await rows.count();

    const tableData: Record<string, any>[] = [];

    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const cells = row.locator("td");
      const cellCount = await cells.count();

      if (cellCount >= 5) {
        const rowData = {
          action: await cells.nth(0).textContent(),
          visible: await cells.nth(1).textContent(),
          stable: await cells.nth(2).textContent(),
          receivesEvents: await cells.nth(3).textContent(),
          enabled: await cells.nth(4).textContent(),
          editable: cellCount > 5 ? await cells.nth(5).textContent() : null,
        };
        tableData.push(rowData);
      }
    }

    return tableData;
  }

  @step("Verify auto-waiting features")
  async verifyAutoWaitingFeatures(): Promise<{
    sectionsFound: string[];
    tableData: Record<string, any>[];
    titleVerified: boolean;
  }> {
    const sectionsFound = await this.verifyAutoWaitingSections();
    const tableData = await this.getActionabilityChecksTable();
    const titleVerified = await this.verifyPageTitle("Auto-waiting");

    return {
      sectionsFound,
      tableData,
      titleVerified,
    };
  }
}
