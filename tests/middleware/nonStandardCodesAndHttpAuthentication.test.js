const sha256 = require("../../src/utils/sha256.js");
const ipMatch = require("../../src/utils/ipMatch.js");
const matchHostname = require("../../src/utils/matchHostname.js");
const ipBlockList = require("../../src/utils/ipBlockList.js");
const cluster = require("../../src/utils/clusterShim.js");

jest.mock("../../src/utils/sha256.js");
jest.mock("../../src/utils/ipMatch.js");
jest.mock("../../src/utils/matchHostname.js");
jest.mock("../../src/utils/ipBlockList.js");
jest.mock("../../src/utils/clusterShim.js");

let mockScryptHash = "mocked-scrypt-hash";
let mockPbkdf2Hash = "mocked-pbkdf2-hash";

jest.mock("crypto", () => {
  return {
    scrypt: jest.fn((password, salt, keylen, callback) => {
      // Mock implementation for crypto.scrypt
      callback(null, Buffer.from(mockScryptHash));
    }),
    pbkdf2: jest.fn((password, salt, iterations, keylen, digest, callback) => {
      // Mock implementation for crypto.pbkdf2
      callback(null, Buffer.from(mockPbkdf2Hash));
    })
    // Add other properties or methods of crypto module if needed
  };
});

process.serverConfig = {
  nonStandardCodes: [
    {
      host: "example.com",
      ip: "192.168.1.1",
      url: "/test/path",
      scode: 403,
      users: ["127.0.0.1"]
    },
    {
      host: "example.com",
      ip: "192.168.1.1",
      url: "/test/path2",
      scode: 401
    }
  ],
  configVHost: [
    {
      host: "example.org",
      ip: "192.168.1.1",
      nonStandardCodes: [
        {
          url: "/test/path3",
          scode: 403,
          users: ["127.0.0.1"]
        }
      ]
    }
  ]
};

process.messageEventListeners = [];

process.send = undefined;

const middleware = require("../../src/middleware/nonStandardCodesAndHttpAuthentication.js");

