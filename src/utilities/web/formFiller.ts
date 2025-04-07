// src/utilities/web/formFiller.ts
import { Page, Locator } from "@playwright/test";
import { Faker, en, LocaleDefinition } from "@faker-js/faker";

/**
 * Types of form fields supported by the FormFiller
 */
export enum FieldType {
  TEXT = "text",
  EMAIL = "email",
  PASSWORD = "password",
  PHONE = "phone",
  NUMBER = "number",
  DATE = "date",
  SELECT = "select",
  CHECKBOX = "checkbox",
  RADIO = "radio",
  TEXTAREA = "textarea",
  FILE = "file",
  NAME = "name",
  ADDRESS = "address",
  CITY = "city",
  STATE = "state",
  ZIP = "zip",
  COUNTRY = "country",
  COMPANY = "company",
  URL = "url",
  CUSTOM = "custom",
}

/**
 * Configuration for a form field
 */
export interface FieldConfig {
  selector: string | Locator;
  type: FieldType;
  valueGenerator?: () => string | boolean | number | Date;
  min?: number;
  max?: number;
  options?: string[];
  clickAfterFill?: boolean;
  pressEnterAfterFill?: boolean;
  blurAfterFill?: boolean;
  filePath?: string;
  locale?: string;
}

/**
 * Options for auto-filling a form
 */
export interface AutoFillOptions {
  /**
   * Form selector (optional, defaults to "form")
   */
  formSelector?: string;

  /**
   * Fields to exclude from auto-filling (optional)
   */
  excludeSelectors?: string[];

  /**
   * Fields to include in auto-filling with custom configuration (optional)
   */
  customFields?: Record<string, Partial<Omit<FieldConfig, "selector">>>;

  /**
   * Whether to submit the form after filling (optional)
   */
  submitAfterFill?: boolean;

  /**
   * Selector for the submit button (optional, defaults to "button[type='submit']")
   */
  submitSelector?: string;

  /**
   * Locale for generating data (optional)
   */
  locale?: string;

  /**
   * Maximum number of visible elements to fill (optional, defaults to 50)
   */
  maxElements?: number;
}

/**
 * Smart form filler utility that uses Faker to automatically populate form fields
 */
export class FormFiller {
  private readonly page: Page;
  private faker: Faker;

  // Map of common field names/types to FieldType
  private static readonly fieldTypeMappings: Record<string, FieldType> = {
    // Input type mappings
    text: FieldType.TEXT,
    email: FieldType.EMAIL,
    password: FieldType.PASSWORD,
    number: FieldType.NUMBER,
    date: FieldType.DATE,
    checkbox: FieldType.CHECKBOX,
    radio: FieldType.RADIO,
    file: FieldType.FILE,
    url: FieldType.URL,

    // Name attribute pattern mappings
    name: FieldType.NAME,
    first: FieldType.NAME,
    firstname: FieldType.NAME,
    "first-name": FieldType.NAME,
    first_name: FieldType.NAME,
    last: FieldType.NAME,
    lastname: FieldType.NAME,
    "last-name": FieldType.NAME,
    last_name: FieldType.NAME,
    fullname: FieldType.NAME,
    "full-name": FieldType.NAME,
    full_name: FieldType.NAME,

    "e-mail": FieldType.EMAIL,
    mail: FieldType.EMAIL,

    pass: FieldType.PASSWORD,

    pwd: FieldType.PASSWORD,

    phone: FieldType.PHONE,
    telephone: FieldType.PHONE,
    tel: FieldType.PHONE,
    mobile: FieldType.PHONE,
    cell: FieldType.PHONE,

    address: FieldType.ADDRESS,
    street: FieldType.ADDRESS,
    "street-address": FieldType.ADDRESS,
    street_address: FieldType.ADDRESS,
    addr: FieldType.ADDRESS,
    line1: FieldType.ADDRESS,
    "address-line1": FieldType.ADDRESS,
    address_line1: FieldType.ADDRESS,

    city: FieldType.CITY,
    town: FieldType.CITY,
    locality: FieldType.CITY,

    state: FieldType.STATE,
    province: FieldType.STATE,
    region: FieldType.STATE,
    county: FieldType.STATE,

    zip: FieldType.ZIP,
    zipcode: FieldType.ZIP,
    "zip-code": FieldType.ZIP,
    zip_code: FieldType.ZIP,
    postal: FieldType.ZIP,
    postalcode: FieldType.ZIP,
    "postal-code": FieldType.ZIP,
    postal_code: FieldType.ZIP,

    country: FieldType.COUNTRY,
    nation: FieldType.COUNTRY,

    company: FieldType.COMPANY,
    organization: FieldType.COMPANY,
    organisation: FieldType.COMPANY,
    business: FieldType.COMPANY,
    firm: FieldType.COMPANY,

    website: FieldType.URL,
    "web-site": FieldType.URL,
    web_site: FieldType.URL,
    homepage: FieldType.URL,
    "home-page": FieldType.URL,
    home_page: FieldType.URL,
    web: FieldType.URL,

    comment: FieldType.TEXTAREA,
    message: FieldType.TEXTAREA,
    description: FieldType.TEXTAREA,
    memo: FieldType.TEXTAREA,
    notes: FieldType.TEXTAREA,
  };

