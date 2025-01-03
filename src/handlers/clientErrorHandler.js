const fs = require("fs");
const http = require("http");
const defaultPageCSS = require("../res/defaultPageCSS.js");
const statusCodes = require("../res/statusCodes.js");
const generateErrorStack = require("../utils/generateErrorStack.js");
const serverHTTPErrorDescs = require("../res/httpErrorDescriptions.js");
const generateServerString = require("../utils/generateServerString.js");
const deepClone = require("../utils/deepClone.js");
const normalizeWebroot = require("../utils/normalizeWebroot.js");
const ipMatch = require("../utils/ipMatch.js");

let serverconsole = {};

function clientErrorHandler(err, socket) {
  const config = deepClone(process.serverConfig);

  // Change the webroot if there is a webroot assigned for a virtual host
  if (config.wwwrootVHost) {
    config.wwwrootVHost.every((wwwrootVHost) => {
      if (
        ipMatch(wwwrootVHost.ip, socket ? socket.localAddress : undefined) &&
        wwwrootVHost.wwwroot
      ) {
        config.wwwroot = wwwrootVHost.wwwroot;
        return false;
      } else {
        return true;
      }
    });
  }

  // Normalize the webroot
  config.wwwroot = normalizeWebroot(config.wwwroot);

  config.generateServerString = () =>
    generateServerString(config.exposeServerVersion);

  // getCustomHeaders() in SVR.JS 3.x
  config.getCustomHeaders = () => Object.assign({}, config.customHeaders);

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
      socket.end(x, () => {
        try {
          socket.destroy();
          // eslint-disable-next-line no-unused-vars
        } catch (err) {
          // Socket is probably already destroyed
        }
      });
    },
    writeHead: (code, name, headers) => {
      if (code >= 400 && code <= 499) process.err4xxcounter++;
      if (code >= 500 && code <= 599) process.err5xxcounter++;
      let head = "HTTP/1.1 " + code.toString() + " " + name + "\r\n";
      headers = Object.assign({}, headers);
      headers["Date"] = new Date().toGMTString();
      headers["Connection"] = "close";
      Object.keys(headers).forEach((headername) => {
        if (headername.toLowerCase() == "set-cookie") {
          headers[headername].forEach((headerValueS) => {
            if (
              // eslint-disable-next-line no-control-regex
              headername.match(/[^\x09\x20-\x7e\x80-\xff]|.:/) ||
              // eslint-disable-next-line no-control-regex
              headerValueS.match(/[^\x09\x20-\x7e\x80-\xff]/)
            )
              throw new Error(`Invalid header!!! (${headername})`);
            head += headername + ": " + headerValueS;
          });
        } else {
          if (
            // eslint-disable-next-line no-control-regex
            headername.match(/[^\x09\x20-\x7e\x80-\xff]|.:/) ||
            // eslint-disable-next-line no-control-regex
            headers[headername].match(/[^\x09\x20-\x7e\x80-\xff]/)
          )
            throw new Error(`Invalid header!!! (${headername})`);
          head += headername + ": " + headers[headername];
        }
        head += "\r\n";
      });
      head += "\r\n";
      res.write(head);
    }
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
    locmessage: (msg) => serverconsole.locmessage(msg, reqId)
  };

  socket.on("close", (hasError) => {
    if (
      !hasError ||
      err.code == "ERR_SSL_HTTP_REQUEST" ||
      err.message.indexOf("http request") != -1
    )
      logFacilities.locmessage("Client disconnected.");
    else logFacilities.locmessage("Client disconnected due to error.");
  });
  socket.on("error", () => {});

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
        "Error stack parameter needs to be either a string or an instance of Error object."
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
                      callServerError(500, err2);
                    }
                  }
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
                  callServerError(500, err2);
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

      if (list[_i].scode != errorCode) {
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
      if (Object.prototype.toString.call(stack) === "[object Error]")
        stack = generateErrorStack(stack);
      if (stack === undefined)
        stack = generateErrorStack(new Error("Unknown error"));
      if (errorCode == 500 || errorCode == 502) {
        logFacilities.errmessage(
          "There was an error while processing the request!"
        );
        logFacilities.errmessage("Stack:");
        logFacilities.errmessage(stack);
      }
      if (config.stackHidden) stack = "[error stack hidden]";
      if (serverHTTPErrorDescs[errorCode] === undefined) {
        callServerError(501, extName, stack);
      } else {
        let cheaders = { ...config.getCustomHeaders(), ...ch };
        cheaders["Content-Type"] = "text/html";
        if (errorCode == 405 && !cheaders["Allow"])
          cheaders["Allow"] = "GET, POST, HEAD, OPTIONS";
        if (
          err.code == "ERR_SSL_HTTP_REQUEST" &&
          process.version &&
          parseInt(process.version.split(".")[0].substring(1)) >= 16
        ) {
          // Disable custom error page for HTTP SSL error
          res.writeHead(errorCode, statusCodes[errorCode], cheaders);
          res.write(
            `<!DOCTYPE html><html><head><title>{errorMessage}</title><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><style>${defaultPageCSS}${"</style></head><body><h1>{errorMessage}</h1><p>{errorDesc}</p><p><i>{server}</i></p></body></html>"
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
                /{server}/g,
                (
                  config.generateServerString() +
                  (!config.exposeModsInErrorPages || extName == undefined
                    ? ""
                    : " " + extName)
                )
                  .replace(/&/g, "&amp;")
                  .replace(/</g, "&lt;")
                  .replace(/>/g, "&gt;")
              )
              .replace(
                /{contact}/g,
                config.serverAdministratorEmail
                  .replace(/&/g, "&amp;")
                  .replace(/</g, "&lt;")
                  .replace(/>/g, "&gt;")
                  .replace(/\./g, "[dot]")
                  .replace(/@/g, "[at]")
              )}`
          );
          res.end();
        } else {
          fs.readFile(errorFile, (err, data) => {
            try {
              if (err) throw err;
              res.writeHead(errorCode, statusCodes[errorCode], cheaders);
              responseEnd(
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
                    /{server}/g,
                    (
                      config.generateServerString() +
                      (!config.exposeModsInErrorPages || extName == undefined
                        ? ""
                        : " " + extName)
                    )
                      .replace(/&/g, "&amp;")
                      .replace(/</g, "&lt;")
                      .replace(/>/g, "&gt;")
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
                    /{server}/g,
                    (
                      config.generateServerString() +
                      (!config.exposeModsInErrorPages || extName == undefined
                        ? ""
                        : " " + extName)
                    )
                      .replace(/&/g, "&amp;")
                      .replace(/</g, "&lt;")
                      .replace(/>/g, "&gt;")
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
    `Somebody connected to ${
      config.secure && fromMain
        ? (typeof config.sport == "number" ? "port " : "socket ") + config.sport
        : (typeof config.port == "number" ? "port " : "socket ") + config.port
    }...`
  );
  logFacilities.reqmessage(
    `Client ${
      !reqip || reqip == ""
        ? "[unknown client]"
        : reqip +
          (reqport && reqport !== 0 && reqport != "" ? ":" + reqport : "")
    } sent invalid request.`
  );
  try {
    if (
      config.enableIncludingHeadAndFootInHTML ||
      config.enableIncludingHeadAndFootInHTML === undefined
    ) {
      head = fs.existsSync(`${config.wwwroot}/.head`)
        ? fs.readFileSync(`${config.wwwroot}/.head`).toString()
        : fs.existsSync(`${config.wwwroot}/head.html`)
          ? fs.readFileSync(`${config.wwwroot}/head.html`).toString()
          : ""; // header
      foot = fs.existsSync(`${config.wwwroot}/.foot`)
        ? fs.readFileSync(`${config.wwwroot}/.foot`).toString()
        : fs.existsSync(`${config.wwwroot}/foot.html`)
          ? fs.readFileSync(`${config.wwwroot}/foot.html`).toString()
          : ""; // footer
    }

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
          `An SSL error occurred: ${err.code ? err.code : err.message}`
        );
        callServerError(400);
        return;
      }
    }

    if (err.code && err.code.indexOf("ERR_HTTP2_") == 0) {
      logFacilities.errmessage(`An HTTP/2 error occurred: ${err.code}`);
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
          "The request is invalid (it may be a part of larger invalid request)."
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
    } else if (!httpVersion.toString().match(/^HTTP[/]/i)) {
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
    // eslint-disable-next-line no-unused-vars
  } catch (err) {
    logFacilities.errmessage(
      "There was an error while determining type of malformed request."
    );
    callServerError(400);
  }
}

module.exports = (serverconsoleO) => {
  serverconsole = serverconsoleO;
  return clientErrorHandler;
};
