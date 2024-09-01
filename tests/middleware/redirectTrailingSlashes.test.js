const fs = require("fs");
const middleware = require("../../src/middleware/redirectTrailingSlashes.js");

jest.mock("fs");

describe("Trailing slash redirection middleware", () => {
  let req, res, logFacilities, config, next;

  beforeEach(() => {
    req = {
      isProxy: false,
      parsedURL: { pathname: "/test", search: "?query=1", hash: "#hash" },
      originalParsedURL: { pathname: "/test" }
    };
    res = {
      redirect: jest.fn(),
      error: jest.fn()
    };
    logFacilities = {};
    config = { disableTrailingSlashRedirects: false };
    next = jest.fn();
  });

  test("should redirect if pathname does not end with a slash", () => {
    fs.stat.mockImplementation((path, cb) => {
      cb(null, { isDirectory: () => true });
    });

    middleware(req, res, logFacilities, config, next);

    expect(res.redirect).toHaveBeenCalledWith("/test/?query=1#hash");
  });

  test("should not redirect if pathname ends with a slash", () => {
    req.parsedURL.pathname = "/test/";
    req.originalParsedURL.pathname = "/test/";

    middleware(req, res, logFacilities, config, next);

    expect(next).toHaveBeenCalled();
  });

  test("should not redirect if disableTrailingSlashRedirects is true", () => {
    config.disableTrailingSlashRedirects = true;

    middleware(req, res, logFacilities, config, next);

    expect(next).toHaveBeenCalled();
  });

  test("should not redirect if isProxy is true", () => {
    req.isProxy = true;

    middleware(req, res, logFacilities, config, next);

    expect(next).toHaveBeenCalled();
  });

  test("should call next if fs.stat returns an error", () => {
    fs.stat.mockImplementation((path, cb) => {
      cb(new Error("File does not exist"));
    });

    middleware(req, res, logFacilities, config, next);

    expect(next).toHaveBeenCalled();
  });

  test("should call next if fs.stat returns a file that is not a directory", () => {
    fs.stat.mockImplementation((path, cb) => {
      cb(null, { isDirectory: () => false });
    });

    middleware(req, res, logFacilities, config, next);

    expect(next).toHaveBeenCalled();
  });

  test("should call res.error if next throws an error", () => {
    fs.stat.mockImplementation((path, cb) => {
      cb(null, { isDirectory: () => false });
    });
    next.mockImplementation(() => {
      throw new Error("Next error");
    });

    middleware(req, res, logFacilities, config, next);

    expect(res.error).toHaveBeenCalledWith(500, new Error("Next error"));
  });
});
