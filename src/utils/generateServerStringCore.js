const svrjsCoreInfo = require("../../svrjs.core.json");
const { name } = svrjsCoreInfo;
const svrjsInfo = require("../../svrjs.json");
const { version } = svrjsInfo;
const getOS = require("./getOS.js");
const serverStringWithVersion = `${name.replace(/ /g, "-")}/${version} (${getOS()}; ${
  process.isBun
    ? "Bun/v" + process.versions.bun + "; like Node.js/" + process.version
    : process.versions && process.versions.deno
      ? "Deno/v" + process.versions.deno + "; like Node.js/" + process.version
      : "Node.js/" + process.version
})`;
const serverStringWithoutVersion = name.replace(/ /g, "-");

function generateServerString(exposeServerVersion) {
  return exposeServerVersion
    ? serverStringWithVersion
    : serverStringWithoutVersion;
}

module.exports = generateServerString;
