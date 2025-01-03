const defaultHandlerChecks = require("../../src/middleware/defaultHandlerChecks.js");
const statusCodes = require("../../src/res/statusCodes.js");
const svrjsInfo = require("../../svrjs.json");

const mockConfig = {
  getCustomHeaders: jest.fn(() => ({
    "X-Custom-Header": "Test",
    Server: "test-server"
  })),
  generateServerString: jest.fn(() => "test-server")
};

const mockLogFacilities = {
  errmessage: jest.fn()
};

describe("Default handler checks middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      writeHead: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
      error: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  test("should return 501 if request is a proxy request", () => {
    req.isProxy = true;

    defaultHandlerChecks(req, res, mockLogFacilities, mockConfig, next);

    expect(mockConfig.getCustomHeaders).toHaveBeenCalled();
    expect(res.writeHead).toHaveBeenCalledWith(
      501,
      statusCodes[501],
      expect.objectContaining({ "Content-Type": "text/html" })
    );
    expect(res.write).toHaveBeenCalledWith(
      expect.stringContaining("Proxy not implemented")
    );
    expect(res.end).toHaveBeenCalled();
    expect(mockLogFacilities.errmessage).toHaveBeenCalledWith(
      `${svrjsInfo.name} doesn't support proxy without proxy mod.`
    );
    expect(next).not.toHaveBeenCalled();
  });

  test("should return 204 and Allow header on OPTIONS request", () => {
    req.method = "OPTIONS";

    defaultHandlerChecks(req, res, mockLogFacilities, mockConfig, next);

    expect(mockConfig.getCustomHeaders).toHaveBeenCalled();
    expect(res.writeHead).toHaveBeenCalledWith(
      204,
      statusCodes[204],
      expect.objectContaining({ Allow: "GET, POST, HEAD, OPTIONS" })
    );
    expect(res.end).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  test("should return 405 and log error for unsupported methods", () => {
    req.method = "PUT";

    defaultHandlerChecks(req, res, mockLogFacilities, mockConfig, next);

    expect(res.error).toHaveBeenCalledWith(405);
    expect(mockLogFacilities.errmessage).toHaveBeenCalledWith(
      "Invalid method: PUT"
    );
    expect(next).not.toHaveBeenCalled();
  });

  test("should call next() for GET requests", () => {
    req.method = "GET";

    defaultHandlerChecks(req, res, mockLogFacilities, mockConfig, next);

    expect(next).toHaveBeenCalled();
  });

  test("should call next() for POST requests", () => {
    req.method = "POST";

    defaultHandlerChecks(req, res, mockLogFacilities, mockConfig, next);

    expect(next).toHaveBeenCalled();
  });

  test("should call next() for HEAD requests", () => {
    req.method = "HEAD";

    defaultHandlerChecks(req, res, mockLogFacilities, mockConfig, next);

    expect(next).toHaveBeenCalled();
  });
});
