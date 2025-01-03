const fs = require("fs");
const os = require("os");
const path = require("path");
const zlib = require("zlib");
const { getMimeType, checkIfCompressible } = require("../utils/mimeTypes.js");
const defaultPageCSS = require("../res/defaultPageCSS.js");
const matchHostname = require("../utils/matchHostname.js");
const ipMatch = require("../utils/ipMatch.js");
const createRegex = require("../utils/createRegex.js");
const sha256 = require("../utils/sha256.js");
const sizify = require("../utils/sizify.js");
const statusCodes = require("../res/statusCodes.js");
const svrjsInfo = require("../../svrjs.json");
const { name } = svrjsInfo;

// ETag-related
let ETagDB = {};

const generateETag = (filePath, stat) => {
  if (!ETagDB[filePath + "-" + stat.size + "-" + stat.mtime])
    ETagDB[filePath + "-" + stat.size + "-" + stat.mtime] = sha256(
      filePath + "-" + stat.size + "-" + stat.mtime
    );
  return ETagDB[filePath + "-" + stat.size + "-" + stat.mtime];
};

// eslint-disable-next-line no-unused-vars
module.exports = (req, res, logFacilities, config, next) => {
  const checkPathLevel = (path) => {
    // Split the path into an array of components based on "/"
    const pathComponents = path.split("/");

    // Initialize counters for level up (..) and level down (.)
    let levelUpCount = 0;
    let levelDownCount = 0;

    // Loop through the path components
    for (let i = 0; i < pathComponents.length; i++) {
      // If the component is "..", decrement the levelUpCount
      if (".." === pathComponents[i]) {
        levelUpCount--;
      }
      // If the component is not "." or an empty string, increment the levelDownCount
      else if ("." !== pathComponents[i] && "" !== pathComponents[i]) {
        levelDownCount++;
      }
    }

    // Calculate the overall level by subtracting levelUpCount from levelDownCount
    const overallLevel = levelDownCount - levelUpCount;

    // Return the overall level
    return overallLevel;
  };

  const checkForEnabledDirectoryListing = (hostname, localAddress) => {
    const main =
      config.enableDirectoryListing ||
      config.enableDirectoryListing === undefined;
    if (!config.enableDirectoryListingVHost) return main;
    let vhostP = null;
    config.enableDirectoryListingVHost.every((vhost) => {
      if (
        matchHostname(vhost.host, hostname) &&
        ipMatch(vhost.ip, localAddress)
      ) {
        vhostP = vhost;
        return false;
      } else {
        return true;
      }
    });
    if (!vhostP || vhostP.enabled === undefined) return main;
    else return vhostP.enabled;
  };

  let href = req.parsedURL.pathname;
  let origHref = req.originalParsedURL.pathname;
  let ext = href.match(/[^/]\.([^.]+)$/);
  if (!ext) ext = "";
  else ext = ext[1].toLowerCase();
  let dHref = "";
  try {
    dHref = decodeURIComponent(href);
    // eslint-disable-next-line no-unused-vars
  } catch (err) {
    res.error(400);
    return;
  }
  let readFrom = config.wwwroot + dHref;
  let dirImagesMissing = false;
  fs.stat(readFrom, (err, stats) => {
    if (err) {
      if (err.code == "ENOENT") {
        if (
          process.dirname !=
            (config.wwwroot !== undefined
              ? path.normalize(config.wwwroot)
              : "") &&
          dHref.match(/^\/\.dirimages\/(?:(?!\.png$).)+\.png$/)
        ) {
          dirImagesMissing = true;
          readFrom = process.dirname + dHref;
        } else {
          res.error(404);
          logFacilities.errmessage("Resource not found.");
          return;
        }
      } else if (err.code == "ENOTDIR") {
        res.error(404); // Assume that file doesn't exist.
        logFacilities.errmessage("Resource not found.");
        return;
      } else if (err.code == "EACCES") {
        res.error(403);
        logFacilities.errmessage("Access denied.");
        return;
      } else if (err.code == "ENAMETOOLONG") {
        res.error(414);
        return;
      } else if (err.code == "EMFILE") {
        res.error(503);
        return;
      } else if (err.code == "ELOOP") {
        res.error(508); // The symbolic link loop is detected during file system operations.
        logFacilities.errmessage("Symbolic link loop detected.");
        return;
      } else {
        res.error(500, err);
        return;
      }
    }

    const properDirectoryListingAndStaticFileServe = () => {
      if (stats.isFile()) {
        let acceptEncoding = req.headers["accept-encoding"];
        if (!acceptEncoding) acceptEncoding = "";

        let filelen = stats.size;

        // ETag code
        let fileETag = undefined;
        if (config.enableETag == undefined || config.enableETag) {
          fileETag = generateETag(href, stats);
          // Check if the client's request matches the ETag value (If-None-Match)
          const clientETag = req.headers["if-none-match"];
          if (clientETag === fileETag) {
            res.writeHead(304, statusCodes[304], {
              ETag: clientETag
            });
            res.end();
            return;
          }

          // Check if the client's request doesn't match the ETag value (If-Match)
          const ifMatchETag = req.headers["if-match"];
          if (ifMatchETag && ifMatchETag !== "*" && ifMatchETag !== fileETag) {
            res.error(412, {
              ETag: clientETag
            });
            return;
          }
        }

        // Handle partial content request
        if (req.headers["range"]) {
          try {
            let rhd = config.getCustomHeaders();
            rhd["Accept-Ranges"] = "bytes";
            rhd["Content-Range"] = `bytes */${filelen}`;
            const regexmatch = req.headers["range"].match(
              /bytes=([0-9]*)-([0-9]*)/
            );
            if (!regexmatch) {
              res.error(416, rhd);
            } else {
              // Process the partial content request
              const beginOrig = regexmatch[1];
              const endOrig = regexmatch[2];
              const maxEnd =
                filelen -
                1 +
                (ext == "html" ? res.head.length + res.foot.length : 0);
              let begin = 0;
              let end = maxEnd;
              if (beginOrig == "" && endOrig == "") {
                res.error(416, rhd);
                return;
              } else if (beginOrig == "") {
                begin = end - parseInt(endOrig) + 1;
              } else {
                begin = parseInt(beginOrig);
                if (endOrig != "") end = parseInt(endOrig);
              }
              if (begin > end || begin < 0 || begin > maxEnd) {
                res.error(416, rhd);
                return;
              }
              if (end > maxEnd) end = maxEnd;
              rhd["Content-Range"] =
                "bytes " + begin + "-" + end + "/" + filelen;
              rhd["Content-Length"] = end - begin + 1;
              delete rhd["Content-Type"];
              const mtype = getMimeType(ext);
              if (mtype && ext != "") rhd["Content-Type"] = mtype;
              if (fileETag) rhd["ETag"] = fileETag;

              if (req.method != "HEAD") {
                if (
                  ext == "html" &&
                  begin < res.head.length &&
                  end - begin < res.head.length
                ) {
                  res.writeHead(206, statusCodes[206], rhd);
                  res.end(res.head.substring(begin, end + 1));
                  return;
                } else if (
                  ext == "html" &&
                  begin >= res.head.length + filelen
                ) {
                  res.writeHead(206, statusCodes[206], rhd);
                  res.end(
                    res.foot.substring(
                      begin - res.head.length - filelen,
                      end - res.head.length - filelen + 1
                    )
                  );
                  return;
                }
                let readStream = fs.createReadStream(readFrom, {
                  start:
                    ext == "html"
                      ? Math.max(0, begin - res.head.length)
                      : begin,
                  end:
                    ext == "html"
                      ? Math.min(filelen, end - res.head.length)
                      : end
                });
                readStream
                  .on("error", (err) => {
                    if (err.code == "ENOENT") {
                      res.error(404);
                      logFacilities.errmessage("Resource not found.");
                    } else if (err.code == "ENOTDIR") {
                      res.error(404); // Assume that file doesn't exist.
                      logFacilities.errmessage("Resource not found.");
                    } else if (err.code == "EACCES") {
                      res.error(403);
                      logFacilities.errmessage("Access denied.");
                    } else if (err.code == "ENAMETOOLONG") {
                      res.error(414);
                    } else if (err.code == "EMFILE") {
                      res.error(503);
                    } else if (err.code == "ELOOP") {
                      res.error(508); // The symbolic link loop is detected during file system operations.
                      logFacilities.errmessage("Symbolic link loop detected.");
                    } else {
                      res.error(500, err);
                    }
                  })
                  .on("open", () => {
                    try {
                      if (ext == "html") {
                        const afterWriteCallback = () => {
                          if (
                            res.foot.length > 0 &&
                            end > res.head.length + filelen
                          ) {
                            readStream.on("end", () => {
                              res.end(
                                res.foot.substring(
                                  0,
                                  end - res.head.length - filelen + 1
                                )
                              );
                            });
                          }
                          readStream.pipe(res, {
                            end: !(
                              res.foot.length > 0 &&
                              end > res.head.length + filelen
                            )
                          });
                        };
                        res.writeHead(206, statusCodes[206], rhd);
                        if (res.head.length == 0 || begin > res.head.length) {
                          afterWriteCallback();
                        } else if (
                          !res.write(
                            res.head.substring(begin, res.head.length - begin)
                          )
                        ) {
                          res.on("drain", afterWriteCallback);
                        } else {
                          process.nextTick(afterWriteCallback);
                        }
                      } else {
                        res.writeHead(206, statusCodes[206], rhd);
                        readStream.pipe(res);
                      }
                      logFacilities.resmessage(
                        "Client successfully received content."
                      );
                    } catch (err) {
                      res.error(500, err);
                    }
                  });
              } else {
                res.writeHead(206, statusCodes[206], rhd);
                res.end();
              }
            }
          } catch (err) {
            res.error(500, err);
          }
        } else {
          // Helper function to check if compression is allowed for the file
          const canCompress = (path, list) => {
            let canCompress = true;
            for (let i = 0; i < list.length; i++) {
              if (createRegex(list[i], true).test(path)) {
                canCompress = false;
                break;
              }
            }
            return canCompress;
          };

          let useBrotli =
            ext != "br" &&
            filelen > 256 &&
            zlib.createBrotliCompress &&
            acceptEncoding.match(/\bbr\b/);
          let useDeflate =
            ext != "zip" &&
            filelen > 256 &&
            acceptEncoding.match(/\bdeflate\b/);
          let useGzip =
            ext != "gz" && filelen > 256 && acceptEncoding.match(/\bgzip\b/);

          let isCompressible = checkIfCompressible(ext);
          try {
            // Check for files not to compressed and compression enabling setting. Also check for browser quirks and adjust compression accordingly
            if (
              (!useBrotli && !useDeflate && !useGzip) ||
              config.enableCompression !== true ||
              !canCompress(href, config.dontCompress)
            ) {
              isCompressible = false; // Compression is disabled
            } else if (
              ext != "html" &&
              ext != "htm" &&
              ext != "xhtml" &&
              ext != "xht" &&
              ext != "shtml"
            ) {
              if (
                /^Mozilla\/4\.[0-9]+(( *\[[^)]*\] *| *)\([^)\]]*\))? *$/.test(
                  req.headers["user-agent"]
                ) &&
                !/https?:\/\/|[bB][oO][tT]|[sS][pP][iI][dD][eE][rR]|[sS][uU][rR][vV][eE][yY]|MSIE/.test(
                  req.headers["user-agent"]
                )
              ) {
                isCompressible = false; // Netscape 4.x doesn't handle compressed data properly outside of HTML documents.
              } else if (/^w3m\/[^ ]*$/.test(req.headers["user-agent"])) {
                isCompressible = false; // w3m doesn't handle compressed data properly outside of HTML documents.
              }
            } else {
              if (
                /^Mozilla\/4\.0[6-8](( *\[[^)]*\] *| *)\([^)\]]*\))? *$/.test(
                  req.headers["user-agent"]
                ) &&
                !/https?:\/\/|[bB][oO][tT]|[sS][pP][iI][dD][eE][rR]|[sS][uU][rR][vV][eE][yY]|MSIE/.test(
                  req.headers["user-agent"]
                )
              ) {
                isCompressible = false; // Netscape 4.06-4.08 doesn't handle compressed data properly.
              }
            }
          } catch (err) {
            res.error(500, err);
            return;
          }

          // Bun 1.1 has definition for zlib.createBrotliCompress, but throws an error while invoking the function.
          if (process.isBun && useBrotli && isCompressible) {
            try {
              zlib.createBrotliCompress();
              // eslint-disable-next-line no-unused-vars
            } catch (err) {
              useBrotli = false;
            }
          }

          try {
            let hdrs = {};
            if (useBrotli && isCompressible) {
              hdrs["Content-Encoding"] = "br";
            } else if (useDeflate && isCompressible) {
              hdrs["Content-Encoding"] = "deflate";
            } else if (useGzip && isCompressible) {
              hdrs["Content-Encoding"] = "gzip";
            } else {
              if (ext == "html") {
                hdrs["Content-Length"] =
                  res.head.length + filelen + res.foot.length;
              } else {
                hdrs["Content-Length"] = filelen;
              }
            }
            hdrs["Accept-Ranges"] = "bytes";
            delete hdrs["Content-Type"];
            const mtype = getMimeType(ext);
            if (mtype && ext != "") hdrs["Content-Type"] = mtype;
            if (fileETag) hdrs["ETag"] = fileETag;

            if (req.method != "HEAD") {
              let readStream = fs.createReadStream(readFrom);
              readStream
                .on("error", (err) => {
                  if (err.code == "ENOENT") {
                    res.error(404);
                    logFacilities.errmessage("Resource not found.");
                  } else if (err.code == "ENOTDIR") {
                    res.error(404); // Assume that file doesn't exist.
                    logFacilities.errmessage("Resource not found.");
                  } else if (err.code == "EACCES") {
                    res.error(403);
                    logFacilities.errmessage("Access denied.");
                  } else if (err.code == "ENAMETOOLONG") {
                    res.error(414);
                  } else if (err.code == "EMFILE") {
                    res.error(503);
                  } else if (err.code == "ELOOP") {
                    res.error(508); // The symbolic link loop is detected during file system operations.
                    logFacilities.errmessage("Symbolic link loop detected.");
                  } else {
                    res.error(500, err);
                  }
                })
                .on("open", () => {
                  try {
                    let resStream = {};
                    if (useBrotli && isCompressible) {
                      resStream = zlib.createBrotliCompress();
                      resStream.pipe(res);
                    } else if (useDeflate && isCompressible) {
                      resStream = zlib.createDeflateRaw();
                      resStream.pipe(res);
                    } else if (useGzip && isCompressible) {
                      resStream = zlib.createGzip();
                      resStream.pipe(res);
                    } else {
                      resStream = res;
                    }
                    if (ext == "html") {
                      const afterWriteCallback = () => {
                        if (res.foot.length > 0) {
                          readStream.on("end", () => {
                            resStream.end(res.foot);
                          });
                        }
                        readStream.pipe(resStream, {
                          end: res.foot.length == 0
                        });
                      };
                      res.writeHead(200, statusCodes[200], hdrs);
                      if (res.head.length == 0) {
                        afterWriteCallback();
                      } else if (!resStream.write(res.head)) {
                        resStream.on("drain", afterWriteCallback);
                      } else {
                        process.nextTick(afterWriteCallback);
                      }
                    } else {
                      res.writeHead(200, statusCodes[200], hdrs);
                      readStream.pipe(resStream);
                    }
                    logFacilities.resmessage(
                      "Client successfully received content."
                    );
                  } catch (err) {
                    res.error(500, err);
                  }
                });
            } else {
              res.writeHead(200, statusCodes[200], hdrs);
              res.end();
              logFacilities.resmessage("Client successfully received content.");
            }
          } catch (err) {
            res.error(500, err);
          }
        }
      } else if (stats.isDirectory()) {
        // Check if directory listing is enabled in the configuration
        if (
          checkForEnabledDirectoryListing(
            req.headers.host,
            req.socket ? req.socket.localAddress : undefined
          )
        ) {
          let customDirListingHeader = "";
          let customDirListingFooter = "";

          const getCustomDirListingHeader = (callback) => {
            fs.readFile(
              (config.wwwroot + dHref + "/.dirhead").replace(/\/+/g, "/"),
              (err, data) => {
                if (err) {
                  if (err.code == "ENOENT" || err.code == "EISDIR") {
                    if (os.platform != "win32" || href != "/") {
                      fs.readFile(
                        (config.wwwroot + dHref + "/HEAD.html").replace(
                          /\/+/g,
                          "/"
                        ),
                        (err, data) => {
                          if (err) {
                            if (err.code == "ENOENT" || err.code == "EISDIR") {
                              callback();
                            } else {
                              res.error(500, err);
                            }
                          } else {
                            customDirListingHeader = data.toString();
                            callback();
                          }
                        }
                      );
                    } else {
                      callback();
                    }
                  } else {
                    res.error(500, err);
                  }
                } else {
                  customDirListingHeader = data.toString();
                  callback();
                }
              }
            );
          };

          const getCustomDirListingFooter = (callback) => {
            fs.readFile(
              (config.wwwroot + dHref + "/.dirfoot").replace(/\/+/g, "/"),
              (err, data) => {
                if (err) {
                  if (err.code == "ENOENT" || err.code == "EISDIR") {
                    if (os.platform != "win32" || href != "/") {
                      fs.readFile(
                        (config.wwwroot + dHref + "/FOOT.html").replace(
                          /\/+/g,
                          "/"
                        ),
                        (err, data) => {
                          if (err) {
                            if (err.code == "ENOENT" || err.code == "EISDIR") {
                              callback();
                            } else {
                              res.error(500, err);
                            }
                          } else {
                            customDirListingFooter = data.toString();
                            callback();
                          }
                        }
                      );
                    } else {
                      callback();
                    }
                  } else {
                    res.error(500, err);
                  }
                } else {
                  customDirListingFooter = data.toString();
                  callback();
                }
              }
            );
          };

          // Read custom header and footer content (if available)
          getCustomDirListingHeader(() => {
            getCustomDirListingFooter(() => {
              // Check if custom header has HTML tag
              const headerHasHTMLTag = customDirListingHeader
                .replace(/<!--(?:(?:(?!-->)[\s\S])*|)(?:-->|$)/g, "")
                .match(
                  /<html(?![a-zA-Z0-9])(?:"(?:\\(?:[\s\S]|$)|[^\\"])*(?:"|$)|'(?:\\(?:[\s\S]|$)|[^\\'])*(?:'|$)|[^'">])*(?:>|$)/i
                );

              // Generate HTML head and footer based on configuration and custom content
              let htmlHead = `${
                (!config.enableDirectoryListingWithDefaultHead || res.head == ""
                  ? !headerHasHTMLTag
                    ? "<!DOCTYPE html><html><head><title>Directory: " +
                      decodeURIComponent(origHref)
                        .replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;") +
                      '</title><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><style>' +
                      defaultPageCSS +
                      "</style></head><body>"
                    : customDirListingHeader.replace(
                        /<head>/i,
                        "<head><title>Directory: " +
                          decodeURIComponent(origHref)
                            .replace(/&/g, "&amp;")
                            .replace(/</g, "&lt;")
                            .replace(/>/g, "&gt;") +
                          "</title>"
                      )
                  : res.head.replace(
                      /<head>/i,
                      "<head><title>Directory: " +
                        decodeURIComponent(origHref)
                          .replace(/&/g, "&amp;")
                          .replace(/</g, "&lt;")
                          .replace(/>/g, "&gt;") +
                        "</title>"
                    )) + (!headerHasHTMLTag ? customDirListingHeader : "")
              }<h1>Directory: ${decodeURIComponent(origHref)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(
                  />/g,
                  "&gt;"
                )}</h1><table id="directoryListing"> <tr> <th></th> <th>Filename</th> <th>Size</th> <th>Date</th> </tr>${
                checkPathLevel(decodeURIComponent(origHref)) < 1
                  ? ""
                  : '<tr><td style="width: 24px;"><img src="/.dirimages/return.png" width="24px" height="24px" alt="[RET]" /></td><td style="word-wrap: break-word; word-break: break-word; overflow-wrap: break-word;"><a href="' +
                    origHref.replace(/\/+/g, "/").replace(/\/[^/]*\/?$/, "/") +
                    '">Return</a></td><td></td><td></td></tr>'
              }`;

              let htmlFoot = `</table><p><i>${config
                .generateServerString()
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")}${
                req.headers.host == undefined
                  ? ""
                  : " on " +
                    String(req.headers.host)
                      .replace(/&/g, "&amp;")
                      .replace(/</g, "&lt;")
                      .replace(/>/g, "&gt;")
              }</i></p>${customDirListingFooter}${
                !config.enableDirectoryListingWithDefaultHead || res.foot == ""
                  ? "</body></html>"
                  : res.foot
              }`;

              if (
                fs.existsSync(
                  config.wwwroot +
                    decodeURIComponent(href) +
                    "/.maindesc".replace(/\/+/g, "/")
                )
              ) {
                htmlFoot =
                  "</table><hr/>" +
                  fs.readFileSync(
                    config.wwwroot +
                      decodeURIComponent(href) +
                      "/.maindesc".replace(/\/+/g, "/")
                  ) +
                  htmlFoot;
              }

              fs.readdir(readFrom, (err, list) => {
                try {
                  if (err) throw err;
                  list = list.sort();

                  // Function to get stats for all files in the directory
                  const getStatsForAllFilesI = (
                    fileList,
                    callback,
                    prefix,
                    pushArray,
                    index
                  ) => {
                    if (fileList.length == 0) {
                      callback(pushArray);
                      return;
                    }

                    fs.stat(
                      (prefix + "/" + fileList[index]).replace(/\/+/g, "/"),
                      (err, stats) => {
                        if (err) {
                          fs.lstat(
                            (prefix + "/" + fileList[index]).replace(
                              /\/+/g,
                              "/"
                            ),
                            (err, stats) => {
                              pushArray.push({
                                name: fileList[index],
                                stats: err ? null : stats,
                                errored: true
                              });
                              if (index < fileList.length - 1) {
                                getStatsForAllFilesI(
                                  fileList,
                                  callback,
                                  prefix,
                                  pushArray,
                                  index + 1
                                );
                              } else {
                                callback(pushArray);
                              }
                            }
                          );
                        } else {
                          pushArray.push({
                            name: fileList[index],
                            stats: stats,
                            errored: false
                          });
                          if (index < fileList.length - 1) {
                            getStatsForAllFilesI(
                              fileList,
                              callback,
                              prefix,
                              pushArray,
                              index + 1
                            );
                          } else {
                            callback(pushArray);
                          }
                        }
                      }
                    );
                  };

                  // Wrapper function to get stats for all files
                  const getStatsForAllFiles = (fileList, prefix, callback) => {
                    if (!prefix) prefix = "";
                    getStatsForAllFilesI(fileList, callback, prefix, [], 0);
                  };

                  // Get stats for all files in the directory and generate the listing
                  getStatsForAllFiles(list, readFrom, (filelist) => {
                    let directoryListingRows = [];
                    for (let i = 0; i < filelist.length; i++) {
                      if (filelist[i].name[0] !== ".") {
                        const estats = filelist[i].stats;
                        const ename = filelist[i].name;
                        let eext = ename.match(/\.([^.]+)$/);
                        eext = eext ? eext[1] : "";
                        const emime = eext ? getMimeType(eext) : false;
                        if (filelist[i].errored) {
                          directoryListingRows.push(
                            `<tr><td style="width: 24px;"><img src="/.dirimages/bad.png" alt="[BAD]" width="24px" height="24px" /></td><td style="word-wrap: break-word; word-break: break-word; overflow-wrap: break-word;"><a href="${(
                              href +
                              "/" +
                              encodeURI(ename)
                            ).replace(/\/+/g, "/")}">${ename
                              .replace(/&/g, "&amp;")
                              .replace(/</g, "&lt;")
                              .replace(
                                />/g,
                                "&gt;"
                              )}</a></td><td>-</td><td>${estats ? estats.mtime.toDateString() : "-"}</td></tr>\r\n`
                          );
                        } else {
                          let entry = `<tr><td style="width: 24px;"><img src="[img]" alt="[alt]" width="24px" height="24px" /></td><td style="word-wrap: break-word; word-break: break-word; overflow-wrap: break-word;"><a href="${(
                            origHref +
                            "/" +
                            encodeURIComponent(ename)
                          ).replace(
                            /\/+/g,
                            "/"
                          )}${estats.isDirectory() ? "/" : ""}">${ename
                            .replace(/&/g, "&amp;")
                            .replace(/</g, "&lt;")
                            .replace(/>/g, "&gt;")}</a></td><td>${
                            estats.isDirectory() ? "-" : sizify(estats.size)
                          }</td><td>${estats.mtime.toDateString()}</td></tr>\r\n`;

                          // Determine the file type and set the appropriate image and alt text
                          if (estats.isDirectory()) {
                            entry = entry
                              .replace("[img]", "/.dirimages/directory.png")
                              .replace("[alt]", "[DIR]");
                          } else if (!estats.isFile()) {
                            entry = `<tr><td style="width: 24px;"><img src="[img]" alt="[alt]" width="24px" height="24px" /></td><td style="word-wrap: break-word; word-break: break-word; overflow-wrap: break-word;"><a href="${(
                              origHref +
                              "/" +
                              encodeURIComponent(ename)
                            ).replace(/\/+/g, "/")}">${ename
                              .replace(/&/g, "&amp;")
                              .replace(/</g, "&lt;")
                              .replace(
                                />/g,
                                "&gt;"
                              )}</a></td><td>-</td><td>${estats.mtime.toDateString()}</td></tr>\r\n`;

                            // Determine the special file types (block device, character device, etc.)
                            if (estats.isBlockDevice()) {
                              entry = entry
                                .replace("[img]", "/.dirimages/hwdevice.png")
                                .replace("[alt]", "[BLK]");
                            } else if (estats.isCharacterDevice()) {
                              entry = entry
                                .replace("[img]", "/.dirimages/hwdevice.png")
                                .replace("[alt]", "[CHR]");
                            } else if (estats.isFIFO()) {
                              entry = entry
                                .replace("[img]", "/.dirimages/fifo.png")
                                .replace("[alt]", "[FIF]");
                            } else if (estats.isSocket()) {
                              entry = entry
                                .replace("[img]", "/.dirimages/socket.png")
                                .replace("[alt]", "[SCK]");
                            }
                          } else if (ename.match(/README|LICEN[SC]E/i)) {
                            entry = entry
                              .replace("[img]", "/.dirimages/important.png")
                              .replace("[alt]", "[IMP]");
                          } else if (eext.match(/^(?:[xs]?html?|xml)$/i)) {
                            entry = entry
                              .replace("[img]", "/.dirimages/html.png")
                              .replace(
                                "[alt]",
                                eext == "xml" ? "[XML]" : "[HTM]"
                              );
                          } else if (eext == "js") {
                            entry = entry
                              .replace("[img]", "/.dirimages/javascript.png")
                              .replace("[alt]", "[JS ]");
                          } else if (eext == "php") {
                            entry = entry
                              .replace("[img]", "/.dirimages/php.png")
                              .replace("[alt]", "[PHP]");
                          } else if (eext == "css") {
                            entry = entry
                              .replace("[img]", "/.dirimages/css.png")
                              .replace("[alt]", "[CSS]");
                          } else if (emime && emime.split("/")[0] == "image") {
                            entry = entry
                              .replace("[img]", "/.dirimages/image.png")
                              .replace(
                                "[alt]",
                                eext == "ico" ? "[ICO]" : "[IMG]"
                              );
                          } else if (emime && emime.split("/")[0] == "font") {
                            entry = entry
                              .replace("[img]", "/.dirimages/font.png")
                              .replace("[alt]", "[FON]");
                          } else if (emime && emime.split("/")[0] == "audio") {
                            entry = entry
                              .replace("[img]", "/.dirimages/audio.png")
                              .replace("[alt]", "[AUD]");
                          } else if (
                            (emime && emime.split("/")[0] == "text") ||
                            eext == "json"
                          ) {
                            entry = entry
                              .replace("[img]", "/.dirimages/text.png")
                              .replace(
                                "[alt]",
                                eext == "json" ? "[JSO]" : "[TXT]"
                              );
                          } else if (emime && emime.split("/")[0] == "video") {
                            entry = entry
                              .replace("[img]", "/.dirimages/video.png")
                              .replace("[alt]", "[VID]");
                          } else if (
                            eext.match(/^(?:zip|rar|bz2|[gb7x]z|lzma|tar)$/i)
                          ) {
                            entry = entry
                              .replace("[img]", "/.dirimages/archive.png")
                              .replace("[alt]", "[ARC]");
                          } else if (eext.match(/^(?:[id]mg|iso|flp)$/i)) {
                            entry = entry
                              .replace("[img]", "/.dirimages/diskimage.png")
                              .replace("[alt]", "[DSK]");
                          } else {
                            entry = entry
                              .replace("[img]", "/.dirimages/other.png")
                              .replace("[alt]", "[OTH]");
                          }
                          directoryListingRows.push(entry);
                        }
                      }
                    }

                    // Push the information about empty directory
                    if (directoryListingRows.length == 0) {
                      directoryListingRows.push(
                        "<tr><td></td><td>No files found</td><td></td><td></td></tr>"
                      );
                    }

                    // Send the directory listing response
                    res.writeHead(200, statusCodes[200], {
                      "Content-Type": "text/html"
                    });
                    res.end(
                      htmlHead + directoryListingRows.join("") + htmlFoot
                    );
                    logFacilities.resmessage(
                      "Client successfully received content."
                    );
                  });
                } catch (err) {
                  if (err.code == "ENOENT") {
                    res.error(404);
                    logFacilities.errmessage("Resource not found.");
                  } else if (err.code == "ENOTDIR") {
                    res.error(404); // Assume that file doesn't exist.
                    logFacilities.errmessage("Resource not found.");
                  } else if (err.code == "EACCES") {
                    res.error(403);
                    logFacilities.errmessage("Access denied.");
                  } else if (err.code == "ENAMETOOLONG") {
                    res.error(414);
                  } else if (err.code == "EMFILE") {
                    res.error(503);
                  } else if (err.code == "ELOOP") {
                    res.error(508); // The symbolic link loop is detected during file system operations.
                    logFacilities.errmessage("Symbolic link loop detected.");
                  } else {
                    res.error(500, err);
                  }
                }
              });
            });
          });
        } else {
          // Directory listing is disabled, call 403 Forbidden error
          res.error(403);
          logFacilities.errmessage("Directory listing is disabled.");
        }
      } else {
        res.error(501);
        logFacilities.errmessage(
          `${name} doesn't support block devices, character devices, FIFOs nor sockets.`
        );
        return;
      }
    };

    // Check if index file exists
    if (!dirImagesMissing && (req.url == "/" || stats.isDirectory())) {
      fs.stat((readFrom + "/index.html").replace(/\/+/g, "/"), (e, s) => {
        if (e || !s.isFile()) {
          fs.stat((readFrom + "/index.htm").replace(/\/+/g, "/"), (e, s) => {
            if (e || !s.isFile()) {
              fs.stat(
                (readFrom + "/index.xhtml").replace(/\/+/g, "/"),
                (e, s) => {
                  if (e || !s.isFile()) {
                    properDirectoryListingAndStaticFileServe();
                  } else {
                    stats = s;
                    ext = "xhtml";
                    readFrom = (readFrom + "/index.xhtml").replace(/\/+/g, "/");
                    properDirectoryListingAndStaticFileServe();
                  }
                }
              );
            } else {
              stats = s;
              ext = "htm";
              readFrom = (readFrom + "/index.htm").replace(/\/+/g, "/");
              properDirectoryListingAndStaticFileServe();
            }
          });
        } else {
          stats = s;
          ext = "html";
          readFrom = (readFrom + "/index.html").replace(/\/+/g, "/");
          properDirectoryListingAndStaticFileServe();
        }
      });
    } else if (dirImagesMissing) {
      fs.stat(readFrom, (e, s) => {
        if (e || !s.isFile()) {
          if (err.code == "ENOENT") {
            res.error(404);
            logFacilities.errmessage("Resource not found.");
            return;
          } else if (err.code == "ENOTDIR") {
            res.error(404); // Assume that file doesn't exist.
            logFacilities.errmessage("Resource not found.");
            return;
          } else if (err.code == "EACCES") {
            res.error(403);
            logFacilities.errmessage("Access denied.");
            return;
          } else if (err.code == "ENAMETOOLONG") {
            res.error(414);
            return;
          } else if (err.code == "EMFILE") {
            res.error(503);
            return;
          } else if (err.code == "ELOOP") {
            res.error(508); // The symbolic link loop is detected during file system operations.
            logFacilities.errmessage("Symbolic link loop detected.");
            return;
          } else {
            res.error(500, err);
            return;
          }
        } else {
          stats = s;
          properDirectoryListingAndStaticFileServe();
        }
      });
    } else {
      properDirectoryListingAndStaticFileServe();
    }
  });
};

module.exports.proxySafe = true;
