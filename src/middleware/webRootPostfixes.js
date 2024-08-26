const createRegex = require("../utils/createRegex.js");
const ipMatch = require("../utils/ipMatch.js");
const sanitizeURL = require("../utils/urlSanitizer.js");

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

  // Add web root postfixes
  if (!req.isProxy) {
    let preparedReqUrl3 = config.allowPostfixDoubleSlashes
      ? req.parsedURL.pathname.replace(/\/+/, "/") +
        req.parsedURL.search +
        req.parsedURL.hash
      : req.url;
    let urlWithPostfix = preparedReqUrl3;
    let postfixPrefix = "";
    config.wwwrootPostfixPrefixesVHost.every(function (currentPostfixPrefix) {
      if (preparedReqUrl3.indexOf(currentPostfixPrefix) == 0) {
        if (currentPostfixPrefix.match(/\/+$/))
          postfixPrefix = currentPostfixPrefix.replace(/\/+$/, "");
        else if (
          urlWithPostfix.length == currentPostfixPrefix.length ||
          urlWithPostfix[currentPostfixPrefix.length] == "?" ||
          urlWithPostfix[currentPostfixPrefix.length] == "/" ||
          urlWithPostfix[currentPostfixPrefix.length] == "#"
        )
          postfixPrefix = currentPostfixPrefix;
        else return true;
        urlWithPostfix = urlWithPostfix.substring(postfixPrefix.length);
        return false;
      } else {
        return true;
      }
    });
    config.wwwrootPostfixesVHost.every(function (postfixEntry) {
      if (
        matchHostname(postfixEntry.host) &&
        ipMatch(
          postfixEntry.ip,
          req.socket ? req.socket.localAddress : undefined,
        ) &&
        !(
          postfixEntry.skipRegex &&
          preparedReqUrl3.match(createRegex(postfixEntry.skipRegex))
        )
      ) {
        urlWithPostfix =
          postfixPrefix + "/" + postfixEntry.postfix + urlWithPostfix;
        return false;
      } else {
        return true;
      }
    });
    if (urlWithPostfix != preparedReqUrl3) {
      logFacilities.resmessage(
        "Added web root postfix: " + req.url + " => " + urlWithPostfix,
      );
      req.url = urlWithPostfix;
      try {
        req.parsedURL = new URL(
          req.url,
          `http${req.socket.encrypted ? "s" : ""}://${
            req.headers.host
              ? req.headers.host
              : config.domain
                ? config.domain
                : "unknown.invalid"
          }`,
        );
      } catch (err) {
        res.error(400, err);
        return;
      }

      const sHref = sanitizeURL(
        req.parsedURL.pathname,
        config.allowDoubleSlashes,
      );
      const preparedReqUrl2 =
        req.parsedURL.pathname + req.parsedURL.search + req.parsedURL.hash;

      if (
        req.url != preparedReqUrl2 ||
        sHref !=
          req.parsedURL.pathname
            .replace(/\/\.(?=\/|$)/g, "/")
            .replace(/\/+/g, "/")
      ) {
        res.error(403);
        logFacilities.errmessage("Content blocked.");
        return;
      } else if (sHref != req.parsedURL.pathname) {
        let rewrittenAgainURL =
          sHref + req.parsedURL.search + req.parsedURL.hash;
        logFacilities.resmessage(
          `URL sanitized: ${req.url} => ${rewrittenAgainURL}`,
        );
        req.url = rewrittenAgainURL;
        try {
          req.parsedURL = new URL(
            req.url,
            `http${req.socket.encrypted ? "s" : ""}://${
              req.headers.host
                ? req.headers.host
                : config.domain
                  ? config.domain
                  : "unknown.invalid"
            }`,
          );
        } catch (err) {
          res.error(400, err);
          return;
        }
      }
    }
  }

  next();
};

module.exports.proxySafe = true;
