const generateServerString = require("./generateServerString.js");
const svrjsInfo = require("../../svrjs.json");
const { version, statisticsServerCollectEndpoint } = svrjsInfo;

let crypto = {
  __disabled__: null
};
let https = {
  createServer: () => {
    throw new Error("Crypto support is not present");
  },
  connect: () => {
    throw new Error("Crypto support is not present");
  },
  get: () => {
    throw new Error("Crypto support is not present");
  }
};
try {
  // eslint-disable-next-line no-unused-vars
  crypto = require("crypto");
  https = require("https");
  // eslint-disable-next-line no-unused-vars
} catch (err) {
  // Can't load HTTPS
}

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
  const statisticsRequest = https.request(
    statisticsServerCollectEndpoint,
    {
      method: "POST",
      headers: {
        "User-Agent": generateServerString(true),
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(statisticsToSend)
      }
    },
    (res) => {
      const statusCode = res.statusCode;
      let data = "";
      res.on("data", (chunk) => {
        data += chunk.toString();
      });
      res.on("end", () => {
        try {
          let parsedJson = {};
          try {
            parsedJson = JSON.parse(data);
            // eslint-disable-next-line no-unused-vars
          } catch (err) {
            throw new Error("JSON parse error (response parsing failed).");
          }
          if (parsedJson.status != statusCode)
            throw new Error("Status code mismatch");
          if (statusCode != 200) throw new Error(parsedJson.message);
          callback(null);
        } catch (err) {
          callback(err);
        }
      });
    }
  );
  statisticsRequest.on("error", (err) => {
    callback(err);
  });
  statisticsRequest.end(statisticsToSend);
}

module.exports = sendStatistics;
