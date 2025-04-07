// tests/unit/data-parser-example.spec.ts
import { test, expect } from "@playwright/test";
import { DataParser } from "@utilities/files/dataParser";
import { fileURLToPath } from "url";
import * as path from "path";

// Get the current directory equivalent to __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the structure for our test data
interface ProductData {
  id: string;
  name: string;
  price: number;
  category: string;
  inStock: boolean;
}

test.describe("DataParser Simple Examples", () => {
  test("should parse CSV data and validate against expected values", async () => {
    // Get path to test data file
    const dataFilePath = path.resolve(__dirname, "../../testdata/products.csv");

    // Parse the CSV file
    const result = await DataParser.parseDataFile<ProductData>(dataFilePath);

    // Basic assertions about the parsed data
    expect(result.data).toBeInstanceOf(Array);
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.headers).toContain("id");
    expect(result.headers).toContain("name");
    expect(result.headers).toContain("price");

    // Validate first product in the dataset matches expected values
    expect(result.data[0].id).toBe("P001");
    expect(result.data[0].name).toBe("Laptop");
    expect(result.data[0].price).toBe(1200);
    expect(result.data[0].category).toBe("Electronics");
    expect(result.data[0].inStock).toBe("true");
  });

  test("should load test data and map it to a specific type", async () => {
    // Get path to test data file
    const dataFilePath = path.resolve(__dirname, "../../testdata/products.csv");

    // Define a mapper function
    const mapper = (row: Record<string, any>): ProductData => ({
      id: row.id,
      name: row.name,
      price: parseFloat(row.price),
      category: row.category,
      inStock: row.inStock === "true",
    });

    // Load and map the data
    const result = await DataParser.loadTestData<ProductData>(
      dataFilePath,
      mapper
    );

    // Validate the mapped data
    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toEqual({
      id: "P001",
      name: "Laptop",
      price: 1200,
      category: "Electronics",
      inStock: true,
    });
  });

  test("should filter data based on a condition", async () => {
    // Get path to test data file
    const dataFilePath = path.resolve(__dirname, "../../testdata/products.csv");

    // Parse the CSV file
    const result = await DataParser.parseDataFile<ProductData>(dataFilePath);

    // Filter products in stock
    const inStockProducts = DataParser.filterData(
      result.data,
      (product) => product.inStock
    );

    // Validate the filtered data
    expect(inStockProducts).toBeInstanceOf(Array);
    expect(inStockProducts.length).toBeGreaterThan(0);
    expect(inStockProducts.every((product) => product.inStock)).toBe(true);
  });

  test("should group data by category", async () => {
    // Get path to test data file
    const dataFilePath = path.resolve(__dirname, "../../testdata/products.csv");

    // Parse the CSV file
    const result = await DataParser.parseDataFile<ProductData>(dataFilePath);

    // Group products by category
    const groupedData = DataParser.groupData(result.data, "category");

    // Validate the grouped data
    expect(groupedData).toHaveProperty("Electronics");
    expect(groupedData["Electronics"]).toBeInstanceOf(Array);
    expect(groupedData["Electronics"].length).toBeGreaterThan(0);
  });

  test("should extract data for a specific column", async () => {
    // Get path to test data file
    const dataFilePath = path.resolve(__dirname, "../../testdata/products.csv");

    // Parse the CSV file
    const result = await DataParser.parseDataFile<ProductData>(dataFilePath);

    // Extract the 'name' column
    const productNames = DataParser.getColumnData(result.data, "name");

    // Validate the extracted data
    expect(productNames).toBeInstanceOf(Array);
    expect(productNames.length).toBeGreaterThan(0);
    expect(productNames).toContain("Laptop");
  });
});
