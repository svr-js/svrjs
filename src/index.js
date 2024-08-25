const http = require("http");
const fs = require("fs");
const generateServerString = require("./utils/generateServerString.js");
const deleteFolderRecursive = require("./utils/deleteFolderRecursive.js");
const svrjsInfo = require("../svrjs.json");
const { version } = svrjsInfo;

let inspector = undefined;
try {
  inspector = require("inspector");
} catch (err) {
  // Don't use inspector
}

process.dirname = __dirname;
process.filename = __filename;

// TODO: after implementing clustering in new SVR.JS
//process.singleThreaded = false;
process.singleThreaded = true;

process.err4xxcounter = 0;
process.err5xxcounter = 0;
process.reqcounter = 0;
process.malformedcounter = 0;

if (process.versions) process.versions.svrjs = version; // Inject SVR.JS into process.versions

let forceSecure = false;
let disableMods = false;

// Handle command line arguments
const args = process.argv;
for (
  let i =
    process.argv[0].indexOf("node") > -1 || process.argv[0].indexOf("bun") > -1
      ? 2
      : 1;
  i < args.length;
  i++
) {
  if (
    args[i] == "-h" ||
    args[i] == "--help" ||
    args[i] == "-?" ||
    args[i] == "/h" ||
    args[i] == "/?"
  ) {
    console.log("SVR.JS usage:");
    console.log(
      "node svr.js [-h] [--help] [-?] [/h] [/?] [--secure] [--reset] [--clean] [--disable-mods] [--single-threaded] [-v] [--version]",
    );
    console.log("-h -? /h /? --help    -- Displays help");
    console.log("--clean               -- Cleans up files created by SVR.JS");
    console.log(
      "--reset               -- Resets SVR.JS to default settings (WARNING: DANGEROUS)",
    );
    console.log("--secure              -- Runs HTTPS server");
    console.log("--disable-mods        -- Disables mods (safe mode)");
    console.log("--single-threaded     -- Run single-threaded");
    console.log("-v --version          -- Display server version");
    process.exit(0);
  } else if (args[i] == "--secure") {
    forceSecure = true;
  } else if (args[i] == "-v" || args[i] == "--version") {
    console.log(generateServerString(true));
    process.exit(0);
  } else if (args[i] == "--clean") {
    console.log("Removing logs...");
    deleteFolderRecursive(process.dirname + "/log");
    fs.mkdirSync(process.dirname + "/log");
    console.log("Removing temp folder...");
    deleteFolderRecursive(process.dirname + "/temp");
    fs.mkdirSync(process.dirname + "/temp");
    console.log("Done!");
    process.exit(0);
  } else if (args[i] == "--reset") {
    console.log("Removing logs...");
    deleteFolderRecursive(process.dirname + "/log");
    fs.mkdirSync(process.dirname + "/log");
    console.log("Removing temp folder...");
    deleteFolderRecursive(process.dirname + "/temp");
    fs.mkdirSync(process.dirname + "/temp");
    console.log("Removing configuration file...");
    fs.unlinkSync(process.dirname + "/config.json");
    console.log("Done!");
    process.exit(0);
  } else if (args[i] == "--disable-mods") {
    disableMods = true;
  } else if (args[i] == "--single-threaded") {
    process.singlethreaded = true;
  } else {
    console.log("Unrecognized argument: " + args[i]);
    console.log("SVR.JS usage:");
    console.log(
      "node svr.js [-h] [--help] [-?] [/h] [/?] [--secure] [--reset] [--clean] [--disable-mods] [--single-threaded] [-v] [--version]",
    );
    console.log("-h -? /h /? --help    -- Displays help");
    console.log("--clean               -- Cleans up files created by SVR.JS");
    console.log(
      "--reset               -- Resets SVR.JS to default settings (WARNING: DANGEROUS)",
    );
    console.log("--secure              -- Runs HTTPS server");
    console.log("--disable-mods        -- Disables mods (safe mode)");
    console.log("--single-threaded     -- Run single-threaded");
    console.log("-v --version          -- Display server version");
    process.exit(1);
  }
}

// Create log, mods and temp directories, if they don't exist.
if (!fs.existsSync(process.dirname + "/log"))
  fs.mkdirSync(process.dirname + "/log");
if (!fs.existsSync(process.dirname + "/mods"))
  fs.mkdirSync(process.dirname + "/mods");
if (!fs.existsSync(process.dirname + "/temp"))
  fs.mkdirSync(process.dirname + "/temp");

