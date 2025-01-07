const generateServerString = require("./generateServerString.js");
const svrjsInfo = require("../../svrjs.json");
const { version, statisticsServerCollectEndpoint } = svrjsInfo;

function sendStatistics(modInfos, callback) {
  const statisticsToSend = JSON.stringify({
    version: version,
    runtime: process.isBun
      ? "Bun"
      : process.versions && process.versions.deno
        ? "Deno"
        : "Node.js",
    runtimeVersion: process.isBun
      ? process.versions.bun
      : process.versions && process.versions.deno
        ? process.versions.deno
        : process.version,
    mods: modInfos
  });

  // Fetch API is present in Node.js 18 and newer. For older versions, Fetch API implementation from "node-fetch" library is used (it is polyfilled).
  fetch(statisticsServerCollectEndpoint, {
    method: "POST",
    headers: {
      "User-Agent": generateServerString(true),
      "Content-Type": "application/json",
      "Content-Length": statisticsToSend.length // Note: Content-Length is not strictly necessary with Fetch
    },
    body: statisticsToSend
  })
    .then((res) => {
      const statusCode = res.status;
      return res
        .json()
        .then((data) => {
          if (!data) {
            callback(new Error("Unspecified JSON parse error"));
            return;
          } else if (data.status !== statusCode) {
            callback(new Error("Status code mismatch"));
            return;
          } else if (statusCode !== 200) {
            callback(new Error(data.message));
            return;
          }
          callback(null);
        })
        .catch((err) => {
          callback(err);
        });
    })
    .catch((err) => {
      callback(err);
    });
}

module.exports = sendStatistics;
