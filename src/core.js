const fs = require("fs");
const net = require("net");
const defaultPageCSS = require("./res/defaultPageCSS.js");
const generateErrorStack = require("./utils/generateErrorStack.js");
const serverHTTPErrorDescs = require("./res/httpErrorDescriptions.js");
const fixNodeMojibakeURL = require("./utils/urlMojibakeFixer.js");
const ipMatch = require("./utils/ipMatch.js");
const matchHostname = require("./utils/matchHostname.js");
const generateServerStringCore = require("./utils/generateServerStringCore.js");
const parseURL = require("./utils/urlParser.js");
const deepClone = require("./utils/deepClone.js");
const statusCodes = require("./res/statusCodes.js");

const middleware = [
  require("./middleware/urlSanitizer.js"),
  require("./middleware/redirectTrailingSlashes.js"),
  require("./middleware/defaultHandlerChecks.js"),
  require("./middleware/staticFileServingAndDirectoryListings.js")
];
let coreConfig = {};

function requestHandler(req, res, next) {
  // SVR.JS log facilities (stubs in SVR.JS core)
  const logFacilities = {
    climessage: () => {},
    reqmessage: () => {},
    resmessage: () => {},
    errmessage: () => {},
    locerrmessage: () => {},
    locwarnmessage: () => {},
    locmessage: () => {}
  };

  // SVR.JS configuration object (modified)
  const config = deepClone(coreConfig);

  config.generateServerString = () =>
    generateServerStringCore(config.exposeServerVersion);

  // Determine the webroot from the current working directory if it is not configured
  if (config.wwwroot === undefined) config.wwwroot = process.cwd();

  // getCustomHeaders() in SVR.JS 3.x
  config.getCustomHeaders = () => {
    let ph = Object.assign({}, config.customHeaders);
    if (config.customHeadersVHost) {
      let vhostP = null;
      config.customHeadersVHost.every((vhost) => {
        if (
          matchHostname(vhost.host, req.headers.host) &&
          ipMatch(vhost.ip, req.socket ? req.socket.localAddress : undefined)
        ) {
          vhostP = vhost;
          return false;
        } else {
          return true;
        }
      });
      if (vhostP && vhostP.headers) ph = { ...ph, ...vhostP.headers };
    }
    Object.keys(ph).forEach((phk) => {
      if (typeof ph[phk] == "string")
        ph[phk] = ph[phk].replace(/\{path\}/g, req.url);
    });
    return ph;
  };

  // Make HTTP/1.x API-based scripts compatible with HTTP/2.0 API
  if (config.enableHTTP2 == true && req.httpVersion == "2.0") {
    // Set HTTP/1.x methods (to prevent process warnings)
    res.writeHeadNodeApi = res.writeHead;
    res.setHeaderNodeApi = res.setHeader;

    res.writeHead = (a, b, c) => {
      let table = c;
      if (typeof b == "object") table = b;
      if (table == undefined) table = this.tHeaders;
      if (table == undefined) table = {};
      table = Object.assign({}, table);
      Object.keys(table).forEach((key) => {
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
    res.setHeader = (headerName, headerValue) => {
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
        'Either ":path" or ":method" pseudoheader is missing.'
      );
      if (Buffer.alloc) err.rawPacket = Buffer.alloc(0);
      if (req.socket && req.socket.server)
        req.socket.server.emit("clientError", err, req.socket);
    }
  }

  req.url = fixNodeMojibakeURL(req.url);

  req.isProxy = false;

  if (req.socket == null) return;

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
          // eslint-disable-next-line no-unused-vars
        } catch (err) {
          // Address setting failed
        }
      } else {
        isForwardedValid = false;
      }
    }
  }

  // Process the Host header
  if (typeof req.headers.host == "string") {
    req.headers.host = req.headers.host.toLowerCase();
    if (!req.headers.host.match(/^\.+$/))
      req.headers.host = req.headers.host.replace(/\.$/, "");
  }

  // Header and footer placeholders
  res.head = "";
  res.foot = "";

  res.responseEnd = (body) => {
    // If body is Buffer, then it is converted to String anyway.
    res.write(res.head + body + res.foot);
    res.end();
  };

  const defaultServerError = (errorCode, extName, stack, ch) => {
    // Determine error file
    const getErrorFileName = (list, callback, _i) => {
      const medCallback = (p) => {
        if (p) callback(p);
        else {
          if (errorCode == 404) {
            fs.access(config.page404, fs.constants.F_OK, (err) => {
              if (err) {
                fs.access(
                  config.wwwroot + "/." + errorCode.toString(),
                  fs.constants.F_OK,
                  (err) => {
                    try {
                      if (err) {
                        callback(errorCode.toString() + ".html");
                      } else {
                        callback(config.wwwroot + "/." + errorCode.toString());
                      }
                    } catch (err2) {
                      res.error(500, err2);
                    }
                  }
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
              config.wwwroot + "/." + errorCode.toString(),
              fs.constants.F_OK,
              (err) => {
                try {
                  if (err) {
                    callback(errorCode.toString() + ".html");
                  } else {
                    callback(config.wwwroot + "/." + errorCode.toString());
                  }
                } catch (err2) {
                  res.error(500, err2);
                }
              }
            );
          }
        }
      };

      if (!_i) _i = 0;
      if (_i >= list.length) {
        medCallback(false);
        return;
      }

      if (
        list[_i].scode != errorCode ||
        !(
          matchHostname(list[_i].host, req.headers.host) &&
          ipMatch(list[_i].ip, req.socket ? req.socket.localAddress : undefined)
        )
      ) {
        getErrorFileName(list, callback, _i + 1);
        return;
      } else {
        fs.access(list[_i].path, fs.constants.F_OK, (err) => {
          if (err) {
            getErrorFileName(list, callback, _i + 1);
          } else {
            medCallback(list[_i].path);
          }
        });
      }
    };

    getErrorFileName(config.errorPages, (errorFile) => {
      // Generate error stack if not provided
      if (Object.prototype.toString.call(stack) === "[object Error]")
        stack = generateErrorStack(stack);
      if (stack === undefined)
        stack = generateErrorStack(new Error("Unknown error"));

      // Hide the error stack if specified
      if (config.stackHidden) stack = "[error stack hidden]";

      // Validate the error code and handle unknown codes
      if (serverHTTPErrorDescs[errorCode] === undefined) {
        res.error(501, extName, stack);
      } else {
        // Process custom headers if provided
        let cheaders = { ...config.getCustomHeaders(), ...ch };

        cheaders["Content-Type"] = "text/html";

        // Set default Allow header for 405 error if not provided
        if (errorCode == 405 && !cheaders["Allow"])
          cheaders["Allow"] = "GET, POST, HEAD, OPTIONS";

        // Read the error file and replace placeholders with error information
        fs.readFile(errorFile, (err, data) => {
          try {
            if (err) throw err;
            res.writeHead(errorCode, statusCodes[errorCode], cheaders);
            res.responseEnd(
              data
                .toString()
                .replace(
                  /{errorMessage}/g,
                  errorCode.toString() +
                    " " +
                    statusCodes[errorCode]
                      .replace(/&/g, "&amp;")
                      .replace(/</g, "&lt;")
                      .replace(/>/g, "&gt;")
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
                    .replace(/ {2}/g, "&nbsp;&nbsp;")
                )
                .replace(
                  /{path}/g,
                  req.url
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
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
                      .replace(/>/g, "&gt;") +
                    (req.headers.host == undefined || req.isProxy
                      ? ""
                      : " on " +
                        String(req.headers.host)
                          .replace(/&/g, "&amp;")
                          .replace(/</g, "&lt;")
                          .replace(/>/g, "&gt;"))
                )
                .replace(
                  /{contact}/g,
                  config.serverAdministratorEmail
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/\./g, "[dot]")
                    .replace(/@/g, "[at]")
                )
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

            res.writeHead(errorCode, statusCodes[errorCode], cheaders);
            res.write(
              `<!DOCTYPE html><html><head><title>{errorMessage}</title><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><style>${defaultPageCSS}</style></head><body><h1>{errorMessage}</h1><p>{errorDesc}</p>${
                additionalError == 404
                  ? ""
                  : "<p>Additionally, a {additionalError} error occurred while loading an error page.</p>"
              }<p><i>{server}</i></p></body></html>`
                .replace(
                  /{errorMessage}/g,
                  errorCode.toString() +
                    " " +
                    statusCodes[errorCode]
                      .replace(/&/g, "&amp;")
                      .replace(/</g, "&lt;")
                      .replace(/>/g, "&gt;")
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
                    .replace(/ {2}/g, "&nbsp;&nbsp;")
                )
                .replace(
                  /{path}/g,
                  req.url
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
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
                      .replace(/>/g, "&gt;") +
                    (req.headers.host == undefined || req.isProxy
                      ? ""
                      : " on " +
                        String(req.headers.host)
                          .replace(/&/g, "&amp;")
                          .replace(/</g, "&lt;")
                          .replace(/>/g, "&gt;"))
                )
                .replace(
                  /{contact}/g,
                  config.serverAdministratorEmail
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/\./g, "[dot]")
                    .replace(/@/g, "[at]")
                )
                .replace(/{additionalError}/g, additionalError.toString())
            ); // Replace placeholders in error response
            res.end();
          }
        });
      }
    });
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
        "Error stack parameter needs to be either a string or an instance of Error object."
      );
    }

    if (next) {
      // Invoke next() handler, like when it is used in Express
      if (errorCode == 500) {
        next(new Error("Internal SVR.JS core error"));
      } else {
        next();
      }
    } else {
      // Invoke default server error handler
      defaultServerError(errorCode, extName, stack, ch);
    }
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
    res.writeHead(statusCode, statusCodes[statusCode], customHeaders);

    // End the response
    res.end();

    // Return from the function
    return;
  };

  if (
    config.enableIncludingHeadAndFootInHTML ||
    config.enableIncludingHeadAndFootInHTML === undefined
  ) {
    try {
      res.head = fs.existsSync(`${config.wwwroot}/.head`)
        ? fs.readFileSync(`${config.wwwroot}/.head`).toString()
        : fs.existsSync(`${config.wwwroot}/head.html`)
          ? fs.readFileSync(`${config.wwwroot}/head.html`).toString()
          : ""; // header
      res.foot = fs.existsSync(`${config.wwwroot}/.foot`)
        ? fs.readFileSync(`${config.wwwroot}/.foot`).toString()
        : fs.existsSync(`${config.wwwroot}/foot.html`)
          ? fs.readFileSync(`${config.wwwroot}/foot.html`).toString()
          : ""; // footer
    } catch (err) {
      res.error(500, err);
    }
  }

  // Authenticated user variable
  req.authUser = null;

  if (req.url == "*") {
    // Handle "*" URL
    if (req.method == "OPTIONS") {
      // Respond with list of methods
      let hdrs = config.getCustomHeaders();
      hdrs["Allow"] = "GET, POST, HEAD, OPTIONS";
      res.writeHead(204, statusCodes[204], hdrs);
      res.end();
      return;
    } else {
      // SVR.JS doesn't understand that request, so throw an 400 error
      res.error(400);
      return;
    }
  }

  if (req.headers["expect"] && req.headers["expect"] != "100-continue") {
    // Expectations not met.
    res.error(417);
    return;
  }

  if (req.method == "CONNECT") {
    // CONNECT requests should be handled in "connect" event.
    res.error(501);
    return;
  }

  if (!isForwardedValid) {
    res.error(400);
    return;
  }

  try {
    req.parsedURL = parseURL(
      req.url,
      "http" +
        (req.socket.encrypted ? "s" : "") +
        "://" +
        (req.headers.host
          ? req.headers.host
          : config.domain
            ? config.domain
            : "unknown.invalid")
    );

    // req.originalParsedURL fallback
    req.originalParsedURL = req.parsedURL;
  } catch (err) {
    res.error(400, err);
    return;
  }

  let index = 0;

  // Call the next middleware function
  const nextMiddleware = () => {
    let currentMiddleware = middleware[index++];
    while (
      req.isProxy &&
      currentMiddleware &&
      currentMiddleware.proxySafe !== false &&
      !(currentMiddleware.proxySafe || currentMiddleware.proxy)
    ) {
      currentMiddleware = middleware[index++];
    }
    if (currentMiddleware) {
      try {
        currentMiddleware(req, res, logFacilities, config, nextMiddleware);
      } catch (err) {
        res.error(500, err);
      }
    } else {
      res.error(404);
    }
  };

  // Handle middleware
  nextMiddleware();
}

