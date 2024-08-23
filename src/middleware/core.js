const http = require("http");
const fs = require("fs");
const generateErrorStack = require("../utils/generateErrorStack.js");
const serverHTTPErrorDescs = require("../res/httpErrorDescriptions.js");
const fixNodeMojibakeURL = require("../utils/urlMojibakeFixer.js");
const getOS = require("../utils/getOS.js");
const svrjsInfo = require("../../svrjs.json");
const version = svrjsInfo.version;

if (!process.err4xxcounter) process.err4xxcounter = 0;
if (!process.err5xxcounter) process.err5xxcounter = 0;
if (!process.reqcounter) process.reqcounter = 0;

module.exports = (req, res, logFacilities, config, next) => {
  const matchHostname = (hostname) => {
    if (typeof hostname == "undefined" || hostname == "*") {
      return true;
    } else if (
      req.headers.host &&
      hostname.indexOf("*.") == 0 &&
      hostname != "*."
    ) {
      const hostnamesRoot = hostname.substring(2);
      if (
        req.headers.host == hostnamesRoot ||
        (req.headers.host.length > hostnamesRoot.length &&
          req.headers.host.indexOf("." + hostnamesRoot) ==
            req.headers.host.length - hostnamesRoot.length - 1)
      ) {
        return true;
      }
    } else if (req.headers.host && req.headers.host == hostname) {
      return true;
    }
    return false;
  };

  config.getCustomHeaders = () => {
    let ph = Object.assign(config.customHeaders);
    if (config.customHeadersVHost) {
      let vhostP = null;
      config.customHeadersVHost.every(function (vhost) {
        if (
          matchHostname(vhost.host) &&
          ipMatch(vhost.ip, req.socket ? req.socket.localAddress : undefined)
        ) {
          vhostP = vhost;
          return false;
        } else {
          return true;
        }
      });
      if (vhostP && vhostP.headers) {
        const phNu = Object.assign(vhostP.headers);
        Object.keys(phNu).forEach(function (phNuK) {
          ph[phNuK] = phNu[phNuK];
        });
      }
    }
    Object.keys(ph).forEach(function (phk) {
      if (typeof ph[phk] == "string")
        ph[phk] = ph[phk].replace(/\{path\}/g, req.url);
    });
    ph["Server"] = config.exposeServerVersion
      ? "SVR.JS/" +
        version +
        " (" +
        getOS() +
        "; " +
        (process.isBun
          ? "Bun/v" + process.versions.bun + "; like Node.JS/" + process.version
          : "Node.JS/" + process.version) +
        ")"
      : "SVR.JS";
    return ph;
  };

  // Estimate fromMain from SVR.JS 3.x
  let fromMain = !(config.secure && !req.socket.encrypted);

  // Make HTTP/1.x API-based scripts compatible with HTTP/2.0 API
  if (config.enableHTTP2 == true && req.httpVersion == "2.0") {
    // Set HTTP/1.x methods (to prevent process warnings)
    res.writeHeadNodeApi = res.writeHead;
    res.setHeaderNodeApi = res.setHeader;

    res.writeHead = function (a, b, c) {
      let table = c;
      if (typeof b == "object") table = b;
      if (table == undefined) table = this.tHeaders;
      if (table == undefined) table = {};
      table = Object.assign(table);
      Object.keys(table).forEach(function (key) {
        const al = key.toLowerCase();
        if (
          al == "transfer-encoding" ||
          al == "connection" ||
          al == "keep-alive" ||
          al == "upgrade"
        )
          delete table[key];
      });
      if (res.stream && res.stream.destroyed) {
        return false;
      } else {
        return res.writeHeadNodeApi(a, table);
      }
    };
    res.setHeader = function (headerName, headerValue) {
      const al = headerName.toLowerCase();
      if (
        al != "transfer-encoding" &&
        al != "connection" &&
        al != "keep-alive" &&
        al != "upgrade"
      )
        return res.setHeaderNodeApi(headerName, headerValue);
      return false;
    };

    // Set HTTP/1.x headers
    if (!req.headers.host) req.headers.host = req.headers[":authority"];
    if (!req.url) req.url = req.headers[":path"];
    if (!req.protocol) req.protocol = req.headers[":scheme"];
    if (!req.method) req.method = req.headers[":method"];
    if (
      req.headers[":path"] == undefined ||
      req.headers[":method"] == undefined
    ) {
      let err = new Error(
        'Either ":path" or ":method" pseudoheader is missing.',
      );
      if (Buffer.alloc) err.rawPacket = Buffer.alloc(0);
      return;
      // TODO: reqerrhandler(err, req.socket, fromMain);
    }
  }

  /*if (req.headers["x-svr-js-from-main-thread"] == "true" && req.socket && (!req.socket.remoteAddress || req.socket.remoteAddress == "::1" || req.socket.remoteAddress == "::ffff:127.0.0.1" || req.socket.remoteAddress == "127.0.0.1" || req.socket.remoteAddress == "localhost" || req.socket.remoteAddress == host || req.socket.remoteAddress == "::ffff:" + host)) {
      let headers = config.getCustomHeaders();
      res.writeHead(204, http.STATUS_CODES[204], headers);
      res.end();
      return;
    }*/

  req.url = fixNodeMojibakeURL(req.url);

  let headWritten = false;
  let lastStatusCode = null;
  res.writeHeadNative = res.writeHead;
  res.writeHead = function (code, codeDescription, headers) {
    if (
      !(
        headWritten &&
        process.isBun &&
        code === lastStatusCode &&
        codeDescription === undefined &&
        codeDescription === undefined
      )
    ) {
      if (headWritten) {
        process.emitWarning("res.writeHead called multiple times.", {
          code: "WARN_SVRJS_MULTIPLE_WRITEHEAD",
        });
        return res;
      } else {
        headWritten = true;
      }
      if (code >= 400 && code <= 599) {
        if (code >= 400 && code <= 499) process.err4xxcounter++;
        else if (code >= 500 && code <= 599) process.err5xxcounter++;
        logFacilities.errmessage(
          "Server responded with " + code.toString() + " code.",
        );
      } else {
        logFacilities.resmessage(
          "Server responded with " + code.toString() + " code.",
        );
      }
      if (typeof codeDescription != "string" && http.STATUS_CODES[code]) {
        if (!headers) headers = codeDescription;
        codeDescription = http.STATUS_CODES[code];
      }
      lastStatusCode = code;
    }
    res.writeHeadNative(code, codeDescription, headers);
  };

  let finished = false;
  res.on("finish", function () {
    if (!finished) {
      finished = true;
      logFacilities.locmessage("Client disconnected.");
    }
  });
  res.on("close", function () {
    if (!finished) {
      finished = true;
      logFacilities.locmessage("Client disconnected.");
    }
  });

  req.isProxy = false;
  if (req.url[0] != "/" && req.url != "*") req.isProxy = true;
  logFacilities.locmessage(
    "Somebody connected to " +
      (config.secure && fromMain
        ? (typeof config.sport == "number" ? "port " : "socket ") + config.sport
        : (typeof config.port == "number" ? "port " : "socket ") +
          config.port) +
      "...",
  );

  if (req.socket == null) {
    logFacilities.errmessage("Client socket is null!!!");
    return;
  }

  // Set up X-Forwarded-For
  let reqip = req.socket.remoteAddress;
  let reqport = req.socket.remotePort;
  let oldip = "";
  let oldport = "";
  let isForwardedValid = true;
  if (config.enableIPSpoofing) {
    if (req.headers["x-forwarded-for"] != undefined) {
      let preparedReqIP = req.headers["x-forwarded-for"]
        .split(",")[0]
        .replace(/ /g, "");
      let preparedReqIPvalid = net.isIP(preparedReqIP);
      if (preparedReqIPvalid) {
        if (
          preparedReqIPvalid == 4 &&
          req.socket.remoteAddress &&
          req.socket.remoteAddress.indexOf(":") > -1
        )
          preparedReqIP = "::ffff:" + preparedReqIP;
        reqip = preparedReqIP;
        reqport = null;
        try {
          oldport = req.socket.remotePort;
          oldip = req.socket.remoteAddress;
          req.socket.realRemotePort = reqport;
          req.socket.realRemoteAddress = reqip;
          req.socket.originalRemotePort = oldport;
          req.socket.originalRemoteAddress = oldip;
          res.socket.realRemotePort = reqport;
          res.socket.realRemoteAddress = reqip;
          res.socket.originalRemotePort = oldport;
          res.socket.originalRemoteAddress = oldip;
        } catch (err) {
          // Address setting failed
        }
      } else {
        isForwardedValid = false;
      }
    }
  }

  process.reqcounter++;

  // Process the Host header
  let oldHostHeader = req.headers.host;
  if (typeof req.headers.host == "string") {
    req.headers.host = req.headers.host.toLowerCase();
    if (!req.headers.host.match(/^\.+$/))
      req.headers.host = req.headers.host.replace(/\.$/g, "");
  }

  logFacilities.reqmessage(
    "Client " +
      (!reqip || reqip == ""
        ? "[unknown client]"
        : reqip +
          (reqport && reqport !== 0 && reqport != "" ? ":" + reqport : "")) +
      " wants " +
      (req.method == "GET"
        ? "content in "
        : req.method == "POST"
          ? "to post content in "
          : req.method == "PUT"
            ? "to add content in "
            : req.method == "DELETE"
              ? "to delete content in "
              : req.method == "PATCH"
                ? "to patch content in "
                : "to access content using " + req.method + " method in ") +
      (req.headers.host == undefined || req.isProxy ? "" : req.headers.host) +
      req.url,
  );
  if (req.headers["user-agent"] != undefined)
    logFacilities.reqmessage("Client uses " + req.headers["user-agent"]);
  if (oldHostHeader && oldHostHeader != req.headers.host)
    logFacilities.resmessage(
      "Host name rewritten: " + oldHostHeader + " => " + req.headers.host,
    );

    // Header and footer placeholders
    res.head = "";
    res.foot = "";

    res.responseEnd = (body) => {
      // If body is Buffer, then it is converted to String anyway.
      res.write(head + body + foot);
      res.end();
    }

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
    function getErrorFileName(list, callback, _i) {
      function medCallback(p) {
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
                      res.error(500, err2);
                    }
                  },
                );
              } else {
                try {
                  callback(config.page404);
                } catch (err2) {
                  res.error(500, err2);
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
                  res.error(500, err2);
                }
              },
            );
          }
        }
      }

      if (!_i) _i = 0;
      if (_i >= list.length) {
        medCallback(false);
        return;
      }

      if (
        list[_i].scode != errorCode ||
        !(
          matchHostname(list[_i].host) &&
          ipMatch(list[_i].ip, req.socket ? req.socket.localAddress : undefined)
        )
      ) {
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

    getErrorFileName(config.errorPages, function (errorFile) {
      // Generate error stack if not provided
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

      // Hide the error stack if specified
      if (config.stackHidden) stack = "[error stack hidden]";

      // Validate the error code and handle unknown codes
      if (serverHTTPErrorDescs[errorCode] === undefined) {
        res.error(501, extName, stack);
      } else {
        // Process custom headers if provided
        let cheaders = { ...config.getCustomHeaders(), ...ch };

        cheaders["Content-Type"] = "text/html; charset=utf-8";

        // Set default Allow header for 405 error if not provided
        if (errorCode == 405 && !cheaders["Allow"])
          cheaders["Allow"] = "GET, POST, HEAD, OPTIONS";

        // Read the error file and replace placeholders with error information
        fs.readFile(errorFile, function (err, data) {
          try {
            if (err) throw err;
            res.writeHead(errorCode, http.STATUS_CODES[errorCode], cheaders);
            res.responseEnd(
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
                  /{path}/g,
                  req.url
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;"),
                )
                .replace(
                  /{server}/g,
                  "" +
                    (
                      (config.exposeServerVersion
                        ? "SVR.JS/" +
                          version +
                          " (" +
                          getOS() +
                          "; " +
                          (process.isBun
                            ? "Bun/v" +
                              process.versions.bun +
                              "; like Node.JS/" +
                              process.version
                            : "Node.JS/" + process.version) +
                          ")"
                        : "SVR.JS") +
                      (!config.exposeModsInErrorPages || extName == undefined
                        ? ""
                        : " " + extName)
                    )
                      .replace(/&/g, "&amp;")
                      .replace(/</g, "&lt;")
                      .replace(/>/g, "&gt;") +
                    (req.headers.host == undefined || req.isProxy
                      ? ""
                      : " on " +
                        String(req.headers.host)
                          .replace(/&/g, "&amp;")
                          .replace(/</g, "&lt;")
                          .replace(/>/g, "&gt;")),
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
            ); // Replace placeholders in error response
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
                  /{path}/g,
                  req.url
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;"),
                )
                .replace(
                  /{server}/g,
                  "" +
                    (
                      (config.exposeServerVersion
                        ? "SVR.JS/" +
                          version +
                          " (" +
                          getOS() +
                          "; " +
                          (process.isBun
                            ? "Bun/v" +
                              process.versions.bun +
                              "; like Node.JS/" +
                              process.version
                            : "Node.JS/" + process.version) +
                          ")"
                        : "SVR.JS") +
                      (!config.exposeModsInErrorPages || extName == undefined
                        ? ""
                        : " " + extName)
                    )
                      .replace(/&/g, "&amp;")
                      .replace(/</g, "&lt;")
                      .replace(/>/g, "&gt;") +
                    (req.headers.host == undefined || req.isProxy
                      ? ""
                      : " on " +
                        String(req.headers.host)
                          .replace(/&/g, "&amp;")
                          .replace(/</g, "&lt;")
                          .replace(/>/g, "&gt;")),
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
            ); // Replace placeholders in error response
            res.end();
          }
        });
      }
    });
  };

  // Function to perform HTTP redirection to a specified destination URL
  res.redirect = (destination, isTemporary, keepMethod, customHeaders) => {
    // If keepMethod is a object, then save it to customHeaders
    if (typeof keepMethod == "object") customHeaders = keepMethod;

    // If isTemporary is a object, then save it to customHeaders
    if (typeof isTemporary == "object") customHeaders = isTemporary;

    // If customHeaders are not provided, get the default custom headers
    if (customHeaders === undefined) customHeaders = config.getCustomHeaders();

    // Set the "Location" header to the destination URL
    customHeaders["Location"] = destination;

    // Determine the status code for redirection based on the isTemporary and keepMethod flags
    const statusCode = keepMethod
      ? isTemporary
        ? 307
        : 308
      : isTemporary
        ? 302
        : 301;

    // Write the response header with the appropriate status code and message
    res.writeHead(statusCode, http.STATUS_CODES[statusCode], customHeaders);

    // Log the redirection message
    logFacilities.resmessage("Client redirected to " + destination);

    // End the response
    res.end();

    // Return from the function
    return;
  };

  try {
    res.head = fs.existsSync("./.head") ? fs.readFileSync("./.head").toString() : (fs.existsSync("./head.html") ? fs.readFileSync("./head.html").toString() : ""); // header
    res.foot = fs.existsSync("./.foot") ? fs.readFileSync("./.foot").toString() : (fs.existsSync("./foot.html") ? fs.readFileSync("./foot.html").toString() : ""); // footer
  } catch (err) {
    callServerError(500, err);
  }

  // Authenticated user variable
  req.authUser = null;

  if (req.url == "*") {
    // Handle "*" URL
    if (req.method == "OPTIONS") {
      // Respond with list of methods
      let hdss = config.getCustomHeaders();
      hdss["Allow"] = "GET, POST, HEAD, OPTIONS";
      res.writeHead(204, http.STATUS_CODES[204], hdss);
      res.end();
      return;
    } else {
      // SVR.JS doesn't understand that request, so throw an 400 error
      callServerError(400);
      return;
    }
  }

  if (req.headers["expect"] && req.headers["expect"] != "100-continue") {
    // Expectations not met.
    callServerError(417);
    return;
  }
  
  if (req.method == "CONNECT") {
    // CONNECT requests should be handled in "connect" event.
    callServerError(501);
    logFacilities.errmessage(
      "CONNECT requests aren't supported. Your JS runtime probably doesn't support 'connect' handler for HTTP library.",
    );
    return;
  }

  if (!isForwardedValid) {
    logFacilities.errmessage("X-Forwarded-For header is invalid.");
    res.error(400);
    return;
  }

  try {
    req.parsedURL = new URL(
      req.url,
      "http" +
        (req.socket.encrypted ? "s" : "") +
        "://" +
        (req.headers.host
          ? req.headers.host
          : config.domain
            ? config.domain
            : "unknown.invalid"),
    );
  } catch (err) {
    res.error(400, err);
    return;
  }

  next();
};
