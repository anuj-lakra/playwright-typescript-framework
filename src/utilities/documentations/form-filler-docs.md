# Form Filler Utility

The `FormFiller` is a powerful utility for automatically filling out web forms during testing, using Faker to generate realistic test data.

## Features

- Automatic form field detection
- Support for multiple field types
- Customizable data generation
- Locale-specific data generation
- Flexible form filling options

## Installation Dependencies

- `@playwright/test`
- `@faker-js/faker`

## Supported Field Types

```typescript
enum FieldType {
  TEXT, EMAIL, PASSWORD, PHONE, NUMBER, 
  DATE, SELECT, CHECKBOX, RADIO, TEXTAREA, 
  FILE, NAME, ADDRESS, CITY, STATE, 
  ZIP, COUNTRY, COMPANY, URL, CUSTOM
}
```

## Basic Usage

### Initializing the FormFiller

```typescript
import { FormFiller } from '@utilities/web/formFiller';

// Create a FormFiller instance
const formFiller = new FormFiller(page, 'en'); // Optional locale
```

### Manually Filling a Single Field

```typescript
await formFiller.fillField({
  selector: '#email',
  type: FieldType.EMAIL
});
```

### Filling Multiple Fields

```typescript
const fieldValues = await formFiller.fillForm([
  { 
    selector: '#name', 
    type: FieldType.NAME 
  },
  { 
    selector: '#email', 
    type: FieldType.EMAIL 
  }
]);
```

### Auto-Filling an Entire Form

```typescript
const filledValues = await formFiller.autoFillForm({
  formSelector: '#registration-form',
  excludeSelectors: ['#captcha'],
  submitAfterFill: true
});
```

## Advanced Configuration

### Field Configuration Options

```typescript
interface FieldConfig {
  selector: string | Locator;
  type: FieldType;
  valueGenerator?: () => any;  // Custom value generation
  min?: number;                // For numeric fields
  max?: number;
  options?: string[];          // For select fields
  clickAfterFill?: boolean;
  pressEnterAfterFill?: boolean;
  blurAfterFill?: boolean;
  filePath?: string;           // For file inputs
  locale?: string;             // Locale-specific generation
}
```

### Auto-Fill Options

```typescript
interface AutoFillOptions {
  formSelector?: string;           // Default: "form"
  excludeSelectors?: string[];     // Fields to skip
  customFields?: Record<string, Partial<FieldConfig>>;
  submitAfterFill?: boolean;       // Automatically submit form
  submitSelector?: string;         // Custom submit button selector
  locale?: string;                 // Locale for data generation
  maxElements?: number;            // Limit number of fields to fill
}
```

## Data Generation Strategies

- Uses Faker.js for generating realistic data
- Supports multiple locales
- Automatically detects field types based on:
  - Input type attributes
  - Name attributes
  - Placeholder text
  - ARIA labels

## Example Scenarios

### Custom Value Generation

```typescript
await formFiller.fillField({
  selector: '#custom-field',
  type: FieldType.CUSTOM,
  valueGenerator: () => 'My Custom Value'
});
```

### Selective Form Filling

```typescript
await formFiller.autoFillForm({
  excludeSelectors: ['#sensitive-field'],
  customFields: {
    '#specific-email': { 
      valueGenerator: () => 'test@example.com' 
    }
  }
});
```

## Best Practices

- Always exclude sensitive or protected fields
- Use custom value generators for specific requirements
- Set appropriate locale for region-specific testing
- Limit the number of fields to fill for performance

## Limitations

- Cannot handle complex, dynamically generated forms
- May not work with highly customized or JavaScript-heavy form interactions
- Requires basic form structure to be standard HTML

## Error Handling

- Throws errors for unsupported locales
- Defaults to TEXT type if field type cannot be determined
- Skips hidden or submit-type inputs

## Compatibility

- Works with standard HTML forms
- Supports most common input types
- Compatible with Playwright's page object model

**Note:** Always review and validate generated data to ensure it meets your specific testing requirements.
