// src/utilities/dataParser.ts
import { parse as csvParse } from "csv-parse/sync";
import * as XLSX from "xlsx";
import * as fs from "fs/promises";
import * as path from "path";

/**
 * Options for parsing data files
 */
export interface DataParserOptions {
  /**
   * Whether to convert string values to their appropriate types (numbers, booleans, etc.)
   * @default true
   */
  dynamicTyping?: boolean;

  /**
   * Whether to skip empty lines in CSV files
   * @default true
   */
  skipEmptyLines?: boolean;

  /**
   * Character to use as delimiter in CSV files
   * @default ","
   */
  delimiter?: string;

  /**
   * Whether the file has a header row
   * @default true
   */
  header?: boolean;

  /**
   * Name of the worksheet to read from Excel files (only for Excel)
   * If not provided, the first worksheet will be used
   */
  sheetName?: string;
}

/**
 * Result of parsing a data file
 */
export interface DataParseResult<T = Record<string, any>> {
  /**
   * The parsed data
   */
  data: T[];

  /**
   * The headers (column names) from the file
   */
  headers: string[];

  /**
   * Information about the parsed file
   */
  fileInfo: {
    /**
     * The path to the file
     */
    filePath: string;

    /**
     * The type of file (csv, xlsx, etc.)
     */
    fileType: string;

    /**
     * The size of the file in bytes
     */
    fileSize: number;

    /**
     * The name of the file
     */
    fileName: string;
  };
}

/**
 * Utility class for parsing data from CSV and Excel files
 */
export class DataParser {
  /**
   * Default options for parsing data files
   */
  private static readonly defaultOptions: DataParserOptions = {
    dynamicTyping: true,
    skipEmptyLines: true,
    delimiter: ",",
    header: true,
  };

  /**
   * Parse a data file (CSV or Excel)
   * @param filePath - Path to the data file
   * @param options - Options for parsing
   * @returns Parsed data
   */
  public static async parseDataFile<T = Record<string, any>>(
    filePath: string,
    options?: DataParserOptions
  ): Promise<DataParseResult<T>> {
    // Merge default options with provided options
    const parsedOptions = { ...this.defaultOptions, ...options };

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Get file stats
    const stats = await fs.stat(filePath);
    const fileName = path.basename(filePath);
    const fileExtension = path.extname(filePath).toLowerCase();

    // Parse file based on extension
    if (fileExtension === ".csv") {
      return this.parseCSV<T>(filePath, parsedOptions, stats.size, fileName);
    } else if ([".xlsx", ".xls"].includes(fileExtension)) {
      return this.parseExcel<T>(filePath, parsedOptions, stats.size, fileName);
    } else {
      throw new Error(
        `Unsupported file type: ${fileExtension}. Supported types are .csv, .xlsx, and .xls`
      );
    }
  }

  /**
   * Parse a CSV file
   * @param filePath - Path to the CSV file
   * @param options - Options for parsing
   * @param fileSize - Size of the file in bytes
   * @param fileName - Name of the file
   * @returns Parsed data
   */
  private static async parseCSV<T = Record<string, any>>(
    filePath: string,
    options: DataParserOptions,
    fileSize: number,
    fileName: string
  ): Promise<DataParseResult<T>> {
    // Read file content
    const fileContent = await fs.readFile(filePath, "utf-8");

    // Parse CSV content
    const parseOptions = {
      delimiter: options.delimiter,
      skip_empty_lines: options.skipEmptyLines,
      columns: options.header ? true : false, // Set columns to false if header is false
      cast: options.dynamicTyping,
    };

    let parsedData: any[];
    let headers: string[];

    try {
      parsedData = csvParse(fileContent, parseOptions) as any[];

      // Extract headers if present
      if (options.header) {
        headers = Object.keys(parsedData[0] || {});
      } else {
        // If no header, use column indices as headers
        headers = parsedData[0]
          ? Array.from(
              { length: parsedData[0].length },
              (_, i) => `Column${i + 1}`
            )
          : [];
      }
    } catch (error) {
      throw new Error(`Failed to parse CSV file: ${(error as Error).message}`);
    }

    return {
      data: parsedData as T[],
      headers,
      fileInfo: {
        filePath,
        fileType: "csv",
        fileSize,
        fileName,
      },
    };
  }

