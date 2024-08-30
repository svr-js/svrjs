const forbiddenPaths = require("../../src/utils/forbiddenPaths.js");

jest.mock("../../src/utils/forbiddenPaths.js", () => ({
  getInitializePath: jest.fn(() => "/forbidden"),
  isForbiddenPath: jest.fn((path) => path === "/forbidden"),
  isIndexOfForbiddenPath: jest.fn((path) => path.includes("/forbidden")),
  forbiddenPaths: {
    config: "/forbidden",
    certificates: [],
    svrjs: "/forbidden",
    serverSideScripts: ["/forbidden"],
    serverSideScriptDirectories: ["/forbidden"],
    temp: "/forbidden",
    log: "/forbidden",
  },
}));

process.serverConfig = {
  secure: true,
  sni: [],
};

process.dirname = "/usr/lib/mocksvrjs";
process.filename = "/usr/lib/mocksvrjs/svr.js";

const middleware = require("../../src/middleware/checkForbiddenPaths.js");

describe("Forbidden path checking middleware", () => {
  let req, res, logFacilities, config, next;

  beforeEach(() => {
    req = {
      parsedURL: { pathname: "/forbidden" },
      isProxy: false,
    };
    res = {
      error: jest.fn(),
    };
    logFacilities = {
      errmessage: jest.fn(),
    };
    config = {
      enableLogging: true,
      enableRemoteLogBrowsing: false,
      exposeServerVersion: false,
      disableServerSideScriptExpose: true,
    };
    next = jest.fn();
  });

  test("should deny access to forbidden paths", () => {
    middleware(req, res, logFacilities, config, next);
    expect(res.error).toHaveBeenCalledWith(403);
    expect(logFacilities.errmessage).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  test("should allow access to non-forbidden paths", () => {
    req.parsedURL.pathname = "/allowed";
    forbiddenPaths.isForbiddenPath.mockReturnValue(false);
    forbiddenPaths.isIndexOfForbiddenPath.mockReturnValue(false);
    middleware(req, res, logFacilities, config, next);
    expect(res.error).not.toHaveBeenCalled();
    expect(logFacilities.errmessage).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
});
