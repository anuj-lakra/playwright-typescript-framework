# Accessibility Utility

The Accessibility Utility provides a streamlined method for running accessibility scans using Axe Core in Playwright tests.

## Method

### `runAccessibilityScan(page: Page): Promise<AxeResults>`
Runs a comprehensive accessibility scan on a given page.

**Parameters:**
- `page`: Playwright Page object

**Returns:** Axe Core accessibility scan results

**Example:**
```typescript
import { test, expect } from '@playwright/test';
import { runAccessibilityScan } from '@utilities/web/accessibility';

test('Page should have no accessibility violations', async ({ page }) => {
  await page.goto('/');
  const accessibilityResults = await runAccessibilityScan(page);
  expect(accessibilityResults.violations).toBe(0);
});
```

## Scan Configuration

The utility scans against multiple WCAG (Web Content Accessibility Guidelines) levels:
- WCAG 2.0 Level A
- WCAG 2.0 Level AA
- WCAG 2.1 Level A
- WCAG 2.1 Level AA
- WCAG 2.2 Level A
- WCAG 2.2 Level AA

## Included Tags

The scan checks for accessibility issues in the following categories:
- Keyboard accessibility
- Color contrast
- Form labels
- Image alt text
- Page structure
- ARIA attributes
- Navigation
- Content readability

## Use Cases

1. **Automated Accessibility Testing:** Integrate accessibility checks in CI/CD pipelines
2. **Compliance Verification:** Ensure web applications meet accessibility standards
3. **Early Detection:** Identify potential accessibility issues during development

## Best Practices

- Run accessibility scans on all pages and components
- Address violations early in the development process
- Use the detailed violations report to improve accessibility

## Interpreting Results

The `AxeResults` object contains:
- `violations`: List of accessibility issues found
- `passes`: Checks that passed
- `incomplete`: Checks that could not be automatically verified
- `inapplicable`: Checks not applicable to the page

## Dependencies

- `@axe-core/playwright`: Axe Core integration for Playwright
- Requires Playwright test context

## Limitations

- Automated scans cannot detect all accessibility issues
- Manual testing and user testing are still recommended

**Note:** While this utility provides comprehensive automated accessibility testing, it should be used in conjunction with manual accessibility reviews and user testing.
