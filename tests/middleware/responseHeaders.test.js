const middleware = require("../../src/middleware/responseHeaders.js");

describe("Response header setting middleware", () => {
  let req, res, next, config, logFacilities;

  beforeEach(() => {
    req = { isProxy: false };
    res = { setHeader: jest.fn() };
    next = jest.fn();
    config = {
      getCustomHeaders: jest.fn(() => ({ "X-Custom-Header": "custom-value" })),
    };
    logFacilities = {};
  });

  test("should set custom headers if req.isProxy is false", () => {
    middleware(req, res, logFacilities, config, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      "X-Custom-Header",
      "custom-value",
    );
    expect(next).toHaveBeenCalled();
  });

  test("should not set custom headers if req.isProxy is true", () => {
    req.isProxy = true;

    middleware(req, res, logFacilities, config, next);

    expect(res.setHeader).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  test("should call next even if an error occurs while setting headers", () => {
    res.setHeader.mockImplementation(() => {
      throw new Error("test error");
    });

    middleware(req, res, logFacilities, config, next);

    expect(next).toHaveBeenCalled();
  });

  test("should have proxySafe property set to true", () => {
    expect(middleware.proxySafe).toBe(true);
  });
});
