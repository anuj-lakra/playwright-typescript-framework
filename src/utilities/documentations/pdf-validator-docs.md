# PDF Validator Utility

The `PdfValidator` utility provides comprehensive methods for downloading, validating, and managing PDF files in Playwright tests.

## Methods

### `downloadPdf(page: Page, triggerSelector: string, downloadPath?: string): Promise<string>`
Download a PDF file from a specific page.

**Parameters:**
- `page`: Playwright Page object
- `triggerSelector`: CSS selector for the download trigger element
- `downloadPath`: Optional custom download directory

**Returns:** Path to the downloaded PDF file

**Example:**
```typescript
const pdfPath = await PdfValidator.downloadPdf(page, '#downloadButton');
```

### `verifyPdfHeaders(page: Page, pdfUrl: string): Promise<{ contentType: string, contentLength: number }>`
Verify PDF headers and content type.

**Parameters:**
- `page`: Playwright Page object
- `pdfUrl`: URL of the PDF file

**Returns:** 
- `contentType`: MIME type of the file
- `contentLength`: Size of the file in bytes

**Example:**
```typescript
const headerInfo = await PdfValidator.verifyPdfHeaders(page, 'https://example.com/document.pdf');
```

### `fileExists(filePath: string): Promise<boolean>`
Check if a file exists at the specified path.

**Parameters:**
- `filePath`: Full path to the file

**Returns:** Boolean indicating file existence

**Example:**
```typescript
const exists = await PdfValidator.fileExists('/path/to/document.pdf');
```

### `getFileSize(filePath: string): Promise<number>`
Get the size of a file in bytes.

**Parameters:**
- `filePath`: Full path to the file

**Returns:** File size in bytes

**Example:**
```typescript
const fileSize = await PdfValidator.getFileSize('/path/to/document.pdf');
```

### `downloadAndVerifyPdfSize(page: Page, triggerSelector: string, minSizeBytes: number, downloadPath?: string): Promise<string>`
Download a PDF and verify its size against a minimum expected size.

**Parameters:**
- `page`: Playwright Page object
- `triggerSelector`: CSS selector for the download trigger
- `minSizeBytes`: Minimum expected file size in bytes
- `downloadPath`: Optional custom download directory

**Returns:** Path to the downloaded PDF file

**Example:**
```typescript
const pdfPath = await PdfValidator.downloadAndVerifyPdfSize(
  page, 
  '#downloadButton', 
  30000 // minimum file size in bytes
);
```

## Use Cases

1. **PDF Download Validation:** Ensure PDFs are downloaded correctly
2. **File Size Verification:** Check PDF files meet minimum size requirements
3. **Content Type Checking:** Validate that downloaded files are actual PDFs

## Error Handling

The utility provides detailed error messages for:
- Download failures
- Incorrect file types
- Size verification issues
- File access problems

## Best Practices

- Always specify a minimum file size when downloading PDFs
- Use custom download paths for organized file management
- Verify file existence and content type before processing

## Compatibility

Works with Playwright's Page and Request objects for comprehensive PDF handling.

**Note:** Ensure proper file permissions and access rights when working with file system operations.
