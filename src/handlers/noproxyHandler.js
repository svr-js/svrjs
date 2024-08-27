// eslint-disable-next-line no-unused-vars
const svrjsInfo = require("../../svrjs.json");

let serverconsole = {};

// eslint-disable-next-line no-unused-vars
function noproxyHandler(req, socket, head) {
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
  const config = Object.assign({}, process.serverConfig);

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
    logFacilities.reqmessage(`Client uses ${req.headers["user-agent"]}`);

  logFacilities.errmessage("This server will never be a proxy.");
  if (!socket.destroyed) socket.end("HTTP/1.1 501 Not Implemented\n\n");
}

module.exports = (serverconsoleO) => {
  serverconsole = serverconsoleO;
  return noproxyHandler;
};
