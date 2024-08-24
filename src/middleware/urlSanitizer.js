const sanitizeURL = require("../utils/urlSanitizer.js");
const url = require("url");

module.exports = (req, res, logFacilities, config, next) => {
  // Sanitize URL
  let sanitizedHref = sanitizeURL(
    req.parsedURL.pathname,
    config.allowDoubleSlashes,
  );
  let preparedReqUrl =
    req.parsedURL.pathname + req.parsedURL.search + req.parsedURL.hash;

  // Check if URL is "dirty"
  if (req.parsedURL.pathname != sanitizedHref && !req.isProxy) {
    let sanitizedURL = new url.Url();
    sanitizedURL.path = null;
    sanitizedURL.href = null;
    sanitizedURL.pathname = sanitizedHref;
    sanitizedURL.hostname = null;
    sanitizedURL.host = null;
    sanitizedURL.port = null;
    sanitizedURL.protocol = null;
    sanitizedURL.slashes = null;
    sanitizedURL = url.format(sanitizedURL);
    logFacilities.resmessage(
      "URL sanitized: " + req.url + " => " + sanitizedURL,
    );
    if (config.rewriteDirtyURLs) {
      req.url = sanitizedURL;
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
    } else {
      res.redirect(sanitizedURL, false);
      return;
    }
  } else if (req.url != preparedReqUrl && !req.isProxy) {
    logFacilities.resmessage(
      "URL sanitized: " + req.url + " => " + preparedReqUrl,
    );
    if (config.rewriteDirtyURLs) {
      req.url = preparedReqUrl;
    } else {
      res.redirect(preparedReqUrl, false);
      return;
    }
  }

  next();
};