describe("Non-standard codes and HTTP authentication middleware", () => {
  let req, res, logFacilities, config, next;

  beforeEach(() => {
    req = {
      socket: {
        realRemoteAddress: "127.0.0.1",
        localAddress: "192.168.1.1"
      },
      parsedURL: {
        pathname: "/test/path"
      },
      url: "/test/path",
      headers: {
        host: "example.com"
      },
      isProxy: false
    };
    res = {
      error: jest.fn(),
      redirect: jest.fn()
    };
    logFacilities = {
      errmessage: jest.fn(),
      reqmessage: jest.fn()
    };
    config = {
      getCustomHeaders: jest.fn(),
      users: []
    };
    next = jest.fn();
    process.serverConfig = {
      nonStandardCodes: []
    };

    cluster.isPrimary = true;
    config.getCustomHeaders.mockReturnValue({});
  });

  test("should handle non-standard codes", () => {
    ipBlockList.mockReturnValue({
      check: jest.fn().mockReturnValue(true)
    });
    matchHostname.mockReturnValue(true);
    ipMatch.mockReturnValue(true);

    middleware(req, res, logFacilities, config, next);

    expect(res.error).toHaveBeenCalledWith(403);
    expect(logFacilities.errmessage).toHaveBeenCalledWith("Content blocked.");
  });

  test("should handle non-standard codes per virtual host from configVHost property", () => {
    req.headers.host = "example.org";
    req.parsedURL.pathname = "/test/path3";
    req.url = "/test/path3";
    ipBlockList.mockReturnValue({
      check: jest.fn().mockReturnValue(true)
    });
    matchHostname.mockReturnValue(true);
    ipMatch.mockReturnValue(true);

    middleware(req, res, logFacilities, config, next);

    expect(res.error).toHaveBeenCalledWith(403);
    expect(logFacilities.errmessage).toHaveBeenCalledWith("Content blocked.");
  });

  test("should handle HTTP authentication", () => {
    req.parsedURL.pathname = "/test/path2";
    req.url = "/test/path2";
    matchHostname.mockReturnValue(true);
    ipMatch.mockReturnValue(true);
    config.users = [
      {
        name: "test",
        pass: "test",
        salt: "test"
      }
    ];
    sha256.mockReturnValue("test");
    req.headers.authorization = "Basic dGVzdDp0ZXN0";

    middleware(req, res, logFacilities, config, next);

    expect(next).toHaveBeenCalled();
    expect(logFacilities.reqmessage).toHaveBeenCalledWith(
      'Client is logged in as "test".'
    );
  });

  test("should handle brute force protection", () => {
    req.parsedURL.pathname = "/test/path2";
    req.url = "/test/path2";
    req.socket.realRemoteAddress = "127.0.0.2";
    matchHostname.mockReturnValue(true);
    ipMatch.mockReturnValue(true);
    config.users = [
      {
        name: "test",
        pass: "test2",
        salt: "test"
      }
    ];
    sha256.mockReturnValue("test");
    req.headers.authorization = "Basic dGVzdDp0ZXN0";

    // Maximum 10 login attempts by default
    for (let i = 0; i < 11; i++) {
      logFacilities.errmessage.mockClear();
      middleware(req, res, logFacilities, config, next);
    }

    expect(next).not.toHaveBeenCalled();
    expect(logFacilities.errmessage).toHaveBeenCalledWith(
      "Brute force limit reached!"
    );
  });

  test("should handle HTTP authentication with scrypt", () => {
    req.parsedURL.pathname = "/test/path2";
    req.url = "/test/path2";
    matchHostname.mockReturnValue(true);
    ipMatch.mockReturnValue(true);
    config.users = [
      {
        name: "test",
        pass: "74657374", // "test" converted to hex
        salt: "test",
        scrypt: true
      }
    ];
    mockScryptHash = "test";
    req.headers.authorization = "Basic dGVzdDp0ZXN0";

    middleware(req, res, logFacilities, config, next);

    expect(next).toHaveBeenCalled();
    expect(logFacilities.reqmessage).toHaveBeenCalledWith(
      'Client is logged in as "test".'
    );
  });

  test("should handle HTTP authentication with PBKDF2", () => {
    req.parsedURL.pathname = "/test/path2";
    req.url = "/test/path2";
    matchHostname.mockReturnValue(true);
    ipMatch.mockReturnValue(true);
    config.users = [
      {
        name: "test",
        pass: "74657374", // "test" converted to hex
        salt: "test",
        pbkdf2: true
      }
    ];
    mockPbkdf2Hash = "test";
    req.headers.authorization = "Basic dGVzdDp0ZXN0";

    middleware(req, res, logFacilities, config, next);

    expect(next).toHaveBeenCalled();
    expect(logFacilities.reqmessage).toHaveBeenCalledWith(
      'Client is logged in as "test".'
    );
  });

  test("should call next if no non-standard codes or HTTP authentication is needed", () => {
    req.parsedURL.pathname = "/test/path4";
    req.url = "/test/path4";

    middleware(req, res, logFacilities, config, next);

    expect(next).toHaveBeenCalled();
  });

  test("should handle HTTP authentication with clustering", () => {
    cluster.isPrimary = false;
    req.parsedURL.pathname = "/test/path2";
    req.url = "/test/path2";
    matchHostname.mockReturnValue(true);
    ipMatch.mockReturnValue(true);
    config.users = [
      {
        name: "test",
        pass: "test",
        salt: "test"
      }
    ];
    sha256.mockReturnValue("test");
    req.headers.authorization = "Basic dGVzdDp0ZXN0";
    let mockHandlers = [];
    process.on = (eventType, eventListener) => {
      if (eventType == "message") {
        mockHandlers.push(eventListener);
      }
    };
    process.once = (eventType, eventListener) => {
      const wrap = (...params) => {
        eventListener(...params);
        process.removeListener(eventType, wrap);
      };
      process.on(eventType, wrap);
    };
    process.addListener = process.on;
    process.removeListener = (eventType, eventListener) => {
      if (eventType == "message") {
        let indexOfListener = mockHandlers.indexOf(eventListener);
        if (indexOfListener != -1) mockHandlers.splice(indexOfListener, 1);
      }
    };
    process.removeAllListeners = (eventType) => {
      if (eventType == "message") {
        mockHandlers = [];
      }
    };
    process.send = (message) => {
      const mockWorker = {
        send: (msg) => {
          mockHandlers.forEach((handler) => handler(msg));
        }
      };
      const mockServerConsole = {
        climessage: () => {},
        reqmessage: () => {},
        resmessage: () => {},
        errmessage: () => {},
        locerrmessage: () => {},
        locwarnmessage: () => {},
        locmessage: () => {}
      };
      process.messageEventListeners.forEach((listenerWrapper) =>
        listenerWrapper(mockWorker, mockServerConsole)(message)
      );
    };

    middleware(req, res, logFacilities, config, next);

    expect(next).toHaveBeenCalled();
    expect(logFacilities.reqmessage).toHaveBeenCalledWith(
      'Client is logged in as "test".'
    );
  });
});
