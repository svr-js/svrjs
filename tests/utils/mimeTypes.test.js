const {
  getMimeType,
  checkIfCompressible
} = require("../../src/utils/mimeTypes.js");

describe("MIME type utilities", () => {
  describe("getMimeType", () => {
    test("should return the correct MIME type for a given extension", () => {
      const extension = "html";
      const expectedMimeType = "text/html";
      expect(getMimeType(extension)).toBe(expectedMimeType);
    });

    test("should return false for an unknown extension", () => {
      const extension = "unknown";
      expect(getMimeType(extension)).toBe(false);
    });

    test("should return false for an invalid extension", () => {
      const extension = 123;
      expect(getMimeType(extension)).toBe(false);
    });

    test("should return the correct MIME type for an extension with a dot", () => {
      const extension = ".html";
      const expectedMimeType = "text/html";
      expect(getMimeType(extension)).toBe(expectedMimeType);
    });

    test("should return the correct MIME type for an extension with a charset", () => {
      const extension = "css";
      const expectedMimeType = "text/css; charset=utf-8";
      expect(getMimeType(extension)).toBe(expectedMimeType);
    });
  });

  describe("checkIfCompressible", () => {
    test("should return true for a compressible extension", () => {
      const extension = "html";
      expect(checkIfCompressible(extension)).toBe(true);
    });

    test("should return false for a non-compressible extension", () => {
      const extension = "jpg";
      expect(checkIfCompressible(extension)).toBe(false);
    });

    test("should return true for an unknown extension", () => {
      const extension = "unknown";
      expect(checkIfCompressible(extension)).toBe(true);
    });

    test("should return true for an invalid extension", () => {
      const extension = 123;
      expect(checkIfCompressible(extension)).toBe(true);
    });

    test("should return true for an extension with a dot", () => {
      const extension = ".html";
      expect(checkIfCompressible(extension)).toBe(true);
    });
  });
});
