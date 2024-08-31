const middleware = require("../../src/middleware/staticFileServingAndDirectoryListings.js");
const fs = require("fs");
const http = require("http");
const httpMocks = require("node-mocks-http");

jest.mock("fs");

describe("Static file serving and directory listings middleware", () => {
  let req, res, logFacilities, config, next;

  beforeEach(() => {
    req = httpMocks.createRequest({
      method: "GET",
      url: "/",
      headers: {
        host: "example.com",
        "accept-encoding": "gzip, deflate, br",
        "user-agent": "Mozilla/5.0",
      },
      socket: {
        localAddress: "127.0.0.1",
      },
    });
    req.parsedURL = {
      pathname: "/",
    };
    req.originalParsedURL = {
      pathname: "/",
    };
    res = httpMocks.createResponse({
      eventEmitter: require("events").EventEmitter,
    });
    res.error = (statusCode) => {
      // Very simple replacement of res.error
      res.writeHead(statusCode, { "Content-Type": "text/plain" });
      res.end(statusCode + " " + http.STATUS_CODES[statusCode]);
    };
    res.head = "";
    res.foot = "";
    logFacilities = {
      errmessage: jest.fn(),
      resmessage: jest.fn(),
    };
    config = {
      enableDirectoryListing: true,
      enableDirectoryListingVHost: [],
      enableCompression: true,
      dontCompress: [],
      generateServerString: jest.fn().mockReturnValue("Server"),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should return 404 if file does not exist", async () => {
    fs.stat.mockImplementation((path, cb) => {
      cb({ code: "ENOENT" });
    });

    await middleware(req, res, logFacilities, config, next);

    expect(res.statusCode).toBe(404);
    expect(logFacilities.errmessage).toHaveBeenCalledWith(
      "Resource not found.",
    );
  });

  test("should return 403 if directory listing is disabled", async () => {
    config.enableDirectoryListing = false;
    fs.stat.mockImplementation((path, cb) => {
      cb(null, { isDirectory: () => true, isFile: () => false });
    });

    await middleware(req, res, logFacilities, config, next);

    expect(res.statusCode).toBe(403);
    expect(logFacilities.errmessage).toHaveBeenCalledWith(
      "Directory listing is disabled.",
    );
  });

  test("should return 403 if access is denied", async () => {
    fs.stat.mockImplementation((path, cb) => {
      cb({ code: "EACCES" });
    });

    await middleware(req, res, logFacilities, config, next);

    expect(res.statusCode).toBe(403);
    expect(logFacilities.errmessage).toHaveBeenCalledWith("Access denied.");
  });

  test("should return 414 if the URI is too long", async () => {
    fs.stat.mockImplementation((path, cb) => {
      cb({ code: "ENAMETOOLONG" });
    });

    await middleware(req, res, logFacilities, config, next);

    expect(res.statusCode).toBe(414);
  });

  test("should return 503 if the server is unable to handle the request", async () => {
    fs.stat.mockImplementation((path, cb) => {
      cb({ code: "EMFILE" });
    });

    await middleware(req, res, logFacilities, config, next);

    expect(res.statusCode).toBe(503);
  });

  test("should return 508 if a loop is detected in symbolic links", async () => {
    fs.stat.mockImplementation((path, cb) => {
      cb({ code: "ELOOP" });
    });

    await middleware(req, res, logFacilities, config, next);

    expect(res.statusCode).toBe(508);
    expect(logFacilities.errmessage).toHaveBeenCalledWith(
      "Symbolic link loop detected.",
    );
  });

  test("should return 500 if an unknown error occurs", async () => {
    fs.stat.mockImplementation((path, cb) => {
      cb(new Error("Unknown error"));
    });

    await middleware(req, res, logFacilities, config, next);

    expect(res.statusCode).toBe(500);
  });

  test("should return 501 if the file is a block device, character device, FIFO, or socket", async () => {
    fs.stat.mockImplementation((path, cb) => {
      cb(null, {
        isDirectory: () => false,
        isFile: () => false,
        isBlockDevice: () => true,
      });
    });

    await middleware(req, res, logFacilities, config, next);

    expect(res.statusCode).toBe(501);
    expect(logFacilities.errmessage).toHaveBeenCalledWith(
      expect.stringContaining("doesn't support block devices"),
    );
  });

  test("should return a directory listing if the path is a directory and directory listing is enabled", async () => {
    fs.readdir.mockImplementation((path, cb) => {
      cb(null, ["file1.txt", "file2.txt"]);
    });
    fs.readFile.mockImplementation((path, cb) => {
      if (path.match(/(?:^|\/)file[12]\.txt$/)) {
        cb(null, Buffer.from("test"));
      } else {
        cb({ code: "ENOENT" });
      }
    });
    fs.stat.mockImplementation((path, cb) => {
      if (!path.match(/(?:^|\/)file[12]\.txt$/)) {
        cb(null, { isDirectory: () => true, isFile: () => false });
      } else {
        cb(null, {
          isDirectory: () => false,
          isFile: () => true,
          size: 1024,
          mtime: new Date(),
        });
      }
    });

    await middleware(req, res, logFacilities, config, next);

    expect(res.statusCode).toBe(200);
    expect(res._getData()).toContain("Directory: /");
    expect(res._getData()).toContain("file1.txt");
    expect(res._getData()).toContain("file2.txt");
  });

  test("should serve static file if the path is a file", async () => {
    req.headers["accept-encoding"] = undefined;
    req.path = "/file.txt";
    req.parsedURL.pathname = "/file.txt";
    req.originalParsedURL.pathname = "/file.txt";

    fs.stat.mockImplementation((path, cb) => {
      if (!path.match(/(?:^|\/)file\.txt$/)) {
        cb(null, { isDirectory: () => true, isFile: () => false });
      } else {
        cb(null, {
          isDirectory: () => false,
          isFile: () => true,
          size: 9,
        });
      }
    });

    let mockEndListener = () => {};
    let mockDataSent = false;
    const mockStream = {
      on: (event, listener) => {
        if (event == "open") {
          listener();
        } else if (event == "data") {
          if (!mockDataSent) {
            listener(Buffer.from("mock data"));
            mockDataSent = true;
          }
          mockEndListener();
        } else if (event == "end") {
          mockEndListener = listener;
          if (mockDataSent) mockEndListener();
        }
        return mockStream;
      },
      once: (event, listener) => {
        mockStream.on(event, listener);
      },
      pipe: (destStream) => {
        if (!mockDataSent) {
          destStream.end("mock data");
        }
        return destStream;
      },
    };

    fs.createReadStream.mockImplementation(() => {
      return mockStream;
    });

    await middleware(req, res, logFacilities, config, next);

    expect(res.statusCode).toBe(200);
    expect(res._getData()).toBe("mock data");
  });
});
