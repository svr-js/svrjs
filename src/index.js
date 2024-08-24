const http = require("http");
const fs = require("fs");
//const generateErrorStack = require("./utils/generateErrorStack.js");
//const getOS = require("./utils/getOS.js");
const generateServerString = require("./utils/generateServerString.js")
const svrjsInfo = require("../svrjs.json");
const {version} = svrjsInfo;
//const parseURL = require("./utils/urlParser.js");
//const fixNodeMojibakeURL = require("./utils/urlMojibakeFixer.js");

let inspector = undefined;
try {
  inspector = require("inspector");
} catch (err) {
  // Don't use inspector
}

// Create log, mods and temp directories, if they don't exist.
if (!fs.existsSync(__dirname + "/log")) fs.mkdirSync(__dirname + "/log");
if (!fs.existsSync(__dirname + "/mods")) fs.mkdirSync(__dirname + "/mods");
if (!fs.existsSync(__dirname + "/temp")) fs.mkdirSync(__dirname + "/temp");

// TODO: process.singleThreaded flag
process.singleThreaded = true;
const cluster = require("./utils/clusterBunShim.js"); // Cluster module with shim for Bun

process.serverConfig = {};

// TODO: configuration from config.json
if (process.serverConfig.users === undefined) process.serverConfig.users = [];
if (process.serverConfig.secure) {
  if (process.serverConfig.key === undefined) process.serverConfig.key = "cert/key.key";
  if (process.serverConfig.cert === undefined) process.serverConfig.cert = "cert/cert.crt";
  if (process.serverConfig.sport === undefined) process.serverConfig.sport = 443;
  if (process.serverConfig.spubport === undefined) process.serverConfig.spubport = 443;
  if (process.serverConfig.sni === undefined) process.serverConfig.sni = {};
  if (process.serverConfig.enableOCSPStapling === undefined) process.serverConfig.enableOCSPStapling = false;
}
if (process.serverConfig.port === undefined) process.serverConfig.port = 80;
if (process.serverConfig.pubport === undefined) process.serverConfig.pubport = 80;
if (process.serverConfig.domain === undefined && process.serverConfig.domian !== undefined) process.serverConfig.domain = process.serverConfig.domian;
delete process.serverConfig.domian;
if (process.serverConfig.page404 === undefined) process.serverConfig.page404 = "404.html";
//process.serverConfig.timestamp = timestamp; //TODO
//process.serverConfig.blacklist = blocklist.raw; //TODO
if (process.serverConfig.nonStandardCodes === undefined) process.serverConfig.nonStandardCodes = [];
if (process.serverConfig.enableCompression === undefined) process.serverConfig.enableCompression = true;
if (process.serverConfig.customHeaders === undefined) process.serverConfig.customHeaders = {};
if (process.serverConfig.enableHTTP2 === undefined) process.serverConfig.enableHTTP2 = false;
if (process.serverConfig.enableLogging === undefined) process.serverConfig.enableLogging = true;
if (process.serverConfig.enableDirectoryListing === undefined) process.serverConfig.enableDirectoryListing = true;
if (process.serverConfig.enableDirectoryListingWithDefaultHead === undefined) process.serverConfig.enableDirectoryListingWithDefaultHead = false;
if (process.serverConfig.serverAdministratorEmail === undefined) process.serverConfig.serverAdministratorEmail = "[no contact information]";
if (process.serverConfig.stackHidden === undefined) process.serverConfig.stackHidden = false;
if (process.serverConfig.enableRemoteLogBrowsing === undefined) process.serverConfig.enableRemoteLogBrowsing = false;
if (process.serverConfig.exposeServerVersion === undefined) process.serverConfig.exposeServerVersion = true;
if (process.serverConfig.disableServerSideScriptExpose === undefined) process.serverConfig.disableServerSideScriptExpose = true;
if (process.serverConfig.allowStatus === undefined) process.serverConfig.allowStatus = true;
if (process.serverConfig.rewriteMap === undefined) process.serverConfig.rewriteMap = [];
if (process.serverConfig.dontCompress === undefined) process.serverConfig.dontCompress = ["/.*\\.ipxe$/", "/.*\\.(?:jpe?g|png|bmp|tiff|jfif|gif|webp)$/", "/.*\\.(?:[id]mg|iso|flp)$/", "/.*\\.(?:zip|rar|bz2|[gb7x]z|lzma|tar)$/", "/.*\\.(?:mp[34]|mov|wm[av]|avi|webm|og[gv]|mk[va])$/"];
if (process.serverConfig.enableIPSpoofing === undefined) process.serverConfig.enableIPSpoofing = false;
if (process.serverConfig.secure === undefined) process.serverConfig.secure = false;
if (process.serverConfig.disableNonEncryptedServer === undefined) process.serverConfig.disableNonEncryptedServer = false;
if (process.serverConfig.disableToHTTPSRedirect === undefined) process.serverConfig.disableToHTTPSRedirect = false;
if (process.serverConfig.enableETag === undefined) process.serverConfig.enableETag = true;
if (process.serverConfig.disableUnusedWorkerTermination === undefined) process.serverConfig.disableUnusedWorkerTermination = false;
if (process.serverConfig.rewriteDirtyURLs === undefined) process.serverConfig.rewriteDirtyURLs = false;
if (process.serverConfig.errorPages === undefined) process.serverConfig.errorPages = [];
if (process.serverConfig.useWebRootServerSideScript === undefined) process.serverConfig.useWebRootServerSideScript = true;
if (process.serverConfig.exposeModsInErrorPages === undefined) process.serverConfig.exposeModsInErrorPages = true;
if (process.serverConfig.disableTrailingSlashRedirects === undefined) process.serverConfig.disableTrailingSlashRedirects = false;
if (process.serverConfig.environmentVariables === undefined) process.serverConfig.environmentVariables = {};
if (process.serverConfig.wwwrootPostfixesVHost === undefined) process.serverConfig.wwwrootPostfixesVHost = [];
if (process.serverConfig.wwwrootPostfixPrefixesVHost === undefined) process.serverConfig.wwwrootPostfixPrefixesVHost = [];
if (process.serverConfig.allowDoubleSlashes === undefined) process.serverConfig.allowDoubleSlashes = false;
if (process.serverConfig.allowPostfixDoubleSlashes === undefined) process.serverConfig.allowPostfixDoubleSlashes = false;
if (process.serverConfig.optOutOfStatisticsServer === undefined) process.serverConfig.optOutOfStatisticsServer = false;

