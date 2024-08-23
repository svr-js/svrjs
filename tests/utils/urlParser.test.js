const parseURL = require("../../src/utils/urlParser.js");

describe("URL parser", () => {
  test("should parse a simple URL", () => {
    const parsedUrl = parseURL("http://example.com");
    expect(parsedUrl.protocol).toBe("http:");
    expect(parsedUrl.hostname).toBe("example.com");
    expect(parsedUrl.pathname).toBe("/");
    expect(parsedUrl.path).toBe("/");
    expect(parsedUrl.href).toBe("http://example.com/");
  });

  test("should parse a URL with a path", () => {
    const parsedUrl = parseURL("http://example.com/path/to/resource");
    expect(parsedUrl.protocol).toBe("http:");
    expect(parsedUrl.hostname).toBe("example.com");
    expect(parsedUrl.pathname).toBe("/path/to/resource");
    expect(parsedUrl.path).toBe("/path/to/resource");
    expect(parsedUrl.href).toBe("http://example.com/path/to/resource");
  });

  test("should parse a URL with a query string", () => {
    const parsedUrl = parseURL("http://example.com/path?query=string");
    expect(parsedUrl.protocol).toBe("http:");
    expect(parsedUrl.hostname).toBe("example.com");
    expect(parsedUrl.pathname).toBe("/path");
    expect(parsedUrl.search).toBe("?query=string");
    expect(parsedUrl.query.query).toBe("string");
    expect(parsedUrl.path).toBe("/path?query=string");
    expect(parsedUrl.href).toBe("http://example.com/path?query=string");
  });

  test("should parse a URL with a port", () => {
    const parsedUrl = parseURL("http://example.com:8080");
    expect(parsedUrl.protocol).toBe("http:");
    expect(parsedUrl.hostname).toBe("example.com");
    expect(parsedUrl.port).toBe("8080");
    expect(parsedUrl.pathname).toBe("/");
    expect(parsedUrl.path).toBe("/");
    expect(parsedUrl.href).toBe("http://example.com:8080/");
  });

  test("should parse a URL with a username and password", () => {
    const parsedUrl = parseURL("http://user:pass@example.com");
    expect(parsedUrl.protocol).toBe("http:");
    expect(parsedUrl.auth).toBe("user:pass");
    expect(parsedUrl.hostname).toBe("example.com");
    expect(parsedUrl.pathname).toBe("/");
    expect(parsedUrl.path).toBe("/");
    expect(parsedUrl.href).toBe("http://user:pass@example.com/");
  });

  test("should parse a URL with a fragment", () => {
    const parsedUrl = parseURL("http://example.com/path#fragment");
    expect(parsedUrl.protocol).toBe("http:");
    expect(parsedUrl.hostname).toBe("example.com");
    expect(parsedUrl.pathname).toBe("/path");
    expect(parsedUrl.hash).toBe("#fragment");
    expect(parsedUrl.path).toBe("/path");
    expect(parsedUrl.href).toBe("http://example.com/path#fragment");
  });

  test("should parse a URL with all components", () => {
    const parsedUrl = parseURL(
      "http://user:pass@example.com:8080/path/to/resource?query=string#fragment",
    );
    expect(parsedUrl.protocol).toBe("http:");
    expect(parsedUrl.auth).toBe("user:pass");
    expect(parsedUrl.hostname).toBe("example.com");
    expect(parsedUrl.port).toBe("8080");
    expect(parsedUrl.pathname).toBe("/path/to/resource");
    expect(parsedUrl.search).toBe("?query=string");
    expect(parsedUrl.query.query).toBe("string");
    expect(parsedUrl.hash).toBe("#fragment");
    expect(parsedUrl.path).toBe("/path/to/resource?query=string");
    expect(parsedUrl.href).toBe(
      "http://user:pass@example.com:8080/path/to/resource?query=string#fragment",
    );
  });
});
