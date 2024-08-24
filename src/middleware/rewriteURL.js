const fs = require("fs");
const url = require("url");
const createRegex = require("../utils/createRegex.js");
const ipMatch = require("../utils/ipMatch.js");
const sanitizeURL = require("../utils/urlSanitizer.js");

module.exports = (req, res, logFacilities, config, next) => {
  try {
    decodeURIComponent(req.parsedURL.pathname);
  } catch (err) {
    res.error(400);
  }

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

  // Handle URL rewriting
  const rewriteURL = (address, map, callback, _fileState, _mapBegIndex) => {
    let rewrittenURL = address;
    let doCallback = true;
    if (!req.isProxy) {
      for (let i = _mapBegIndex ? _mapBegIndex : 0; i < map.length; i++) {
        let mapEntry = map[i];
        if (
          req.parsedUrl.pathname != "/" &&
          (mapEntry.isNotDirectory || mapEntry.isNotFile) &&
          !_fileState
        ) {
          fs.stat(
            "." + decodeURIComponent(req.parsedUrl.pathname),
            (err, stats) => {
              var _fileState = 3;
              if (err) {
                _fileState = 3;
              } else if (stats.isDirectory()) {
                _fileState = 2;
              } else if (stats.isFile()) {
                _fileState = 1;
              } else {
                _fileState = 3;
              }
              rewriteURL(address, map, callback, _fileState, i);
            },
          );
          doCallback = false;
          break;
        }
        let tempRewrittenURL = rewrittenURL;
        if (!mapEntry.allowDoubleSlashes) {
          address = address.replace(/\/+/g, "/");
          tempRewrittenURL = address;
        }
        if (
          matchHostname(mapEntry.host) &&
          ipMatch(
            mapEntry.ip,
            req.socket ? req.socket.localAddress : undefined,
          ) &&
          address.match(createRegex(mapEntry.definingRegex)) &&
          !(mapEntry.isNotDirectory && _fileState == 2) &&
          !(mapEntry.isNotFile && _fileState == 1)
        ) {
          rewrittenURL = tempRewrittenURL;
          try {
            mapEntry.replacements.forEach(function (replacement) {
              rewrittenURL = rewrittenURL.replace(
                createRegex(replacement.regex),
                replacement.replacement,
              );
            });
            if (mapEntry.append) rewrittenURL += mapEntry.append;
          } catch (err) {
            doCallback = false;
            callback(err, null);
          }
          break;
        }
      }
    }
    if (doCallback) callback(null, rewrittenURL);
  };

  // Rewrite URLs
  rewriteURL(req.url, config.rewriteMap, function (err, rewrittenURL) {
    if (err) {
      res.error(500, err);
      return;
    }
    if (rewrittenURL != req.url) {
      logFacilities.resmessage(
        "URL rewritten: " + req.url + " => " + rewrittenURL,
      );
      req.url = rewrittenURL;
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

      var sHref = sanitizeURL(
        req.parsedURL.pathname,
        config.allowDoubleSlashes,
      );
      var preparedReqUrl2 =
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
        var rewrittenAgainURL = new url.Url();
        rewrittenAgainURL.path = null;
        rewrittenAgainURL.href = null;
        rewrittenAgainURL.pathname = sHref;
        rewrittenAgainURL.hostname = null;
        rewrittenAgainURL.host = null;
        rewrittenAgainURL.port = null;
        rewrittenAgainURL.protocol = null;
        rewrittenAgainURL.slashes = null;
        rewrittenAgainURL = url.format(rewrittenAgainURL);
        logFacilities.resmessage(
          "URL sanitized: " + req.url + " => " + rewrittenAgainURL,
        );
        req.url = rewrittenAgainURL;
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
      }
    }

    next();
  });
};
