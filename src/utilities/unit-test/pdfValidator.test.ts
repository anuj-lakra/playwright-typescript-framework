import { PdfValidator } from "@utilities/files/pdfValidator";
import * as fs from "fs/promises";

// Mock fs/promises module
jest.mock("fs/promises", () => ({
  access: jest.fn(),
  stat: jest.fn(() => Promise.resolve({ size: 12345 })),
  mkdir: jest.fn(() => Promise.resolve()),
}));

describe("PdfValidator", () => {
  let mockPage: any;
  let mockDownload: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Playwright download object
    mockDownload = {
      suggestedFilename: jest.fn().mockReturnValue("test.pdf"),
      path: jest.fn().mockResolvedValue("/tmp/test.pdf"),
      saveAs: jest.fn().mockResolvedValue(undefined),
    };

    // Mock Playwright Page object
    mockPage = {
      click: jest.fn(),
      waitForEvent: jest.fn().mockResolvedValue(mockDownload),
      request: {
        head: jest.fn(),
      },
    };
  });

  describe("downloadPdf", () => {
    it("should download a PDF and return the default path", async () => {
      const result = await PdfValidator.downloadPdf(
        mockPage,
        "#downloadButton"
      );

      expect(mockPage.click).toHaveBeenCalledWith("#downloadButton");
      expect(mockPage.waitForEvent).toHaveBeenCalledWith("download");
      expect(mockDownload.path).toHaveBeenCalled();
      expect(result).toBe("/tmp/test.pdf");
    });

    it("should download a PDF and save it to a custom path", async () => {
      const result = await PdfValidator.downloadPdf(
        mockPage,
        "#downloadButton",
        "/custom/path"
      );

      expect(mockPage.click).toHaveBeenCalledWith("#downloadButton");
      expect(mockPage.waitForEvent).toHaveBeenCalledWith("download");
      expect(mockDownload.saveAs).toHaveBeenCalledWith("/custom/path/test.pdf");
      expect(result).toBe("/custom/path/test.pdf");
    });

    it("should handle errors when creating a directory", async () => {
      (fs.mkdir as jest.Mock).mockRejectedValue(
        new Error("Directory creation failed")
      );

      const result = await PdfValidator.downloadPdf(
        mockPage,
        "#downloadButton",
        "/custom/path"
      );

      expect(mockPage.click).toHaveBeenCalledWith("#downloadButton");
      expect(mockPage.waitForEvent).toHaveBeenCalledWith("download");
      expect(mockDownload.saveAs).toHaveBeenCalledWith("/custom/path/test.pdf");
      expect(result).toBe("/custom/path/test.pdf");
    });
  });

  describe("verifyPdfHeaders", () => {
    it("should verify PDF headers successfully", async () => {
      mockPage.request.head.mockResolvedValue({
        headers: () => ({
          "content-type": "application/pdf",
          "content-length": "54321",
        }),
      });

      const result = await PdfValidator.verifyPdfHeaders(
        mockPage,
        "http://example.com/test.pdf"
      );

      expect(result.contentType).toBe("application/pdf");
      expect(result.contentLength).toBe(54321);
      expect(mockPage.request.head).toHaveBeenCalledWith(
        "http://example.com/test.pdf"
      );
    });

    it("should throw an error for non-PDF content type", async () => {
      mockPage.request.head.mockResolvedValue({
        headers: () => ({
          "content-type": "text/plain",
        }),
      });

      await expect(
        PdfValidator.verifyPdfHeaders(mockPage, "http://example.com/test.txt")
      ).rejects.toThrow("Expected PDF content type");
    });
  });

  describe("fileExists", () => {
    it("should return true if the file exists", async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await PdfValidator.fileExists("/path/to/file.pdf");

      expect(result).toBe(true);
      expect(fs.access).toHaveBeenCalledWith("/path/to/file.pdf");
    });

    it("should return false if the file does not exist", async () => {
      (fs.access as jest.Mock).mockRejectedValue(new Error("File not found"));

      const result = await PdfValidator.fileExists("/path/to/file.pdf");

      expect(result).toBe(false);
      expect(fs.access).toHaveBeenCalledWith("/path/to/file.pdf");
    });
  });

  describe("getFileSize", () => {
    it("should return the file size in bytes", async () => {
      (fs.stat as jest.Mock).mockResolvedValue({ size: 98765 });

      const result = await PdfValidator.getFileSize("/path/to/file.pdf");

      expect(result).toBe(98765);
      expect(fs.stat).toHaveBeenCalledWith("/path/to/file.pdf");
    });

    it("should throw an error if the file size cannot be retrieved", async () => {
      (fs.stat as jest.Mock).mockRejectedValue(new Error("Cannot access file"));

      await expect(
        PdfValidator.getFileSize("/path/to/file.pdf")
      ).rejects.toThrow("Failed to get file size");
    });
  });

  describe("downloadAndVerifyPdfSize", () => {
    beforeEach(() => {
      jest
        .spyOn(PdfValidator, "downloadPdf")
        .mockResolvedValue("/tmp/test.pdf");
      jest.spyOn(PdfValidator, "fileExists").mockResolvedValue(true);
      jest.spyOn(PdfValidator, "getFileSize").mockResolvedValue(50000);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should download and verify the PDF size successfully", async () => {
      const result = await PdfValidator.downloadAndVerifyPdfSize(
        mockPage,
        "#downloadButton",
        30000
      );

      expect(result).toBe("/tmp/test.pdf");
      expect(PdfValidator.downloadPdf).toHaveBeenCalledWith(
        mockPage,
        "#downloadButton",
        undefined
      );
      expect(PdfValidator.fileExists).toHaveBeenCalledWith("/tmp/test.pdf");
      expect(PdfValidator.getFileSize).toHaveBeenCalledWith("/tmp/test.pdf");
    });

    it("should throw an error if the file does not exist", async () => {
      jest.spyOn(PdfValidator, "fileExists").mockResolvedValue(false);

      await expect(
        PdfValidator.downloadAndVerifyPdfSize(
          mockPage,
          "#downloadButton",
          30000
        )
      ).rejects.toThrow("PDF file not found");
    });

    it("should throw an error if the file size is less than the minimum", async () => {
      jest.spyOn(PdfValidator, "getFileSize").mockResolvedValue(10000);

      await expect(
        PdfValidator.downloadAndVerifyPdfSize(
          mockPage,
          "#downloadButton",
          30000
        )
      ).rejects.toThrow(
        "PDF file size (10000 bytes) is less than expected minimum (30000 bytes)"
      );
    });
  });
});
