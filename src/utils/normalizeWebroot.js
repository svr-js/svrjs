const path = require("path");
const os = require("os");

function normalizeWebroot(currentWebroot) {
  if (currentWebroot === undefined) {
    return process.cwd();
  } else if (!path.isAbsolute(currentWebroot)) {
    // This part is the trickiest to implement...
    let dotdotWwwrootB =
      "/" +
      (process.serverConfig && process.serverConfig.wwwroot
        ? process.serverConfig.wwwroot
        : ".");
    if (os.platform() == "win32") {
      dotdotWwwrootB = dotdotWwwrootB.replace(/\\/g, "/");
    }

    dotdotWwwrootB = dotdotWwwrootB.replace(/\/{2,}/g, "/");

    dotdotWwwrootB = dotdotWwwrootB
      .replace(/\/\.(?:\.{2,})?(?=\/|$)/g, "")
      .replace(/([^./])\.+(?=\/|$)/g, "$1");

    while (dotdotWwwrootB.match(/\/(?!\.\.\/)[^/]+\/\.\.(?=\/|$)/)) {
      dotdotWwwrootB = dotdotWwwrootB.replace(
        /\/(?!\.\.\/)[^/]+\/\.\.(?=\/|$)/g,
        ""
      );
    }

    dotdotWwwrootB = dotdotWwwrootB
      .replace(/^\/+/, "")
      .replace(/\/+$/, "")
      .replace(/\/{2,}/, "");

    return (
      process.cwd() +
      ((os.platform() == "win32" ? "\\" : "/") + "..").repeat(
        dotdotWwwrootB.split("/").length
      ) +
      (os.platform() == "win32" ? "\\" : "/") +
      currentWebroot
    );
  } else {
    return currentWebroot;
  }
}

module.exports = normalizeWebroot;
