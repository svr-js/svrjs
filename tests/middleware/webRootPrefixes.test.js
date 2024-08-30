const middleware = require("../../src/middleware/webRootPostfixes.js");
const createRegex = require("../../src/utils/createRegex.js");
const ipMatch = require("../../src/utils/ipMatch.js");
const sanitizeURL = require("../../src/utils/urlSanitizer.js");
const parseURL = require("../../src/utils/urlParser.js");

jest.mock("../../src/utils/createRegex.js");
jest.mock("../../src/utils/ipMatch.js");
jest.mock("../../src/utils/urlSanitizer.js");
jest.mock("../../src/utils/urlParser.js");

describe("Web root postfixes middleware", () => {
  let req, res, logFacilities, config, next;

  beforeEach(() => {
    req = {
      isProxy: false,
      url: "/test",
      parsedURL: { pathname: "/test" },
      headers: { host: "test.com" },
      socket: { localAddress: "127.0.0.1" },
    };
    res = { error: jest.fn() };
    logFacilities = { resmessage: jest.fn(), errmessage: jest.fn() };
    config = {
      allowPostfixDoubleSlashes: true,
      wwwrootPostfixPrefixesVHost: [],
      wwwrootPostfixesVHost: [
        { host: "test.com", ip: "127.0.0.1", postfix: "postfix" },
      ],
    };
    next = jest.fn();

    createRegex.mockReturnValue(new RegExp());
    ipMatch.mockReturnValue(true);
    sanitizeURL.mockImplementation((url) => url);
    parseURL.mockImplementation((url) => ({ pathname: url }));
  });

  test("should add web root postfix", () => {
    middleware(req, res, logFacilities, config, next);
    expect(req.url).toBe("/postfix/test");
    expect(logFacilities.resmessage).toHaveBeenCalledWith(
      "Added web root postfix: /test => /postfix/test",
    );
  });

  test("should not add web root postfix if req.isProxy is true", () => {
    req.isProxy = true;
    middleware(req, res, logFacilities, config, next);
    expect(req.url).toBe("/test");
    expect(logFacilities.resmessage).not.toHaveBeenCalled();
  });

  test("should not add web root postfix if no matching config is found", () => {
    config.wwwrootPostfixesVHost = [
      { host: "example.com", ip: "127.0.0.1", postfix: "postfix" },
    ];
    middleware(req, res, logFacilities, config, next);
    expect(req.url).toBe("/test");
    expect(logFacilities.resmessage).not.toHaveBeenCalled();
  });

  test("should call next function", () => {
    middleware(req, res, logFacilities, config, next);
    expect(next).toHaveBeenCalled();
  });
});
