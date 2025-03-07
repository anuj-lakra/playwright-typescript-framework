import { test, expect } from "@fixtures/todo-fixture";

const TODO_ITEMS = [
  "buy some cheese",
  "feed the cat",
  "book a doctors appointment",
] as const;

test.beforeEach(async ({ todoPage }) => {
  await todoPage.navigateToTodoApp();
});

test.describe("New Todo", () => {
  test("should allow me to add todo items", async ({ todoPage }) => {
    // Create 1st todo.
    await todoPage.createTodo(TODO_ITEMS[0]);

    // Make sure the list only has one todo item.
    const todoItems = await todoPage.getTodoItems();
    await expect(todoItems[0]).toHaveText(TODO_ITEMS[0]);

    // Create 2nd todo.
    await todoPage.createTodo(TODO_ITEMS[1]);

    // Make sure the list now has two todo items.
    const updatedTodoItems = await todoPage.getTodoItems();
    const updatedTodoTexts = await Promise.all(
      updatedTodoItems.map((item) => item.textContent())
    );
    expect(updatedTodoTexts).toEqual([TODO_ITEMS[0], TODO_ITEMS[1]]);
  });

  test("should clear text input field when an item is added", async ({
    todoPage,
  }) => {
    // Create one todo item.
    await todoPage.createTodo(TODO_ITEMS[0]);

    // Check that input is empty.
    await expect(todoPage.newTodoInput).toBeEmpty();
  });

  test("should append new items to the bottom of the list", async ({
    todoPage,
  }) => {
    // Create 3 items.
    for (const item of TODO_ITEMS) {
      await todoPage.createTodo(item);
    }

    // Check all items in one call.
    const todoItems = await todoPage.getTodoItems();
    await Promise.all(
      TODO_ITEMS.map(async (item, index) => {
        await expect(todoItems[index]).toHaveText(item);
      })
    );

    // Check the count.
    const todoCount = await todoPage.getTodoCount();
    expect(todoCount).toContain("3");
  });
});

test.describe("Mark all as completed", () => {
  test.beforeEach(async ({ todoPage }) => {
    for (const item of TODO_ITEMS) {
      await todoPage.createTodo(item);
    }
  });

  test("should allow me to mark all items as completed", async ({
    todoPage,
  }) => {
    // Complete all todos.
    await todoPage.markAllAsCompleted();

    // Ensure all todos have 'completed' class.
    const todoItems = await todoPage.getTodoItems();
    for (const item of todoItems) {
      await expect(item).toHaveClass("completed");
    }
  });

  test("should allow me to clear the complete state of all items", async ({
    todoPage,
  }) => {
    await todoPage.markAllAsCompleted();
    await todoPage.toggleAll.uncheck();

    // Should be no completed classes.
    const todoItems = await todoPage.getTodoItems();
    for (const item of todoItems) {
      await expect(item).toHaveClass("");
    }
  });

  test("complete all checkbox should update state when items are completed / cleared", async ({
    todoPage,
  }) => {
    await todoPage.markAllAsCompleted();
    await expect(todoPage.toggleAll).toBeChecked();

    // Uncheck first todo.
    const firstTodoCheckbox = await todoPage.getTodoCheckbox(0);
    await firstTodoCheckbox.uncheck();

    // Reuse toggleAll locator and make sure it's not checked.
    await expect(todoPage.toggleAll).not.toBeChecked();

    await firstTodoCheckbox.check();
    await expect(todoPage.toggleAll).toBeChecked();
  });
});

test.describe("Item", () => {
  test("should allow me to mark items as complete", async ({ todoPage }) => {
    // Create two items.
    for (const item of TODO_ITEMS.slice(0, 2)) {
      await todoPage.createTodo(item);
    }

    // Check first item.
    const firstTodoCheckbox = await todoPage.getTodoCheckbox(0);
    await firstTodoCheckbox.check();
    const todoItems = await todoPage.getTodoItems();
    await expect(todoItems[0]).toHaveClass("completed");

    // Check second item.
    const secondTodoCheckbox = await todoPage.getTodoCheckbox(1);
    await expect(todoItems[1]).not.toHaveClass("completed");
    await secondTodoCheckbox.check();

    // Assert completed class.
    await expect(todoItems[0]).toHaveClass("completed");
    await expect(todoItems[1]).toHaveClass("completed");
  });

  test("should allow me to un-mark items as complete", async ({ todoPage }) => {
    // Create two items.
    for (const item of TODO_ITEMS.slice(0, 2)) {
      await todoPage.createTodo(item);
    }

    const firstTodoCheckbox = await todoPage.getTodoCheckbox(0);
    await firstTodoCheckbox.check();
    const todoItems = await todoPage.getTodoItems();
    await expect(todoItems[0]).toHaveClass("completed");
    await expect(todoItems[1]).not.toHaveClass("completed");

    await firstTodoCheckbox.uncheck();
    await expect(todoItems[0]).not.toHaveClass("completed");
    await expect(todoItems[1]).not.toHaveClass("completed");
  });

  test("should allow me to edit an item", async ({ todoPage }) => {
    for (const item of TODO_ITEMS) {
      await todoPage.createTodo(item);
    }

    const todoItems = await todoPage.getTodoItems();
    const secondTodo = todoItems[1];
    await secondTodo.dblclick();
    await expect(secondTodo.getByRole("textbox", { name: "Edit" })).toHaveValue(
      TODO_ITEMS[1]
    );
    await secondTodo
      .getByRole("textbox", { name: "Edit" })
      .fill("buy some sausages");
    await secondTodo.getByRole("textbox", { name: "Edit" }).press("Enter");

    // Explicitly assert the new text value.
    const todoTexts = await Promise.all(
      todoItems.map((item) => item.textContent())
    );
    expect(todoTexts).toEqual([
      TODO_ITEMS[0],
      "buy some sausages",
      TODO_ITEMS[2],
    ]);
  });
});

