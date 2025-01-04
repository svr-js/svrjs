process.serverConfig = {
  useWebRootServerSideScript: true
};

const checkForbiddenPaths = require("../../src/middleware/checkForbiddenPaths.js");
const os = require("os");

jest.mock("os", () => ({
  platform: jest.fn()
}));

describe("checkForbiddenPaths middleware", () => {
  let req, res, logFacilities, config, next;

  beforeEach(() => {
    req = {
      parsedURL: {
        pathname: ""
      }
    };
    res = {
      error: jest.fn()
    };
    logFacilities = {
      errmessage: jest.fn()
    };
    config = {};
    next = jest.fn();
    process.serverConfig = {
      useWebRootServerSideScript: true
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should return 400 for invalid URL", () => {
    req.parsedURL.pathname = "%";
    checkForbiddenPaths(req, res, logFacilities, config, next);
    expect(res.error).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  test("should return 403 for forbidden path on Unix", () => {
    os.platform.mockReturnValue("linux");
    req.parsedURL.pathname = "/serverSideScript.js";
    checkForbiddenPaths(req, res, logFacilities, config, next);
    expect(res.error).toHaveBeenCalledWith(403);
    expect(logFacilities.errmessage).toHaveBeenCalledWith(
      "Access to server-side JavaScript is denied."
    );
    expect(next).not.toHaveBeenCalled();
  });

  test("should return 403 for forbidden path on Windows", () => {
    os.platform.mockReturnValue("win32");
    req.parsedURL.pathname = "/serverSideScript.js";
    checkForbiddenPaths(req, res, logFacilities, config, next);
    expect(res.error).toHaveBeenCalledWith(403);
    expect(logFacilities.errmessage).toHaveBeenCalledWith(
      "Access to server-side JavaScript is denied."
    );
    expect(next).not.toHaveBeenCalled();
  });

  test("should return 403 for forbidden path on Windows with different casing", () => {
    os.platform.mockReturnValue("win32");
    req.parsedURL.pathname = "/ServerSideScript.js";
    checkForbiddenPaths(req, res, logFacilities, config, next);
    expect(res.error).toHaveBeenCalledWith(403);
    expect(logFacilities.errmessage).toHaveBeenCalledWith(
      "Access to server-side JavaScript is denied."
    );
    expect(next).not.toHaveBeenCalled();
  });

  test("should call next for allowed path", () => {
    req.parsedURL.pathname = "/allowedPath";
    checkForbiddenPaths(req, res, logFacilities, config, next);
    expect(next).toHaveBeenCalled();
  });

  test("should call next for allowed path with duplicate slashes", () => {
    req.parsedURL.pathname = "//allowed//path";
    checkForbiddenPaths(req, res, logFacilities, config, next);
    expect(next).toHaveBeenCalled();
  });
});
