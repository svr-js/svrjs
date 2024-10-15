const os = require("os");
const defaultPageCSS = require("../res/defaultPageCSS.js");
const sizify = require("../utils/sizify.js");
const statusCodes = require("../res/statusCodes.js");
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
    statusBody += `Current time: ${new Date().toString()}<br/>Thread start time: ${new Date(new Date() - process.uptime() * 1000).toString()}<br/>Thread uptime: ${formatRelativeTime(Math.floor(process.uptime()))}<br/>`;
    statusBody += `OS uptime: ${formatRelativeTime(os.uptime())}<br/>`;
    statusBody += `Total request count: ${process.reqcounter}<br/>`;
    statusBody += `Average request rate: ${Math.round((process.reqcounter / process.uptime()) * 100) / 100} requests/s<br/>`;
    statusBody += `Client errors (4xx): ${process.err4xxcounter}<br/>`;
    statusBody += `Server errors (5xx): ${process.err5xxcounter}<br/>`;
    statusBody += `Average error rate: ${
      Math.round(
        ((process.err4xxcounter + process.err5xxcounter) / process.reqcounter) *
          10000
      ) / 100
    }%<br/>`;
    statusBody += `Malformed HTTP requests: ${process.malformedcounter}`;
    if (process.memoryUsage)
      statusBody += `<br/>Memory usage of thread: ${sizify(process.memoryUsage().rss, true)}B`;
    if (process.cpuUsage)
      statusBody += `<br/>Total CPU usage by thread: u${process.cpuUsage().user / 1000}ms s${process.cpuUsage().system / 1000}ms - ${
        Math.round(
          ((process.cpuUsage().user + process.cpuUsage().system) /
            1000000 /
            process.uptime()) *
            1000
        ) / 1000
      }%`;
    statusBody += `<br/>Thread PID: ${process.pid}<br/>`;

    res.writeHead(200, statusCodes[200], {
      "Content-Type": "text/html; charset=utf-8"
    });
    res.end(
      `${
        res.head == ""
          ? "<!DOCTYPE html><html><head><title>" +
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
            '</title><meta name="viewport" content="width=device-width, initial-scale=1.0" /><style>' +
            defaultPageCSS +
            "</style></head><body>"
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
                "</title>"
            )
      }<h1>${name
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")} status${
        req.headers.host == undefined
          ? ""
          : " for " +
            String(req.headers.host)
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
      }</h1>${statusBody}${res.foot == "" ? "</body></html>" : res.foot}`
    );
    return;
  }
  next();
};

module.exports.proxySafe = true;
