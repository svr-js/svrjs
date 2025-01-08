const middleware = require("../../src/middleware/defaultHandlerChecks.js");
const httpMocks = require("node-mocks-http");

describe("Default handler checks middleware", () => {
  let req, res, logFacilities, config, next;

  beforeEach(() => {
    req = httpMocks.createRequest();
    res = httpMocks.createResponse();
    logFacilities = {
      errmessage: jest.fn()
    };
    config = {
      getCustomHeaders: jest.fn(() => ({})),
      generateServerString: jest.fn(() => "Server String")
    };
    next = jest.fn();
  });

  test("should return 501 and log error message if req.isProxy is true", () => {
    req.isProxy = true;
    middleware(req, res, logFacilities, config, next);
    expect(res._getStatusCode()).toBe(501);
    expect(logFacilities.errmessage).toHaveBeenCalledWith(
      expect.stringContaining("doesn't support proxy without proxy mod.")
    );
  });

  test("should return 204 if req.method is OPTIONS", () => {
    req.method = "OPTIONS";
    middleware(req, res, logFacilities, config, next);
    expect(res._getStatusCode()).toBe(204);
    expect(res._getHeaders()).toHaveProperty(
      "allow",
      "GET, POST, HEAD, OPTIONS"
    );
  });

  test("should call res.error with 405 and log error message if req.method is not GET, POST, or HEAD", () => {
    req.method = "PUT";
    res.error = jest.fn();
    middleware(req, res, logFacilities, config, next);
    expect(res.error).toHaveBeenCalledWith(405);
    expect(logFacilities.errmessage).toHaveBeenCalledWith(
      expect.stringContaining("Invalid method: PUT")
    );
  });

  test("should call next if req.method is GET, POST, or HEAD and req.isProxy is false", () => {
    req.method = "GET";
    middleware(req, res, logFacilities, config, next);
    expect(next).toHaveBeenCalled();
  });
});
