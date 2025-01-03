const cluster = require("../utils/clusterShim.js");
const ipBlockList = require("../utils/ipBlockList.js");
let blocklist = ipBlockList(process.serverConfig.blacklist);

module.exports = (req, res, logFacilities, config, next) => {
  if (
    blocklist.check(
      req.socket.realRemoteAddress
        ? req.socket.realRemoteAddress
        : req.socket.remoteAddress
    )
  ) {
    // Invoke 403 Forbidden error
    res.error(403);
    logFacilities.errmessage("Client is in the block list.");
    return;
  }
  next();
};

module.exports.commands = {
  block: (ip, log, passCommand) => {
    if (ip == undefined || JSON.stringify(ip) == "[]") {
      if (!cluster.isPrimary === false) log("Cannot block nonexistent IP.");
    } else {
      ip.forEach((ipAddress) => {
        if (ipAddress !== "localhost" && ipAddress.indexOf(":") == -1) {
          ipAddress = "::ffff:" + ipAddress;
        }
        if (!blocklist.check(ipAddress)) {
          blocklist.add(ipAddress);
        }
      });
      process.serverConfig.blacklist = blocklist.raw;
      if (!cluster.isPrimary === false) log("IPs successfully blocked.");
      passCommand(ip, log);
    }
  },
  unblock: (ip, log, passCommand) => {
    if (ip == undefined || JSON.stringify(ip) == "[]") {
      if (!cluster.isPrimary === false) log("Cannot unblock nonexistent IP.");
    } else {
      ip.forEach((ipAddress) => {
        if (ipAddress !== "localhost" && ipAddress.indexOf(":") == -1) {
          ipAddress = "::ffff:" + ipAddress;
        }
        blocklist.remove(ipAddress);
      });
      process.serverConfig.blacklist = blocklist.raw;
      if (!cluster.isPrimary === false) log("IPs successfully unblocked.");
      passCommand(ip, log);
    }
  }
};

module.exports.proxySafe = true;
