const http = require("http");
const svrjsInfo = require("../../svrjs.json");
const { name } = svrjsInfo;

module.exports = (req, res, logFacilities, config, next) => {
  if (req.isProxy) {
    let eheaders = config.getCustomHeaders();
    eheaders["Content-Type"] = "text/html; charset=utf-8";
    res.writeHead(501, http.STATUS_CODES[501], eheaders);
    res.write(
      '<!DOCTYPE html><html><head><title>Proxy not implemented</title><meta name="viewport" content="width=device-width, initial-scale=1.0" /><style>html{background-color:#dfffdf;color:#000000;font-family:FreeSans, Helvetica, Tahoma, Verdana, Arial, sans-serif;margin:0.75em}body{background-color:#ffffff;padding:0.5em 0.5em 0.1em;margin:0.5em auto;width:90%;max-width:800px;-webkit-box-shadow:0 5px 10px 0 rgba(0, 0, 0, 0.15);-moz-box-shadow:0 5px 10px 0 rgba(0, 0, 0, 0.15);box-shadow:0 5px 10px 0 rgba(0, 0, 0, 0.15)}h1{text-align:center;font-size:2.25em;margin:0.3em 0 0.5em}code{background-color:#dfffdf;-webkit-box-shadow:0 2px 4px 0 rgba(0, 0, 0, 0.1);-moz-box-shadow:0 2px 4px 0 rgba(0, 0, 0, 0.1);box-shadow:0 2px 4px 0 rgba(0, 0, 0, 0.1);display:block;padding:0.2em;font-family:"DejaVu Sans Mono", "Bitstream Vera Sans Mono", Hack, Menlo, Consolas, Monaco, monospace;font-size:0.85em;margin:auto;width:95%;max-width:600px}table{width:95%;border-collapse:collapse;margin:auto;overflow-wrap:break-word;word-wrap:break-word;word-break:break-all;word-break:break-word;position:relative;z-index:0}table tbody{background-color:#ffffff;color:#000000}table tbody:after{-webkit-box-shadow:0 4px 8px 0 rgba(0, 0, 0, 0.175);-moz-box-shadow:0 4px 8px 0 rgba(0, 0, 0, 0.175);box-shadow:0 4px 8px 0 rgba(0, 0, 0, 0.175);content:\' \';position:absolute;top:0;left:0;right:0;bottom:0;z-index:-1}table img{margin:0;display:inline}th,tr{padding:0.15em;text-align:center}th{background-color:#007000;color:#ffffff}th a{color:#ffffff}td,th{padding:0.225em}td{text-align:left}tr:nth-child(odd){background-color:#dfffdf}hr{color:#ffffff}@media screen and (prefers-color-scheme: dark){html{background-color:#002000;color:#ffffff}body{background-color:#000f00;-webkit-box-shadow:0 5px 10px 0 rgba(127, 127, 127, 0.15);-moz-box-shadow:0 5px 10px 0 rgba(127, 127, 127, 0.15);box-shadow:0 5px 10px 0 rgba(127, 127, 127, 0.15)}code{background-color:#002000;-webkit-box-shadow:0 2px 4px 0 rgba(127, 127, 127, 0.1);-moz-box-shadow:0 2px 4px 0 rgba(127, 127, 127, 0.1);box-shadow:0 2px 4px 0 rgba(127, 127, 127, 0.1)}a{color:#ffffff}a:hover{color:#00ff00}table tbody{background-color:#000f00;color:#ffffff}table tbody:after{-webkit-box-shadow:0 4px 8px 0 rgba(127, 127, 127, 0.175);-moz-box-shadow:0 4px 8px 0 rgba(127, 127, 127, 0.175);box-shadow:0 4px 8px 0 rgba(127, 127, 127, 0.175)}tr:nth-child(odd){background-color:#002000}}</style></head><body><h1>Proxy not implemented</h1><p>SVR.JS doesn\'t support proxy without proxy mod. If you\'re administator of this server, then install this mod in order to use ' +
        name
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;") +
        " as a proxy.</p><p><i>" +
        config
          .generateServerString()
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;") +
        "</i></p></body></html>",
    );
    res.end();
    logFacilities.errmessage(
      name + " doesn't support proxy without proxy mod.",
    );
    return;
  }

  if (req.method == "OPTIONS") {
    let hdss = config.getCustomHeaders();
    hdss["Allow"] = "GET, POST, HEAD, OPTIONS";
    res.writeHead(204, http.STATUS_CODES[204], hdss);
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
