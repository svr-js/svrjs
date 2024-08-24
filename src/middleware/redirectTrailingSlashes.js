const fs = require("fs");
const url = require("url");

module.exports = (req, res, logFacilities, config, next) => {
  // Trailing slash redirection
    if (
      !req.isProxy &&
      !config.disableTrailingSlashRedirects &&
      req.parsedURL.pathname[req.parsedURL.pathname.length - 1] != "/" &&
      req.originalParsedURL.pathname[
        req.originalParsedURL.pathname.length - 1
      ] != "/"
    ) {
      fs.stat(
        "." + decodeURIComponent(req.parsedURL.pathname),
        function (err, stats) {
          if (err || !stats.isDirectory()) {
            try {
              next();
            } catch (err) {
              res.error(500, err);
            }
          } else {
            var destinationURL = new url.Url();
            destinationURL.path = null;
            destinationURL.href = null;
            destinationURL.pathname = req.originalParsedURL.pathname + "/";
            destinationURL.hostname = null;
            destinationURL.host = null;
            destinationURL.port = null;
            destinationURL.protocol = null;
            destinationURL.slashes = null;
            destinationURL = url.format(destinationURL);
            res.redirect(destinationURL);
          }
        },
      );
    } else {
      next();
    }

};
