const http = require("http");
const fs = require("fs");
const cluster = require("./utils/clusterBunShim.js"); // Cluster module with shim for Bun
const sanitizeURL = require("./utils/urlSanitizer.js");
//const generateErrorStack = require("./utils/generateErrorStack.js");
//const serverHTTPErrorDescs = require("./res/httpErrorDescriptions.js");
const getOS = require("./utils/getOS.js");
const svrjsInfo = require("../svrjs.json");
const version = svrjsInfo.version;
//const parseURL = require("./utils/urlParser.js");
//const fixNodeMojibakeURL = require("./utils/urlMojibakeFixer.js");

// Create log, mods and temp directories, if they don't exist.
if (!fs.existsSync(__dirname + "/log")) fs.mkdirSync(__dirname + "/log");
if (!fs.existsSync(__dirname + "/mods")) fs.mkdirSync(__dirname + "/mods");
if (!fs.existsSync(__dirname + "/temp")) fs.mkdirSync(__dirname + "/temp");

const serverconsoleConstructor = require("./utils/serverconsole.js");

let configJSON = {};

// TODO: configuration from config.json
if (!configJSON.page404) configJSON.page404 = "404.html"
if (!configJSON.errorPages) configJSON.errorPages = [];
if (!configJSON.stackHidden) configJSON.stackHidden = true;
if (!configJSON.exposeServerVersion) configJSON.exposeServerVersion = false;
if (!configJSON.exposeModsInErrorPages) configJSON.exposeModsInErrorPages = false;
if (!configJSON.enableLogging) configJSON.enableLogging = true;
if (!configJSON.serverAdministratorEmail) configJSON.serverAdministratorEmail = "webmaster@svrjs.org";

const serverconsole = serverconsoleConstructor(configJSON.enableLogging);

let middleware = [
  require("./middleware/core.js")
];

function addMiddleware(mw) {
  middleware.push(mw);
}

function requestHandler(req, res) {
  let reqIdInt = Math.floor(Math.random() * 16777216);
  if (reqIdInt == 16777216) reqIdInt = 0;
  const reqId = "0".repeat(6 - reqIdInt.toString(16).length) + reqIdInt.toString(16);

  // SVR.JS log facilities
  const logFacilities = {
    climessage: (msg) => serverconsole.climessage(msg, reqId),
    reqmessage: (msg) => serverconsole.reqmessage(msg, reqId),
    resmessage: (msg) => serverconsole.resmessage(msg, reqId),
    errmessage: (msg) => serverconsole.errmessage(msg, reqId),
    locerrmessage: (msg) => serverconsole.locerrmessage(msg, reqId),
    locwarnmessage: (msg) => serverconsole.locwarnmessage(msg, reqId),
    locmessage: (msg) => serverconsole.locmessage(msg, reqId)
  };

  // SVR.JS configuration object (modified)
  const config = Object.assign(configJSON);

  let index = 0;

  // Call the next middleware function
  const next = () => {
    const currentMiddleware = middleware[index++];
    if (currentMiddleware) {
      try {
        currentMiddleware(req, res, logFacilities, config, next);
      } catch (err) {
        if (res.error) res.error(500);
        else {
          res.writeHead(500, "Internal Server Error", {
            Server: (config.exposeServerVersion ? "SVR.JS/" + version + " (" + getOS() + "; " + (process.isBun ? ("Bun/v" + process.versions.bun + "; like Node.JS/" + process.version) : ("Node.JS/" + process.version)) + ")" : "SVR.JS")
          });
          res.end("Error while executing the request handler");
        }
      }
    } else {
      if (res.error) res.error(404);
      else {
        res.writeHead(404, "Not Found", {
          Server: (config.exposeServerVersion ? "SVR.JS/" + version + " (" + getOS() + "; " + (process.isBun ? ("Bun/v" + process.versions.bun + "; like Node.JS/" + process.version) : ("Node.JS/" + process.version)) + ")" : "SVR.JS")
        });
        res.end("Request handler missing");
      }
    }
  }

  // Handle middleware
  next();
}

// Create HTTP server
http.createServer(requestHandler).listen(3000);
