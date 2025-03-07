import { test as baseTest } from "@playwright/test";
import { TodoPage } from "../page-objects/todo/todo-page";

type TodoFixtures = {
  todoPage: TodoPage;
};

export const test = baseTest.extend<TodoFixtures>({
  todoPage: async ({ page }, use) => {
    const todoPage = new TodoPage(page);

    await use(todoPage);
  },
});

export { expect } from "@playwright/test";