test.describe("Editing", () => {
  test.beforeEach(async ({ todoPage }) => {
    for (const item of TODO_ITEMS) {
      await todoPage.createTodo(item);
    }
  });

  test("should hide other controls when editing", async ({ todoPage }) => {
    const todoItems = await todoPage.getTodoItems();
    const todoItem = todoItems[1];
    await todoItem.dblclick();
    await expect(todoItem.getByRole("checkbox")).toBeHidden();
    await expect(
      todoItem.locator("label", { hasText: TODO_ITEMS[1] })
    ).toBeHidden();
  });

  test("should save edits on blur", async ({ todoPage }) => {
    const todoItems = await todoPage.getTodoItems();
    await todoItems[1].dblclick();
    await todoItems[1]
      .getByRole("textbox", { name: "Edit" })
      .fill("buy some sausages");
    await todoItems[1]
      .getByRole("textbox", { name: "Edit" })
      .dispatchEvent("blur");

    const todoTexts = await Promise.all(
      todoItems.map((item) => item.textContent())
    );
    expect(todoTexts).toEqual([
      TODO_ITEMS[0],
      "buy some sausages",
      TODO_ITEMS[2],
    ]);
  });

  test("should trim entered text", async ({ todoPage }) => {
    const todoItems = await todoPage.getTodoItems();
    await todoItems[1].dblclick();
    await todoItems[1]
      .getByRole("textbox", { name: "Edit" })
      .fill("    buy some sausages    ");
    await todoItems[1].getByRole("textbox", { name: "Edit" }).press("Enter");

    const todoTexts = await Promise.all(
      todoItems.map((item) => item.textContent())
    );
    expect(todoTexts).toEqual([
      TODO_ITEMS[0],
      "buy some sausages",
      TODO_ITEMS[2],
    ]);
  });

  test("should remove the item if an empty text string was entered", async ({
    todoPage,
  }) => {
    const todoItems = await todoPage.getTodoItems();
    await todoItems[1].dblclick();
    await todoItems[1].getByRole("textbox", { name: "Edit" }).fill("");
    await todoItems[1].getByRole("textbox", { name: "Edit" }).press("Enter");

    const updatedTodoItems = await todoPage.getTodoItems();

    const todoTexts = await Promise.all(
      updatedTodoItems.map((item) => item.textContent())
    );
    expect(todoTexts).toEqual([TODO_ITEMS[0], TODO_ITEMS[2]]);
  });

  test("should cancel edits on escape", async ({ todoPage }) => {
    const todoItems = await todoPage.getTodoItems();
    await todoItems[1].dblclick();
    await todoItems[1]
      .getByRole("textbox", { name: "Edit" })
      .fill("buy some sausages");
    await todoItems[1].getByRole("textbox", { name: "Edit" }).press("Escape");
    const todoTexts = await Promise.all(
      todoItems.map((item) => item.textContent())
    );
    expect(todoTexts).toEqual(TODO_ITEMS);
  });
});

test.describe("Counter", () => {
  test("should display the current number of todo items", async ({
    todoPage,
  }) => {
    // Create two items.
    for (const item of TODO_ITEMS.slice(0, 2)) {
      await todoPage.createTodo(item);
    }

    // Check the count.
    const todoCount = await todoPage.getTodoCount();
    expect(todoCount).toContain("2");
  });
});

