const generateServerString = require("../utils/generateServerString.js");
let serverconsole = {};
let middleware = [];

function requestHandler(req, res) {
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

  // SVR.JS configuration object (modified)
  const config = Object.assign(process.serverConfig);

  let index = 0;

  // Call the next middleware function
  const next = () => {
    const currentMiddleware = middleware[index++];
    if (currentMiddleware) {
      try {
        currentMiddleware(req, res, logFacilities, config, next);
      } catch (err) {
        if (res.error) res.error(500, err);
        else {
          logFacilities.errmessage(
            "There was an error while processing the request!",
          );
          logFacilities.errmessage("Stack:");
          logFacilities.errmessage(err.stack);
          res.writeHead(500, "Internal Server Error", {
            Server: generateServerString(config.exposeServerVersion),
          });
          res.end("Error while executing the request handler");
        }
      }
    } else {
      if (res.error) res.error(404);
      else {
        res.writeHead(404, "Not Found", {
          Server: generateServerString(config.exposeServerVersion),
        });
        res.end("Request handler missing");
      }
    }
  };

  // Handle middleware
  next();
}

module.exports = (serverconsoleO, middlewareO) => {
  serverconsole = serverconsoleO;
  middleware = middlewareO;
  return requestHandler;
};
