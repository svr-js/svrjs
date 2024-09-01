const middleware = require("../../src/middleware/rewriteURL.js");
const createRegex = require("../../src/utils/createRegex.js");
const sanitizeURL = require("../../src/utils/urlSanitizer.js");
const parseURL = require("../../src/utils/urlParser.js");

jest.mock("fs");
jest.mock("../../src/utils/urlSanitizer.js");
jest.mock("../../src/utils/urlParser.js");
jest.mock("../../src/utils/createRegex.js");

describe("rewriteURL middleware", () => {
  let req, res, logFacilities, config, next;

  beforeEach(() => {
    jest.resetAllMocks();
    req = {
      parsedURL: {
        pathname: "/test",
        search: "",
        hash: ""
      },
      url: "/test",
      headers: {
        host: "test.com"
      },
      socket: {
        encrypted: false,
        localAddress: "127.0.0.1"
      }
    };
    res = {
      error: jest.fn()
    };
    logFacilities = {
      resmessage: jest.fn(),
      errmessage: jest.fn()
    };
    config = {
      rewriteMap: [],
      domain: "test.com",
      allowDoubleSlashes: false
    };
    next = jest.fn();

    // Make mocks call actual functions
    createRegex.mockImplementation((...params) =>
      jest.requireActual("../../src/utils/createRegex.js")(...params)
    );
    parseURL.mockImplementation((...params) =>
      jest.requireActual("../../src/utils/urlParser.js")(...params)
    );
    sanitizeURL.mockImplementation((...params) =>
      jest.requireActual("../../src/utils/urlSanitizer.js")(...params)
    );
  });

  test("should call next if URL is not rewritten", () => {
    middleware(req, res, logFacilities, config, next);
    expect(next).toHaveBeenCalled();
  });

  test("should return 400 if URL decoding fails", () => {
    req.parsedURL.pathname = "%";
    middleware(req, res, logFacilities, config, next);
    expect(res.error).toHaveBeenCalledWith(400);
  });

  test("should return 500 if rewriteURL callback returns an error", () => {
    config.rewriteMap = [
      {
        host: "test.com",
        definingRegex: "/.*/",
        replacements: [
          {
            regex: "/.*/",
            replacement: "error"
          }
        ]
      }
    ];
    createRegex.mockImplementation(() => {
      throw new Error("Test error");
    });
    middleware(req, res, logFacilities, config, next);
    expect(res.error).toHaveBeenCalledWith(500, expect.any(Error));
  });

  test("should return 400 if parsedURL is invalid", () => {
    config.rewriteMap = [
      {
        host: "test.com",
        definingRegex: "/.*/",
        replacements: [
          {
            regex: "/.*/",
            replacement: "/new"
          }
        ]
      }
    ];
    parseURL.mockImplementation(() => {
      throw new Error("Test error");
    });
    middleware(req, res, logFacilities, config, next);
    expect(res.error).toHaveBeenCalledWith(400, expect.any(Error));
  });

  test("should return 403 if URL is sanitized", () => {
    config.rewriteMap = [
      {
        host: "test.com",
        definingRegex: "/.*/",
        replacements: [
          {
            regex: "/.*/",
            replacement: "/new"
          }
        ]
      }
    ];
    sanitizeURL.mockReturnValue("/sanitized");
    middleware(req, res, logFacilities, config, next);
    expect(res.error).toHaveBeenCalledWith(403);
    expect(logFacilities.errmessage).toHaveBeenCalledWith("Content blocked.");
  });

  test("should call next if URL is rewritten successfully", () => {
    config.rewriteMap = [
      {
        host: "test.com",
        definingRegex: "/.*/",
        replacements: [
          {
            regex: "/.*/",
            replacement: "/new"
          }
        ]
      }
    ];
    middleware(req, res, logFacilities, config, next);
    expect(next).toHaveBeenCalled();
  });
});
