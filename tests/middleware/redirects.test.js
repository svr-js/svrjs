const middleware = require("../../src/middleware/redirects.js");

describe("Redirects middleware", () => {
  let req, res, logFacilities, config, next;

  beforeEach(() => {
    req = {
      headers: {},
      socket: { encrypted: false, remoteAddress: "8.8.8.8" },
      isProxy: false,
      url: "/test"
    };
    res = {
      redirect: jest.fn(),
      error: jest.fn()
    };
    logFacilities = {
      errmessage: jest.fn()
    };
    config = {
      secure: true,
      disableNonEncryptedServer: false,
      disableToHTTPSRedirect: false,
      port: 80,
      sport: 443,
      spubport: 8443,
      wwwredirect: true,
      domain: "example.com"
    };
    next = jest.fn();
  });

  test("should redirect to HTTPS if config.secure is true and connection is not encrypted", () => {
    req.headers.host = "www.example.com";
    middleware(req, res, logFacilities, config, next);
    expect(res.redirect).toHaveBeenCalledWith("https://www.example.com/test");
  });

  test("should not redirect if connection is encrypted", () => {
    req.headers.host = "www.example.com";
    req.socket.encrypted = true;
    middleware(req, res, logFacilities, config, next);
    expect(res.redirect).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  test("should redirect to www subdomain if config.wwwredirect is true and host does not start with www", () => {
    req.headers.host = "example.com";
    middleware(req, res, logFacilities, config, next);
    expect(res.redirect).toHaveBeenCalledWith("https://example.com/test");
  });
});
