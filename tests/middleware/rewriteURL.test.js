const middleware = require("../../src/middleware/rewriteURL.js");
const createRegex = require("../../src/utils/createRegex.js");

jest.mock("fs");
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
      },
      rewriteURL: jest.fn()
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

  test("should call req.rewriteURL if URL is to be rewritten", () => {
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
    expect(req.rewriteURL).toHaveBeenCalledWith("/new", next);
  });
});