  /**
   * Creates a new FormFiller instance
   *
   * @param page - Playwright page object
   * @param locale - Optional locale for Faker (default: 'en')
   */
  constructor(page: Page, locale: string = "en") {
    this.page = page;

    // Map the string locale to a LocaleDefinition
    const localeDefinition: LocaleDefinition = this.getLocaleDefinition(locale);

    this.faker = new Faker({ locale: localeDefinition }); // Initialize Faker with the specified locale
  }

  /**
   * Map a string locale to a LocaleDefinition
   *
   * @param locale - The string locale (e.g., 'en')
   * @returns The corresponding LocaleDefinition
   */
  private getLocaleDefinition(locale: string): LocaleDefinition {
    switch (locale) {
      case "en":
        return en;
      // Add other locales here as needed
      default:
        throw new Error(`Unsupported locale: ${locale}`);
    }
  }

  /**
   * Fill a form field based on its type
   *
   * @param fieldConfig - Configuration for the field
   * @returns Promise that resolves to the value used to fill the field
   */
  async fillField(
    fieldConfig: FieldConfig
  ): Promise<string | boolean | number | Date> {
    // Temporarily set a new Faker instance if a locale is specified
    const originalFaker = this.faker;
    if (fieldConfig.locale) {
      const localeDefinition: LocaleDefinition = this.getLocaleDefinition(
        fieldConfig.locale
      );
      this.faker = new Faker({ locale: localeDefinition });
    }

    // Get the locator for the field
    const locator =
      typeof fieldConfig.selector === "string"
        ? this.page.locator(fieldConfig.selector)
        : fieldConfig.selector;

    // Generate a value based on the field type
    const value = await this.generateValue(fieldConfig);

    // Fill the field with the generated value
    await this.applyValueToField(locator, fieldConfig, value);

    // Reset Faker instance to the original one
    if (fieldConfig.locale) {
      this.faker = originalFaker;
    }

    return value;
  }

  /**
   * Fill multiple form fields
   *
   * @param fieldsConfig - Array of field configurations
   * @returns Promise that resolves to an object mapping field selectors to the values used
   */
  async fillForm(fieldsConfig: FieldConfig[]): Promise<Record<string, any>> {
    const fieldValues: Record<string, any> = {};

    for (const fieldConfig of fieldsConfig) {
      const value = await this.fillField(fieldConfig);
      const selectorKey =
        typeof fieldConfig.selector === "string"
          ? fieldConfig.selector
          : `field-${Object.keys(fieldValues).length}`;

      fieldValues[selectorKey] = value;
    }

    return fieldValues;
  }

