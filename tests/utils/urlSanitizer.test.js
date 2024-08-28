const sanitizeURL = require("../../src/utils/urlSanitizer.js");

describe("URL sanitizer", () => {
  test('should return "*" for "*"', () => {
    expect(sanitizeURL("*")).toBe("*");
  });

  test("should return empty string for empty string", () => {
    expect(sanitizeURL("")).toBe("");
  });

  test("should remove null characters", () => {
    expect(sanitizeURL("/test%00")).toBe("/test");
    expect(sanitizeURL("/test\0")).toBe("/test");
  });

  test("should throw URIError for malformed URL", () => {
    expect(() => sanitizeURL("%c0%af")).toThrow(URIError);
    expect(() => sanitizeURL("%u002f")).toThrow(URIError);
    expect(() => sanitizeURL("%as")).toThrow(URIError);
  });

  test("should ensure the resource starts with a slash", () => {
    expect(sanitizeURL("test")).toBe("/test");
  });

  test("should convert backslashes to slashes", () => {
    expect(sanitizeURL("test\\path")).toBe("/test/path");
  });

  test("should handle duplicate slashes", () => {
    expect(sanitizeURL("test//path", false)).toBe("/test/path");
    expect(sanitizeURL("test//path", true)).toBe("/test//path");
  });

  test("should handle relative navigation", () => {
    expect(sanitizeURL("/./test")).toBe("/test");
    expect(sanitizeURL("/../test")).toBe("/test");
    expect(sanitizeURL("../test")).toBe("/test");
    expect(sanitizeURL("./test")).toBe("/test");
    expect(sanitizeURL("/test/./")).toBe("/test/");
    expect(sanitizeURL("/test/../")).toBe("/");
    expect(sanitizeURL("/test/../path")).toBe("/path");
  });

  test("should remove trailing dots in paths", () => {
    expect(sanitizeURL("/test...")).toBe("/test");
    expect(sanitizeURL("/test.../")).toBe("/test/");
  });

  test('should return "/" for empty sanitized resource', () => {
    expect(sanitizeURL("/../..")).toBe("/");
  });
});