process.serverConfig.version = version; // Compatiblity for very old SVR.JS mods

const serverconsole = require("./utils/serverconsole.js");

let inspectorURL = undefined;
try {
  if (inspector) {
    inspectorURL = inspector.url();
  }
} catch (err) {
  // Failed to get inspector URL
}

if (!process.stdout.isTTY && !inspectorURL) {
  // When stdout is not a terminal and not attached to an Node.JS inspector, disable it to improve performance of SVR.JS
  console.log = function () {};
  process.stdout.write = function () {};
  process.stdout._write = function () {};
  process.stdout._writev = function () {};
}

var wwwrootError = null;
try {
  if (cluster.isPrimary || cluster.isPrimary === undefined) process.chdir(process.serverConfig.wwwroot != undefined ? process.serverConfig.wwwroot : __dirname);
} catch (err) {
  wwwrootError = err;
}

let middleware = [
  require("./middleware/core.js"),
  require("./middleware/urlSanitizer.js"),
  require("./middleware/redirects.js"),
  require("./middleware/webRootPostfixes.js"),
  require("./middleware/rewriteURL.js")
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
          logFacilities.errmessage("There was an error while processing the request!");
                logFacilities.errmessage("Stack:");
                logFacilities.errmessage(err.stack);
          res.writeHead(500, "Internal Server Error", {
            Server: generateServerString(config.exposeServerVersion)
          });
          res.end("Error while executing the request handler");
        }
      }
    } else {
      if (res.error) res.error(404);
      else {
        res.writeHead(404, "Not Found", {
          Server: generateServerString(config.exposeServerVersion)
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

if(wwwrootError) throw wwwrootError;