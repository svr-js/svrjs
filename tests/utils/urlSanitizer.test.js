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

  test("should encode special characters", () => {
    expect(sanitizeURL("/test<path>")).toBe("/test%3Cpath%3E");
    expect(sanitizeURL("/test^path")).toBe("/test%5Epath");
    expect(sanitizeURL("/test`path")).toBe("/test%60path");
    expect(sanitizeURL("/test{path}")).toBe("/test%7Bpath%7D");
    expect(sanitizeURL("/test|path")).toBe("/test%7Cpath");
  });

  test("should preserve certain characters", () => {
    expect(sanitizeURL("/test!path")).toBe("/test!path");
    expect(sanitizeURL("/test$path")).toBe("/test$path");
    expect(sanitizeURL("/test&path")).toBe("/test&path");
    expect(sanitizeURL("/test-path")).toBe("/test-path");
    expect(sanitizeURL("/test=path")).toBe("/test=path");
    expect(sanitizeURL("/test@path")).toBe("/test@path");
    expect(sanitizeURL("/test_path")).toBe("/test_path");
    expect(sanitizeURL("/test~path")).toBe("/test~path");
  });

  test("should decode URL-encoded characters while preserving certain characters", () => {
    expect(sanitizeURL("/test%20path")).toBe("/test%20path");
    expect(sanitizeURL("/test%21path")).toBe("/test!path");
    expect(sanitizeURL("/test%22path")).toBe("/test%22path");
    expect(sanitizeURL("/test%24path")).toBe("/test$path");
    expect(sanitizeURL("/test%25path")).toBe("/test%25path");
    expect(sanitizeURL("/test%26path")).toBe("/test&path");
    expect(sanitizeURL("/test%2Dpath")).toBe("/test-path");
    expect(sanitizeURL("/test%3Cpath")).toBe("/test%3Cpath");
    expect(sanitizeURL("/test%3Dpath")).toBe("/test=path");
    expect(sanitizeURL("/test%3Epath")).toBe("/test%3Epath");
    expect(sanitizeURL("/test%40path")).toBe("/test@path");
    expect(sanitizeURL("/test%5Fpath")).toBe("/test_path");
    expect(sanitizeURL("/test%7Dpath")).toBe("/test%7Dpath");
    expect(sanitizeURL("/test%7Epath")).toBe("/test~path");
  });

  test("should decode URL-encoded alphanumeric characters while preserving certain characters", () => {
    expect(sanitizeURL("/conf%69g.json")).toBe("/config.json");
    expect(sanitizeURL("/CONF%49G.JSON")).toBe("/CONFIG.JSON");
    expect(sanitizeURL("/svr%32.js")).toBe("/svr2.js");
    expect(sanitizeURL("/%73%76%72%32%2E%6A%73")).toBe("/svr2.js");
  });

  test("should decode URL-encoded characters regardless of the letter case of the URL encoding", () => {
    expect(sanitizeURL("/%5f")).toBe("/_");
    expect(sanitizeURL("/%5F")).toBe("/_");
  });

  test("should return the sanitized URL after calling the URL sanitizer two times", () => {
    sanitizeURL("/./test");
    const sanitizedURL = sanitizeURL("/./test");
    expect(sanitizedURL).toBe("/test");
  });
});
