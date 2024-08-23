const http = require("http");
const fs = require("fs");
const cluster = require("./utils/clusterBunShim.js"); // Cluster module with shim for Bun
const sanitizeURL = require("./utils/urlSanitizer.js");
const generateErrorStack = require("./utils/generateErrorStack.js");
const serverHTTPErrorDescs = require("./res/httpErrorDescriptions.js");
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

let config = {};

// TODO: configuration from config.json
let page404 = "404.html"
let errorPages = [];
let stackHidden = true;
let exposeServerVersion = false;
let exposeModsInErrorPages = false;
let enableLogging = true;
let serverAdmin = "webmaster@svrjs.org";
function getCustomHeaders() {
  return {};
}

const serverconsole = serverconsoleConstructor(enableLogging);

function requestHandler(req, res) {
  // TODO: variables from SVR.JS 3.x
  let isProxy = false;

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

  // Server error calling method
  res.error = (errorCode, extName, stack, ch) => {
    if (typeof errorCode !== "number") {
      throw new TypeError("HTTP error code parameter needs to be an integer.");
    }

    // Handle optional parameters
    if (extName && typeof extName === "object") {
      ch = stack;
      stack = extName;
      extName = undefined;
    } else if (typeof extName !== "string" && extName !== null && extName !== undefined) {
      throw new TypeError("Extension name parameter needs to be a string.");
    }

    if (stack && typeof stack === "object" && Object.prototype.toString.call(stack) !== "[object Error]") {
      ch = stack;
      stack = undefined;
    } else if (typeof stack !== "object" && typeof stack !== "string" && stack) {
      throw new TypeError("Error stack parameter needs to be either a string or an instance of Error object.");
    }

    // Determine error file
    function getErrorFileName(list, callback, _i) {

      function medCallback(p) {
        if (p) callback(p);
        else {
          if (errorCode == 404) {
            fs.access(page404, fs.constants.F_OK, function (err) {
              if (err) {
                fs.access("." + errorCode.toString(), fs.constants.F_OK, function (err) {
                  try {
                    if (err) {
                      callback(errorCode.toString() + ".html");
                    } else {
                      callback("." + errorCode.toString());
                    }
                  } catch (err2) {
                    res.error(500, err2);
                  }
                });
              } else {
                try {
                  callback(page404);
                } catch (err2) {
                  res.error(500, err2);
                }
              }
            });
          } else {
            fs.access("." + errorCode.toString(), fs.constants.F_OK, function (err) {
              try {
                if (err) {
                  callback(errorCode.toString() + ".html");
                } else {
                  callback("." + errorCode.toString());
                }
              } catch (err2) {
                res.error(500, err2);
              }
            });
          }
        }
      }

      if (!_i) _i = 0;
      if (_i >= list.length) {
        medCallback(false);
        return;
      }

      if (list[_i].scode != errorCode || !(matchHostname(list[_i].host) && ipMatch(list[_i].ip, req.socket ? req.socket.localAddress : undefined))) {
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
    }

    getErrorFileName(errorPages, function (errorFile) {
      // Generate error stack if not provided
      if (Object.prototype.toString.call(stack) === "[object Error]") stack = generateErrorStack(stack);
      if (stack === undefined) stack = generateErrorStack(new Error("Unknown error"));

      if (errorCode == 500 || errorCode == 502) {
        //TODO: server logging facilities
        logFacilities.errmessage("There was an error while processing the request!");
        logFacilities.errmessage("Stack:");
        logFacilities.errmessage(stack);
      }

      // Hide the error stack if specified
      if (stackHidden) stack = "[error stack hidden]";

      // Validate the error code and handle unknown codes
      if (serverHTTPErrorDescs[errorCode] === undefined) {
        res.error(501, extName, stack);
      } else {
        // Process custom headers if provided
        let cheaders = { ...getCustomHeaders(), ...ch };

        cheaders["Content-Type"] = "text/html; charset=utf-8";

        // Set default Allow header for 405 error if not provided
        if (errorCode == 405 && !cheaders["Allow"]) cheaders["Allow"] = "GET, POST, HEAD, OPTIONS";

        // Read the error file and replace placeholders with error information
        fs.readFile(errorFile, function (err, data) {
          try {
            if (err) throw err;
            res.writeHead(errorCode, http.STATUS_CODES[errorCode], cheaders);
            responseEnd(data.toString().replace(/{errorMessage}/g, errorCode.toString() + " " + http.STATUS_CODES[errorCode].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")).replace(/{errorDesc}/g, serverHTTPErrorDescs[errorCode]).replace(/{stack}/g, stack.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\r\n/g, "<br/>").replace(/\n/g, "<br/>").replace(/\r/g, "<br/>").replace(/ {2}/g, "&nbsp;&nbsp;")).replace(/{path}/g, req.url.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")).replace(/{server}/g, "" + ((exposeServerVersion ? "SVR.JS/" + version + " (" + getOS() + "; " + (process.isBun ? ("Bun/v" + process.versions.bun + "; like Node.JS/" + process.version) : ("Node.JS/" + process.version)) + ")" : "SVR.JS") + ((!exposeModsInErrorPages || extName == undefined) ? "" : " " + extName)).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + ((req.headers.host == undefined || isProxy) ? "" : " on " + String(req.headers.host).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"))).replace(/{contact}/g, serverAdmin.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\./g, "[dot]").replace(/@/g, "[at]"))); // Replace placeholders in error response
          } catch (err) {
            let additionalError = 500;
            // Handle additional error cases
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
            res.write(("<!DOCTYPE html><html><head><title>{errorMessage}</title><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" /><style>html{background-color:#dfffdf;color:#000000;font-family:FreeSans, Helvetica, Tahoma, Verdana, Arial, sans-serif;margin:0.75em}body{background-color:#ffffff;padding:0.5em 0.5em 0.1em;margin:0.5em auto;width:90%;max-width:800px;-webkit-box-shadow:0 5px 10px 0 rgba(0, 0, 0, 0.15);-moz-box-shadow:0 5px 10px 0 rgba(0, 0, 0, 0.15);box-shadow:0 5px 10px 0 rgba(0, 0, 0, 0.15)}h1{text-align:center;font-size:2.25em;margin:0.3em 0 0.5em}code{background-color:#dfffdf;-webkit-box-shadow:0 2px 4px 0 rgba(0, 0, 0, 0.1);-moz-box-shadow:0 2px 4px 0 rgba(0, 0, 0, 0.1);box-shadow:0 2px 4px 0 rgba(0, 0, 0, 0.1);display:block;padding:0.2em;font-family:\"DejaVu Sans Mono\", \"Bitstream Vera Sans Mono\", Hack, Menlo, Consolas, Monaco, monospace;font-size:0.85em;margin:auto;width:95%;max-width:600px}table{width:95%;border-collapse:collapse;margin:auto;overflow-wrap:break-word;word-wrap:break-word;word-break:break-all;word-break:break-word;position:relative;z-index:0}table tbody{background-color:#ffffff;color:#000000}table tbody:after{-webkit-box-shadow:0 4px 8px 0 rgba(0, 0, 0, 0.175);-moz-box-shadow:0 4px 8px 0 rgba(0, 0, 0, 0.175);box-shadow:0 4px 8px 0 rgba(0, 0, 0, 0.175);content:' ';position:absolute;top:0;left:0;right:0;bottom:0;z-index:-1}table img{margin:0;display:inline}th,tr{padding:0.15em;text-align:center}th{background-color:#007000;color:#ffffff}th a{color:#ffffff}td,th{padding:0.225em}td{text-align:left}tr:nth-child(odd){background-color:#dfffdf}hr{color:#ffffff}@media screen and (prefers-color-scheme: dark){html{background-color:#002000;color:#ffffff}body{background-color:#000f00;-webkit-box-shadow:0 5px 10px 0 rgba(127, 127, 127, 0.15);-moz-box-shadow:0 5px 10px 0 rgba(127, 127, 127, 0.15);box-shadow:0 5px 10px 0 rgba(127, 127, 127, 0.15)}code{background-color:#002000;-webkit-box-shadow:0 2px 4px 0 rgba(127, 127, 127, 0.1);-moz-box-shadow:0 2px 4px 0 rgba(127, 127, 127, 0.1);box-shadow:0 2px 4px 0 rgba(127, 127, 127, 0.1)}a{color:#ffffff}a:hover{color:#00ff00}table tbody{background-color:#000f00;color:#ffffff}table tbody:after{-webkit-box-shadow:0 4px 8px 0 rgba(127, 127, 127, 0.175);-moz-box-shadow:0 4px 8px 0 rgba(127, 127, 127, 0.175);box-shadow:0 4px 8px 0 rgba(127, 127, 127, 0.175)}tr:nth-child(odd){background-color:#002000}}</style></head><body><h1>{errorMessage}</h1><p>{errorDesc}</p>" + ((additionalError == 404) ? "" : "<p>Additionally, a {additionalError} error occurred while loading an error page.</p>") + "<p><i>{server}</i></p></body></html>").replace(/{errorMessage}/g, errorCode.toString() + " " + http.STATUS_CODES[errorCode].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")).replace(/{errorDesc}/g, serverHTTPErrorDescs[errorCode]).replace(/{stack}/g, stack.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\r\n/g, "<br/>").replace(/\n/g, "<br/>").replace(/\r/g, "<br/>").replace(/ {2}/g, "&nbsp;&nbsp;")).replace(/{path}/g, req.url.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")).replace(/{server}/g, "" + ((exposeServerVersion ? "SVR.JS/" + version + " (" + getOS() + "; " + (process.isBun ? ("Bun/v" + process.versions.bun + "; like Node.JS/" + process.version) : ("Node.JS/" + process.version)) + ")" : "SVR.JS") + ((!exposeModsInErrorPages || extName == undefined) ? "" : " " + extName)).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + ((req.headers.host == undefined || isProxy) ? "" : " on " + String(req.headers.host).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"))).replace(/{contact}/g, serverAdmin.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\./g, "[dot]").replace(/@/g, "[at]")).replace(/{additionalError}/g, additionalError.toString())); // Replace placeholders in error response
            res.end();
          }
        });
      }
    });
  }

  // Function to perform HTTP redirection to a specified destination URL
  res.redirect = (destination, isTemporary, keepMethod, customHeaders) => {
    // If keepMethod is a object, then save it to customHeaders
    if (typeof keepMethod == "object") customHeaders = keepMethod;

    // If isTemporary is a object, then save it to customHeaders
    if (typeof isTemporary == "object") customHeaders = isTemporary;

    // If customHeaders are not provided, get the default custom headers
    if (customHeaders === undefined) customHeaders = getCustomHeaders();

    // Set the "Location" header to the destination URL
    customHeaders["Location"] = destination;

    // Determine the status code for redirection based on the isTemporary and keepMethod flags
    const statusCode = keepMethod ? (isTemporary ? 307 : 308) : (isTemporary ? 302 : 301);

    // Write the response header with the appropriate status code and message
    res.writeHead(statusCode, http.STATUS_CODES[statusCode], customHeaders);

    // Log the redirection message
    logFacilities("Client redirected to " + destination);

    // End the response
    res.end();

    // Return from the function
    return;
  }

  try {
    req.parsedURL = new URL(req.url, "http" + (req.socket.encrypted ? "s" : "") + "://" + (req.headers.host ? req.headers.host : (domain ? domain : "unknown.invalid")));
  } catch (err) {
    res.error(400, err);
    return;
  }

  //logFacilities.resmessage("svrjs");

  // Call res.error (equivalent to callServerError in SVR.JS 3.x)
  res.error(200);
}

// Create HTTP server
http.createServer(requestHandler).listen(3000);
