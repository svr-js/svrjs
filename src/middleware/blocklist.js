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
  block: (ip, logFacilities, passCommand) => {
    if (ip == undefined || JSON.stringify(ip) == "[]") {
      log("Cannot block non-existent IP.");
    } else {
      for (var i = 0; i < ip.length; i++) {
        if (ip[i] != "localhost" && ip[i].indexOf(":") == -1) {
          ip[i] = "::ffff:" + ip[i];
        }
        if (!blocklist.check(ip[i])) {
          blocklist.add(ip[i]);
        }
      }
      process.config.blacklist = blocklist.raw;
      log("IPs successfully blocked.");
      passCommand(args, logFacilities);
    }
  },
  unblock: (ip, logFacilities, passCommand) => {
    if (ip == undefined || JSON.stringify(ip) == "[]") {
      log("Cannot unblock non-existent IP.");
    } else {
      for (var i = 0; i < ip.length; i++) {
        if (ip[i].indexOf(":") == -1) {
          ip[i] = "::ffff:" + ip[i];
        }
        blocklist.remove(ip[i]);
      }
      process.config.blacklist = blocklist.raw;
      log("IPs successfully unblocked.");
      passCommand(args, logFacilities);
    }
  },
};
