const http = require("http");
const os = require("os");
const sizify = require("../utils/sizify.js");
const svrjsInfo = require("../../svrjs.json");
const { name } = svrjsInfo;

module.exports = (req, res, logFacilities, config, next) => {
  if (
    config.allowStatus &&
    (req.parsedURL.pathname == "/svrjsstatus.svr" ||
      (os.platform() == "win32" &&
        req.parsedURL.pathname.toLowerCase() == "/svrjsstatus.svr"))
  ) {
    const formatRelativeTime = (relativeTime) => {
      const days = Math.floor(relativeTime / 60 / (60 * 24));
      const dateDiff = new Date(relativeTime * 1000);
      return (
        days +
        " days, " +
        dateDiff.getUTCHours() +
        " hours, " +
        dateDiff.getUTCMinutes() +
        " minutes, " +
        dateDiff.getUTCSeconds() +
        " seconds"
      );
    };
    let statusBody = "";
    statusBody +=
      "Server version: " + config.generateServerString() + "<br/><hr/>";

    //Those entries are just dates and numbers converted/formatted to strings, so no escaping is needed.
    statusBody +=
      "Current time: " +
      new Date().toString() +
      "<br/>Thread start time: " +
      new Date(new Date() - process.uptime() * 1000).toString() +
      "<br/>Thread uptime: " +
      formatRelativeTime(Math.floor(process.uptime())) +
      "<br/>";
    statusBody += "OS uptime: " + formatRelativeTime(os.uptime()) + "<br/>";
    statusBody += "Total request count: " + process.reqcounter + "<br/>";
    statusBody +=
      "Average request rate: " +
      Math.round((process.reqcounter / process.uptime()) * 100) / 100 +
      " requests/s<br/>";
    statusBody += "Client errors (4xx): " + process.err4xxcounter + "<br/>";
    statusBody += "Server errors (5xx): " + process.err5xxcounter + "<br/>";
    statusBody +=
      "Average error rate: " +
      Math.round(
        ((process.err4xxcounter + process.err5xxcounter) / process.reqcounter) *
          10000,
      ) /
        100 +
      "%<br/>";
    statusBody += "Malformed HTTP requests: " + process.malformedcounter;
    if (process.memoryUsage)
      statusBody +=
        "<br/>Memory usage of thread: " +
        sizify(process.memoryUsage().rss, true) +
        "B";
    if (process.cpuUsage)
      statusBody +=
        "<br/>Total CPU usage by thread: u" +
        process.cpuUsage().user / 1000 +
        "ms s" +
        process.cpuUsage().system / 1000 +
        "ms - " +
        Math.round(
          ((process.cpuUsage().user + process.cpuUsage().system) /
            1000000 /
            process.uptime()) *
            1000,
        ) /
          1000 +
        "%";
    statusBody += "<br/>Thread PID: " + process.pid + "<br/>";

    res.writeHead(200, http.STATUS_CODES[200], {
      "Content-Type": "text/html; charset=utf-8",
    });
    res.end(
      (res.head == ""
        ? "<!DOCTYPE html><html><head><title>SVR.JS status" +
          (req.headers.host == undefined
            ? ""
            : " for " +
              String(req.headers.host)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")) +
          '</title><meta name="viewport" content="width=device-width, initial-scale=1.0" /><style>html{background-color:#dfffdf;color:#000000;font-family:FreeSans, Helvetica, Tahoma, Verdana, Arial, sans-serif;margin:0.75em}body{background-color:#ffffff;padding:0.5em 0.5em 0.1em;margin:0.5em auto;width:90%;max-width:800px;-webkit-box-shadow:0 5px 10px 0 rgba(0, 0, 0, 0.15);-moz-box-shadow:0 5px 10px 0 rgba(0, 0, 0, 0.15);box-shadow:0 5px 10px 0 rgba(0, 0, 0, 0.15)}h1{text-align:center;font-size:2.25em;margin:0.3em 0 0.5em}code{background-color:#dfffdf;-webkit-box-shadow:0 2px 4px 0 rgba(0, 0, 0, 0.1);-moz-box-shadow:0 2px 4px 0 rgba(0, 0, 0, 0.1);box-shadow:0 2px 4px 0 rgba(0, 0, 0, 0.1);display:block;padding:0.2em;font-family:"DejaVu Sans Mono", "Bitstream Vera Sans Mono", Hack, Menlo, Consolas, Monaco, monospace;font-size:0.85em;margin:auto;width:95%;max-width:600px}table{width:95%;border-collapse:collapse;margin:auto;overflow-wrap:break-word;word-wrap:break-word;word-break:break-all;word-break:break-word;position:relative;z-index:0}table tbody{background-color:#ffffff;color:#000000}table tbody:after{-webkit-box-shadow:0 4px 8px 0 rgba(0, 0, 0, 0.175);-moz-box-shadow:0 4px 8px 0 rgba(0, 0, 0, 0.175);box-shadow:0 4px 8px 0 rgba(0, 0, 0, 0.175);content:\' \';position:absolute;top:0;left:0;right:0;bottom:0;z-index:-1}table img{margin:0;display:inline}th,tr{padding:0.15em;text-align:center}th{background-color:#007000;color:#ffffff}th a{color:#ffffff}td,th{padding:0.225em}td{text-align:left}tr:nth-child(odd){background-color:#dfffdf}hr{color:#ffffff}@media screen and (prefers-color-scheme: dark){html{background-color:#002000;color:#ffffff}body{background-color:#000f00;-webkit-box-shadow:0 5px 10px 0 rgba(127, 127, 127, 0.15);-moz-box-shadow:0 5px 10px 0 rgba(127, 127, 127, 0.15);box-shadow:0 5px 10px 0 rgba(127, 127, 127, 0.15)}code{background-color:#002000;-webkit-box-shadow:0 2px 4px 0 rgba(127, 127, 127, 0.1);-moz-box-shadow:0 2px 4px 0 rgba(127, 127, 127, 0.1);box-shadow:0 2px 4px 0 rgba(127, 127, 127, 0.1)}a{color:#ffffff}a:hover{color:#00ff00}table tbody{background-color:#000f00;color:#ffffff}table tbody:after{-webkit-box-shadow:0 4px 8px 0 rgba(127, 127, 127, 0.175);-moz-box-shadow:0 4px 8px 0 rgba(127, 127, 127, 0.175);box-shadow:0 4px 8px 0 rgba(127, 127, 127, 0.175)}tr:nth-child(odd){background-color:#002000}}</style></head><body>'
        : res.head.replace(
            /<head>/i,
            "<head><title>" +
              name
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;") +
              " status" +
              (req.headers.host == undefined
                ? ""
                : " for " +
                  String(req.headers.host)
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")) +
              "</title>",
          )) +
        "<h1>" +
        name
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;") +
        " status" +
        (req.headers.host == undefined
          ? ""
          : " for " +
            String(req.headers.host)
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")) +
        "</h1>" +
        statusBody +
        (res.foot == "" ? "</body></html>" : res.foot),
    );
    return;
  }
  next();
};
