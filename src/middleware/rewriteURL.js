const fs = require("fs");
const createRegex = require("../utils/createRegex.js");
const ipMatch = require("../utils/ipMatch.js");
const matchHostname = require("../utils/matchHostname.js");

module.exports = (req, res, logFacilities, config, next) => {
  try {
    decodeURIComponent(req.parsedURL.pathname);
    // eslint-disable-next-line no-unused-vars
  } catch (err) {
    res.error(400);
  }

  req.originalParsedURL = req.parsedURL;

  // Handle URL rewriting
  const rewriteURL = (address, map, callback, _fileState, _mapBegIndex) => {
    let rewrittenURL = address;
    let doCallback = true;
    if (!req.isProxy) {
      for (let i = _mapBegIndex ? _mapBegIndex : 0; i < map.length; i++) {
        let mapEntry = map[i];
        if (
          req.parsedURL.pathname != "/" &&
          (mapEntry.isNotDirectory || mapEntry.isNotFile) &&
          !_fileState
        ) {
          fs.stat(
            config.wwwroot + decodeURIComponent(req.parsedURL.pathname),
            (err, stats) => {
              let _fileState = 3;
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
            }
          );
          doCallback = false;
          break;
        }
        let tempRewrittenURL = rewrittenURL;
        if (!mapEntry.allowDoubleSlashes) {
          address = address.replace(/\/+/g, "/");
          tempRewrittenURL = address;
        }
        try {
          if (
            matchHostname(mapEntry.host, req.headers.host) &&
            ipMatch(
              mapEntry.ip,
              req.socket ? req.socket.localAddress : undefined
            ) &&
            address.match(createRegex(mapEntry.definingRegex)) &&
            !(mapEntry.isNotDirectory && _fileState == 2) &&
            !(mapEntry.isNotFile && _fileState == 1)
          ) {
            rewrittenURL = tempRewrittenURL;
            mapEntry.replacements.forEach((replacement) => {
              rewrittenURL = rewrittenURL.replace(
                createRegex(replacement.regex),
                replacement.replacement
              );
            });
            if (mapEntry.append) rewrittenURL += mapEntry.append;
            break;
          }
        } catch (err) {
          doCallback = false;
          callback(err, null);
          break;
        }
      }
    }
    if (doCallback) callback(null, rewrittenURL);
  };

  // Rewrite URLs
  rewriteURL(req.url, config.rewriteMap, (err, rewrittenURL) => {
    if (err) {
      res.error(500, err);
      return;
    }
    if (rewrittenURL != req.url) {
      req.rewriteURL(rewrittenURL, next);
    } else {
      next();
    }
  });
};

module.exports.proxySafe = true;