const cluster = require("./utils/clusterBunShim.js"); // Cluster module with shim for Bun
const generateErrorStack = require("./utils/generateErrorStack.js");
const serverHTTPErrorDescs = require("../res/httpErrorDescriptions.js");
const getOS = require("./utils/getOS.js");
//const parseURL = require("./utils/urlParser.js");
//const fixNodeMojibakeURL = require("./utils/urlMojibakeFixer.js");

process.serverConfig = {};
let configJSONRErr = undefined;
let configJSONPErr = undefined;
if (fs.existsSync(__dirname + "/config.json")) {
  let configJSONf = "";
  try {
    configJSONf = fs.readFileSync(__dirname + "/config.json"); // Read JSON File
    try {
      process.serverConfig = JSON.parse(configJSONf); // Parse JSON
    } catch (err2) {
      configJSONPErr = err2;
    }
  } catch (err) {
    configJSONRErr = err2;
  }
}

// TODO: configuration from config.json
if (process.serverConfig.users === undefined) process.serverConfig.users = [];
if (process.serverConfig.secure === undefined)
  process.serverConfig.secure = false;
if (forceSecure) process.serverConfig.secure = true;
if (process.serverConfig.secure) {
  if (process.serverConfig.key === undefined)
    process.serverConfig.key = "cert/key.key";
  if (process.serverConfig.cert === undefined)
    process.serverConfig.cert = "cert/cert.crt";
  if (process.serverConfig.sport === undefined)
    process.serverConfig.sport = 443;
  if (process.serverConfig.spubport === undefined)
    process.serverConfig.spubport = 443;
  if (process.serverConfig.sni === undefined) process.serverConfig.sni = {};
  if (process.serverConfig.enableOCSPStapling === undefined)
    process.serverConfig.enableOCSPStapling = false;
}
if (process.serverConfig.port === undefined) process.serverConfig.port = 80;
if (process.serverConfig.pubport === undefined)
  process.serverConfig.pubport = 80;
if (
  process.serverConfig.domain === undefined &&
  process.serverConfig.domian !== undefined
)
  process.serverConfig.domain = process.serverConfig.domian;
delete process.serverConfig.domian;
if (process.serverConfig.page404 === undefined)
  process.serverConfig.page404 = "404.html";
process.serverConfig.timestamp = new Date().getTime();
if (process.serverConfig.blacklist === undefined)
  process.serverConfig.blacklist = [];
if (process.serverConfig.nonStandardCodes === undefined)
  process.serverConfig.nonStandardCodes = [];
if (process.serverConfig.enableCompression === undefined)
  process.serverConfig.enableCompression = true;
if (process.serverConfig.customHeaders === undefined)
  process.serverConfig.customHeaders = {};
if (process.serverConfig.enableHTTP2 === undefined)
  process.serverConfig.enableHTTP2 = false;
if (process.serverConfig.enableLogging === undefined)
  process.serverConfig.enableLogging = true;
if (process.serverConfig.enableDirectoryListing === undefined)
  process.serverConfig.enableDirectoryListing = true;
if (process.serverConfig.enableDirectoryListingWithDefaultHead === undefined)
  process.serverConfig.enableDirectoryListingWithDefaultHead = false;
if (process.serverConfig.serverAdministratorEmail === undefined)
  process.serverConfig.serverAdministratorEmail = "[no contact information]";
if (process.serverConfig.stackHidden === undefined)
  process.serverConfig.stackHidden = false;
if (process.serverConfig.enableRemoteLogBrowsing === undefined)
  process.serverConfig.enableRemoteLogBrowsing = false;
if (process.serverConfig.exposeServerVersion === undefined)
  process.serverConfig.exposeServerVersion = true;
if (process.serverConfig.disableServerSideScriptExpose === undefined)
  process.serverConfig.disableServerSideScriptExpose = true;
if (process.serverConfig.allowStatus === undefined)
  process.serverConfig.allowStatus = true;
if (process.serverConfig.rewriteMap === undefined)
  process.serverConfig.rewriteMap = [];
if (process.serverConfig.dontCompress === undefined)
  process.serverConfig.dontCompress = [
    "/.*\\.ipxe$/",
    "/.*\\.(?:jpe?g|png|bmp|tiff|jfif|gif|webp)$/",
    "/.*\\.(?:[id]mg|iso|flp)$/",
    "/.*\\.(?:zip|rar|bz2|[gb7x]z|lzma|tar)$/",
    "/.*\\.(?:mp[34]|mov|wm[av]|avi|webm|og[gv]|mk[va])$/",
  ];
if (process.serverConfig.enableIPSpoofing === undefined)
  process.serverConfig.enableIPSpoofing = false;
