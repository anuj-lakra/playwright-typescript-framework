// src/utilities/pdfValidator.ts
import { Page } from "@playwright/test";

/**
 * Utility for validating PDF content in Playwright tests
 */
export class PdfValidator {
  /**
   * Download a PDF file by clicking a trigger element
   * @param page - Playwright page object
   * @param triggerSelector - Selector for the element that triggers the download
   * @param downloadPath - Optional path where the file will be downloaded
   * @returns Path to the downloaded file
   */
  public static async downloadPdf(
    page: Page,
    triggerSelector: string,
    downloadPath?: string
  ): Promise<string> {
    // Set up download handler
    const downloadPromise = page.waitForEvent("download");

    // Click the download trigger
    await page.click(triggerSelector);

    // Wait for download to start
    const download = await downloadPromise;
    const suggestedFilename = download.suggestedFilename();

    // If download path is provided, save to that location
    let savedPath: string;
    if (downloadPath) {
      // Dynamic import for Node.js modules
      const fs = await import("fs/promises");
      const path = await import("path");

      // Ensure the directory exists
      await fs.mkdir(downloadPath, { recursive: true }).catch(() => {
        // Directory may already exist, ignore error
      });

      savedPath = path.join(downloadPath, suggestedFilename);
      await download.saveAs(savedPath);
    } else {
      // Use default download path
      savedPath = await download.path();
    }

    return savedPath;
  }

  /**
   * Verify PDF metadata by checking HTTP headers
   * @param page - Playwright page
   * @param pdfUrl - URL of the PDF file
   * @returns Object containing content type and content length
   */
  public static async verifyPdfHeaders(
    page: Page,
    pdfUrl: string
  ): Promise<{ contentType: string; contentLength: number }> {
    const response = await page.request.head(pdfUrl);
    const headers = response.headers();

    const contentType = headers["content-type"] || "";
    const contentLength = parseInt(headers["content-length"] || "0", 10);

    if (!contentType.includes("application/pdf")) {
      throw new Error(`Expected PDF content type, got: ${contentType}`);
    }

    return { contentType, contentLength };
  }

  /**
   * Check if a file exists at the specified path
   * @param filePath - Path to check
   * @returns Promise that resolves to true if file exists
   */
  public static async fileExists(filePath: string): Promise<boolean> {
    try {
      // Dynamic import for Node.js modules
      const fs = await import("fs/promises");
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file size in bytes
   * @param filePath - Path to the file
   * @returns File size in bytes
   */
  public static async getFileSize(filePath: string): Promise<number> {
    try {
      // Dynamic import for Node.js modules
      const fs = await import("fs/promises");
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get file size: ${errorMessage}`);
    }
  }

  /**
   * Download a PDF and verify its size
   * @param page - Playwright page
   * @param triggerSelector - Selector for download trigger
   * @param minSizeBytes - Minimum expected file size in bytes
   * @param downloadPath - Optional path where the file will be downloaded
   * @returns Path to the downloaded file
   */
  public static async downloadAndVerifyPdfSize(
    page: Page,
    triggerSelector: string,
    minSizeBytes: number,
    downloadPath?: string
  ): Promise<string> {
    // Download the PDF
    const filePath = await this.downloadPdf(
      page,
      triggerSelector,
      downloadPath
    );

    // Verify file exists
    const exists = await this.fileExists(filePath);
    if (!exists) {
      throw new Error(`PDF file not found at path: ${filePath}`);
    }

    // Check file size
    const fileSize = await this.getFileSize(filePath);
    if (fileSize < minSizeBytes) {
      throw new Error(
        `PDF file size (${fileSize} bytes) is less than expected minimum (${minSizeBytes} bytes)`
      );
    }

    return filePath;
  }
}
