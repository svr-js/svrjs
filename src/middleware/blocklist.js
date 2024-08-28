const cluster = require("../utils/clusterBunShim.js");
const ipBlockList = require("../utils/ipBlockList.js");
let blocklist = ipBlockList(process.serverConfig.blacklist);

module.exports = (req, res, logFacilities, config, next) => {
  if (
    blocklist.check(
      req.socket.realRemoteAddress
        ? req.socket.realRemoteAddress
        : req.socket.remoteAddress,
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
      if (!cluster.isPrimary === false) log("Cannot block non-existent IP.");
    } else {
      for (var i = 0; i < ip.length; i++) {
        if (ip[i] != "localhost" && ip[i].indexOf(":") == -1) {
          ip[i] = "::ffff:" + ip[i];
        }
        if (!blocklist.check(ip[i])) {
          blocklist.add(ip[i]);
        }
      }
      process.serverConfig.blacklist = blocklist.raw;
      if (!cluster.isPrimary === false) log("IPs successfully blocked.");
      passCommand(ip, log);
    }
  },
  unblock: (ip, log, passCommand) => {
    if (ip == undefined || JSON.stringify(ip) == "[]") {
      if (!cluster.isPrimary === false) log("Cannot unblock non-existent IP.");
    } else {
      for (var i = 0; i < ip.length; i++) {
        if (ip[i].indexOf(":") == -1) {
          ip[i] = "::ffff:" + ip[i];
        }
        blocklist.remove(ip[i]);
      }
      process.serverConfig.blacklist = blocklist.raw;
      if (!cluster.isPrimary === false) log("IPs successfully unblocked.");
      passCommand(ip, log);
    }
  },
};

module.exports.proxySafe = true;
