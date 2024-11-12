const path = require("path");
const os = require("os");

function normalizeWebroot(currentWebroot) {
  if (currentWebroot === undefined) {
    return process.cwd();
  } else if (!path.isAbsolute(currentWebroot)) {
    return (
      process.cwd() + (os.platform() == "win32" ? "\\" : "/") + currentWebroot
    );
  } else {
    return currentWebroot;
  }
}

module.exports = normalizeWebroot;
