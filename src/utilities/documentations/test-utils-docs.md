# Test Utilities

A collection of utility functions to enhance Playwright test management and reporting.

## Methods

### `addTestAnnotations(testInfo: TestInfo, testKey: string, testSummary: string, testDescription: string)`
Add custom annotations to test information for advanced test management.

**Parameters:**
- `testInfo`: Playwright TestInfo object
- `testKey`: Unique identifier for the test (e.g., Jira ticket)
- `testSummary`: Short summary of the test
- `testDescription`: Detailed description of the test

**Example:**
```typescript
import { test } from '@playwright/test';
import { addTestAnnotations } from '@utilities/test-utils';

test('Login Test', async ({ page }, testInfo) => {
  addTestAnnotations(
    testInfo, 
    'JIRA-123', 
    'Validate User Login', 
    'Verify successful login with valid credentials'
  );
  
  // Test implementation
});
```

### `captureAndAttachScreenshot(page: Page, testInfo: TestInfo)`
Capture a full-page screenshot and automatically attach it to test results.

**Parameters:**
- `page`: Playwright Page object
- `testInfo`: Playwright TestInfo object

**Example:**
```typescript
import { test } from '@playwright/test';
import { captureAndAttachScreenshot } from '@utilities/test-utils';

test('UI Validation', async ({ page }, testInfo) => {
  await page.goto('/dashboard');
  await captureAndAttachScreenshot(page, testInfo);
});
```

### `step(stepName?: string)` (Decorator)
A method decorator to wrap method calls in Playwright test steps for better reporting and traceability.

**Parameters:**
- `stepName`: Optional custom step name (defaults to method name)

**Example:**
```typescript
import { step } from '@utilities/test-utils';

class LoginPage {
  @step()
  async login(username: string, password: string) {
    // Login implementation
  }

  @step('Custom Step Name')
  async navigateToLoginPage() {
    // Navigation implementation
  }
}
```

## Use Cases

1. **Test Reporting:** Add custom metadata to test results
2. **Traceability:** Link tests to issue tracking systems
3. **Detailed Logging:** Capture screenshots and method-level details
4. **Step Tracking:** Break down test methods into traceable steps

## Benefits

- Enhanced test reporting
- Improved debugging capabilities
- Better integration with test management tools
- Clear visualization of test execution flow

## Best Practices

- Use meaningful test keys and descriptions
- Capture screenshots at critical points in the test
- Use the `@step` decorator to break down complex methods
- Ensure annotations provide clear context about the test

## Compatibility

- Works with Playwright's test runner
- Supports custom test management and reporting workflows

**Note:** Annotations and screenshots are most effective when used strategically to provide meaningful insights into test execution.
