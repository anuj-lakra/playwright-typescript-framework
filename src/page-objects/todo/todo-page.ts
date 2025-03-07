import { Page, Locator } from "@playwright/test";
import { step } from "@utilities/test-utils";

type PageAction<Params extends unknown[] = [], Return = void> = (
  ...params: Params
) => Promise<Return>;

export interface ITodoPage {
  navigateToTodoApp: PageAction;
  createTodo: PageAction<[string]>;
  getTodoItems: PageAction<[], Locator[]>;
  markAllAsCompleted: PageAction;
  clearCompleted: PageAction;
  filterTodos: PageAction<[string]>;
  getTodoCount: PageAction<[], string>;
  getTodoCheckbox: PageAction<[number], Locator>;
}

export class TodoPage implements ITodoPage {
  private readonly page: Page;
  readonly newTodoInput: Locator;
  readonly todoList: Locator;
  readonly toggleAll: Locator;
  readonly clearCompletedButton: Locator;
  readonly todoCount: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newTodoInput = page.getByPlaceholder("What needs to be done?");
    this.todoList = page.getByTestId("todo-item");
    this.toggleAll = page.getByLabel("Mark all as complete");
    this.clearCompletedButton = page.getByRole("button", {
      name: "Clear completed",
    });
    this.todoCount = page.getByTestId("todo-count");
  }

  @step("Navigate to Todo App")
  async navigateToTodoApp(): Promise<void> {
    await this.page.goto("/todomvc");
  }

  @step("Create a new todo")
  async createTodo(todoText: string): Promise<void> {
    await this.newTodoInput.fill(todoText);
    await this.newTodoInput.press("Enter");
  }

  @step("Get all todo items")
  async getTodoItems(): Promise<Locator[]> {
    return await this.todoList.all();
  }

  @step("Mark all todos as completed")
  async markAllAsCompleted(): Promise<void> {
    await this.toggleAll.check();
  }

  @step("Clear completed todos")
  async clearCompleted(): Promise<void> {
    await this.clearCompletedButton.click();
  }

  @step("Filter todos")
  async filterTodos(filter: string): Promise<void> {
    await this.page.getByRole("link", { name: filter }).click();
  }

  @step("Get todo count")
  async getTodoCount(): Promise<string> {
    return (await this.todoCount.textContent()) ?? "";
  }

  @step("Get checkbox for a specific todo item")
  async getTodoCheckbox(index: number): Promise<Locator> {
    const todoItems = await this.getTodoItems();
    return todoItems[index].getByRole("checkbox");
  }
}
