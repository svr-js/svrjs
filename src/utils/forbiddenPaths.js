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

function isForbiddenPath(decodedHref, match) {
  const forbiddenPath = forbiddenPaths[match];
  if (!forbiddenPath) return false;

  const isWin32 = os.platform() === "win32";
  const decodedHrefLower = isWin32 ? decodedHref.toLowerCase() : null;

  if (typeof forbiddenPath === "string") {
    return isWin32
      ? decodedHrefLower === forbiddenPath.toLowerCase()
      : decodedHref === forbiddenPath;
  }

  if (typeof forbiddenPath === "object") {
    return isWin32
      ? forbiddenPath.some((path) => decodedHrefLower === path.toLowerCase())
      : forbiddenPath.includes(decodedHref);
  }

  return false;
}

function isIndexOfForbiddenPath(decodedHref, match) {
  const forbiddenPath = forbiddenPaths[match];
  if (!forbiddenPath) return false;

  const isWin32 = os.platform() === "win32";
  const decodedHrefLower = isWin32 ? decodedHref.toLowerCase() : null;

  if (typeof forbiddenPath === "string") {
    const forbiddenPathLower = isWin32 ? forbiddenPath.toLowerCase() : null;
    return isWin32
      ? decodedHrefLower === forbiddenPathLower ||
          decodedHrefLower.indexOf(forbiddenPathLower + "/") == 0
      : decodedHref === forbiddenPath ||
          decodedHref.indexOf(forbiddenPath + "/") == 0;
  }

  if (typeof forbiddenPath === "object") {
    return isWin32
      ? forbiddenPath.some(
          (path) =>
            decodedHrefLower === path.toLowerCase() ||
            decodedHrefLower.indexOf(path.toLowerCase() + "/") == 0,
        )
      : forbiddenPath.some(
          (path) =>
            decodedHref === path || decodedHref.indexOf(path + "/") == 0,
        );
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
