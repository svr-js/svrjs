const middleware = require("../../src/middleware/status.js");
const http = require("http");
const os = require("os");

describe("Status middleware", () => {
  let req, res, logFacilities, config, next;

  beforeEach(() => {
    req = {
      parsedURL: { pathname: "/svrjsstatus.svr" },
      headers: { host: "localhost" }
    };
    res = {
      writeHead: jest.fn(),
      end: jest.fn(),
      head: "",
      foot: ""
    };
    logFacilities = {};
    config = {
      allowStatus: true,
      generateServerString: () => "Test Server"
    };
    next = jest.fn();
    process.reqcounter = 100;
    process.err4xxcounter = 10;
    process.err5xxcounter = 5;
    process.malformedcounter = 2;
    process.uptime = jest.fn(() => 1000);
    process.memoryUsage = jest.fn(() => ({ rss: 1024 }));
    process.cpuUsage = jest.fn(() => ({ user: 500000, system: 500000 }));
    process.pid = 1234;
  });

  test("should set response headers and body when conditions are met", () => {
    middleware(req, res, logFacilities, config, next);
    expect(res.writeHead).toHaveBeenCalledWith(200, http.STATUS_CODES[200], {
      "Content-Type": "text/html; charset=utf-8"
    });
    expect(res.end).toHaveBeenCalled();
  });

  test("should call next function when conditions are not met", () => {
    req.parsedURL.pathname = "/";
    middleware(req, res, logFacilities, config, next);
    expect(next).toHaveBeenCalled();
  });

  test("should handle case insensitivity on Windows", () => {
    req.parsedURL.pathname = "/SvrJsStatus.Svr";
    jest.spyOn(os, "platform").mockReturnValue("win32");
    middleware(req, res, logFacilities, config, next);
    expect(res.writeHead).toHaveBeenCalledWith(200, http.STATUS_CODES[200], {
      "Content-Type": "text/html; charset=utf-8"
    });
    expect(res.end).toHaveBeenCalled();
    os.platform.mockRestore();
  });

  test("should handle undefined host header", () => {
    req.headers.host = undefined;
    middleware(req, res, logFacilities, config, next);
    expect(res.writeHead).toHaveBeenCalledWith(200, http.STATUS_CODES[200], {
      "Content-Type": "text/html; charset=utf-8"
    });
    expect(res.end).toHaveBeenCalled();
  });

  test("should handle custom head and foot", () => {
    const headContents = "<style>body { background-color: red; }</style>";
    res.head = `<head>${headContents}</head>`;
    res.foot = "<footer>Copyright 2022</footer>";
    middleware(req, res, logFacilities, config, next);
    expect(res.end).toHaveBeenCalledWith(expect.stringContaining(headContents));
    expect(res.end).toHaveBeenCalledWith(expect.stringContaining(res.foot));
  });
});