  /**
   * Parse an Excel file
   * @param filePath - Path to the Excel file
   * @param options - Options for parsing
   * @param fileSize - Size of the file in bytes
   * @param fileName - Name of the file
   * @returns Parsed data
   */
  private static async parseExcel<T = Record<string, any>>(
    filePath: string,
    options: DataParserOptions,
    fileSize: number,
    fileName: string
  ): Promise<DataParseResult<T>> {
    // Read file content
    const fileContent = await fs.readFile(filePath);

    // Parse Excel content
    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(fileContent, {
        type: "buffer",
        cellDates: true,
        cellNF: true,
        cellText: true,
      });
    } catch (error) {
      throw new Error(
        `Failed to parse Excel file: ${(error as Error).message}`
      );
    }

    // Determine which sheet to use
    const sheetName = options.sheetName || workbook.SheetNames[0];
    if (!workbook.SheetNames.includes(sheetName)) {
      throw new Error(
        `Sheet "${sheetName}" not found in Excel file. Available sheets: ${workbook.SheetNames.join(
          ", "
        )}`
      );
    }

    // Get sheet data
    const worksheet = workbook.Sheets[sheetName];

    // Parse sheet data
    const sheetData = XLSX.utils.sheet_to_json(worksheet, {
      header: options.header ? 1 : undefined,
      raw: !options.dynamicTyping,
      blankrows: !options.skipEmptyLines,
    });

    // Extract headers
    let headers: string[];
    if (options.header) {
      headers = Object.keys(sheetData[0] || {});
    } else {
      // If no header, use column indices as headers
      const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
      headers = Array.from(
        { length: range.e.c - range.s.c + 1 },
        (_, i) => `Column${i + 1}`
      );
    }

    return {
      data: sheetData as T[],
      headers,
      fileInfo: {
        filePath,
        fileType: path.extname(filePath).substring(1), // Remove dot from extension
        fileSize,
        fileName,
      },
    };
  }

  /**
   * Load test data from a file and map it to a specific type
   * @param filePath - Path to the data file
   * @param mapper - Function to map raw data to the desired type
   * @param options - Options for parsing
   * @returns Array of typed data objects
   */
  public static async loadTestData<T>(
    filePath: string,
    mapper: (row: Record<string, any>) => T,
    options?: DataParserOptions
  ): Promise<T[]> {
    const result = await this.parseDataFile(filePath, options);
    return result.data.map(mapper);
  }

  /**
   * Get the data for a specific column from the parsed data
   * @param data - Parsed data
   * @param columnName - Name of the column to extract
   * @returns Array of values from the specified column
   */
  public static getColumnData<T = any>(
    data: Record<string, any>[],
    columnName: string
  ): T[] {
    return data.map((row) => row[columnName] as T);
  }

  /**
   * Filter parsed data based on a predicate function
   * @param data - Parsed data
   * @param predicate - Function to test each row
   * @returns Filtered data
   */
  public static filterData<T = Record<string, any>>(
    data: T[],
    predicate: (row: T) => boolean
  ): T[] {
    return data.filter(predicate);
  }

  /**
   * Group parsed data by a specified key
   * @param data - Parsed data
   * @param key - Key to group by
   * @returns Grouped data
   */
  public static groupData<T = Record<string, any>>(
    data: T[],
    key: keyof T
  ): Record<string, T[]> {
    return data.reduce((groups, row) => {
      const keyValue = String(row[key]);
      groups[keyValue] = groups[keyValue] || [];
      groups[keyValue].push(row);
      return groups;
    }, {} as Record<string, T[]>);
  }
}
