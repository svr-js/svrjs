const svrjsInfo = require("../../svrjs.json");
const { version, name } = svrjsInfo;
const getOS = require("./getOS.js");

function generateServerString(exposeServerVersion) {
  return exposeServerVersion
    ? `${name.replace(/ /g, "-")}/${version} (${getOS()}; ${
        process.isBun
          ? "Bun/v" + process.versions.bun + "; like Node.JS/" + process.version
          : process.versions && process.versions.deno
            ? "Deno/v" +
              process.versions.deno +
              "; like Node.JS/" +
              process.version
            : "Node.JS/" + process.version
      })`
    : name.replace(/ /g, "-");
}

module.exports = generateServerString;
