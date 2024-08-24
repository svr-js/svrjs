const svrjsInfo = require("../../svrjs.json");
const {version, name} = svrjsInfo;
const getOS = require("./getOS.js");

function generateServerString(exposeServerVersion) {
  return exposeServerVersion
  ? name +
    "/" +
    version +
    " (" +
    getOS() +
    "; " +
    (process.isBun
      ? "Bun/v" + process.versions.bun + "; like Node.JS/" + process.version
      : "Node.JS/" + process.version) +
    ")"
  : name;
}

module.exports = generateServerString;