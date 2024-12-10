const normalizeWebroot = require("../../src/utils/normalizeWebroot.js");
const path = require("path");
const os = require("os");

jest.mock("os");
jest.mock("path");

describe("Webroot normalization function", () => {
  test("should return process.cwd() when currentWebroot is undefined", () => {
    const cwdSpy = jest.spyOn(process, "cwd").mockReturnValue("/test");
    expect(normalizeWebroot(undefined)).toBe("/test");
    cwdSpy.mockRestore();
  });

  test("should return the absolute path when currentWebroot is absolute", () => {
    path.isAbsolute.mockReturnValue(true);
    expect(normalizeWebroot("/absolute/path")).toBe("/absolute/path");
  });

  test("should return the relative path with process.cwd() prepended on Unix", () => {
    path.isAbsolute.mockReturnValue(false);
    os.platform.mockReturnValue("linux");
    const cwdSpy = jest.spyOn(process, "cwd").mockReturnValue("/test");
    expect(normalizeWebroot("relative/path")).toBe("/test/relative/path");
    cwdSpy.mockRestore();
  });

  test("should return the relative path with process.cwd() prepended on Windows", () => {
    path.isAbsolute.mockReturnValue(false);
    os.platform.mockReturnValue("win32");
    const cwdSpy = jest.spyOn(process, "cwd").mockReturnValue("C:\\test");
    expect(normalizeWebroot("relative\\path")).toBe("C:\\test\\relative\\path");
    cwdSpy.mockRestore();
  });
});
