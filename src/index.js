const http = require("http");
const fs = require("fs");
const cluster = require("./utils/clusterBunShim.js"); // Cluster module with shim for Bun
//const generateErrorStack = require("./utils/generateErrorStack.js");
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
if (configJSON.users === undefined) configJSON.users = [];
if (configJSON.secure) {
  if (configJSON.key === undefined) configJSON.key = "cert/key.key";
  if (configJSON.cert === undefined) configJSON.cert = "cert/cert.crt";
  if (configJSON.sport === undefined) configJSON.sport = 443;
  if (configJSON.spubport === undefined) configJSON.spubport = 443;
  if (configJSON.sni === undefined) configJSON.sni = {};
  if (configJSON.enableOCSPStapling === undefined) configJSON.enableOCSPStapling = false;
}
if (configJSON.port === undefined) configJSON.port = 80;
if (configJSON.pubport === undefined) configJSON.pubport = 80;
if (configJSON.domain === undefined && configJSON.domian !== undefined) configJSON.domain = configJSON.domian;
delete configJSON.domian;
if (configJSON.page404 === undefined) configJSON.page404 = "404.html";
//configJSON.timestamp = timestamp; //TODO
//configJSON.blacklist = blocklist.raw; //TODO
if (configJSON.nonStandardCodes === undefined) configJSON.nonStandardCodes = [];
if (configJSON.enableCompression === undefined) configJSON.enableCompression = true;
if (configJSON.customHeaders === undefined) configJSON.customHeaders = {};
if (configJSON.enableHTTP2 === undefined) configJSON.enableHTTP2 = false;
if (configJSON.enableLogging === undefined) configJSON.enableLogging = true;
if (configJSON.enableDirectoryListing === undefined) configJSON.enableDirectoryListing = true;
if (configJSON.enableDirectoryListingWithDefaultHead === undefined) configJSON.enableDirectoryListingWithDefaultHead = false;
if (configJSON.serverAdministratorEmail === undefined) configJSON.serverAdministratorEmail = "[no contact information]";
if (configJSON.stackHidden === undefined) configJSON.stackHidden = false;
if (configJSON.enableRemoteLogBrowsing === undefined) configJSON.enableRemoteLogBrowsing = false;
if (configJSON.exposeServerVersion === undefined) configJSON.exposeServerVersion = true;
if (configJSON.disableServerSideScriptExpose === undefined) configJSON.disableServerSideScriptExpose = true;
if (configJSON.allowStatus === undefined) configJSON.allowStatus = true;
if (configJSON.rewriteMap === undefined) configJSON.rewriteMap = [];
if (configJSON.dontCompress === undefined) configJSON.dontCompress = ["/.*\\.ipxe$/", "/.*\\.(?:jpe?g|png|bmp|tiff|jfif|gif|webp)$/", "/.*\\.(?:[id]mg|iso|flp)$/", "/.*\\.(?:zip|rar|bz2|[gb7x]z|lzma|tar)$/", "/.*\\.(?:mp[34]|mov|wm[av]|avi|webm|og[gv]|mk[va])$/"];
if (configJSON.enableIPSpoofing === undefined) configJSON.enableIPSpoofing = false;
if (configJSON.secure === undefined) configJSON.secure = false;
if (configJSON.disableNonEncryptedServer === undefined) configJSON.disableNonEncryptedServer = false;
if (configJSON.disableToHTTPSRedirect === undefined) configJSON.disableToHTTPSRedirect = false;
if (configJSON.enableETag === undefined) configJSON.enableETag = true;
if (configJSON.disableUnusedWorkerTermination === undefined) configJSON.disableUnusedWorkerTermination = false;
if (configJSON.rewriteDirtyURLs === undefined) configJSON.rewriteDirtyURLs = false;
if (configJSON.errorPages === undefined) configJSON.errorPages = [];
if (configJSON.useWebRootServerSideScript === undefined) configJSON.useWebRootServerSideScript = true;
if (configJSON.exposeModsInErrorPages === undefined) configJSON.exposeModsInErrorPages = true;
if (configJSON.disableTrailingSlashRedirects === undefined) configJSON.disableTrailingSlashRedirects = false;
if (configJSON.environmentVariables === undefined) configJSON.environmentVariables = {};
if (configJSON.allowDoubleSlashes === undefined) configJSON.allowDoubleSlashes = false;
if (configJSON.optOutOfStatisticsServer === undefined) configJSON.optOutOfStatisticsServer = false;

configJSON.version = version; // Compatiblity for very old SVR.JS mods

var wwwrootError = null;
try {
  if (cluster.isPrimary || cluster.isPrimary === undefined) process.chdir(configJSON.wwwroot != undefined ? configJSON.wwwroot : __dirname);
} catch (err) {
  wwwrootError = err;
}

const serverconsole = serverconsoleConstructor(configJSON.enableLogging);

let middleware = [
  require("./middleware/core.js"),
  require("./middleware/urlSanitizer.js")
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
        if (res.error) res.error(500, err);
        else {
          logFacilities.errmessage("There was an error while processing the request!");
                logFacilities.errmessage("Stack:");
                logFacilities.errmessage(err.stack);
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

if(wwwrootError) throw wwwrootError;