const generateServerString = require("./generateServerString.js");
const svrjsInfo = require("../svrjs.json");
const { version, statisticsServerCollectEndpoint } = svrjsInfo;

let crypto = {
  __disabled__: null,
};
let https = {
  createServer: function () {
    throw new Error("Crypto support is not present");
  },
  connect: function () {
    throw new Error("Crypto support is not present");
  },
  get: function () {
    throw new Error("Crypto support is not present");
  },
};
try {
  crypto = require("crypto");
  https = require("https");
} catch (err) {
  // Can't load HTTPS
}

function sendStatistics(modInfos, callback) {
  const statisticsToSend = JSON.stringify({
    version: version,
    runtime: process.isBun ? "Bun" : "Node.js",
    runtimeVersion: process.isBun ? process.versions.bun : process.version,
    mods: modInfos,
  });
  const statisticsRequest = https.request(
    statisticsServerCollectEndpoint,
    {
      method: "POST",
      headers: {
        "User-Agent": generateServerString(true),
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(statisticsToSend),
      },
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
    },
  );
  statisticsRequest.on("error", (err) => {
    callback(err);
  });
  statisticsRequest.end(statisticsToSend);
}

module.exports = sendStatistics;