test.describe("Clear completed button", () => {
  test.beforeEach(async ({ todoPage }) => {
    for (const item of TODO_ITEMS) {
      await todoPage.createTodo(item);
    }
  });

  test("should display the correct text", async ({ todoPage }) => {
    const todoItems = await todoPage.getTodoItems();
    await todoItems[0].getByRole("checkbox").check();
    await expect(todoPage.clearCompletedButton).toBeVisible();
  });

  test("should remove completed items when clicked", async ({ todoPage }) => {
    const todoItems = await todoPage.getTodoItems();
    await todoItems[1].getByRole("checkbox").check();
    await todoPage.clearCompleted();
    const updatedTodoItems = await todoPage.getTodoItems();
    expect(updatedTodoItems.length).toBe(2);

    const todoTexts = await Promise.all(
      updatedTodoItems.map((item) => item.textContent())
    );
    expect(todoTexts).toEqual([TODO_ITEMS[0], TODO_ITEMS[2]]);
  });

  test("should be hidden when there are no items that are completed", async ({
    todoPage,
  }) => {
    const todoItems = await todoPage.getTodoItems();
    await todoItems[0].getByRole("checkbox").check();
    await todoPage.clearCompleted();
    await expect(todoPage.clearCompletedButton).toBeHidden();
  });
});

test.describe("Persistence", () => {
  test("should persist its data", async ({ todoPage, page }) => {
    // Create two items.
    for (const item of TODO_ITEMS.slice(0, 2)) {
      await todoPage.createTodo(item);
    }

    const todoItems = await todoPage.getTodoItems();
    const firstTodoCheck = await todoPage.getTodoCheckbox(0);
    await firstTodoCheck.check();
    const updatedTodoItems = await todoPage.getTodoItems();
    const todoTexts = await Promise.all(
      updatedTodoItems.map((item) => item.textContent())
    );
    expect(todoTexts).toEqual([TODO_ITEMS[0], TODO_ITEMS[1]]);

    await expect(firstTodoCheck).toBeChecked();
    await expect(todoItems[0]).toHaveClass("completed");
    await expect(todoItems[1]).not.toHaveClass("completed");

    // Now reload.
    await page.reload();
    for (let i = 0; i < todoItems.length; i++) {
      await expect(todoItems[i]).toHaveText(TODO_ITEMS[i]);
    }
    await expect(firstTodoCheck).toBeChecked();
    await expect(todoItems[0]).toHaveClass("completed");
    await expect(todoItems[1]).not.toHaveClass("completed");
  });
});

test.describe("Routing", () => {
  test.beforeEach(async ({ todoPage }) => {
    for (const item of TODO_ITEMS) {
      await todoPage.createTodo(item);
    }
  });

  test("should allow me to display active items", async ({ todoPage }) => {
    const todoItems = await todoPage.getTodoItems();
    await todoItems[1].getByRole("checkbox").check();
    await todoPage.filterTodos("Active");
    const updatedTodoItems = await todoPage.getTodoItems();
    expect(updatedTodoItems).toHaveLength(2);
    const todoTexts = await Promise.all(
      updatedTodoItems.map((item) => item.textContent())
    );
    expect(todoTexts).toEqual([TODO_ITEMS[0], TODO_ITEMS[2]]);
  });

  test("should respect the back button", async ({ todoPage, page }) => {
    const todoItems = await todoPage.getTodoItems();
    await todoItems[1].getByRole("checkbox").check();

    await test.step("Showing all items", async () => {
      await todoPage.filterTodos("All");
      expect(todoItems).toHaveLength(3);
    });

    await test.step("Showing active items", async () => {
      await todoPage.filterTodos("Active");
    });

    await test.step("Showing completed items", async () => {
      await todoPage.filterTodos("Completed");
    });

    expect(await todoPage.getTodoItems()).toHaveLength(1);
    await page.goBack();
    expect(await todoPage.getTodoItems()).toHaveLength(2);
    await page.goBack();
    expect(await todoPage.getTodoItems()).toHaveLength(3);
  });

  test("should allow me to display completed items", async ({ todoPage }) => {
    const todoItems = await todoPage.getTodoItems();
    await todoItems[1].getByRole("checkbox").check();
    await todoPage.filterTodos("Completed");
    expect(await todoPage.getTodoItems()).toHaveLength(1);
  });

  test("should allow me to display all items", async ({ todoPage }) => {
    const todoItems = await todoPage.getTodoItems();
    await todoItems[1].getByRole("checkbox").check();
    await todoPage.filterTodos("Active");
    await todoPage.filterTodos("Completed");
    await todoPage.filterTodos("All");
    expect(todoItems).toHaveLength(3);
  });

  test("should highlight the currently applied filter", async ({ page }) => {
    await expect(page.getByRole("link", { name: "All" })).toHaveClass(
      "selected"
    );

    const activeLink = page.getByRole("link", { name: "Active" });
    const completedLink = page.getByRole("link", {
      name: "Completed",
    });
    await activeLink.click();

    await expect(activeLink).toHaveClass("selected");
    await completedLink.click();

    await expect(completedLink).toHaveClass("selected");
  });
});