  /**
   * Automatically fill all form fields without requiring explicit selectors
   *
   * @param options - Options for auto-filling
   * @returns Promise that resolves to an object mapping field selectors to the values used
   */
  async autoFillForm(
    options: AutoFillOptions = {}
  ): Promise<Record<string, any>> {
    const {
      formSelector = "form",
      excludeSelectors = [],
      customFields = {},
      submitAfterFill = false,
      submitSelector = "button[type='submit']",
      locale,
      maxElements = 50,
    } = options;

    // Temporarily set a new Faker instance if a locale is specified
    const originalFaker = this.faker;
    if (locale) {
      const localeDefinition: LocaleDefinition =
        this.getLocaleDefinition(locale);
      this.faker = new Faker({ locale: localeDefinition });
    }

    // Get all form elements
    const formFields = await this.detectFormFields(
      formSelector,
      excludeSelectors,
      maxElements
    );

    // Apply custom field configurations
    for (const selector in customFields) {
      const fieldIndex = formFields.findIndex(
        (field) => field.selector === selector
      );
      if (fieldIndex !== -1) {
        formFields[fieldIndex] = {
          ...formFields[fieldIndex],
          ...customFields[selector],
        };
      }
    }

    // Fill all fields
    const fieldValues = await this.fillForm(formFields);

    // Submit the form if required
    if (submitAfterFill) {
      const submitButton = this.page.locator(submitSelector);
      const isVisible = await submitButton.isVisible();

      if (isVisible) {
        await submitButton.click();
      } else {
        // If no submit button is visible, try pressing Enter on the last field
        const lastField = formFields[formFields.length - 1];
        if (lastField) {
          const lastLocator =
            typeof lastField.selector === "string"
              ? this.page.locator(lastField.selector)
              : lastField.selector;

          await lastLocator.press("Enter");
        }
      }
    }

    // Reset Faker instance to the original one
    if (locale) {
      this.faker = originalFaker;
    }

    return fieldValues;
  }

  /**
   * Detect form fields and create field configurations
   *
   * @param formSelector - Selector for the form
   * @param excludeSelectors - Selectors to exclude
   * @param maxElements - Maximum number of elements to detect
   * @returns Array of field configurations
   */
  private async detectFormFields(
    formSelector: string,
    excludeSelectors: string[],
    maxElements: number
  ): Promise<FieldConfig[]> {
    // Selectors for form elements
    const fieldSelectors = [
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"])',
      "select",
      "textarea",
    ];

    const formFields: FieldConfig[] = [];

    for (const elementSelector of fieldSelectors) {
      // Find all elements of this type
      const elements = this.page.locator(`${formSelector} ${elementSelector}`);
      const count = Math.min(await elements.count(), maxElements);

      for (let i = 0; i < count; i++) {
        const element = elements.nth(i);

        // Get element attributes
        const name = (await element.getAttribute("name")) || "";
        const id = (await element.getAttribute("id")) || "";
        const type = (await element.getAttribute("type")) || "";
        const placeholder = (await element.getAttribute("placeholder")) || "";
        const ariaLabel = (await element.getAttribute("aria-label")) || "";
        const label = (await element.getAttribute("label")) || "";

        // Create a unique selector for this element
        let selector = "";
        if (id) {
          selector = `#${id}`;
        } else if (name) {
          selector = `${elementSelector}[name="${name}"]`;
        } else {
          // Create a selector using nth-child
          selector = `${formSelector} ${elementSelector}:nth-child(${i + 1})`;
        }

        // Skip excluded selectors
        if (
          excludeSelectors.some((excludeSelector) =>
            selector.includes(excludeSelector)
          )
        ) {
          continue;
        }

        // Determine field type
        let fieldType = this.determineFieldType(
          element,
          type,
          name,
          id,
          placeholder,
          ariaLabel,
          label
        );

        // Create field configuration
        const fieldConfig: FieldConfig = {
          selector,
          type: await fieldType,
        };

        // Add field to the list
        formFields.push(fieldConfig);
      }

      // Stop if we've reached the maximum number of elements
      if (formFields.length >= maxElements) {
        break;
      }
    }

    return formFields;
  }

