const generateErrorStack = require("../../src/utils/generateErrorStack.js");

describe("Error stack generation function", () => {
  test("should return the original stack if it is V8-style", () => {
    const error = new Error("Test error");
    error.stack = `Error: Test error
    at Object.<anonymous> (/path/to/file.js:10:15)
    at Module._compile (internal/modules/cjs/loader.js:1063:30)
    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1092:10)`;

    const result = generateErrorStack(error);
    expect(result).toBe(error.stack);
  });

  test("should generate a new stack if the original stack is SpiderMonkey-style", () => {
    const error = new Error("Test error");
    error.stack = `baz@filename.js:10:15
bar@filename.js:6:3
foo@filename.js:2:3
@filename.js:13:1`;

    const result = generateErrorStack(error);
    expect(result).toContain("Error: Test error");
    expect(result).toContain("    at baz (filename.js:10:15)");
    expect(result).toContain("    at bar (filename.js:6:3)");
    expect(result).toContain("    at foo (filename.js:2:3)");
    expect(result).toContain("    at filename.js:13:1");
  });

  test("should generate a new stack if the original stack is JavaScriptCore-style", () => {
    const error = new Error("Test error");
    error.stack = `baz@filename.js:10:15
bar@filename.js:6:3
foo@filename.js:2:3
global code@filename.js:13:1`;

    const result = generateErrorStack(error);
    expect(result).toContain("Error: Test error");
    expect(result).toContain("    at baz (filename.js:10:15)");
    expect(result).toContain("    at bar (filename.js:6:3)");
    expect(result).toContain("    at foo (filename.js:2:3)");
    expect(result).toContain("    at filename.js:13:1");
  });
});
