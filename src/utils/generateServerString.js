const svrjsInfo = require("../../svrjs.json");
const version = svrjsInfo.version;
const getOS = require("./getOS.js");

function generateServerString(exposeServerVersion) {
  return exposeServerVersion
  ? "SVR.JS/" +
    version +
    " (" +
    getOS() +
    "; " +
    (process.isBun
      ? "Bun/v" + process.versions.bun + "; like Node.JS/" + process.version
      : "Node.JS/" + process.version) +
    ")"
  : "SVR.JS";
}

module.exports = generateServerString;