if (process.serverConfig.disableNonEncryptedServer === undefined)
  process.serverConfig.disableNonEncryptedServer = false;
if (process.serverConfig.disableToHTTPSRedirect === undefined)
  process.serverConfig.disableToHTTPSRedirect = false;
if (process.serverConfig.enableETag === undefined)
  process.serverConfig.enableETag = true;
if (process.serverConfig.disableUnusedWorkerTermination === undefined)
  process.serverConfig.disableUnusedWorkerTermination = false;
if (process.serverConfig.rewriteDirtyURLs === undefined)
  process.serverConfig.rewriteDirtyURLs = false;
if (process.serverConfig.errorPages === undefined)
  process.serverConfig.errorPages = [];
if (process.serverConfig.useWebRootServerSideScript === undefined)
  process.serverConfig.useWebRootServerSideScript = true;
if (process.serverConfig.exposeModsInErrorPages === undefined)
  process.serverConfig.exposeModsInErrorPages = true;
if (process.serverConfig.disableTrailingSlashRedirects === undefined)
  process.serverConfig.disableTrailingSlashRedirects = false;
if (process.serverConfig.environmentVariables === undefined)
  process.serverConfig.environmentVariables = {};
if (process.serverConfig.customHeadersVHost === undefined)
  process.serverConfig.customHeadersVHost = [];
if (process.serverConfig.enableDirectoryListingVHost === undefined)
  process.serverConfig.enableDirectoryListingVHost = [];
if (process.serverConfig.wwwrootPostfixesVHost === undefined)
  process.serverConfig.wwwrootPostfixesVHost = [];
if (process.serverConfig.wwwrootPostfixPrefixesVHost === undefined)
  process.serverConfig.wwwrootPostfixPrefixesVHost = [];
if (process.serverConfig.allowDoubleSlashes === undefined)
  process.serverConfig.allowDoubleSlashes = false;
if (process.serverConfig.allowPostfixDoubleSlashes === undefined)
  process.serverConfig.allowPostfixDoubleSlashes = false;
if (process.serverConfig.optOutOfStatisticsServer === undefined)
  process.serverConfig.optOutOfStatisticsServer = false;

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

let wwwrootError = null;
try {
  if (cluster.isPrimary || cluster.isPrimary === undefined)
    process.chdir(
      process.serverConfig.wwwroot != undefined
        ? process.serverConfig.wwwroot
        : process.dirname,
    );
} catch (err) {
  wwwrootError = err;
}

let middleware = [
  require("./middleware/core.js"),
  require("./middleware/urlSanitizer.js"),
  require("./middleware/redirects.js"),
  require("./middleware/blocklist.js"),
  require("./middleware/webRootPostfixes.js"),
  require("./middleware/rewriteURL.js"),
  require("./middleware/responseHeaders.js"),
  require("./middleware/checkForbiddenPaths.js"),
  require("./middleware/nonStandardCodesAndHttpAuthentication.js"),
  require("./middleware/redirectTrailingSlashes.js"),
  // TODO: SVR.JS mods go here
  require("./middleware/defaultHandlerChecks.js"),
  require("./middleware/status.js"),
  require("./middleware/staticFileServingAndDirectoryListings.js"),
];

function addMiddleware(mw) {
  middleware.push(mw);
}

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

