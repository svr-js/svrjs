const middleware = require("../../src/middleware/urlSanitizer.js");
const sanitizeURL = require("../../src/utils/urlSanitizer.js");
const parseURL = require("../../src/utils/urlParser.js");

jest.mock("../../src/utils/urlSanitizer.js");
jest.mock("../../src/utils/urlParser.js");

describe("Path sanitizer middleware", () => {
  let req, res, logFacilities, config, next;

  beforeEach(() => {
    req = {
      parsedURL: {
        pathname: "/test",
        search: "?query=test",
        hash: "#hash",
      },
      url: "/test?query=test#hash",
      isProxy: false,
      headers: {
        host: "test.com",
      },
      socket: {
        encrypted: false,
      },
    };
    res = {
      redirect: jest.fn(),
      error: jest.fn(),
    };
    logFacilities = {
      resmessage: jest.fn(),
    };
    config = {
      allowDoubleSlashes: false,
      rewriteDirtyURLs: false,
      domain: "test.com",
    };
    next = jest.fn();

    sanitizeURL.mockImplementation((url) => url);
    parseURL.mockImplementation((url) => ({ pathname: url }));
  });

  test("should call next if URL is not dirty", () => {
    middleware(req, res, logFacilities, config, next);
    expect(next).toHaveBeenCalled();
  });

  test("should redirect if URL is dirty and rewriteDirtyURLs is false", () => {
    req.parsedURL.pathname = "/dirty%20url";
    middleware(req, res, logFacilities, config, next);
    expect(res.redirect).toHaveBeenCalledWith(
      "/dirty%20url?query=test#hash",
      false,
    );
    expect(next).not.toHaveBeenCalled();
  });

  test("should rewrite URL if URL is dirty and rewriteDirtyURLs is true", () => {
    req.parsedURL.pathname = "/dirty%20url";
    config.rewriteDirtyURLs = true;
    middleware(req, res, logFacilities, config, next);
    expect(req.url).toBe("/dirty%20url?query=test#hash");
    expect(next).toHaveBeenCalled();
  });

  test("should redirect if URL is dirty (sanitized via sanitizeURL) and rewriteDirtyURLs is false", () => {
    req.parsedURL.pathname = "/dirty%20url";
    sanitizeURL.mockImplementation((url) => url.replace(/dirty/g, "clean"));
    middleware(req, res, logFacilities, config, next);
    expect(res.redirect).toHaveBeenCalledWith(
      "/clean%20url?query=test#hash",
      false,
    );
    expect(next).not.toHaveBeenCalled();
  });

  test("should rewrite URL if URL is dirty (sanitized via sanitizeURL) and rewriteDirtyURLs is true", () => {
    req.parsedURL.pathname = "/dirty%20url";
    config.rewriteDirtyURLs = true;
    sanitizeURL.mockImplementation((url) => url.replace(/dirty/g, "clean"));
    middleware(req, res, logFacilities, config, next);
    expect(req.url).toBe("/clean%20url?query=test#hash");
    expect(next).toHaveBeenCalled();
  });

  test("should handle parseURL errors", () => {
    req.parsedURL.pathname = "/dirty%20url";
    config.rewriteDirtyURLs = true;
    sanitizeURL.mockImplementation((url) => url.replace(/dirty/g, "clean"));
    parseURL.mockImplementation(() => {
      throw new Error("Parse error");
    });
    middleware(req, res, logFacilities, config, next);
    expect(res.error).toHaveBeenCalledWith(400, new Error("Parse error"));
    expect(next).not.toHaveBeenCalled();
  });
});
