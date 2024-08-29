const {
  getInitializePath,
  isForbiddenPath,
  isIndexOfForbiddenPath,
  forbiddenPaths,
} = require("../../src/utils/forbiddenPaths");
const os = require("os");

jest.mock("os", () => ({
  platform: jest.fn(),
}));

describe("Forbidden paths handling", () => {
  beforeEach(() => {
    os.platform.mockReset();
    forbiddenPaths.config = getInitializePath("./config.json");
    forbiddenPaths.serverSideScriptDirectories = [];
    forbiddenPaths.serverSideScriptDirectories.push(
      getInitializePath("./node_modules"),
    );
    forbiddenPaths.serverSideScriptDirectories.push(
      getInitializePath("./mods"),
    );
    process.cwd = () => "/usr/lib/mocksvrjs";
    process.dirname = "/usr/lib/mocksvrjs";
    process.filename = "/usr/lib/mocksvrjs/svr.js";
  });

  describe("getInitializePath", () => {
    test("should return the correct path on Unix", () => {
      os.platform.mockReturnValue("linux");
      expect(getInitializePath("./config.json")).toBe("/config.json");
    });

    test("should return the correct path on Windows", () => {
      process.cwd = () => "C:\\mocksvrjs";
      process.dirname = "C:\\mocksvrjs";
      process.filename = "C:\\mocksvrjs\\svr.js";
      os.platform.mockReturnValue("win32");
      expect(getInitializePath("./config.json")).toBe("/config.json");
    });

    test("should handle absolute paths on Unix", () => {
      os.platform.mockReturnValue("linux");
      expect(getInitializePath("/absolute/path")).toBe(
        "/../../../absolute/path",
      );
    });

    test("should handle absolute paths on Windows", () => {
      process.cwd = () => "C:\\mocksvrjs";
      process.dirname = "C:\\mocksvrjs";
      process.filename = "C:\\mocksvrjs\\svr.js";
      os.platform.mockReturnValue("win32");
      expect(getInitializePath("C:\\absolute\\path")).toBe("/../absolute/path");
    });

    test("should handle relative paths on Unix", () => {
      os.platform.mockReturnValue("linux");
      expect(getInitializePath("./relative/path")).toBe("/relative/path");
    });

    test("should handle relative paths on Windows", () => {
      process.cwd = () => "C:\\mocksvrjs";
      process.dirname = "C:\\mocksvrjs";
      process.filename = "C:\\mocksvrjs\\svr.js";
      os.platform.mockReturnValue("win32");
      expect(getInitializePath("./relative\\path")).toBe("/relative/path");
    });
  });

  describe("isForbiddenPath", () => {
    test("should return true if the path is forbidden", () => {
      os.platform.mockReturnValue("linux");
      expect(isForbiddenPath("/config.json", "config")).toBe(true);
    });

    test("should return false if the path is not forbidden", () => {
      os.platform.mockReturnValue("linux");
      expect(isForbiddenPath("/notconfig.json", "config")).toBe(false);
    });

    test("should handle case insensitivity on Windows", () => {
      process.cwd = () => "C:\\mocksvrjs";
      process.dirname = "C:\\mocksvrjs";
      process.filename = "C:\\mocksvrjs\\svr.js";
      os.platform.mockReturnValue("win32");
      expect(isForbiddenPath("/CONFIG.JSON", "config")).toBe(true);
    });

    test("should handle array of forbidden paths", () => {
      os.platform.mockReturnValue("linux");
      expect(
        isForbiddenPath("/node_modules", "serverSideScriptDirectories"),
      ).toBe(true);
      expect(isForbiddenPath("/mods", "serverSideScriptDirectories")).toBe(
        true,
      );
      expect(
        isForbiddenPath("/notforbidden", "serverSideScriptDirectories"),
      ).toBe(false);
    });
  });

  describe("isIndexOfForbiddenPath", () => {
    test("should return true if the path is an index of a forbidden path", () => {
      os.platform.mockReturnValue("linux");
      expect(isIndexOfForbiddenPath("/config.json", "config")).toBe(true);
      expect(
        isIndexOfForbiddenPath("/node_modules/", "serverSideScriptDirectories"),
      ).toBe(true);
    });

    test("should return false if the path is not an index of a forbidden path", () => {
      os.platform.mockReturnValue("linux");
      expect(isIndexOfForbiddenPath("/notconfig.json", "config")).toBe(false);
      expect(
        isIndexOfForbiddenPath("/notforbidden/", "serverSideScriptDirectories"),
      ).toBe(false);
      expect(isIndexOfForbiddenPath("/config.json.fake", "config")).toBe(false);
      expect(
        isIndexOfForbiddenPath(
          "/node_modules_fake/",
          "serverSideScriptDirectories",
        ),
      ).toBe(false);
    });

    test("should handle case insensitivity on Windows", () => {
      process.cwd = () => "C:\\mocksvrjs";
      process.dirname = "C:\\mocksvrjs";
      process.filename = "C:\\mocksvrjs\\svr.js";
      os.platform.mockReturnValue("win32");
      expect(isIndexOfForbiddenPath("/CONFIG.JSON", "config")).toBe(true);
      expect(
        isIndexOfForbiddenPath("/NODE_MODULES/", "serverSideScriptDirectories"),
      ).toBe(true);
    });

    test("should handle array of forbidden paths", () => {
      os.platform.mockReturnValue("linux");
      expect(
        isIndexOfForbiddenPath("/node_modules/", "serverSideScriptDirectories"),
      ).toBe(true);
      expect(
        isIndexOfForbiddenPath("/mods/", "serverSideScriptDirectories"),
      ).toBe(true);
      expect(
        isIndexOfForbiddenPath("/notforbidden/", "serverSideScriptDirectories"),
      ).toBe(false);
    });
  });
});
