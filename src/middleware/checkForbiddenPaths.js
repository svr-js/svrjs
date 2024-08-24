const os = require("os");
const path = require("path");

// Function to get URL path for use in forbidden path adding.
function getInitializePath(to) {
  const cwd = process.cwd();
  if (os.platform() == "win32") {
    to = to.replace(/\//g, "\\");
    if (to[0] == "\\") to = cwd.split("\\")[0] + to;
  }
  const absoluteTo = path.isAbsolute(to)
    ? to
    : __dirname + (os.platform() == "win32" ? "\\" : "/") + to;
  if (os.platform() == "win32" && cwd[0] != absoluteTo[0]) return "";
  const relative = path.relative(cwd, absoluteTo);
  if (os.platform() == "win32") {
    return "/" + relative.replace(/\\/g, "/");
  } else {
    return "/" + relative;
  }
}

// Function to check if URL path name is a forbidden path.
function isForbiddenPath(decodedHref, match) {
  const forbiddenPath = forbiddenPaths[match];
  if (!forbiddenPath) return false;
  if (typeof forbiddenPath === "string") {
    return (
      decodedHref === forbiddenPath ||
      (os.platform() === "win32" &&
        decodedHref.toLowerCase() === forbiddenPath.toLowerCase())
    );
  }
  if (typeof forbiddenPath === "object") {
    return forbiddenPath.some(function (forbiddenPathSingle) {
      return (
        decodedHref === forbiddenPathSingle ||
        (os.platform() === "win32" &&
          decodedHref.toLowerCase() === forbiddenPathSingle.toLowerCase())
      );
    });
  }
  return false;
}

// Function to check if URL path name is index of one of defined forbidden paths.
function isIndexOfForbiddenPath(decodedHref, match) {
  const forbiddenPath = forbiddenPaths[match];
  if (!forbiddenPath) return false;
  if (typeof forbiddenPath === "string") {
    return (
      decodedHref === forbiddenPath ||
      decodedHref.indexOf(forbiddenPath + "/") === 0 ||
      (os.platform() === "win32" &&
        (decodedHref.toLowerCase() === forbiddenPath.toLowerCase() ||
          decodedHref
            .toLowerCase()
            .indexOf(forbiddenPath.toLowerCase() + "/") === 0))
    );
  }
  if (typeof forbiddenPath === "object") {
    return forbiddenPath.some(function (forbiddenPathSingle) {
      return (
        decodedHref === forbiddenPathSingle ||
        decodedHref.indexOf(forbiddenPathSingle + "/") === 0 ||
        (os.platform() === "win32" &&
          (decodedHref.toLowerCase() === forbiddenPathSingle.toLowerCase() ||
            decodedHref
              .toLowerCase()
              .indexOf(forbiddenPathSingle.toLowerCase() + "/") === 0))
      );
    });
  }
  return false;
}

// Set up forbidden paths
var forbiddenPaths = {};

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
    (__dirname[__dirname.length - 1] != "/"
      ? __filename.replace(__dirname + "/", "")
      : __filename.replace(__dirname, "")),
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
