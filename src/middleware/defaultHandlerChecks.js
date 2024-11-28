const defaultPageCSS = require("../res/defaultPageCSS.js");
const statusCodes = require("../res/statusCodes.js");
const svrjsInfo = require("../../svrjs.json");
const { name } = svrjsInfo;

module.exports = (req, res, logFacilities, config, next) => {
  if (req.isProxy) {
    let eheaders = config.getCustomHeaders();
    eheaders["Content-Type"] = "text/html";
    res.writeHead(501, statusCodes[501], eheaders);
    res.write(
      `<!DOCTYPE html><html><head><title>Proxy not implemented</title><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><style>${defaultPageCSS}</style></head><body><h1>Proxy not implemented</h1><p>${name
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(
          />/g,
          "&gt;"
        )} doesn't support proxy without proxy mod. If you're administator of this server, then install this mod in order to use ${name
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")} as a proxy.</p><p><i>${config
        .generateServerString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")}</i></p></body></html>`
    );
    res.end();
    logFacilities.errmessage(
      `${name} doesn't support proxy without proxy mod.`
    );
    return;
  }

  if (req.method == "OPTIONS") {
    let hdss = config.getCustomHeaders();
    hdss["Allow"] = "GET, POST, HEAD, OPTIONS";
    res.writeHead(204, statusCodes[204], hdss);
    res.end();
    return;
  } else if (
    req.method != "GET" &&
    req.method != "POST" &&
    req.method != "HEAD"
  ) {
    res.error(405);
    logFacilities.errmessage("Invaild method: " + req.method);
    return;
  }

  next();
};

module.exports.proxySafe = true;