  /**
   * Determine the type of a form field based on its attributes
   *
   * @param element - The element locator
   * @param inputType - The input type attribute
   * @param name - The name attribute
   * @param id - The id attribute
   * @param placeholder - The placeholder attribute
   * @param ariaLabel - The aria-label attribute
   * @param label - The label attribute
   * @returns The determined field type
   */
  private async determineFieldType(
    element: Locator,
    inputType: string,
    name: string,
    id: string,
    placeholder: string,
    ariaLabel: string,
    label: string
  ): Promise<FieldType> {
    // Get the tag name
    const tagName = await this.getTagName(element);

    // Check if it's a select element
    if (tagName === "select") {
      return FieldType.SELECT;
    }

    // Check if it's a textarea
    if (tagName === "textarea") {
      return FieldType.TEXTAREA;
    }

    // If it's an input, prioritize the type attribute
    if (inputType && FormFiller.fieldTypeMappings[inputType.toLowerCase()]) {
      return FormFiller.fieldTypeMappings[inputType.toLowerCase()];
    }

    // Check name attribute for clues
    const nameLower = name.toLowerCase();
    for (const [pattern, fieldType] of Object.entries(
      FormFiller.fieldTypeMappings
    )) {
      if (nameLower.includes(pattern.toLowerCase())) {
        return fieldType;
      }
    }

    // Check id attribute for clues
    const idLower = id.toLowerCase();
    for (const [pattern, fieldType] of Object.entries(
      FormFiller.fieldTypeMappings
    )) {
      if (idLower.includes(pattern.toLowerCase())) {
        return fieldType;
      }
    }

    // Check placeholder for clues
    const placeholderLower = placeholder.toLowerCase();
    for (const [pattern, fieldType] of Object.entries(
      FormFiller.fieldTypeMappings
    )) {
      if (placeholderLower.includes(pattern.toLowerCase())) {
        return fieldType;
      }
    }

    // Check aria-label for clues
    const ariaLabelLower = ariaLabel.toLowerCase();
    for (const [pattern, fieldType] of Object.entries(
      FormFiller.fieldTypeMappings
    )) {
      if (ariaLabelLower.includes(pattern.toLowerCase())) {
        return fieldType;
      }
    }

    // Check label attribute for clues
    const labelLower = label.toLowerCase();
    for (const [pattern, fieldType] of Object.entries(
      FormFiller.fieldTypeMappings
    )) {
      if (labelLower.includes(pattern.toLowerCase())) {
        return fieldType;
      }
    }

    // If we couldn't determine the type, default to TEXT
    return FieldType.TEXT;
  }

  /**
   * Generate a value for a field based on its type
   *
   * @param fieldConfig - Configuration for the field
   * @returns The generated value
   */
  private async generateValue(
    fieldConfig: FieldConfig
  ): Promise<string | boolean | number | Date> {
    // If a custom value generator is provided, use it
    if (fieldConfig.valueGenerator) {
      return fieldConfig.valueGenerator();
    }

    // Generate a value based on the field type
    switch (fieldConfig.type) {
      case FieldType.TEXT:
        return this.faker.lorem.words(3);

      case FieldType.EMAIL:
        return this.faker.internet.email();

      case FieldType.PASSWORD:
        return this.faker.internet.password({ length: 12, memorable: true });

      case FieldType.PHONE:
        return this.faker.phone.number();

      case FieldType.NUMBER:
        const min = fieldConfig.min ?? 1;
        const max = fieldConfig.max ?? 100;
        return this.faker.number.int({ min, max });

      case FieldType.DATE:
        return this.faker.date.recent().toISOString().split("T")[0]; // YYYY-MM-DD format

      case FieldType.SELECT:
        if (fieldConfig.options && fieldConfig.options.length > 0) {
          const randomIndex = Math.floor(
            Math.random() * fieldConfig.options.length
          );
          return fieldConfig.options[randomIndex];
        }
        return this.getRandomSelectOption(fieldConfig.selector);

      case FieldType.CHECKBOX:
      case FieldType.RADIO:
        return Math.random() >= 0.5; // 50% chance of being checked

      case FieldType.TEXTAREA:
        return this.faker.lorem.paragraphs(2);

      case FieldType.NAME:
        return this.faker.person.fullName();

      case FieldType.ADDRESS:
        return this.faker.location.streetAddress();

      case FieldType.CITY:
        return this.faker.location.city();

      case FieldType.STATE:
        return this.faker.location.state();

      case FieldType.ZIP:
        return this.faker.location.zipCode();

      case FieldType.COUNTRY:
        return this.faker.location.country();

      case FieldType.COMPANY:
        return this.faker.company.name();

      case FieldType.URL:
        return this.faker.internet.url();

      default:
        return this.faker.lorem.word();
    }
  }

