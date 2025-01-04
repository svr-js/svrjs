const os = require("os");

const useWebRootServerSideScript =
  process.serverConfig.useWebRootServerSideScript;

module.exports = (req, res, logFacilities, config, next) => {
  if (useWebRootServerSideScript) {
    let decodedHrefWithoutDuplicateSlashes = "";
    try {
      decodedHrefWithoutDuplicateSlashes = decodeURIComponent(
        req.parsedURL.pathname
      ).replace(/\/+/g, "/");
      // eslint-disable-next-line no-unused-vars
    } catch (err) {
      res.error(400);
      return;
    }

    // Forbid access to server-side JavaScript, if it is in the webroot.
    if (
      decodedHrefWithoutDuplicateSlashes == "/serverSideScript.js" ||
      (os.platform() == "win32" &&
        decodedHrefWithoutDuplicateSlashes.toLowerCase() ==
          "/serversidescript.js")
    ) {
      res.error(403);
      logFacilities.errmessage("Access to server-side JavaScript is denied.");
      return;
    }
  }

  next();
};

module.exports.proxySafe = true;
