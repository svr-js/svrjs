const generateServerString = require("../utils/generateServerString");
const svrjsInfo = require("../../svrjs.json");
const { name } = svrjsInfo;

let serverconsole = {};
let middleware = [];

function proxyHandler(req, socket, head) {
  let reqIdInt = Math.floor(Math.random() * 16777216);
  if (reqIdInt == 16777216) reqIdInt = 0;
  const reqId =
    "0".repeat(6 - reqIdInt.toString(16).length) + reqIdInt.toString(16);

  // SVR.JS log facilities
  const logFacilities = {
    climessage: (msg) => serverconsole.climessage(msg, reqId),
    reqmessage: (msg) => serverconsole.reqmessage(msg, reqId),
    resmessage: (msg) => serverconsole.resmessage(msg, reqId),
    errmessage: (msg) => serverconsole.errmessage(msg, reqId),
    locerrmessage: (msg) => serverconsole.locerrmessage(msg, reqId),
    locwarnmessage: (msg) => serverconsole.locwarnmessage(msg, reqId),
    locmessage: (msg) => serverconsole.locmessage(msg, reqId),
  };

  socket.on("close", (hasError) => {
    if (!hasError) serverconsole.locmessage("Client disconnected.");
    else serverconsole.locmessage("Client disconnected due to error.");
  });
  socket.on("error", () => {});

  // SVR.JS configuration object (modified)
  const config = Object.assign(process.serverConfig);

  config.generateServerString = () => {
    return generateServerString(config.exposeServerVersion);
  };

  var reqip = socket.remoteAddress;
  var reqport = socket.remotePort;
  process.reqcounter++;
  logFacilities.locmessage(
    `Somebody connected to ${
      config.secure
        ? (typeof config.sport == "number" ? "port " : "socket ") + config.sport
        : (typeof config.port == "number" ? "port " : "socket ") + config.port
    }...`,
  );
  logFacilities.reqmessage(
    `Client ${
      !reqip || reqip == ""
        ? "[unknown client]"
        : reqip +
          (reqport && reqport !== 0 && reqport != "" ? ":" + reqport : "")
    } wants to proxy ${req.url} through this server`,
  );
  if (req.headers["user-agent"] != undefined)
    logFacilities.reqmessage("Client uses " + req.headers["user-agent"]);

  let index = 0;

  // Call the next middleware function
  const next = () => {
    let currentMiddleware = middleware[index++];
    while (currentMiddleware && !currentMiddleware.proxy) {
      currentMiddleware = middleware[index++];
    }
    if (currentMiddleware) {
      try {
        currentMiddleware.proxy(req, socket, head, logFacilities, config, next);
      } catch (err) {
        logFacilities.errmessage(
          "There was an error while processing the request!",
        );
        logFacilities.errmessage("Stack:");
        logFacilities.errmessage(err.stack);
        if (!socket.destroyed)
          socket.end("HTTP/1.1 500 Internal Server Error\n\n");
      }
    } else {
      logFacilities.errmessage(
        `${name} doesn't support proxy without proxy mod.`,
      );
      if (!socket.destroyed) socket.end("HTTP/1.1 501 Not Implemented\n\n");
    }
  };

  // Handle middleware
  next();
}

module.exports = (serverconsoleO, middlewareO) => {
  serverconsole = serverconsoleO;
  middleware = middlewareO;
  return proxyHandler;
};
