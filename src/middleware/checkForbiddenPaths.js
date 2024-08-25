// WARNING: This middleware is optimized for production SVR.JS, and may not work correctly for development SVR.JS.
// Use "npm run dev" to test SVR.JS web server itself.
const {
  getInitializePath,
  isForbiddenPath,
  isIndexOfForbiddenPath,
  forbiddenPaths,
} = require("../utils/forbiddenPaths.js");

forbiddenPaths.config = getInitializePath("./config.json");
forbiddenPaths.certificates = [];
if (process.serverConfig.secure) {
  forbiddenPaths.certificates.push(
    getInitializePath(process.serverConfig.cert),
  );
  forbiddenPaths.certificates.push(getInitializePath(process.serverConfig.key));
  Object.keys(process.serverConfig.sni).forEach(function (sniHostname) {
    forbiddenPaths.certificates.push(
      getInitializePath(process.serverConfig.sni[sniHostname].cert),
    );
    forbiddenPaths.certificates.push(
      getInitializePath(process.serverConfig.sni[sniHostname].key),
    );
  });
}
forbiddenPaths.svrjs = getInitializePath(
  "./" +
    (process.dirname[process.dirname.length - 1] != "/"
      ? process.filename.replace(process.dirname + "/", "")
      : process.filename.replace(process.dirname, "")),
);
forbiddenPaths.serverSideScripts = [];
if (process.serverConfig.useWebRootServerSideScript) {
  forbiddenPaths.serverSideScripts.push("/serverSideScript.js");
} else {
  forbiddenPaths.serverSideScripts.push(
    getInitializePath("./serverSideScript.js"),
  );
}
forbiddenPaths.serverSideScriptDirectories = [];
forbiddenPaths.serverSideScriptDirectories.push(
  getInitializePath("./node_modules"),
);
forbiddenPaths.serverSideScriptDirectories.push(getInitializePath("./mods"));
forbiddenPaths.temp = getInitializePath("./temp");
forbiddenPaths.log = getInitializePath("./log");

module.exports = (req, res, logFacilities, config, next) => {
  let decodedHrefWithoutDuplicateSlashes = "";
  try {
    decodedHrefWithoutDuplicateSlashes = decodeURIComponent(
      req.parsedURL.pathname,
    ).replace(/\/+/g, "/");
  } catch (err) {
    res.error(400);
  }

  // Check if path is forbidden
  if (
    (isForbiddenPath(decodedHrefWithoutDuplicateSlashes, "config") ||
      isForbiddenPath(decodedHrefWithoutDuplicateSlashes, "certificates")) &&
    !req.isProxy
  ) {
    res.error(403);
    logFacilities.errmessage(
      "Access to configuration file/certificates is denied.",
    );
    return;
  } else if (
    isIndexOfForbiddenPath(decodedHrefWithoutDuplicateSlashes, "temp") &&
    !req.isProxy
  ) {
    res.error(403);
    logFacilities.errmessage("Access to temporary folder is denied.");
    return;
  } else if (
    isIndexOfForbiddenPath(decodedHrefWithoutDuplicateSlashes, "log") &&
    !req.isProxy &&
    (config.enableLogging || config.enableLogging == undefined) &&
    !config.enableRemoteLogBrowsing
  ) {
    res.error(403);
    logFacilities.errmessage("Access to log files is denied.");
    return;
  } else if (
    isForbiddenPath(decodedHrefWithoutDuplicateSlashes, "svrjs") &&
    !req.isProxy &&
    !config.exposeServerVersion
  ) {
    res.error(403);
    logFacilities.errmessage("Access to SVR.JS script is denied.");
    return;
  } else if (
    (isForbiddenPath(decodedHrefWithoutDuplicateSlashes, "svrjs") ||
      isForbiddenPath(
        decodedHrefWithoutDuplicateSlashes,
        "serverSideScripts",
      ) ||
      isIndexOfForbiddenPath(
        decodedHrefWithoutDuplicateSlashes,
        "serverSideScriptDirectories",
      )) &&
    !req.isProxy &&
    (config.disableServerSideScriptExpose ||
      config.disableServerSideScriptExpose === undefined)
  ) {
    res.error(403);
    logFacilities.errmessage("Access to sources is denied.");
    return;
  }

  next();
};

module.exports.proxySafe = true;