const os = require("os");
const path = require("path");

// Function to get URL path for use in forbidden path adding.
function getInitializePath(to) {
  const isWin32 = os.platform() == "win32";
  const pathModS = isWin32 ? path.win32 : path.posix; // pathModS needed just for the test suite
  const cwd = process.cwd();
  if (isWin32) {
    to = to.replace(/\//g, "\\");
    if (to[0] == "\\") to = cwd.split("\\")[0] + to;
  }
  const absoluteTo = pathModS.isAbsolute(to)
    ? to
    : process.dirname + (isWin32 ? "\\" : "/") + to;
  if (isWin32 && cwd[0] != absoluteTo[0]) return "";
  const relative = pathModS.relative(cwd, absoluteTo);
  if (isWin32) {
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
    return forbiddenPath.some((forbiddenPathSingle) => {
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
    return forbiddenPath.some((forbiddenPathSingle) => {
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
let forbiddenPaths = {};

module.exports = {
  getInitializePath: getInitializePath,
  isForbiddenPath: isForbiddenPath,
  isIndexOfForbiddenPath: isIndexOfForbiddenPath,
  forbiddenPaths: forbiddenPaths,
};
