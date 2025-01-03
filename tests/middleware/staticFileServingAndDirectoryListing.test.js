const fs = require("fs");
const zlib = require("zlib");
const sha256 = require("../../src/utils/sha256.js");
const middleware = require("../../src/middleware/staticFileServingAndDirectoryListings.js");
const statusCodes = require("../../src/res/statusCodes.js");

jest.mock("fs");
jest.mock("zlib");
jest.mock("../../src/utils/sha256.js");
jest.mock("../../svrjs.json", () => ({ name: "test-server" }));

describe("Static file serving and directory listings middleware", () => {
  let req, res, logFacilities, config, next;

  beforeEach(() => {
    req = {
      parsedURL: { pathname: "/test.txt" },
      originalParsedURL: { pathname: "/test.txt" },
      headers: {},
      method: "GET",
      socket: { localAddress: "127.0.0.1" }
    };
    res = {
      error: jest.fn(),
      writeHead: jest.fn(),
      end: jest.fn(),
      head: "",
      foot: ""
    };
    logFacilities = {
      errmessage: jest.fn(),
      resmessage: jest.fn()
    };
    config = {
      wwwroot: "/wwwroot",
      enableDirectoryListing: true,
      enableDirectoryListingVHost: [],
      enableETag: true,
      enableCompression: true,
      dontCompress: [],
      generateServerString: jest.fn().mockReturnValue("test-server"),
      getCustomHeaders: jest.fn().mockReturnValue({ Server: "test-server" })
    };
    next = jest.fn();

    sha256.mockReturnValue("test-etag");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should serve a static file", () => {
    fs.open.mockImplementation((path, flags, callback) => {
      callback(null, 1);
    });
    fs.fstat.mockImplementation((fd, callback) => {
      callback(null, {
        isFile: () => true,
        isDirectory: () => false,
        size: 1024,
        mtime: new Date()
      });
    });
    // eslint-disable-next-line no-unused-vars
    fs.createReadStream.mockImplementation((path, options) => {
      return {
        pipe: jest.fn().mockImplementation((res) => {
          res.end("file content");
        }),
        on: jest.fn()
      };
    });

    middleware(req, res, logFacilities, config, next);

    expect(res.error).not.toHaveBeenCalled();
    expect(res.writeHead).toHaveBeenCalledWith(
      200,
      statusCodes[200],
      expect.any(Object)
    );
    expect(res.end).toHaveBeenCalledWith("file content");
  });

  test("should handle directory listing", () => {
    fs.open.mockImplementation((path, flags, callback) => {
      callback(null, 1);
    });
    fs.fstat.mockImplementation((fd, callback) => {
      callback(null, { isDirectory: () => true, isFile: () => false });
    });
    fs.readdir.mockImplementation((path, callback) => {
      callback(null, ["file1.txt", "file2.txt"]);
    });
    fs.readFile.mockImplementation((path, callback) => {
      const err = new Error();
      err.code = "ENOENT";
      err.errno = 2; // ENOENT
      callback(err, null);
    });
    fs.stat.mockImplementation((path, callback) => {
      callback(null, {
        isFile: () => true,
        isDirectory: () => false,
        size: 1024,
        mtime: new Date()
      });
    });
    fs.close.mockImplementation((fd, callback) => {
      callback(null);
    });

    middleware(req, res, logFacilities, config, next);

    expect(res.error).not.toHaveBeenCalled();
    expect(res.writeHead).toHaveBeenCalledWith(200, statusCodes[200], {
      "Content-Type": "text/html"
    });
    expect(res.end).toHaveBeenCalled();
  });

  test("should handle 404 error", () => {
    fs.open.mockImplementation((path, flags, callback) => {
      callback({ code: "ENOENT" });
    });

    middleware(req, res, logFacilities, config, next);

    expect(res.error).toHaveBeenCalledWith(404);
    expect(logFacilities.errmessage).toHaveBeenCalledWith(
      "Resource not found."
    );
  });

  test("should handle 403 error", () => {
    fs.open.mockImplementation((path, flags, callback) => {
      callback({ code: "EACCES" });
    });

    middleware(req, res, logFacilities, config, next);

    expect(res.error).toHaveBeenCalledWith(403);
    expect(logFacilities.errmessage).toHaveBeenCalledWith("Access denied.");
  });

  test("should handle partial content request", () => {
    req.headers["range"] = "bytes=0-499";
    fs.open.mockImplementation((path, flags, callback) => {
      callback(null, 1);
    });
    fs.fstat.mockImplementation((fd, callback) => {
      callback(null, {
        isFile: () => true,
        isDirectory: () => false,
        size: 1024,
        mtime: new Date()
      });
    });
    // eslint-disable-next-line no-unused-vars
    fs.createReadStream.mockImplementation((path, options) => {
      return {
        pipe: jest.fn().mockImplementation((res) => {
          res.end("partial content");
        }),
        on: jest.fn()
      };
    });

    middleware(req, res, logFacilities, config, next);

    expect(res.error).not.toHaveBeenCalled();
    expect(res.writeHead).toHaveBeenCalledWith(
      206,
      statusCodes[206],
      expect.any(Object)
    );
    expect(res.end).toHaveBeenCalledWith("partial content");
  });

  test("should handle ETag validation", () => {
    req.headers["if-none-match"] = "test-etag";
    fs.open.mockImplementation((path, flags, callback) => {
      callback(null, 1);
    });
    fs.fstat.mockImplementation((fd, callback) => {
      callback(null, {
        isFile: () => true,
        isDirectory: () => false,
        size: 1024,
        mtime: new Date()
      });
    });
    sha256.mockReturnValue("test-etag");

    middleware(req, res, logFacilities, config, next);

    expect(res.error).not.toHaveBeenCalled();
    expect(res.writeHead).toHaveBeenCalledWith(
      304,
      statusCodes[304],
      expect.any(Object)
    );
    expect(res.end).toHaveBeenCalled();
  });

  test("should handle compression", () => {
    req.headers["accept-encoding"] = "gzip";
    let pipedRes = null;
    fs.open.mockImplementation((path, flags, callback) => {
      callback(null, 1);
    });
    fs.fstat.mockImplementation((fd, callback) => {
      callback(null, {
        isFile: () => true,
        isDirectory: () => false,
        size: 1024,
        mtime: new Date()
      });
    });
    // eslint-disable-next-line no-unused-vars
    fs.createReadStream.mockImplementation((path, options) => {
      return {
        pipe: jest.fn().mockImplementation((res) => {
          res.end("compressed content");
        }),
        on: jest.fn()
      };
    });
    zlib.createGzip.mockReturnValue({
      pipe: jest.fn().mockImplementation((res) => {
        pipedRes = res;
      }),
      end: jest.fn().mockImplementation((data) => {
        pipedRes.end(data);
      })
    });

    middleware(req, res, logFacilities, config, next);

    expect(res.error).not.toHaveBeenCalled();
    expect(res.writeHead).toHaveBeenCalledWith(
      200,
      statusCodes[200],
      expect.any(Object)
    );
    expect(res.end).toHaveBeenCalledWith("compressed content");
  });

  test("should handle 416 error for invalid range", () => {
    req.headers["range"] = "bytes=500-499";
    fs.open.mockImplementation((path, flags, callback) => {
      callback(null, 1);
    });
    fs.fstat.mockImplementation((fd, callback) => {
      callback(null, {
        isFile: () => true,
        isDirectory: () => false,
        size: 1024,
        mtime: new Date()
      });
    });

    middleware(req, res, logFacilities, config, next);

    expect(res.error).toHaveBeenCalledWith(416, expect.any(Object));
  });

  test("should handle 500 error for unexpected issues", () => {
    fs.open.mockImplementation((path, flags, callback) => {
      callback(new Error("Unexpected error"));
    });

    middleware(req, res, logFacilities, config, next);

    expect(res.error).toHaveBeenCalledWith(500, expect.any(Error));
  });
});
