import { DataParser } from "@utilities/files/dataParser";
import * as fs from "fs/promises";
import { Workbook } from "exceljs";
import { parse as csvParse } from "csv-parse/sync";

// Mock dependencies
jest.mock("fs/promises");
jest.mock("exceljs");
jest.mock("csv-parse/sync");

describe("DataParser", () => {
  const mockFsAccess = jest.spyOn(fs, "access");
  const mockFsStat = jest.spyOn(fs, "stat");
  const mockFsReadFile = jest.spyOn(fs, "readFile");
  const mockCsvParse = csvParse as jest.Mock;
  const mockWorkbookXlsx = { load: jest.fn() };
  const MockWorkbook = jest.fn(() => ({
    xlsx: mockWorkbookXlsx,
    worksheets: [
      {
        name: "Sheet1",
        columnCount: 3,
        getRow: jest.fn((rowNumber) => ({
          eachCell: jest.fn((callback) => {
            if (rowNumber === 1) {
              // Mock header row
              callback({ value: "header1" }, 1);
              callback({ value: "header2" }, 2);
              callback({ value: "header3" }, 3);
            } else {
              // Mock data row
              callback({ value: "value1" }, 1);
              callback({ value: "value2" }, 2);
              callback({ value: "value3" }, 3);
            }
          }),
        })),
        eachRow: jest.fn((callback) => {
          callback(
            {
              cellCount: 3,
              eachCell: jest.fn((cb) => {
                cb({ value: "value1" }, 1);
                cb({ value: "value2" }, 2);
                cb({ value: "value3" }, 3);
              }),
            },
            2
          );
        }),
      },
    ],
    getWorksheet: jest.fn((name) => {
      if (name === "Sheet1") {
        return {
          name: "Sheet1",
          columnCount: 3,
          getRow: jest.fn((rowNumber) => ({
            eachCell: jest.fn((callback) => {
              if (rowNumber === 1) {
                callback({ value: "header1" }, 1);
                callback({ value: "header2" }, 2);
                callback({ value: "header3" }, 3);
              } else {
                callback({ value: "value1" }, 1);
                callback({ value: "value2" }, 2);
                callback({ value: "value3" }, 3);
              }
            }),
          })),
          eachRow: jest.fn((callback) => {
            callback(
              {
                cellCount: 3,
                eachCell: jest.fn((cb) => {
                  cb({ value: "value1" }, 1);
                  cb({ value: "value2" }, 2);
                  cb({ value: "value3" }, 3);
                }),
              },
              2
            );
          }),
        };
      }
      return null;
    }),
  }));

  // Replace the constructor with our mock
  (Workbook as any) = MockWorkbook;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFsAccess.mockResolvedValue(undefined);
    mockFsStat.mockResolvedValue({ size: 1024 } as any);
  });

  describe("parseDataFile", () => {
    it("should throw an error if the file is not found", async () => {
      mockFsAccess.mockRejectedValue(new Error("File not found"));

      await expect(DataParser.parseDataFile("nonexistent.csv")).rejects.toThrow(
        "File not found"
      );
    });

    it("should throw an error for unsupported file types", async () => {
      await expect(DataParser.parseDataFile("test.txt")).rejects.toThrow(
        "Unsupported file type: .txt. Supported types are .csv, .xlsx, and .xls"
      );
    });

    describe("CSV parsing", () => {
      beforeEach(() => {
        mockFsReadFile.mockResolvedValue("header1,header2\nvalue1,value2");
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

      // Cover lines 169-172: Test CSV parsing with no headers
      it("should parse CSV files without headers", async () => {
        mockCsvParse.mockReturnValue([
          ["value1", "value2"],
          ["value3", "value4"],
        ]);

        const result = await DataParser.parseDataFile("test.csv", {
          header: false,
        });

        expect(mockCsvParse).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            columns: false,
          })
        );
        expect(result.headers).toEqual(["Column1", "Column2"]);
        expect(result.data).toEqual([
          ["value1", "value2"],
          ["value3", "value4"],
        ]);
      });

      it("should handle CSV parsing errors", async () => {
        mockCsvParse.mockImplementation(() => {
          throw new Error("CSV parsing error");
        });

        await expect(DataParser.parseDataFile("test.csv")).rejects.toThrow(
          "Failed to parse CSV file: CSV parsing error"
        );
      });
    });

    describe("Excel parsing", () => {
      beforeEach(() => {
        mockFsReadFile.mockResolvedValue(Buffer.from("dummy excel content"));
        mockWorkbookXlsx.load.mockResolvedValue(undefined);
      });

      it("should parse Excel files correctly", async () => {
        const result = await DataParser.parseDataFile("test.xlsx");

        expect(mockFsReadFile).toHaveBeenCalledWith("test.xlsx");
        expect(mockWorkbookXlsx.load).toHaveBeenCalledWith(expect.any(Buffer));
        expect(result.data).toBeInstanceOf(Array);
        expect(result.fileInfo.fileType).toBe("xlsx");
      });

      // Cover lines 246-247: Test Excel parsing with no headers
      it("should parse Excel files without headers", async () => {
        const result = await DataParser.parseDataFile("test.xlsx", {
          header: false,
        });

        expect(result.headers).toEqual(["Column1", "Column2", "Column3"]);
        expect(result.data).toBeInstanceOf(Array);
      });

      // Cover line 256: Test dynamicTyping with different value types
      it("should handle dynamic typing for Excel data", async () => {
        // Create a custom mock for this specific test case
        (MockWorkbook as jest.Mock).mockReturnValue({
          xlsx: { load: jest.fn().mockResolvedValue(undefined) },
          worksheets: [
            {
              name: "Sheet1",
              columnCount: 3,
              getRow: jest.fn(() => ({
                eachCell: jest.fn((callback) => {
                  callback({ value: "header1" }, 1);
                  callback({ value: "header2" }, 2);
                  callback({ value: "header3" }, 3);
                }),
              })),
              eachRow: jest.fn((callback) => {
                // First row (header)
                callback(
                  {
                    cellCount: 3,
                    eachCell: jest.fn((cb) => {
                      cb({ value: "header1" }, 1);
                      cb({ value: "header2" }, 2);
                      cb({ value: "header3" }, 3);
                    }),
                  },
                  1
                );

                // Second row with various data types
                callback(
                  {
                    cellCount: 3,
                    eachCell: jest.fn((cb) => {
                      cb({ value: "text" }, 1);
                      cb({ value: { result: 42 } }, 2); // Object with result property
                      cb({ value: new Date("2023-01-01") }, 3); // Date object
                    }),
                  },
                  2
                );
              }),
            },
          ],
          getWorksheet: jest.fn(() => ({
            name: "Sheet1",
            columnCount: 3,
            getRow: jest.fn(() => ({
              eachCell: jest.fn((callback) => {
                callback({ value: "header1" }, 1);
                callback({ value: "header2" }, 2);
                callback({ value: "header3" }, 3);
              }),
            })),
            eachRow: jest.fn((callback) => {
              // First row (header)
              callback(
                {
                  cellCount: 3,
                  eachCell: jest.fn((cb) => {
                    cb({ value: "header1" }, 1);
                    cb({ value: "header2" }, 2);
                    cb({ value: "header3" }, 3);
                  }),
                },
                1
              );

              // Second row with various data types
              callback(
                {
                  cellCount: 3,
                  eachCell: jest.fn((cb) => {
                    cb({ value: "text" }, 1);
                    cb({ value: { result: 42 } }, 2); // Object with result property
                    cb({ value: new Date("2023-01-01") }, 3); // Date object
                  }),
                },
                2
              );
            }),
          })),
        });

        const result = await DataParser.parseDataFile("test.xlsx", {
          dynamicTyping: true,
        });

        // Check that we have processed the data with special types
        expect(result.data.length).toBeGreaterThan(0);
      });

      // Cover lines 268-271: Test handling empty rows and partial data
      it("should handle empty rows and partial data in Excel files", async () => {
        // Create a custom mock for this specific test case
        (MockWorkbook as jest.Mock).mockReturnValue({
          xlsx: { load: jest.fn().mockResolvedValue(undefined) },
          worksheets: [
            {
              name: "Sheet1",
              columnCount: 3,
              getRow: jest.fn(() => ({
                eachCell: jest.fn((callback) => {
                  callback({ value: "header1" }, 1);
                  callback({ value: "header2" }, 2);
                  callback({ value: "header3" }, 3);
                }),
              })),
              eachRow: jest.fn((callback) => {
                // First row (header)
                callback(
                  {
                    cellCount: 3,
                    eachCell: jest.fn((cb) => {
                      cb({ value: "header1" }, 1);
                      cb({ value: "header2" }, 2);
                      cb({ value: "header3" }, 3);
                    }),
                  },
                  1
                );

                // Second row with data
                callback(
                  {
                    cellCount: 3,
                    eachCell: jest.fn((cb) => {
                      cb({ value: "value1" }, 1);
                      cb({ value: "value2" }, 2);
                      cb({ value: "value3" }, 3);
                    }),
                  },
                  2
                );

                // Third row - empty
                callback(
                  {
                    cellCount: 0,
                    eachCell: jest.fn(),
                  },
                  3
                );
              }),
            },
          ],
          getWorksheet: jest.fn(() => ({
            name: "Sheet1",
            columnCount: 3,
            getRow: jest.fn(() => ({
              eachCell: jest.fn((callback) => {
                callback({ value: "header1" }, 1);
                callback({ value: "header2" }, 2);
                callback({ value: "header3" }, 3);
              }),
            })),
            eachRow: jest.fn((callback) => {
              // First row (header)
              callback(
                {
                  cellCount: 3,
                  eachCell: jest.fn((cb) => {
                    cb({ value: "header1" }, 1);
                    cb({ value: "header2" }, 2);
                    cb({ value: "header3" }, 3);
                  }),
                },
                1
              );

              // Second row with data
              callback(
                {
                  cellCount: 3,
                  eachCell: jest.fn((cb) => {
                    cb({ value: "value1" }, 1);
                    cb({ value: "value2" }, 2);
                    cb({ value: "value3" }, 3);
                  }),
                },
                2
              );

              // Third row - empty
              callback(
                {
                  cellCount: 0,
                  eachCell: jest.fn(),
                },
                3
              );
            }),
          })),
        });

        // Test with skipEmptyLines option
        const result = await DataParser.parseDataFile("test.xlsx", {
          skipEmptyLines: true,
        });

        // We should only have one data row since the empty row should be skipped
        expect(result.data.length).toBe(1);

        // Test without skipEmptyLines (though our mock implementation might not fully test this)
        const resultWithEmpty = await DataParser.parseDataFile("test.xlsx", {
          skipEmptyLines: false,
        });
        expect(resultWithEmpty.data).toBeInstanceOf(Array);
      });

      it("should throw an error if the specified sheet does not exist", async () => {
        (MockWorkbook as jest.Mock).mockReturnValue({
          xlsx: { load: jest.fn().mockResolvedValue(undefined) },
          worksheets: [{ name: "Sheet1" }],
          getWorksheet: jest.fn((name) => {
            if (name === "Sheet1") return { name: "Sheet1" };
            return null;
          }),
        });

        await expect(
          DataParser.parseDataFile("test.xlsx", {
            sheetName: "NonExistentSheet",
          })
        ).rejects.toThrow(
          'Sheet "NonExistentSheet" not found in Excel file. Available sheets: Sheet1'
        );
      });

      it("should handle Excel parsing errors", async () => {
        // Set up the mock to throw an error BEFORE worksheet access
        (MockWorkbook as jest.Mock).mockReturnValue({
          xlsx: {
            load: jest.fn().mockRejectedValue(new Error("Excel parsing error")),
          },
          worksheets: [
            {
              name: "Sheet1",
              columnCount: 3,
              getRow: jest.fn().mockReturnValue({
                eachCell: jest.fn(),
              }),
              eachRow: jest.fn(),
            },
          ],
          getWorksheet: jest.fn(),
        });

        await expect(DataParser.parseDataFile("test.xlsx")).rejects.toThrow(
          "Failed to parse Excel file: Excel parsing error"
        );
      });
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
