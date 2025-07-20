import { test, expect } from "@fixtures/playwright-docs-fixture";
import { addTestAnnotations } from "@utilities/test-utils";

const EXPECTED_AUTO_WAITING_SECTIONS = [
  "Introduction",
  "Forcing actions",
  "Assertions",
  "Visible",
  "Stable",
  "Enabled",
  "Editable",
  "Receives Events",
];

test.describe("Playwright Documentation - Auto-waiting Verification", () => {
  test.beforeEach(async ({ playwrightDocsPage }) => {
    await playwrightDocsPage.navigateToHomepage();
  });

  test("should navigate to Auto-waiting documentation and verify all required sections", async ({
    playwrightDocsPage,
    page,
  }, testInfo) => {
    // Add test annotations for reporting
    addTestAnnotations(
      testInfo,
      "PW-AUTO-001",
      "Verify Auto-waiting Documentation Sections",
      "Navigate to Playwright docs, search for Auto-waiting, and verify all required sections are present"
    );

    await test.step("Search for Auto-waiting documentation", async () => {
      await playwrightDocsPage.searchForTopic("Auto-waiting");
      await expect(page.getByRole("searchbox", { name: "Search" })).toHaveValue(
        "Auto-waiting"
      );
    });

    await test.step("Navigate to Auto-waiting page", async () => {
      await playwrightDocsPage.clickSearchResult("Auto-waiting");
      await expect(page).toHaveURL(/.*\/docs\/actionability/);
      await expect(page).toHaveTitle("Auto-waiting | Playwright");
    });

    await test.step("Verify page title and content", async () => {
      const titleVerified = await playwrightDocsPage.verifyPageTitle(
        "Auto-waiting"
      );
      expect(titleVerified).toBe(true);
    });

    await test.step("Verify all required sections are present", async () => {
      const foundSections =
        await playwrightDocsPage.verifyAutoWaitingSections();

      // Verify each expected section is found
      for (const expectedSection of EXPECTED_AUTO_WAITING_SECTIONS) {
        expect(foundSections).toContain(expectedSection);
      }

      // Verify we found all expected sections
      expect(foundSections).toHaveLength(EXPECTED_AUTO_WAITING_SECTIONS.length);
    });

    await test.step("Verify table of contents structure", async () => {
      const tocSections = await playwrightDocsPage.getTableOfContentsSections();

      // Verify TOC contains all main sections
      for (const expectedSection of EXPECTED_AUTO_WAITING_SECTIONS) {
        const sectionInToc = tocSections.some((section) =>
          section.toLowerCase().includes(expectedSection.toLowerCase())
        );
        expect(
          sectionInToc,
          `Section "${expectedSection}" should be in table of contents`
        ).toBe(true);
      }
    });
  });

  test("should verify actionability checks table content", async ({
    playwrightDocsPage,
    page,
  }, testInfo) => {
    addTestAnnotations(
      testInfo,
      "PW-AUTO-002",
      "Verify Actionability Checks Table",
      "Verify the actionability checks table contains expected Playwright actions and their requirements"
    );

    await test.step("Navigate to Auto-waiting documentation", async () => {
      await playwrightDocsPage.searchForTopic("Auto-waiting");
      await playwrightDocsPage.clickSearchResult("Auto-waiting");

      // Ensure we've navigated to the correct page
      await expect(page).toHaveURL(/.*\/docs\/actionability/);
      await expect(page).toHaveTitle("Auto-waiting | Playwright");
    });

    await test.step("Verify actionability table structure", async () => {
      const tableData = await playwrightDocsPage.getActionabilityChecksTable();

      // Verify table has data
      expect(tableData.length).toBeGreaterThan(0);

      // Verify some key actions are present
      const expectedActions = [
        "locator.click()",
        "locator.fill()",
        "locator.check()",
        "locator.hover()",
      ];

      const foundActions = tableData.map((row) => row.action);

      for (const expectedAction of expectedActions) {
        const actionFound = foundActions.some((action) =>
          action?.includes(expectedAction)
        );
        expect(
          actionFound,
          `Action "${expectedAction}" should be in the table`
        ).toBe(true);
      }
    });

    await test.step("Verify actionability requirements for click action", async () => {
      const tableData = await playwrightDocsPage.getActionabilityChecksTable();
      const clickAction = tableData.find((row) =>
        row.action?.includes("locator.click()")
      );

      if (clickAction) {
        expect(clickAction.visible).toBe("Yes");
        expect(clickAction.stable).toBe("Yes");
        expect(clickAction.receivesEvents).toBe("Yes");
        expect(clickAction.enabled).toBe("Yes");
      }
    });
  });

  test("should verify individual section content visibility", async ({
    playwrightDocsPage,
    page,
  }, testInfo) => {
    addTestAnnotations(
      testInfo,
      "PW-AUTO-003",
      "Verify Section Content Visibility",
      "Verify each Auto-waiting section has visible content and proper headings"
    );

    await test.step("Navigate to Auto-waiting documentation", async () => {
      await playwrightDocsPage.searchForTopic("Auto-waiting");
      await playwrightDocsPage.clickSearchResult("Auto-waiting");

      // Ensure we've navigated to the correct page
      await expect(page).toHaveURL(/.*\/docs\/actionability/);
      await expect(page).toHaveTitle("Auto-waiting | Playwright");
    });

    await test.step("Verify each section has visible content", async () => {
      for (const section of EXPECTED_AUTO_WAITING_SECTIONS) {
        const sectionVisible = await playwrightDocsPage.verifySectionContent(
          section
        );
        expect(
          sectionVisible,
          `Section "${section}" content should be visible`
        ).toBe(true);
      }
    });

    await test.step("Verify specific section details", async () => {
      // Verify Introduction section has key content
      await expect(
        page.getByText("Playwright performs a range of actionability checks")
      ).toBeVisible();

      // Verify Visible section explains visibility criteria
      await expect(
        page.getByText("Element is considered visible when")
      ).toBeVisible();

      // Verify Stable section explains stability
      await expect(
        page.getByText("Element is considered stable when")
      ).toBeVisible();

      // Verify Enabled section content
      await expect(
        page.getByText("Element is considered enabled when")
      ).toBeVisible();
    });
  });

  test("should verify comprehensive Auto-waiting features", async ({
    playwrightDocsPage,
    page,
  }, testInfo) => {
    addTestAnnotations(
      testInfo,
      "PW-AUTO-004",
      "Comprehensive Auto-waiting Verification",
      "Complete verification of all Auto-waiting documentation features and content"
    );

    await test.step("Navigate and search for Auto-waiting", async () => {
      await playwrightDocsPage.searchForTopic("Auto-waiting");
      await playwrightDocsPage.clickSearchResult("Auto-waiting");

      // Ensure we've navigated to the correct page
      await expect(page).toHaveURL(/.*\/docs\/actionability/);
      await expect(page).toHaveTitle("Auto-waiting | Playwright");
    });

    await test.step("Perform comprehensive verification", async () => {
      const verificationResults =
        await playwrightDocsPage.verifyAutoWaitingFeatures();

      // Verify all sections found
      expect(verificationResults.sectionsFound).toEqual(
        expect.arrayContaining([...EXPECTED_AUTO_WAITING_SECTIONS])
      );

      // Verify title
      expect(verificationResults.titleVerified).toBe(true);

      // Verify table data exists
      expect(verificationResults.tableData.length).toBeGreaterThan(10);

      // Log results for debugging
      console.log("Found sections:", verificationResults.sectionsFound);
      console.log("Table rows count:", verificationResults.tableData.length);
    });

    await test.step("Verify navigation breadcrumbs", async () => {
      await expect(
        page.getByRole("navigation", { name: "Breadcrumbs" })
      ).toBeVisible();
      await expect(
        page
          .getByRole("navigation", { name: "Breadcrumbs" })
          .getByText("Guides")
      ).toBeVisible();
      await expect(
        page
          .getByRole("navigation", { name: "Breadcrumbs" })
          .getByText("Auto-waiting")
      ).toBeVisible();
    });
  });
});
