const fs = require("fs");

module.exports = (req, res, logFacilities, config, next) => {
  // Trailing slash redirection
  if (
    !req.isProxy &&
    !config.disableTrailingSlashRedirects &&
    req.parsedURL.pathname[req.parsedURL.pathname.length - 1] != "/" &&
    req.originalParsedURL.pathname[req.originalParsedURL.pathname.length - 1] !=
      "/"
  ) {
    fs.stat(
      config.wwwroot + decodeURIComponent(req.parsedURL.pathname),
      (err, stats) => {
        if (err || !stats.isDirectory()) {
          try {
            next();
          } catch (err) {
            res.error(500, err);
          }
        } else {
          res.redirect(
            req.originalParsedURL.pathname +
              "/" +
              (req.parsedURL.search ? req.parsedURL.search : "") +
              (req.parsedURL.hash ? req.parsedURL.hash : "")
          );
        }
      }
    );
  } else {
    next();
  }
};

module.exports.proxySafe = true;
