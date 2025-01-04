// Mock the required modules
jest.mock("globalthis/shim", () => jest.fn());

jest.mock("node-abort-controller", () => ({
  AbortController: jest.fn()
}));

jest.mock("node-fetch", () => ({
  default: jest.fn(),
  Headers: jest.fn(),
  Request: jest.fn(),
  Response: jest.fn(),
  AbortError: jest.fn(),
  FetchError: jest.fn()
}));

jest.mock("fetch-blob", () => jest.fn());

describe("Polyfills", () => {
  beforeAll(() => {
    // Reset the global object before testing
    globalThis.AbortController = undefined;
    globalThis.fetch = undefined;
    globalThis.Headers = undefined;
    globalThis.Request = undefined;
    globalThis.Response = undefined;
    globalThis.AbortError = undefined;
    globalThis.FetchError = undefined;
    globalThis.Blob = undefined;
    globalThis.atob = undefined;
    globalThis.btoa = undefined;

    // Import the polyfills module
    require("../../src/utils/polyfills");
  });

  test("should polyfill globalThis", () => {
    const shim = require("globalthis/shim");
    expect(shim).toHaveBeenCalled();
  });

  test("should polyfill AbortController if undefined", () => {
    expect(globalThis.AbortController).toBeDefined();
  });

  test("should polyfill fetch if undefined", () => {
    expect(globalThis.fetch).toBeDefined();
    expect(globalThis.Headers).toBeDefined();
    expect(globalThis.Request).toBeDefined();
    expect(globalThis.Response).toBeDefined();
    expect(globalThis.AbortError).toBeDefined();
    expect(globalThis.FetchError).toBeDefined();
  });

  test("should polyfill Blob if undefined", () => {
    expect(globalThis.Blob).toBeDefined();
  });

  test("should polyfill atob if undefined", () => {
    expect(globalThis.atob).toBeDefined();
    expect(globalThis.atob("aGVsbG8gd29ybGQ=")).toBe("hello world");
  });

  test("should polyfill btoa if undefined", () => {
    expect(globalThis.btoa).toBeDefined();
    expect(globalThis.btoa("hello world")).toBe("aGVsbG8gd29ybGQ=");
  });
});