function init(config) {
  if (config) coreConfig = deepClone(config);

  if (coreConfig.page404 === undefined) coreConfig.page404 = "404.html";
  if (coreConfig.enableCompression === undefined)
    coreConfig.enableCompression = true;
  if (coreConfig.customHeaders === undefined) coreConfig.customHeaders = {};
  if (coreConfig.enableDirectoryListing === undefined)
    coreConfig.enableDirectoryListing = true;
  if (coreConfig.enableDirectoryListingWithDefaultHead === undefined)
    coreConfig.enableDirectoryListingWithDefaultHead = false;
  if (coreConfig.serverAdministratorEmail === undefined)
    coreConfig.serverAdministratorEmail = "[no contact information]";
  if (coreConfig.stackHidden === undefined) coreConfig.stackHidden = false;
  if (coreConfig.exposeServerVersion === undefined)
    coreConfig.exposeServerVersion = true;
  if (coreConfig.dontCompress === undefined)
    coreConfig.dontCompress = [
      "/.*\\.ipxe$/",
      "/.*\\.(?:jpe?g|png|bmp|tiff|jfif|gif|webp)$/",
      "/.*\\.(?:[id]mg|iso|flp)$/",
      "/.*\\.(?:zip|rar|bz2|[gb7x]z|lzma|tar)$/",
      "/.*\\.(?:mp[34]|mov|wm[av]|avi|webm|og[gv]|mk[va])$/"
    ];
  if (coreConfig.enableIPSpoofing === undefined)
    coreConfig.enableIPSpoofing = false;
  if (coreConfig.enableETag === undefined) coreConfig.enableETag = true;
  if (coreConfig.rewriteDirtyURLs === undefined)
    coreConfig.rewriteDirtyURLs = false;
  if (coreConfig.errorPages === undefined) coreConfig.errorPages = [];
  if (coreConfig.disableTrailingSlashRedirects === undefined)
    coreConfig.disableTrailingSlashRedirects = false;
  if (coreConfig.allowDoubleSlashes === undefined)
    coreConfig.allowDoubleSlashes = false;
  if (coreConfig.enableIncludingHeadAndFootInHTML === undefined)
    coreConfig.enableIncludingHeadAndFootInHTML = true;

  // Replacing regular expressions with "regex strings"
  for (let i = 0; i < coreConfig.dontCompress; i++) {
    if (
      Object.prototype.toString.call(coreConfig.dontCompress[i]) ===
      "[object RegExp]"
    )
      coreConfig.dontCompress[i] =
        `/${coreConfig.dontCompress[i].source.replace(/(^|\\+)\//, (match, bSlashes) => (bSlashes.length % 2 == 0 ? "\\/" : "/"))}/${coreConfig.dontCompress[i].flags}`;
  }

  // You wouldn't use SVR.JS mods in SVR.JS Core
  coreConfig.exposeModsInErrorPages = false;

  return requestHandler;
}

module.exports = init;
module.exports.init = init;
