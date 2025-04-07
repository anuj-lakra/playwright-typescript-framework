# Data Parser Utility

The `DataParser` utility provides robust methods for parsing and manipulating data from CSV and Excel files.

## Methods

### `parseDataFile<T>(filePath: string, options?: DataParserOptions): Promise<DataParseResult<T>>`
Parses data files (CSV or Excel) with flexible configuration options.

**Parameters:**
- `filePath`: Path to the data file
- `options`: Optional parsing configuration

**Options:**
```typescript
interface DataParserOptions {
  dynamicTyping?: boolean;      // Convert values to appropriate types (default: true)
  skipEmptyLines?: boolean;      // Skip empty lines (default: true)
  delimiter?: string;            // CSV delimiter (default: ",")
  header?: boolean;              // File has header row (default: true)
  sheetName?: string;            // Excel sheet name to parse
}
```

**Example:**
```typescript
const result = await DataParser.parseDataFile<ProductData>('products.csv');
```

### `loadTestData<T>(filePath: string, mapper: (row: Record<string, any>) => T, options?: DataParserOptions): Promise<T[]>`
Loads and maps test data to a specific type.

**Example:**
```typescript
const mapper = (row) => ({
  id: row.id,
  name: row.name,
  price: parseFloat(row.price)
});
const products = await DataParser.loadTestData<Product>('products.csv', mapper);
```

## Utility Methods

### `getColumnData<T>(data: Record<string, any>[], columnName: string): T[]`
Extract data from a specific column.

```typescript
const names = DataParser.getColumnData(data, 'name');
```

### `filterData<T>(data: T[], predicate: (row: T) => boolean): T[]`
Filter data based on a condition.

```typescript
const inStockProducts = DataParser.filterData(
  products, 
  (product) => product.inStock
);
```

### `groupData<T>(data: T[], key: keyof T): Record<string, T[]>`
Group data by a specific key.

```typescript
const productsByCategory = DataParser.groupData(products, 'category');
```

## Use Cases

1. **Data-Driven Testing:** Load test data from CSV or Excel files
2. **Test Data Manipulation:** Filter, group, and transform test data
3. **Dynamic Test Scenarios:** Create flexible test scenarios based on external data sources

## Best Practices

- Use `dynamicTyping` to automatically convert data types
- Provide a mapper function when loading test data to ensure type safety
- Use utility methods to manipulate data for complex test scenarios

## Supported File Types

- CSV files
- Excel files (.xlsx, .xls)

## Error Handling

The utility provides informative error messages for:
- File not found
- Unsupported file types
- Parsing errors

**Note:** Ensure the file path is correct and the file is accessible when using these methods.
