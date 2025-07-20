# Playwright TypeScript Framework Documentation

## Overview

This is a comprehensive end-to-end (E2E) testing framework built with **Playwright** and **TypeScript**, designed for scalable, maintainable, and high-quality automated testing of web applications. The framework follows industry best practices and includes advanced features for accessibility testing, data-driven testing, reporting, and CI/CD integration.

---

## 🏗️ Project Architecture

### Directory Structure

```
playwright-typescript-framework/
├── src/                          # Source code and utilities
│   ├── fixtures/                 # Custom Playwright fixtures
│   ├── page-objects/            # Page Object Model implementation
│   └── utilities/               # Utility functions and helpers
│       ├── files/              # File handling utilities
│       ├── web/               # Web-specific utilities
│       ├── unit-test/         # Unit tests for utilities
│       └── documentations/    # Utility documentation
├── tests/                       # Test suites
│   ├── ui/                     # UI/E2E tests
│   └── data-driven/            # Data-driven test suites
├── testdata/                    # Test data files (CSV, etc.)
├── coverage/                    # Code coverage reports
├── playwright-report/           # HTML test reports
├── test-results/               # Test execution artifacts
└── data/                       # Additional test data
```

---

## ⚙️ Configuration

### Playwright Configuration (`playwright.config.ts`)

**Key Features:**
- **Parallel Execution**: Tests run in parallel for faster execution
- **Environment-based Settings**: Different configurations for CI/CD vs local development
- **Retry Logic**: Automatic retry on failures (2 retries on CI)
- **Artifact Collection**: Screenshots, videos, and traces on failures
- **Multiple Reporters**: HTML reports and Xray integration for test management
- **Browser Optimization**: Maximized browser windows, download support, clipboard permissions

**Configuration Highlights:**
```typescript
// CI-specific settings
retries: process.env.CI ? 2 : 0
workers: process.env.CI ? 3 : undefined
maxFailures: process.env.CI ? 5 : 10

// Artifact collection
trace: "on-first-retry"
video: "on-first-retry" 
screenshot: "on"

// Xray integration for test management
reporter: [
  process.env.CI ? ["blob"] : ["html", { open: "never" }],
  ["@xray-app/playwright-junit-reporter", xrayOptions]
]
```

---

## 🧪 Core Components

### 1. Page Object Model (POM)

**Location:** `src/page-objects/`

The framework implements the Page Object Model pattern for maintainable and reusable test code:

```typescript
export class TodoPage implements ITodoPage {
  private readonly page: Page;
  readonly newTodoInput: Locator;
  readonly todoList: Locator;
  readonly toggleAll: Locator;

  @step("Create a new todo")
  async createTodo(todoText: string): Promise<void> {
    await this.newTodoInput.fill(todoText);
    await this.newTodoInput.press("Enter");
  }

  @step("Get all todo items")
  async getTodoItems(): Promise<Locator[]> {
    return await this.todoList.all();
  }
}
```

**Benefits:**
- Encapsulated page interactions
- Reusable across multiple tests
- Enhanced reporting with `@step` decorators
- Type-safe interfaces

### 2. Custom Fixtures

**Location:** `src/fixtures/`

Custom fixtures provide shared setup and context for tests:

```typescript
export const test = baseTest.extend<TodoFixtures>({
  todoPage: async ({ page }, use) => {
    const todoPage = new TodoPage(page);
    await use(todoPage);
  },
});
```

**Features:**
- Dependency injection for page objects
- Automatic setup and teardown
- Shared context across test suites

### 3. Utility Libraries

**Location:** `src/utilities/`

#### A. Form Filler Utility (`web/formFiller.ts`)
Intelligent form filling with Faker.js integration:

```typescript
const formFiller = new FormFiller(page, "en");
await formFiller.autoFillForm({ locale: "fr" });
```

**Capabilities:**
- Automatic field type detection
- Multi-locale support
- 20+ field types (TEXT, EMAIL, PHONE, etc.)
- Smart value generation

#### B. Accessibility Testing (`web/accessibility.ts`)
Automated accessibility scanning with Axe Core:

```typescript
const adaResult = await runAccessibilityScan(page);
expect(adaResult.violations).toBe(0);
```

**Features:**
- WCAG 2.0/2.1/2.2 compliance checking
- Multiple accessibility levels (A, AA)
- Detailed violation reporting

#### C. PDF Validator (`files/pdfValidator.ts`)
PDF download and validation utilities:

```typescript
const pdfValidator = new PdfValidator();
await pdfValidator.downloadPdf(page, selector, { minSize: 1024 });
```

#### D. Data Parser (`files/dataParser.ts`)
Support for CSV and Excel data parsing:

```typescript
const testData = await DataParser.loadTestData<Person>(
  "testdata/users.csv", 
  (row) => ({ name: row.name, age: parseInt(row.age) })
);
```

#### E. Test Utilities (`test-utils.ts`)
Enhanced test reporting and step tracking:

```typescript
// Add test annotations for Xray integration
addTestAnnotations(testInfo, "JIRA-123", "Login Test", "Verify login flow");

// Capture and attach screenshots
await captureAndAttachScreenshot(page, testInfo);

// Step decorator for detailed reporting
@step("Navigate to login page")
async navigateToLogin() { ... }
```

---

## 🧪 Testing Patterns

### 1. UI Testing

**Location:** `tests/ui/`