  /**
   * Apply a generated value to a field
   *
   * @param locator - Playwright locator for the field
   * @param fieldConfig - Configuration for the field
   * @param value - The value to apply
   */
  private async applyValueToField(
    locator: Locator,
    fieldConfig: FieldConfig,
    value: string | boolean | number | Date
  ): Promise<void> {
    const tagName = await this.getTagName(locator);
    const inputType = await this.getInputType(locator);

    if (tagName === "select") {
      if (typeof value === "string") {
        // Select by value
        await locator.selectOption(value);
      }
    } else if (
      tagName === "input" &&
      (inputType === "checkbox" || inputType === "radio")
    ) {
      // Handle checkboxes and radio buttons
      if (value === true) {
        await locator.check();
      } else if (value === false) {
        await locator.uncheck();
      }
    } else if (
      tagName === "input" &&
      inputType === "file" &&
      fieldConfig.filePath
    ) {
      // Handle file inputs
      await locator.setInputFiles(fieldConfig.filePath);
    } else {
      // For text inputs, textareas, etc.
      await locator.fill(String(value));
    }

    // Additional actions after filling
    if (fieldConfig.clickAfterFill) {
      await locator.click();
    }

    if (fieldConfig.pressEnterAfterFill) {
      await locator.press("Enter");
    }

    if (fieldConfig.blurAfterFill) {
      await locator.evaluate((el) => el.blur());
    }
  }

  /**
   * Get the tag name of an element
   *
   * @param locator - Playwright locator for the element
   * @returns Promise that resolves to the tag name (lowercase)
   */
  private async getTagName(locator: Locator): Promise<string> {
    return await locator.evaluate((el) =>
      (el as HTMLElement).tagName.toLowerCase()
    );
  }

  /**
   * Get the input type of an element
   *
   * @param locator - Playwright locator for the element
   * @returns Promise that resolves to the input type, or null if not an input
   */
  private async getInputType(locator: Locator): Promise<string | null> {
    return await locator.evaluate((el) => {
      if (el instanceof HTMLInputElement) {
        return el.type.toLowerCase();
      }
      return null;
    });
  }

  /**
   * Get a random option from a select element
   *
   * @param selector - Selector or locator for the select element
   * @returns Promise that resolves to a random option value
   */
  private async getRandomSelectOption(
    selector: string | Locator
  ): Promise<string> {
    const locator =
      typeof selector === "string" ? this.page.locator(selector) : selector;

    // Get all option values
    const options = await locator.evaluate((el) => {
      if (el instanceof HTMLSelectElement) {
        return Array.from(el.options)
          .filter((option) => option.value && !option.disabled)
          .map((option) => option.value);
      }
      return [];
    });

    if (options.length === 0) {
      return "";
    }

    // Select a random option
    const randomIndex = Math.floor(Math.random() * options.length);
    return options[randomIndex];
  }
}