function clientErrorHandler(err, socket) {
  const config = Object.assign(process.serverConfig);

  config.generateServerString = () =>
    generateServerString(config.exposeServerVersion);

  // getCustomHeaders() in SVR.JS 3.x
  config.getCustomHeaders = () => Object.assign(config.customHeaders);

  // Prevent multiple error handlers from one request
  if (socket.__assigned__) {
    return;
  } else {
    socket.__assigned__ = true;
  }

  // Estimate fromMain from SVR.JS 3.x
  let fromMain = !(
    config.secure &&
    !socket.encrypted &&
    socket.localPort == config.sport
  );

  // Define response object similar to Node.JS native one
  let res = {
    socket: socket,
    write: (x) => {
      if (err.code === "ECONNRESET" || !socket.writable) {
        return;
      }
      socket.write(x);
    },
    end: (x) => {
      if (err.code === "ECONNRESET" || !socket.writable) {
        return;
      }
      socket.end(x, function () {
        try {
          socket.destroy();
        } catch (err) {
          // Socket is probably already destroyed
        }
      });
    },
    writeHead: (code, name, headers) => {
      if (code >= 400 && code <= 499) process.err4xxcounter++;
      if (code >= 500 && code <= 599) process.err5xxcounter++;
      let head = "HTTP/1.1 " + code.toString() + " " + name + "\r\n";
      headers = Object.assign(headers);
      headers["Date"] = new Date().toGMTString();
      headers["Connection"] = "close";
      Object.keys(headers).forEach(function (headername) {
        if (headername.toLowerCase() == "set-cookie") {
          headers[headername].forEach(function (headerValueS) {
            if (
              headername.match(/[^\x09\x20-\x7e\x80-\xff]|.:/) ||
              headerValueS.match(/[^\x09\x20-\x7e\x80-\xff]/)
            )
              throw new Error("Invalid header!!! (" + headername + ")");
            head += headername + ": " + headerValueS;
          });
        } else {
          if (
            headername.match(/[^\x09\x20-\x7e\x80-\xff]|.:/) ||
            headers[headername].match(/[^\x09\x20-\x7e\x80-\xff]/)
          )
            throw new Error("Invalid header!!! (" + headername + ")");
          head += headername + ": " + headers[headername];
        }
        head += "\r\n";
      });
      head += "\r\n";
      res.write(head);
    },
  };

  let reqIdInt = Math.floor(Math.random() * 16777216);
  if (reqIdInt == 16777216) reqIdInt = 0;
  let reqId =
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

  socket.on("close", function (hasError) {
    if (
      !hasError ||
      err.code == "ERR_SSL_HTTP_REQUEST" ||
      err.message.indexOf("http request") != -1
    )
      logFacilities.locmessage("Client disconnected.");
    else logFacilities.locmessage("Client disconnected due to error.");
  });
  socket.on("error", function () {});

  // Header and footer placeholders
  let head = "";
  let foot = "";

  const responseEnd = (body) => {
    // If body is Buffer, then it is converted to String anyway.
    res.write(head + body + foot);
    res.end();
  };

  // Server error calling method
  const callServerError = (errorCode, extName, stack, ch) => {
    if (typeof errorCode !== "number") {
      throw new TypeError("HTTP error code parameter needs to be an integer.");
    }

    // Handle optional parameters
    if (extName && typeof extName === "object") {
      ch = stack;
      stack = extName;
      extName = undefined;
    } else if (
      typeof extName !== "string" &&
      extName !== null &&
      extName !== undefined
    ) {
      throw new TypeError("Extension name parameter needs to be a string.");
    }

    if (
      stack &&
      typeof stack === "object" &&
      Object.prototype.toString.call(stack) !== "[object Error]"
    ) {
      ch = stack;
      stack = undefined;
    } else if (
      typeof stack !== "object" &&
      typeof stack !== "string" &&
      stack
    ) {
      throw new TypeError(
        "Error stack parameter needs to be either a string or an instance of Error object.",
      );
    }

    // Determine error file
    const getErrorFileName = (list, callback, _i) => {
      if (
        err.code == "ERR_SSL_HTTP_REQUEST" &&
        process.version &&
        parseInt(process.version.split(".")[0].substring(1)) >= 16
      ) {
        // Disable custom error page for HTTP SSL error
        callback(errorCode.toString() + ".html");
        return;
      }

      const medCallback = (p) => {
        if (p) callback(p);
        else {
          if (errorCode == 404) {
            fs.access(config.page404, fs.constants.F_OK, function (err) {
              if (err) {
                fs.access(
                  "." + errorCode.toString(),
                  fs.constants.F_OK,
                  function (err) {
                    try {
                      if (err) {
                        callback(errorCode.toString() + ".html");
                      } else {
                        callback("." + errorCode.toString());
                      }
                    } catch (err2) {
                      callServerError(500, err2);
                    }
                  },
                );
              } else {
                try {
                  callback(config.page404);
                } catch (err2) {
                  callServerError(500, err2);
                }
              }
            });
          } else {
            fs.access(
              "." + errorCode.toString(),
              fs.constants.F_OK,
              function (err) {
                try {
                  if (err) {
                    callback(errorCode.toString() + ".html");
                  } else {
                    callback("." + errorCode.toString());
                  }
                } catch (err2) {
                  callServerError(500, err2);
                }
              },
            );
          }
        }
      };

      if (!_i) _i = 0;
      if (_i >= list.length) {
        medCallback(false);
        return;
      }

      if (list[_i].scode != errorCode) {
        getErrorFileName(list, callback, _i + 1);
        return;
      } else {
        fs.access(list[_i].path, fs.constants.F_OK, function (err) {
          if (err) {
            getErrorFileName(list, callback, _i + 1);
          } else {
            medCallback(list[_i].path);
          }
        });
      }
    };

    getErrorFileName(config.errorPages, function (errorFile) {
      if (Object.prototype.toString.call(stack) === "[object Error]")
        stack = generateErrorStack(stack);
      if (stack === undefined)
        stack = generateErrorStack(new Error("Unknown error"));
      if (errorCode == 500 || errorCode == 502) {
        logFacilities.errmessage(
          "There was an error while processing the request!",
        );
        logFacilities.errmessage("Stack:");
        logFacilities.errmessage(stack);
      }
      if (config.stackHidden) stack = "[error stack hidden]";
      if (serverHTTPErrorDescs[errorCode] === undefined) {
        callServerError(501, extName, stack);
      } else {
        let cheaders = { ...config.getCustomHeaders(), ...ch };
        cheaders["Content-Type"] = "text/html; charset=utf-8";
        if (errorCode == 405 && !cheaders["Allow"])
          cheaders["Allow"] = "GET, POST, HEAD, OPTIONS";
        if (
          err.code == "ERR_SSL_HTTP_REQUEST" &&
          process.version &&
          parseInt(process.version.split(".")[0].substring(1)) >= 16
        ) {
          // Disable custom error page for HTTP SSL error
          res.writeHead(errorCode, http.STATUS_CODES[errorCode], cheaders);
          res.write(
            '<!DOCTYPE html><html><head><title>{errorMessage}</title><meta name="viewport" content="width=device-width, initial-scale=1.0" /><style>html{background-color:#dfffdf;color:#000000;font-family:FreeSans, Helvetica, Tahoma, Verdana, Arial, sans-serif;margin:0.75em}body{background-color:#ffffff;padding:0.5em 0.5em 0.1em;margin:0.5em auto;width:90%;max-width:800px;-webkit-box-shadow:0 5px 10px 0 rgba(0, 0, 0, 0.15);-moz-box-shadow:0 5px 10px 0 rgba(0, 0, 0, 0.15);box-shadow:0 5px 10px 0 rgba(0, 0, 0, 0.15)}h1{text-align:center;font-size:2.25em;margin:0.3em 0 0.5em}code{background-color:#dfffdf;-webkit-box-shadow:0 2px 4px 0 rgba(0, 0, 0, 0.1);-moz-box-shadow:0 2px 4px 0 rgba(0, 0, 0, 0.1);box-shadow:0 2px 4px 0 rgba(0, 0, 0, 0.1);display:block;padding:0.2em;font-family:"DejaVu Sans Mono", "Bitstream Vera Sans Mono", Hack, Menlo, Consolas, Monaco, monospace;font-size:0.85em;margin:auto;width:95%;max-width:600px}table{width:95%;border-collapse:collapse;margin:auto;overflow-wrap:break-word;word-wrap:break-word;word-break:break-all;word-break:break-word;position:relative;z-index:0}table tbody{background-color:#ffffff;color:#000000}table tbody:after{-webkit-box-shadow:0 4px 8px 0 rgba(0, 0, 0, 0.175);-moz-box-shadow:0 4px 8px 0 rgba(0, 0, 0, 0.175);box-shadow:0 4px 8px 0 rgba(0, 0, 0, 0.175);content:\' \';position:absolute;top:0;left:0;right:0;bottom:0;z-index:-1}table img{margin:0;display:inline}th,tr{padding:0.15em;text-align:center}th{background-color:#007000;color:#ffffff}th a{color:#ffffff}td,th{padding:0.225em}td{text-align:left}tr:nth-child(odd){background-color:#dfffdf}hr{color:#ffffff}@media screen and (prefers-color-scheme: dark){html{background-color:#002000;color:#ffffff}body{background-color:#000f00;-webkit-box-shadow:0 5px 10px 0 rgba(127, 127, 127, 0.15);-moz-box-shadow:0 5px 10px 0 rgba(127, 127, 127, 0.15);box-shadow:0 5px 10px 0 rgba(127, 127, 127, 0.15)}code{background-color:#002000;-webkit-box-shadow:0 2px 4px 0 rgba(127, 127, 127, 0.1);-moz-box-shadow:0 2px 4px 0 rgba(127, 127, 127, 0.1);box-shadow:0 2px 4px 0 rgba(127, 127, 127, 0.1)}a{color:#ffffff}a:hover{color:#00ff00}table tbody{background-color:#000f00;color:#ffffff}table tbody:after{-webkit-box-shadow:0 4px 8px 0 rgba(127, 127, 127, 0.175);-moz-box-shadow:0 4px 8px 0 rgba(127, 127, 127, 0.175);box-shadow:0 4px 8px 0 rgba(127, 127, 127, 0.175)}tr:nth-child(odd){background-color:#002000}}</style></head><body><h1>{errorMessage}</h1><p>{errorDesc}</p><p><i>{server}</i></p></body></html>'
              .replace(
                /{errorMessage}/g,
                errorCode.toString() +
                  " " +
                  http.STATUS_CODES[errorCode]
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;"),
              )
              .replace(/{errorDesc}/g, serverHTTPErrorDescs[errorCode])
              .replace(
                /{stack}/g,
                stack
                  .replace(/&/g, "&amp;")
                  .replace(/</g, "&lt;")
                  .replace(/>/g, "&gt;")
                  .replace(/\r\n/g, "<br/>")
                  .replace(/\n/g, "<br/>")
                  .replace(/\r/g, "<br/>")
                  .replace(/ {2}/g, "&nbsp;&nbsp;"),
              )
              .replace(
                /{server}/g,
                "" +
                  (
                    config.generateServerString() +
                    (!config.exposeModsInErrorPages || extName == undefined
                      ? ""
                      : " " + extName)
                  )
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;"),
              )
              .replace(
                /{contact}/g,
                config.serverAdministratorEmail
                  .replace(/&/g, "&amp;")
                  .replace(/</g, "&lt;")
                  .replace(/>/g, "&gt;")
                  .replace(/\./g, "[dot]")
                  .replace(/@/g, "[at]"),
              ),
          );
          res.end();
        } else {
          fs.readFile(errorFile, function (err, data) {
            try {
              if (err) throw err;
              res.writeHead(errorCode, http.STATUS_CODES[errorCode], cheaders);
              responseEnd(
                data
                  .toString()
                  .replace(
                    /{errorMessage}/g,
                    errorCode.toString() +
                      " " +
                      http.STATUS_CODES[errorCode]
                        .replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;"),
                  )
                  .replace(/{errorDesc}/g, serverHTTPErrorDescs[errorCode])
                  .replace(
                    /{stack}/g,
                    stack
                      .replace(/&/g, "&amp;")
                      .replace(/</g, "&lt;")
                      .replace(/>/g, "&gt;")
                      .replace(/\r\n/g, "<br/>")
                      .replace(/\n/g, "<br/>")
                      .replace(/\r/g, "<br/>")
                      .replace(/ {2}/g, "&nbsp;&nbsp;"),
                  )
                  .replace(
                    /{server}/g,
                    "" +
                      (
                        config.generateServerString() +
                        (!config.exposeModsInErrorPages || extName == undefined
                          ? ""
                          : " " + extName)
                      )
                        .replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;"),
                  )
                  .replace(
                    /{contact}/g,
                    config.serverAdministratorEmail
                      .replace(/&/g, "&amp;")
                      .replace(/</g, "&lt;")
                      .replace(/>/g, "&gt;")
                      .replace(/\./g, "[dot]")
                      .replace(/@/g, "[at]"),
                  ),
              );
            } catch (err) {
              let additionalError = 500;
              if (err.code == "ENOENT") {
                additionalError = 404;
              } else if (err.code == "ENOTDIR") {
                additionalError = 404; // Assume that file doesn't exist
              } else if (err.code == "EACCES") {
                additionalError = 403;
              } else if (err.code == "ENAMETOOLONG") {
                additionalError = 414;
              } else if (err.code == "EMFILE") {
                additionalError = 503;
              } else if (err.code == "ELOOP") {
                additionalError = 508;
              }
              res.writeHead(errorCode, http.STATUS_CODES[errorCode], cheaders);
              res.write(
                (
                  '<!DOCTYPE html><html><head><title>{errorMessage}</title><meta name="viewport" content="width=device-width, initial-scale=1.0" /><style>html{background-color:#dfffdf;color:#000000;font-family:FreeSans, Helvetica, Tahoma, Verdana, Arial, sans-serif;margin:0.75em}body{background-color:#ffffff;padding:0.5em 0.5em 0.1em;margin:0.5em auto;width:90%;max-width:800px;-webkit-box-shadow:0 5px 10px 0 rgba(0, 0, 0, 0.15);-moz-box-shadow:0 5px 10px 0 rgba(0, 0, 0, 0.15);box-shadow:0 5px 10px 0 rgba(0, 0, 0, 0.15)}h1{text-align:center;font-size:2.25em;margin:0.3em 0 0.5em}code{background-color:#dfffdf;-webkit-box-shadow:0 2px 4px 0 rgba(0, 0, 0, 0.1);-moz-box-shadow:0 2px 4px 0 rgba(0, 0, 0, 0.1);box-shadow:0 2px 4px 0 rgba(0, 0, 0, 0.1);display:block;padding:0.2em;font-family:"DejaVu Sans Mono", "Bitstream Vera Sans Mono", Hack, Menlo, Consolas, Monaco, monospace;font-size:0.85em;margin:auto;width:95%;max-width:600px}table{width:95%;border-collapse:collapse;margin:auto;overflow-wrap:break-word;word-wrap:break-word;word-break:break-all;word-break:break-word;position:relative;z-index:0}table tbody{background-color:#ffffff;color:#000000}table tbody:after{-webkit-box-shadow:0 4px 8px 0 rgba(0, 0, 0, 0.175);-moz-box-shadow:0 4px 8px 0 rgba(0, 0, 0, 0.175);box-shadow:0 4px 8px 0 rgba(0, 0, 0, 0.175);content:\' \';position:absolute;top:0;left:0;right:0;bottom:0;z-index:-1}table img{margin:0;display:inline}th,tr{padding:0.15em;text-align:center}th{background-color:#007000;color:#ffffff}th a{color:#ffffff}td,th{padding:0.225em}td{text-align:left}tr:nth-child(odd){background-color:#dfffdf}hr{color:#ffffff}@media screen and (prefers-color-scheme: dark){html{background-color:#002000;color:#ffffff}body{background-color:#000f00;-webkit-box-shadow:0 5px 10px 0 rgba(127, 127, 127, 0.15);-moz-box-shadow:0 5px 10px 0 rgba(127, 127, 127, 0.15);box-shadow:0 5px 10px 0 rgba(127, 127, 127, 0.15)}code{background-color:#002000;-webkit-box-shadow:0 2px 4px 0 rgba(127, 127, 127, 0.1);-moz-box-shadow:0 2px 4px 0 rgba(127, 127, 127, 0.1);box-shadow:0 2px 4px 0 rgba(127, 127, 127, 0.1)}a{color:#ffffff}a:hover{color:#00ff00}table tbody{background-color:#000f00;color:#ffffff}table tbody:after{-webkit-box-shadow:0 4px 8px 0 rgba(127, 127, 127, 0.175);-moz-box-shadow:0 4px 8px 0 rgba(127, 127, 127, 0.175);box-shadow:0 4px 8px 0 rgba(127, 127, 127, 0.175)}tr:nth-child(odd){background-color:#002000}}</style></head><body><h1>{errorMessage}</h1><p>{errorDesc}</p>' +
                  (additionalError == 404
                    ? ""
                    : "<p>Additionally, a {additionalError} error occurred while loading an error page.</p>") +
                  "<p><i>{server}</i></p></body></html>"
                )
                  .replace(
                    /{errorMessage}/g,
                    errorCode.toString() +
                      " " +
                      http.STATUS_CODES[errorCode]
                        .replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;"),
                  )
                  .replace(/{errorDesc}/g, serverHTTPErrorDescs[errorCode])
                  .replace(
                    /{stack}/g,
                    stack
                      .replace(/&/g, "&amp;")
                      .replace(/</g, "&lt;")
                      .replace(/>/g, "&gt;")
                      .replace(/\r\n/g, "<br/>")
                      .replace(/\n/g, "<br/>")
                      .replace(/\r/g, "<br/>")
                      .replace(/ {2}/g, "&nbsp;&nbsp;"),
                  )
                  .replace(
                    /{server}/g,
                    (config.generateServerString() +
                    (config.exposeModsInErrorPages || extName == undefined)
                      ? ""
                      : " " + extName
                    )
                      .replace(/&/g, "&amp;")
                      .replace(/</g, "&lt;")
                      .replace(/>/g, "&gt;"),
                  )
                  .replace(
                    /{contact}/g,
                    config.serverAdministratorEmail
                      .replace(/&/g, "&amp;")
                      .replace(/</g, "&lt;")
                      .replace(/>/g, "&gt;")
                      .replace(/\./g, "[dot]")
                      .replace(/@/g, "[at]"),
                  )
                  .replace(/{additionalError}/g, additionalError.toString()),
              );
              res.end();
            }
          });
        }
      }
    });
  };
  let reqip = socket.remoteAddress;
  let reqport = socket.remotePort;
  process.reqcounter++;
  process.malformedcounter++;
  logFacilities.locmessage(
    "Somebody connected to " +
      (config.secure && fromMain
        ? (typeof config.sport == "number" ? "port " : "socket ") + config.sport
        : (typeof config.port == "number" ? "port " : "socket ") +
          config.port) +
      "...",
  );
  logFacilities.reqmessage(
    "Client " +
      (!reqip || reqip == ""
        ? "[unknown client]"
        : reqip +
          (reqport && reqport !== 0 && reqport != "" ? ":" + reqport : "")) +
      " sent invalid request.",
  );
  try {
    head = fs.existsSync("./.head")
      ? fs.readFileSync("./.head").toString()
      : fs.existsSync("./head.html")
        ? fs.readFileSync("./head.html").toString()
        : ""; // header
    foot = fs.existsSync("./.foot")
      ? fs.readFileSync("./.foot").toString()
      : fs.existsSync("./foot.html")
        ? fs.readFileSync("./foot.html").toString()
        : ""; // footer

    if (
      (err.code &&
        (err.code.indexOf("ERR_SSL_") == 0 ||
          err.code.indexOf("ERR_TLS_") == 0)) ||
      (!err.code && err.message.indexOf("SSL routines") != -1)
    ) {
      if (
        err.code == "ERR_SSL_HTTP_REQUEST" ||
        err.message.indexOf("http request") != -1
      ) {
        logFacilities.errmessage("Client sent HTTP request to HTTPS port.");
        callServerError(497);
        return;
      } else {
        logFacilities.errmessage(
          "An SSL error occured: " + (err.code ? err.code : err.message),
        );
        callServerError(400);
        return;
      }
    }

    if (err.code && err.code.indexOf("ERR_HTTP2_") == 0) {
      logFacilities.errmessage("An HTTP/2 error occured: " + err.code);
      callServerError(400);
      return;
    }

    if (err.code && err.code == "ERR_HTTP_REQUEST_TIMEOUT") {
      logFacilities.errmessage("Client timed out.");
      callServerError(408);
      return;
    }

    if (!err.rawPacket) {
      logFacilities.errmessage("Connection ended prematurely.");
      callServerError(400);
      return;
    }

    const packetLines = err.rawPacket.toString().split("\r\n");
    if (packetLines.length == 0) {
      logFacilities.errmessage("Invalid request.");
      callServerError(400);
      return;
    }

    const checkHeaders = (beginsFromFirst) => {
      for (let i = beginsFromFirst ? 0 : 1; i < packetLines.length; i++) {
        const header = packetLines[i];
        if (header == "")
          return false; // Beginning of body
        else if (header.indexOf(":") < 1) {
          logFacilities.errmessage("Invalid header.");
          callServerError(400);
          return true;
        } else if (header.length > 8192) {
          logFacilities.errmessage("Header too large.");
          callServerError(431); // Headers too large
          return true;
        }
      }
      return false;
    };
    const packetLine1 = packetLines[0].split(" ");
    let method = "GET";
    let httpVersion = "HTTP/1.1";
    if (String(packetLine1[0]).indexOf(":") > 0) {
      if (!checkHeaders(true)) {
        logFacilities.errmessage(
          "The request is invalid (it may be a part of larger invalid request).",
        );
        callServerError(400); // Also malformed Packet
        return;
      }
    }
    if (String(packetLine1[0]).length < 50) method = packetLine1.shift();
    if (String(packetLine1[packetLine1.length - 1]).length < 50)
      httpVersion = packetLine1.pop();
    if (packetLine1.length != 1) {
      logFacilities.errmessage("The head of request is invalid.");
      callServerError(400); // Malformed Packet
    } else if (!httpVersion.toString().match(/^HTTP[\/]/i)) {
      logFacilities.errmessage("Invalid protocol.");
      callServerError(400); // bad protocol version
    } else if (http.METHODS.indexOf(method) == -1) {
      logFacilities.errmessage("Invalid method.");
      callServerError(405); // Also malformed Packet
    } else {
      if (checkHeaders(false)) return;
      if (packetLine1[0].length > 255) {
        logFacilities.errmessage("URI too long.");
        callServerError(414); // Also malformed Packet
      } else {
        logFacilities.errmessage("The request is invalid.");
        callServerError(400); // Also malformed Packet
      }
    }
  } catch (err) {
    logFacilities.errmessage(
      "There was an error while determining type of malformed request.",
    );
    callServerError(400);
  }
}

// Create HTTP server
http
  .createServer(requestHandler)
  .on("clientError", clientErrorHandler)
  .listen(3000);

if (wwwrootError) throw wwwrootError;
if (configJSONRErr) throw configJSONRErr;
if (configJSONPErr) throw configJSONPErr;
