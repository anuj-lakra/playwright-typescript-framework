// src/utilities/dataParser.test.ts
import { DataParser } from "./dataParser";
import * as fs from "fs/promises";
import * as XLSX from "xlsx";
import { parse as csvParse } from "csv-parse/sync";

// Mock dependencies
jest.mock("fs/promises");
jest.mock("xlsx");
jest.mock("csv-parse/sync");

describe("DataParser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Mock implementation for fs.access
  const mockFsAccess = fs.access as jest.MockedFunction<typeof fs.access>;
  // Mock implementation for fs.stat
  const mockFsStat = fs.stat as jest.MockedFunction<typeof fs.stat>;
  // Mock implementation for fs.readFile
  const mockFsReadFile = fs.readFile as jest.MockedFunction<typeof fs.readFile>;
  // Mock implementation for csvParse
  const mockCsvParse = csvParse as jest.MockedFunction<typeof csvParse>;
  // Mock implementation for XLSX.read
  const mockXLSXRead = XLSX.read as jest.MockedFunction<typeof XLSX.read>;
  // Mock implementation for XLSX.utils.sheet_to_json
  const mockSheetToJson = jest.fn();

  describe("parseDataFile", () => {
    beforeEach(() => {
      // Setup default mocks
      mockFsAccess.mockResolvedValue(undefined);
      mockFsStat.mockResolvedValue({ size: 1024 } as any);

      // Mock individual methods of XLSX.utils
      jest
        .spyOn(XLSX.utils, "sheet_to_json")
        .mockImplementation(mockSheetToJson);
      jest.spyOn(XLSX.utils, "decode_range").mockReturnValue({
        s: { c: 0, r: 0 },
        e: { c: 2, r: 10 },
      });

      mockCsvParse.mockImplementation(
        (input: string | Buffer, options: any) => {
          const inputString =
            typeof input === "string" ? input : input.toString("utf-8");

          if (options.columns === false) {
            // Return an array of arrays for CSV files without headers
            return [
              ["value1", "value2"],
              ["value3", "value4"],
            ];
          }
          // Return an array of objects for CSV files with headers
          return [
            { header1: "value1", header2: "value2" },
            { header1: "value3", header2: "value4" },
          ];
        }
      );
    });

    it("should throw an error if file is not found", async () => {
      mockFsAccess.mockRejectedValue(new Error("File not found"));

      await expect(DataParser.parseDataFile("nonexistent.csv")).rejects.toThrow(
        "File not found"
      );
    });

    it("should throw an error for unsupported file types", async () => {
      await expect(DataParser.parseDataFile("test.txt")).rejects.toThrow(
        "Unsupported file type"
      );
    });

    describe("CSV parsing", () => {
      beforeEach(() => {
        mockFsReadFile.mockResolvedValue(
          "header1,header2\nvalue1,value2" as any
        );
        mockCsvParse.mockReturnValue([
          { header1: "value1", header2: "value2" },
          { header1: "value3", header2: "value4" },
        ]);
      });

      it("should parse CSV files correctly", async () => {
        const result = await DataParser.parseDataFile("test.csv");

        expect(mockFsReadFile).toHaveBeenCalledWith("test.csv", "utf-8");
        expect(mockCsvParse).toHaveBeenCalled();
        expect(result.data).toEqual([
          { header1: "value1", header2: "value2" },
          { header1: "value3", header2: "value4" },
        ]);
        expect(result.headers).toEqual(["header1", "header2"]);
        expect(result.fileInfo.fileType).toBe("csv");
      });

      it("should use custom options for CSV parsing", async () => {
        await DataParser.parseDataFile("test.csv", {
          delimiter: ";",
          skipEmptyLines: false,
          dynamicTyping: false,
        });

        expect(mockCsvParse).toHaveBeenCalledWith(expect.any(String), {
          delimiter: ";",
          skip_empty_lines: false,
          columns: true,
          cast: false,
        });
      });

      it("should handle CSV parsing errors", async () => {
        mockCsvParse.mockImplementation(() => {
          throw new Error("CSV parsing error");
        });

        await expect(DataParser.parseDataFile("test.csv")).rejects.toThrow(
          "Failed to parse CSV file"
        );
      });
    });

    describe("Excel parsing", () => {
      beforeEach(() => {
        mockFsReadFile.mockResolvedValue(
          Buffer.from("dummy excel content") as any
        );
        mockXLSXRead.mockReturnValue({
          SheetNames: ["Sheet1", "Sheet2"],
          Sheets: {
            Sheet1: { "!ref": "A1:C10" },
          },
        } as any);
        mockSheetToJson.mockReturnValue([
          { A: "value1", B: "value2" },
          { A: "value3", B: "value4" },
        ]);
      });

      it("should parse Excel files correctly", async () => {
        const result = await DataParser.parseDataFile("test.xlsx");

        expect(mockFsReadFile).toHaveBeenCalledWith("test.xlsx");
        expect(mockXLSXRead).toHaveBeenCalledWith(expect.any(Buffer), {
          type: "buffer",
          cellDates: true,
          cellNF: true,
          cellText: true,
        });
        expect(mockSheetToJson).toHaveBeenCalled();
        expect(result.data).toEqual([
          { A: "value1", B: "value2" },
          { A: "value3", B: "value4" },
        ]);
        expect(result.fileInfo.fileType).toBe("xlsx");
      });

      it("should use specified sheet name for Excel parsing", async () => {
        await DataParser.parseDataFile("test.xlsx", { sheetName: "Sheet2" });

        expect(mockSheetToJson).toHaveBeenCalled();
      });

      it("should throw an error if the specified sheet does not exist", async () => {
        await expect(
          DataParser.parseDataFile("test.xlsx", {
            sheetName: "NonExistentSheet",
          })
        ).rejects.toThrow('Sheet "NonExistentSheet" not found in Excel file');
      });

      it("should handle Excel parsing errors", async () => {
        mockXLSXRead.mockImplementation(() => {
          throw new Error("Excel parsing error");
        });

        await expect(DataParser.parseDataFile("test.xlsx")).rejects.toThrow(
          "Failed to parse Excel file"
        );
      });
    });
    it("should parse Excel files without headers", async () => {
      mockFsReadFile.mockResolvedValue(
        Buffer.from("dummy excel content") as any
      );
      mockXLSXRead.mockReturnValue({
        SheetNames: ["Sheet1"],
        Sheets: {
          Sheet1: { "!ref": "A1:C2" },
        },
      } as any);
      mockSheetToJson.mockReturnValue([
        ["value1", "value2", "value3"],
        ["value4", "value5", "value6"],
      ]);

      const result = await DataParser.parseDataFile("test.xlsx", {
        header: false,
      });

      expect(mockFsReadFile).toHaveBeenCalledWith("test.xlsx");
      expect(mockXLSXRead).toHaveBeenCalledWith(expect.any(Buffer), {
        type: "buffer",
        cellDates: true,
        cellNF: true,
        cellText: true,
      });
      expect(mockSheetToJson).toHaveBeenCalledWith(expect.any(Object), {
        header: undefined,
        raw: false,
        blankrows: false,
      });
      expect(result.data).toEqual([
        ["value1", "value2", "value3"],
        ["value4", "value5", "value6"],
      ]);
      expect(result.headers).toEqual(["Column1", "Column2", "Column3"]);
      expect(result.fileInfo.fileType).toBe("xlsx");
    });
  });

  describe("loadTestData", () => {
    beforeEach(() => {
      jest.spyOn(DataParser, "parseDataFile").mockResolvedValue({
        data: [
          { name: "John", age: 30 },
          { name: "Jane", age: 25 },
        ],
        headers: ["name", "age"],
        fileInfo: {
          filePath: "test.csv",
          fileType: "csv",
          fileSize: 1024,
          fileName: "test.csv",
        },
      });
    });

    it("should map data using the provided mapper function", async () => {
      interface Person {
        fullName: string;
        ageInYears: number;
      }

      const mapper = (row: Record<string, any>): Person => ({
        fullName: row.name,
        ageInYears: row.age,
      });

      const result = await DataParser.loadTestData<Person>("test.csv", mapper);

      expect(result).toEqual([
        { fullName: "John", ageInYears: 30 },
        { fullName: "Jane", ageInYears: 25 },
      ]);
    });
  });

  describe("utility functions", () => {
    const testData = [
      { id: 1, name: "John", category: "A" },
      { id: 2, name: "Jane", category: "B" },
      { id: 3, name: "Bob", category: "A" },
    ];

    it("should get column data correctly", () => {
      const names = DataParser.getColumnData(testData, "name");
      expect(names).toEqual(["John", "Jane", "Bob"]);
    });

    it("should filter data correctly", () => {
      const filteredData = DataParser.filterData(
        testData,
        (row) => row.category === "A"
      );
      expect(filteredData).toEqual([
        { id: 1, name: "John", category: "A" },
        { id: 3, name: "Bob", category: "A" },
      ]);
    });

    it("should group data correctly", () => {
      const groupedData = DataParser.groupData(testData, "category");
      expect(groupedData).toEqual({
        A: [
          { id: 1, name: "John", category: "A" },
          { id: 3, name: "Bob", category: "A" },
        ],
        B: [{ id: 2, name: "Jane", category: "B" }],
      });
    });
  });
});
