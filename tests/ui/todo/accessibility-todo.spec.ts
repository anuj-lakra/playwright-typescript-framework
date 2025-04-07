import { test, expect } from "@fixtures/todo-fixture";
import { runAccessibilityScan } from "@utilities/web/accessibility";

test("Accessibility scan for Todo App", async ({ todoPage, page }) => {
  await todoPage.navigateToTodoApp();
  const adaResult = await runAccessibilityScan(page);
  expect(adaResult.violations).toBe(0);
});