Example test structure:

```typescript
import { test, expect } from "@fixtures/todo-fixture";

test.describe("New Todo", () => {
  test.beforeEach(async ({ todoPage }) => {
    await todoPage.navigateToTodoApp();
  });

  test("should allow me to add todo items", async ({ todoPage }) => {
    await todoPage.createTodo("buy some cheese");
    const todoItems = await todoPage.getTodoItems();
    await expect(todoItems[0]).toHaveText("buy some cheese");
  });
});
```

### 2. Accessibility Testing

```typescript
test("Accessibility scan for Todo App", async ({ todoPage, page }) => {
  await todoPage.navigateToTodoApp();
  const adaResult = await runAccessibilityScan(page);
  expect(adaResult.violations).toBe(0);
});
```

### 3. Data-Driven Testing

**Location:** `tests/data-driven/`

Tests can consume data from CSV/Excel files in the `testdata/` directory.

---

## 📊 Reporting & CI/CD Integration

### Test Reporting

1. **HTML Reports**: Interactive reports with screenshots and videos
2. **Xray Integration**: Automatic test result upload to Jira Xray
3. **JUnit Reports**: XML format for CI/CD systems
4. **Code Coverage**: Jest-based unit test coverage

### CI/CD Features

- **Environment Detection**: Automatic CI vs local configuration
- **Parallel Execution**: Optimized worker allocation
- **Artifact Management**: Automatic screenshot/video capture
- **Failure Handling**: Smart retry logic and failure thresholds

---

## 🛠️ Development Tools

### Code Quality

- **ESLint**: TypeScript, Playwright, and Jest rules
- **TypeScript**: Full type safety
- **Jest**: Unit testing for utilities
- **Prettier**: Code formatting (configurable)

### Scripts (package.json)

```bash
# E2E Testing
npm run test              # Run all Playwright tests
npm run test:ui           # Run UI tests only

# Unit Testing  
npm run test:unit         # Run utility unit tests
npm run test:unit:coverage # Run with coverage
npm run test:all          # Run both E2E and unit tests

# Code Quality
npm run lint              # Lint TypeScript files
npm run lint:fix          # Auto-fix linting issues

# Reporting
npm run upload-results    # Upload results to Xray
```

---

## 🔧 Key Dependencies

### Core Testing
- `@playwright/test` (^1.54.1): Main testing framework
- `typescript` (^5.8.3): Type safety

### Utilities & Enhancement
- `@faker-js/faker` (^9.6.0): Test data generation
- `@axe-core/playwright` (^4.10.1): Accessibility testing
- `exceljs` (^4.4.0): Excel file processing
- `csv-parse` (^5.6.0): CSV file parsing

### Reporting & Integration
- `@xray-app/playwright-junit-reporter` (^0.5.0): Xray integration
- `jest` (^29.7.0): Unit testing framework

### Development
- `eslint` (^9.24.0): Code linting
- `@typescript-eslint/*`: TypeScript ESLint rules

---

## 🚀 Getting Started

### Prerequisites
- Node.js (latest LTS)
- npm or yarn

### Setup
1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Install Playwright Browsers:**
   ```bash
   npx playwright install
   ```

3. **Environment Configuration:**
   ```bash
   # Create .env file
   BASE_URL=https://your-app-url.com
   ```

4. **Run Tests:**
   ```bash
   # All tests
   npm run test
   
   # Specific test suite
   npm run test:ui
   
   # With debug mode
   npx playwright test --debug
   ```

---

## 📈 Best Practices

### Test Organization
- Use descriptive test names and descriptions
- Group related tests with `test.describe()`
- Implement proper setup/teardown with `beforeEach`/`afterEach`

### Page Objects
- Keep page objects focused and cohesive
- Use the `@step` decorator for detailed reporting
- Implement interfaces for better maintainability

### Data Management
- Store test data in the `testdata/` directory
- Use the DataParser utility for external data files
- Implement data factories for complex test scenarios

### Accessibility
- Include accessibility tests in your test suites
- Run scans on key user journeys
- Address violations early in development

---

## 🔍 Advanced Features

### Custom Test Annotations
Integrate with test management tools:

```typescript
addTestAnnotations(
  testInfo, 
  "PROJ-123", 
  "User Login", 
  "Verify successful authentication flow"
);
```

### Dynamic Form Testing
Automatically test forms with realistic data:

```typescript
const formFiller = new FormFiller(page);
await formFiller.autoFillForm({ 
  excludeFields: ["#sensitive-field"],
  locale: "en" 
});
```

### PDF Validation
Test file downloads and content:

```typescript
const validator = new PdfValidator();
const filePath = await validator.downloadPdf(page, "#download-btn");
await validator.validatePdfSize(filePath, 1024);
```

---

## 🎯 Framework Benefits

1. **Maintainability**: Page Object Model and TypeScript ensure code quality
2. **Scalability**: Parallel execution and modular design support growth
3. **Comprehensive Testing**: UI, accessibility, and data-driven testing
4. **CI/CD Ready**: Optimized for continuous integration pipelines
5. **Rich Reporting**: Multiple report formats with detailed artifacts
6. **Developer Experience**: Strong typing, autocomplete, and debugging support

---

This framework provides a solid foundation for enterprise-level web application testing with Playwright and TypeScript, combining best practices with powerful utilities for comprehensive test coverage.