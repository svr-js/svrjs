const fixNodeMojibakeURL = require("../../src/utils/urlMojibakeFixer.js");

describe("URL mojibake fixer", () => {
  test("should return the same string for ASCII characters", () => {
    expect(fixNodeMojibakeURL("hello world")).toBe("hello world");
  });

  test("should encode characters with values greater than 127", () => {
    expect(fixNodeMojibakeURL("é")).toBe("%E9");
    expect(fixNodeMojibakeURL("ñ")).toBe("%F1");
  });

  test("should uppercase the URL encodings", () => {
    expect(fixNodeMojibakeURL("a%e9b")).toBe("a%E9b");
  });

  test("should handle mixed ASCII and non-ASCII characters", () => {
    expect(fixNodeMojibakeURL("hello é world ñ")).toBe("hello %E9 world %F1");
  });

  test("should handle empty string", () => {
    expect(fixNodeMojibakeURL("")).toBe("");
  });

  test("should handle strings with special characters", () => {
    expect(fixNodeMojibakeURL("!@#$%^&*()")).toBe("!@#$%^&*()");
  });

  test("should handle strings with spaces", () => {
    expect(fixNodeMojibakeURL("hello world")).toBe("hello world");
  });

  test("should handle strings with numbers", () => {
    expect(fixNodeMojibakeURL("12345")).toBe("12345");
  });

  test("should handle strings with mixed characters", () => {
    expect(fixNodeMojibakeURL("hello123 é world ñ!@#$%^&*()")).toBe(
      "hello123 %E9 world %F1!@#$%^&*()"
    );
  });
});
