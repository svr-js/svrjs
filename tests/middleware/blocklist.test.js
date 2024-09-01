const middleware = require("../../src/utils/ipBlockList.js");
const cluster = require("../../src/utils/clusterBunShim.js");

jest.mock("../../src/utils/ipBlockList.js");
jest.mock("../../src/utils/clusterBunShim.js");

const ipBlockListAdd = jest.fn();
const ipBlockListCheck = jest.fn();
const ipBlockListRemove = jest.fn();

middleware.mockImplementation(() => {
  return {
    check: ipBlockListCheck,
    add: ipBlockListAdd,
    remove: ipBlockListRemove,
    raw: []
  };
});

process.serverConfig = {
  blacklist: []
};

const blocklistMiddleware = require("../../src/middleware/blocklist.js");

describe("Blocklist middleware", () => {
  let req, res, logFacilities, config, next;

  beforeEach(() => {
    req = {
      socket: {
        realRemoteAddress: "127.0.0.1",
        remoteAddress: "127.0.0.1"
      }
    };
    res = {
      error: jest.fn()
    };
    logFacilities = {
      errmessage: jest.fn()
    };
    config = {};
    next = jest.fn();

    cluster.isPrimary = true;
  });

  test("should call next if the IP is not in the blocklist", () => {
    middleware().check.mockReturnValue(false);

    blocklistMiddleware(req, res, logFacilities, config, next);

    expect(next).toHaveBeenCalled();
    expect(res.error).not.toHaveBeenCalled();
    expect(logFacilities.errmessage).not.toHaveBeenCalled();
  });

  test("should call res.error if the IP is in the blocklist", () => {
    middleware().check.mockReturnValue(true);

    blocklistMiddleware(req, res, logFacilities, config, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.error).toHaveBeenCalledWith(403);
    expect(logFacilities.errmessage).toHaveBeenCalledWith(
      "Client is in the block list."
    );
  });

  test("should block an IP", () => {
    middleware().check.mockReturnValue(false);

    const ip = ["192.168.1.1"];
    const log = jest.fn();
    const passCommand = jest.fn();

    blocklistMiddleware.commands.block(ip, log, passCommand);

    expect(ipBlockListAdd).toHaveBeenCalledWith("::ffff:192.168.1.1");
    expect(process.serverConfig.blacklist).toEqual(middleware().raw);
    expect(log).toHaveBeenCalledWith("IPs successfully blocked.");
    expect(passCommand).toHaveBeenCalledWith(ip, log);
  });

  test("should unblock an IP", () => {
    const ip = ["192.168.1.1"];
    const log = jest.fn();
    const passCommand = jest.fn();

    blocklistMiddleware.commands.unblock(ip, log, passCommand);

    expect(ipBlockListRemove).toHaveBeenCalledWith("::ffff:192.168.1.1");
    expect(process.serverConfig.blacklist).toEqual(middleware().raw);
    expect(log).toHaveBeenCalledWith("IPs successfully unblocked.");
    expect(passCommand).toHaveBeenCalledWith(ip, log);
  });
});
