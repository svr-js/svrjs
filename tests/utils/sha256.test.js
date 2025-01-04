const sha256 = require("../../src/utils/sha256.js");

describe("SHA256 hash", () => {
  test("should hash the test string", () => {
    const result = sha256("test");
    expect(result).toBe(
      "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"
    );
  });

  test("should handle empty string", () => {
    const result = sha256("");
    expect(result).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    );
  });

  test("should handle special characters", () => {
    const result = sha256("!@#$%^&*()");
    expect(result).toBe(
      "95ce789c5c9d18490972709838ca3a9719094bca3ac16332cfec0652b0236141"
    );
  });

  test("should handle long strings", () => {
    const longString = "a".repeat(1000);
    const result = sha256(longString);
    expect(result).toBe(
      "41edece42d63e8d9bf515a9ba6932e1c20cbc9f5a5d134645adb5db1b9737ea3"
    );
  });

  test("should handle non-ASCII characters", () => {
    const result = sha256("éñ");
    expect(result).toBe(
      "c53435f74d8215688e74112f1c6527ad31fd3b72939769a75d09a14cd8a80cfe"
    );
  });
});
