const http = require("http");
const fs = require("fs");
const os = require("os");
const logo = require("./res/logo.js");
const generateServerString = require("./utils/generateServerString.js");
const deleteFolderRecursive = require("./utils/deleteFolderRecursive.js");
const svrjsInfo = require("../svrjs.json");
const { name, version } = svrjsInfo;

let inspector = undefined;
try {
  inspector = require("inspector");
} catch (err) {
  // Don't use inspector
}

let tar = {};
try {
  tar = require("tar");
} catch (err) {
  tar = {
    _errored: err,
  };
}

let http2 = {};
try {
  http2 = require("http2");
  if (process.isBun) {
    try {
      http2.Http2ServerRequest();
    } catch (err) {
      if (
        err.name == "NotImplementedError" ||
        err.code == "ERR_NOT_IMPLEMENTED"
      )
        throw err;
    }
  }
} catch (err) {
  http2.__disabled__ = null;
  http2.createServer = function () {
    throw new Error("HTTP/2 support is not present");
  };
  http2.createSecureServer = function () {
    throw new Error("HTTP/2 support is not present");
  };
  http2.connect = function () {
    throw new Error("HTTP/2 support is not present");
  };
  http2.get = function () {
    throw new Error("HTTP/2 support is not present");
  };
}
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
  http2.createSecureServer = function () {
    throw new Error("Crypto support is not present");
  };
}

let ocsp = {};
let ocspCache = {};
try {
  ocsp = require("ocsp");
  ocspCache = new ocsp.Cache();
} catch (err) {
  ocsp = {
    _errored: err,
  };
}

process.dirname = __dirname;
process.filename = __filename;

let hexstrbase64 = undefined;
try {
  hexstrbase64 = require(process.dirname + "/hexstrbase64/index.js");
} catch (err) {
  // Don't use hexstrbase64
}

// TODO: after implementing clustering in new SVR.JS
//process.singleThreaded = false;
process.singleThreaded = true;

process.err4xxcounter = 0;
process.err5xxcounter = 0;
process.reqcounter = 0;
process.malformedcounter = 0;

process.messageEventListeners = [];

if (process.versions) process.versions.svrjs = version; // Inject SVR.JS into process.versions

let exiting = false;
let forceSecure = false;
let disableMods = false;

// Handle command line arguments
const args = process.argv;
for (
  let i =
    process.argv[0].indexOf("node") > -1 || process.argv[0].indexOf("bun") > -1
      ? 2
      : 1;
  i < args.length;
  i++
) {
  if (
    args[i] == "-h" ||
    args[i] == "--help" ||
    args[i] == "-?" ||
    args[i] == "/h" ||
    args[i] == "/?"
  ) {
    console.log(name + " usage:");
    console.log(
      "node svr.js [-h] [--help] [-?] [/h] [/?] [--secure] [--reset] [--clean] [--disable-mods] [--single-threaded] [-v] [--version]",
    );
    console.log("-h -? /h /? --help    -- Displays help");
    console.log("--clean               -- Cleans up files created by " + name);
    console.log(
      "--reset               -- Resets " +
        name +
        " to default settings (WARNING: DANGEROUS)",
    );
    console.log("--secure              -- Runs HTTPS server");
    console.log("--disable-mods        -- Disables mods (safe mode)");
    console.log("--single-threaded     -- Run single-threaded");
    console.log("-v --version          -- Display server version");
    process.exit(0);
  } else if (args[i] == "--secure") {
    forceSecure = true;
  } else if (args[i] == "-v" || args[i] == "--version") {
    console.log(generateServerString(true));
    process.exit(0);
  } else if (args[i] == "--clean") {
    console.log("Removing logs...");
    deleteFolderRecursive(process.dirname + "/log");
    fs.mkdirSync(process.dirname + "/log");
    console.log("Removing temp folder...");
    deleteFolderRecursive(process.dirname + "/temp");
    fs.mkdirSync(process.dirname + "/temp");
    console.log("Done!");
    process.exit(0);
  } else if (args[i] == "--reset") {
    console.log("Removing logs...");
    deleteFolderRecursive(process.dirname + "/log");
    fs.mkdirSync(process.dirname + "/log");
    console.log("Removing temp folder...");
    deleteFolderRecursive(process.dirname + "/temp");
    fs.mkdirSync(process.dirname + "/temp");
    console.log("Removing configuration file...");
    fs.unlinkSync(process.dirname + "/config.json");
    console.log("Done!");
    process.exit(0);
  } else if (args[i] == "--disable-mods") {
    disableMods = true;
  } else if (args[i] == "--single-threaded") {
    process.singlethreaded = true;
  } else {
    console.log("Unrecognized argument: " + args[i]);
    console.log(name + " usage:");
    console.log(
      "node svr.js [-h] [--help] [-?] [/h] [/?] [--secure] [--reset] [--clean] [--disable-mods] [--single-threaded] [-v] [--version]",
    );
    console.log("-h -? /h /? --help    -- Displays help");
    console.log("--clean               -- Cleans up files created by " + name);
    console.log(
      "--reset               -- Resets " +
        name +
        " to default settings (WARNING: DANGEROUS)",
    );
    console.log("--secure              -- Runs HTTPS server");
    console.log("--disable-mods        -- Disables mods (safe mode)");
    console.log("--single-threaded     -- Run single-threaded");
    console.log("-v --version          -- Display server version");
    process.exit(1);
  }
}

// Create log, mods and temp directories, if they don't exist.
if (!fs.existsSync(process.dirname + "/log"))
  fs.mkdirSync(process.dirname + "/log");
if (!fs.existsSync(process.dirname + "/mods"))
  fs.mkdirSync(process.dirname + "/mods");
if (!fs.existsSync(process.dirname + "/temp"))
  fs.mkdirSync(process.dirname + "/temp");

const cluster = require("./utils/clusterBunShim.js"); // Cluster module with shim for Bun
const legacyModWrapper = require("./utils/legacyModWrapper.js");
const generateErrorStack = require("./utils/generateErrorStack.js");
const {
  calculateNetworkIPv4FromCidr,
  calculateBroadcastIPv4FromCidr,
} = require("./utils/ipSubnetUtils.js");
//const serverHTTPErrorDescs = require("../res/httpErrorDescriptions.js");
//const getOS = require("./utils/getOS.js");
//const parseURL = require("./utils/urlParser.js");
//const fixNodeMojibakeURL = require("./utils/urlMojibakeFixer.js");

process.serverConfig = {};
let configJSONRErr = undefined;
let configJSONPErr = undefined;
if (fs.existsSync(__dirname + "/config.json")) {
  let configJSONf = "";
  try {
    configJSONf = fs.readFileSync(__dirname + "/config.json"); // Read JSON File
    try {
      process.serverConfig = JSON.parse(configJSONf); // Parse JSON
    } catch (err2) {
      configJSONPErr = err2;
    }
  } catch (err) {
    configJSONRErr = err;
  }
}

// TODO: configuration from config.json
if (process.serverConfig.users === undefined) process.serverConfig.users = [];
if (process.serverConfig.secure === undefined)
  process.serverConfig.secure = false;
if (forceSecure) process.serverConfig.secure = true;
if (process.serverConfig.secure) {
  if (process.serverConfig.key === undefined)
    process.serverConfig.key = "cert/key.key";
  if (process.serverConfig.cert === undefined)
    process.serverConfig.cert = "cert/cert.crt";
  if (process.serverConfig.sport === undefined)
    process.serverConfig.sport = 443;
  if (process.serverConfig.spubport === undefined)
    process.serverConfig.spubport = 443;
  if (process.serverConfig.sni === undefined) process.serverConfig.sni = {};
  if (process.serverConfig.enableOCSPStapling === undefined)
    process.serverConfig.enableOCSPStapling = false;
}
if (process.serverConfig.port === undefined) process.serverConfig.port = 80;
if (process.serverConfig.pubport === undefined)
  process.serverConfig.pubport = 80;
if (
  process.serverConfig.domain === undefined &&
  process.serverConfig.domian !== undefined
)
  process.serverConfig.domain = process.serverConfig.domian;
delete process.serverConfig.domian;
if (process.serverConfig.page404 === undefined)
  process.serverConfig.page404 = "404.html";
process.serverConfig.timestamp = new Date().getTime();
if (process.serverConfig.blacklist === undefined)
  process.serverConfig.blacklist = [];
if (process.serverConfig.nonStandardCodes === undefined)
  process.serverConfig.nonStandardCodes = [];
if (process.serverConfig.enableCompression === undefined)
  process.serverConfig.enableCompression = true;
if (process.serverConfig.customHeaders === undefined)
  process.serverConfig.customHeaders = {};
if (process.serverConfig.enableHTTP2 === undefined)
  process.serverConfig.enableHTTP2 = false;
if (process.serverConfig.enableLogging === undefined)
  process.serverConfig.enableLogging = true;
if (process.serverConfig.enableDirectoryListing === undefined)
  process.serverConfig.enableDirectoryListing = true;
if (process.serverConfig.enableDirectoryListingWithDefaultHead === undefined)
  process.serverConfig.enableDirectoryListingWithDefaultHead = false;
if (process.serverConfig.serverAdministratorEmail === undefined)
  process.serverConfig.serverAdministratorEmail = "[no contact information]";
if (process.serverConfig.stackHidden === undefined)
  process.serverConfig.stackHidden = false;
if (process.serverConfig.enableRemoteLogBrowsing === undefined)
  process.serverConfig.enableRemoteLogBrowsing = false;
if (process.serverConfig.exposeServerVersion === undefined)
  process.serverConfig.exposeServerVersion = true;
if (process.serverConfig.disableServerSideScriptExpose === undefined)
  process.serverConfig.disableServerSideScriptExpose = true;
if (process.serverConfig.allowStatus === undefined)
  process.serverConfig.allowStatus = true;
if (process.serverConfig.rewriteMap === undefined)
  process.serverConfig.rewriteMap = [];
if (process.serverConfig.dontCompress === undefined)
  process.serverConfig.dontCompress = [
    "/.*\\.ipxe$/",
    "/.*\\.(?:jpe?g|png|bmp|tiff|jfif|gif|webp)$/",
    "/.*\\.(?:[id]mg|iso|flp)$/",
    "/.*\\.(?:zip|rar|bz2|[gb7x]z|lzma|tar)$/",
    "/.*\\.(?:mp[34]|mov|wm[av]|avi|webm|og[gv]|mk[va])$/",
  ];
if (process.serverConfig.enableIPSpoofing === undefined)
  process.serverConfig.enableIPSpoofing = false;
if (process.serverConfig.disableNonEncryptedServer === undefined)
  process.serverConfig.disableNonEncryptedServer = false;
if (process.serverConfig.disableToHTTPSRedirect === undefined)
  process.serverConfig.disableToHTTPSRedirect = false;
if (process.serverConfig.enableETag === undefined)
  process.serverConfig.enableETag = true;
if (process.serverConfig.disableUnusedWorkerTermination === undefined)
  process.serverConfig.disableUnusedWorkerTermination = false;
if (process.serverConfig.rewriteDirtyURLs === undefined)
  process.serverConfig.rewriteDirtyURLs = false;
if (process.serverConfig.errorPages === undefined)
  process.serverConfig.errorPages = [];
if (process.serverConfig.useWebRootServerSideScript === undefined)
  process.serverConfig.useWebRootServerSideScript = true;
if (process.serverConfig.exposeModsInErrorPages === undefined)
  process.serverConfig.exposeModsInErrorPages = true;
if (process.serverConfig.disableTrailingSlashRedirects === undefined)
  process.serverConfig.disableTrailingSlashRedirects = false;
if (process.serverConfig.environmentVariables === undefined)
  process.serverConfig.environmentVariables = {};
if (process.serverConfig.customHeadersVHost === undefined)
  process.serverConfig.customHeadersVHost = [];
if (process.serverConfig.enableDirectoryListingVHost === undefined)
  process.serverConfig.enableDirectoryListingVHost = [];
if (process.serverConfig.wwwrootPostfixesVHost === undefined)
  process.serverConfig.wwwrootPostfixesVHost = [];
if (process.serverConfig.wwwrootPostfixPrefixesVHost === undefined)
  process.serverConfig.wwwrootPostfixPrefixesVHost = [];
if (process.serverConfig.allowDoubleSlashes === undefined)
  process.serverConfig.allowDoubleSlashes = false;
if (process.serverConfig.allowPostfixDoubleSlashes === undefined)
  process.serverConfig.allowPostfixDoubleSlashes = false;
if (process.serverConfig.optOutOfStatisticsServer === undefined)
  process.serverConfig.optOutOfStatisticsServer = false;

// Compatiblity for very old SVR.JS mods
process.serverConfig.version = version;
process.serverConfig.productName = name;

let listenAddress = undefined;
let sListenAddress = undefined;
if (typeof process.serverConfig.port === "string") {
  if (process.serverConfig.port.match(/^[0-9]+$/)) {
    process.serverConfig.port = parseInt(process.serverConfig.port);
  } else {
    const portLMatch = process.serverConfig.port.match(
      /^(\[[^ \]@\/\\]+\]|[^ \]\[:@\/\\]+):([0-9]+)$/,
    );
    if (portLMatch) {
      listenAddress = portLMatch[1]
        .replace(/^\[|\]$/g, "")
        .replace(/^::ffff:/i, "");
      process.serverConfig.port = parseInt(portLMatch[2]);
    }
  }
}
if (typeof process.serverConfig.sport === "string") {
  if (process.serverConfig.sport.match(/^[0-9]+$/)) {
    process.serverConfig.sport = parseInt(process.serverConfig.sport);
  } else {
    const sportLMatch = process.serverConfig.sport.match(
      /^(\[[^ \]@\/\\]+\]|[^ \]\[:@\/\\]+):([0-9]+)$/,
    );
    if (sportLMatch) {
      sListenAddress = sportLMatch[1]
        .replace(/^\[|\]$/g, "")
        .replace(/^::ffff:/i, "");
      process.serverConfig.sport = parseInt(sportLMatch[2]);
    }
  }
}

const serverconsole = require("./utils/serverconsole.js");

let inspectorURL = undefined;
try {
  if (inspector) {
    inspectorURL = inspector.url();
  }
} catch (err) {
  // Failed to get inspector URL
}

if (!process.stdout.isTTY && !inspectorURL) {
  // When stdout is not a terminal and not attached to an Node.JS inspector, disable it to improve performance of SVR.JS
  console.log = function () {};
  process.stdout.write = function () {};
  process.stdout._write = function () {};
  process.stdout._writev = function () {};
}

let wwwrootError = null;
try {
  if (cluster.isPrimary || cluster.isPrimary === undefined)
    process.chdir(
      process.serverConfig.wwwroot != undefined
        ? process.serverConfig.wwwroot
        : process.dirname,
    );
} catch (err) {
  wwwrootError = err;
}

// IP and network inteface-related
let ifaces = {};
let ifaceEx = null;
try {
  ifaces = os.networkInterfaces();
} catch (err) {
  ifaceEx = err;
}
var ips = [];
const brdIPs = ["255.255.255.255", "127.255.255.255", "0.255.255.255"];
const netIPs = ["127.0.0.0"];

Object.keys(ifaces).forEach((ifname) => {
  let alias = 0;
  ifaces[ifname].forEach((iface) => {
    if (iface.family !== "IPv4" || iface.internal !== false) {
      return;
    }
    if (alias >= 1) {
      ips.push(ifname + ":" + alias, iface.address);
    } else {
      ips.push(ifname, iface.address);
    }
    brdIPs.push(calculateBroadcastIPv4FromCidr(iface.cidr));
    netIPs.push(calculateNetworkIPv4FromCidr(iface.cidr));
    alias++;
  });
});

if (ips.length == 0) {
  Object.keys(ifaces).forEach((ifname) => {
    let alias = 0;
    ifaces[ifname].forEach((iface) => {
      if (iface.family !== "IPv6" || iface.internal !== false) {
        return;
      }
      if (alias >= 1) {
        ips.push(ifname + ":" + alias, iface.address);
      } else {
        ips.push(ifname, iface.address);
      }
      alias++;
    });
  });
}

// Server IP address
var host = ips[(ips.length) - 1];
if (!host) host = "[offline]";

// TODO: Public IP address-related

// SSL-related
let key = "";
let cert = "";

if (process.serverConfig.secure) {
  if (!process.serverConfig.key) process.serverConfig.key = "cert/key.key";
  if (!process.serverConfig.cert) process.serverConfig.cert = "cert/cert.crt";
} else {
  key = "SSL DISABLED";
  cert = "SSL DISABLED";
  process.serverConfig.cert = "SSL DISABLED";
  process.serverConfig.key = "SSL DISABLED";
}

let certificateError = null;
let sniReDos = false;
let sniCredentials = [];

// Load certificates
if (process.serverConfig.secure) {
  try {
    key = fs
      .readFileSync(
        process.serverConfig.key[0] != "/" &&
          !process.serverConfig.key.match(/^[A-Z0-9]:\\/)
          ? process.dirname + "/" + process.serverConfig.key
          : process.serverConfig.key,
      )
      .toString();
    cert = fs
      .readFileSync(
        process.serverConfig.cert[0] != "/" &&
          !process.serverConfig.cert.match(/^[A-Z0-9]:\\/)
          ? process.dirname + "/" + process.serverConfig.cert
          : process.serverConfig.cert,
      )
      .toString();
    const sniNames = Object.keys(process.serverConfig.sni);
    sniNames.forEach(function (sniName) {
      if (
        typeof sniName === "string" &&
        sniName.match(/\*[^*.:]*\*[^*.:]*(?:\.|:|$)/)
      ) {
        sniReDos = true;
      }
      sniCredentials.push({
        name: sniName,
        cert: fs
          .readFileSync(
            process.serverConfig.sni[sniName].cert[0] != "/" &&
              !process.serverConfig.sni[sniName].cert.match(/^[A-Z0-9]:\\/)
              ? process.dirname + "/" + process.serverConfig.sni[sniName].cert
              : process.serverConfig.sni[sniName].cert,
          )
          .toString(),
        key: fs
          .readFileSync(
            process.serverConfig.sni[sniName].key[0] != "/" &&
              !process.serverConfig.sni[sniName].key.match(/^[A-Z0-9]:\\/)
              ? process.dirname + "/" + process.serverConfig.sni[sniName].key
              : process.serverConfig.sni[sniName].key,
          )
          .toString(),
      });
    });
  } catch (err) {
    certificateError = err;
  }
}

let vnum = 0;
try {
  vnum = process.config.variables.node_module_version;
} catch (err) {
  // Version number not retrieved
}

if (vnum === undefined) vnum = 0;
if (process.isBun) vnum = 64;

let mods = [];
const modFiles = fs.readdirSync(__dirname + "/mods").sort();
let modInfos = [];
let modLoadingErrors = [];
let SSJSError = undefined;

if (!disableMods) {
  // Iterate through the list of mod files
  modFiles.forEach((modFileRaw) => {
    // Build the path to the current mod file
    const modFile = process.dirname + "/mods/" + modFileRaw;

    // Check if the current mod file is a regular file
    if (fs.statSync(modFile).isFile()) {
      if (modFile.indexOf(".js") == modFile.length - 3) {
        try {
          const mod = require(modFile);
          mods.push(mod);
          if (mod.modInfo) modInfos.push(mod.modInfo);
          else {
            modInfos.push({
              name:
                "Unknown mod (" +
                modFileRaw +
                "; module.exports.modInfo not set)",
              version: "ERROR",
            });
          }
        } catch (err) {
          modLoadingErrors.push({
            error: err,
            modName: modFileRaw,
          });
        }
      } else {
        try {
          // Define the modloader folder name
          let modloaderFolderName = "modloader";
          if (cluster.isPrimary === false) {
            // If not the master process, create a unique modloader folder name for each worker
            modloaderFolderName =
              ".modloader_w" + Math.floor(Math.random() * 65536);
          }

          // Determine if the mod file is a ".tar.gz" file or not
          if (modFile.indexOf(".tar.gz") == modFile.length - 7) {
            // If it's a ".tar.gz" file, extract its contents using `tar`
            if (tar._errored) throw tar._errored;
            tar.x({
              file: modFile,
              sync: true,
              C:
                process.dirname +
                "/temp/" +
                modloaderFolderName +
                "/" +
                modFileRaw,
            });
          } else {
            // If it's not a ".tar.gz" file, throw an error about `svrmodpack` support being dropped
            throw new Error(
              "This version of " +
                name +
                ' no longer supports "svrmodpack" library for SVR.JS mods. Please consider using newer mods with .tar.gz format.',
            );
          }

          // Add the mod to the mods list
          mods.push(
            legacyModWrapper(
              require(
                process.dirname +
                  "/temp/" +
                  modloaderFolderName +
                  "/" +
                  modFileRaw +
                  "/index.js",
              ),
            ),
          );

          // Read the mod's info file
          try {
            modInfos.push(
              JSON.parse(
                fs.readFileSync(
                  process.dirname +
                    "/temp/" +
                    modloaderFolderName +
                    "/" +
                    modFileRaw +
                    "/mod.info",
                ),
              ),
            );
          } catch (err) {
            // If failed to read info file, add a placeholder entry to modInfos with an error message
            modInfos.push({
              name: "Unknown mod (" + modFileRaw + ";" + err.message + ")",
              version: "ERROR",
            });
          }
        } catch (err) {
          modLoadingErrors.push({
            error: err,
            modName: modFileRaw,
          });
        }
      }
    }
  });

  // Define the temporary server-side JavaScript file name
  let tempServerSideScriptName = "serverSideScript.js";
  if (
    !(
      process.isBun &&
      process.versions.bun &&
      process.versions.bun[0] == "0"
    ) &&
    cluster.isPrimary === false
  ) {
    // If not the master process and it's not Bun, create a unique temporary server-side JavaScript file name for each worker
    tempServerSideScriptName =
      ".serverSideScript_w" + Math.floor(Math.random() * 65536) + ".js";
  }

  // Determine path of server-side script file
  let SSJSPath = "./serverSideScript.js";
  if (!process.serverConfig.useWebRootServerSideScript)
    SSJSPath = process.dirname + "/serverSideScript.js";

  // Check if a custom server side script file exists
  if (fs.existsSync(SSJSPath) && fs.statSync(SSJSPath).isFile()) {
    try {
      // Prepend necessary modules and variables to the custom server side script
      const modhead =
        "var readline = require('readline');\r\nvar os = require('os');\r\nvar http = require('http');\r\nvar url = require('url');\r\nvar fs = require('fs');\r\nvar path = require('path');\r\n" +
        (hexstrbase64 === undefined
          ? ""
          : "var hexstrbase64 = require('../hexstrbase64/index.js');\r\n") +
        (crypto.__disabled__ === undefined
          ? "var crypto = require('crypto');\r\nvar https = require('https');\r\n"
          : "") +
        'var stream = require(\'stream\');\r\nvar customvar1;\r\nvar customvar2;\r\nvar customvar3;\r\nvar customvar4;\r\n\r\nfunction Mod() {}\r\nMod.prototype.callback = function callback(req, res, serverconsole, responseEnd, href, ext, uobject, search, defaultpage, users, page404, head, foot, fd, elseCallback, configJSON, callServerError, getCustomHeaders, origHref, redirect, parsePostData, authUser) {\r\nreturn function () {\r\nvar disableEndElseCallbackExecute = false;\r\nfunction filterHeaders(e){var r={};return Object.keys(e).forEach((function(t){null!==e[t]&&void 0!==e[t]&&("object"==typeof e[t]?r[t]=JSON.parse(JSON.stringify(e[t])):r[t]=e[t])})),r}\r\nfunction checkHostname(e){if(void 0===e||"*"==e)return!0;if(req.headers.host&&0==e.indexOf("*.")&&"*."!=e){var r=e.substring(2);if(req.headers.host==r||req.headers.host.indexOf("."+r)==req.headers.host.length-r.length-1)return!0}else if(req.headers.host&&req.headers.host==e)return!0;return!1}\r\nfunction checkHref(e){return href==e||"win32"==os.platform()&&href.toLowerCase()==e.toLowerCase()}\r\n';
      const modfoot =
        "\r\nif(!disableEndElseCallbackExecute) {\r\ntry{\r\nelseCallback();\r\n} catch(err) {\r\n}\r\n}\r\n}\r\n}\r\nmodule.exports = Mod;";
      // Write the modified server side script to the temp folder
      fs.writeFileSync(
        process.dirname + "/temp/" + tempServerSideScriptName,
        modhead + fs.readFileSync(SSJSPath) + modfoot,
      );

      // Add the server side script to the mods list
      mods.push(
        legacyModWrapper(
          require(process.dirname + "/temp/" + tempServerSideScriptName),
        ),
      );
    } catch (err) {
      SSJSError = err;
    }
  }
}

// Middleware
let middleware = [
  require("./middleware/urlSanitizer.js"),
  require("./middleware/redirects.js"),
  require("./middleware/blocklist.js"),
  require("./middleware/webRootPostfixes.js"),
  require("./middleware/rewriteURL.js"),
  require("./middleware/responseHeaders.js"),
  require("./middleware/checkForbiddenPaths.js"),
  require("./middleware/nonStandardCodesAndHttpAuthentication.js"),
  require("./middleware/redirectTrailingSlashes.js"),
  ...mods, // Load SVR.JS mods as middleware
  require("./middleware/defaultHandlerChecks.js"),
  require("./middleware/status.js"),
  require("./middleware/staticFileServingAndDirectoryListings.js"),
];

// HTTP server handlers
const requestHandler = require("./handlers/requestHandler.js")(
  serverconsole,
  middleware,
);

const proxyHandler = require("./handlers/proxyHandler.js")(
  serverconsole,
  middleware,
);

const noproxyHandler = require("./handlers/noproxyHandler.js")(serverconsole);

const clientErrorHandler = require("./handlers/clientErrorHandler.js")(
  serverconsole,
);

const serverErrorHandler = require("./handlers/serverErrorHandler.js")(
  serverconsole,
);

let server = {};
let server2 = {};

// Create secondary HTTP server
try {
  server2 = http.createServer({
    requireHostHeader: false,
  });
} catch (err) {
  server2 = http.createServer();
}

// Add handlers to secondary HTTP server
server2.on("request", requestHandler);
server2.on("checkExpectation", requestHandler);
server2.on("clientError", clientErrorHandler);
server2.on(
  "connect",
  process.serverConfig.disableToHTTPSRedirect ? proxyHandler : noproxyHandler,
);
server2.on("error", (err) => {
  serverErrorHandler(err, true, server2, start);
});
server2.on("listening", () => {
  serverErrorHandler.resetAttempts(true);
  // TODO: listeningMessage();
});

// Create HTTP server
if (process.serverConfig.enableHTTP2 == true) {
  if (process.serverConfig.secure) {
    server = http2.createSecureServer({
      allowHTTP1: true,
      requireHostHeader: false,
      key: key,
      cert: cert,
      requestCert: process.serverConfig.useClientCertificate,
      rejectUnauthorized:
        process.serverConfig.rejectUnauthorizedClientCertificates,
      ciphers: process.serverConfig.cipherSuite,
      ecdhCurve: process.serverConfig.ecdhCurve,
      minVersion: process.serverConfig.tlsMinVersion,
      maxVersion: process.serverConfig.tlsMaxVersion,
      sigalgs: process.serverConfig.signatureAlgorithms,
      settings: process.serverConfig.http2Settings,
    });
  } else {
    server = http2.createServer({
      allowHTTP1: true,
      requireHostHeader: false,
      settings: process.serverConfig.http2Settings,
    });
  }
} else {
  if (process.serverConfig.secure) {
    server = https.createServer({
      key: key,
      cert: cert,
      requireHostHeader: false,
      requestCert: process.serverConfig.useClientCertificate,
      rejectUnauthorized:
        process.serverConfig.rejectUnauthorizedClientCertificates,
      ciphers: process.serverConfig.cipherSuite,
      ecdhCurve: process.serverConfig.ecdhCurve,
      minVersion: process.serverConfig.tlsMinVersion,
      maxVersion: process.serverConfig.tlsMaxVersion,
      sigalgs: process.serverConfig.signatureAlgorithms,
    });
  } else {
    try {
      server = http.createServer({
        requireHostHeader: false,
      });
    } catch (err) {
      server = http.createServer();
    }
  }
}

// Load SNI contexts into HTTP server
if (process.serverConfig.secure) {
  try {
    sniCredentials.forEach(function (sniCredentialsSingle) {
      server.addContext(sniCredentialsSingle.name, {
        cert: sniCredentialsSingle.cert,
        key: sniCredentialsSingle.key,
      });
      try {
        var snMatches = sniCredentialsSingle.name.match(
          /^([^:[]*|\[[^]]*\]?)((?::.*)?)$/,
        );
        if (!snMatches[1][0].match(/^\.+$/))
          snMatches[1][0] = snMatches[1][0].replace(/\.+$/, "");
        server._contexts[server._contexts.length - 1][0] = new RegExp(
          "^" +
            snMatches[1]
              .replace(/([.^$+?\-\\[\]{}])/g, "\\$1")
              .replace(/\*/g, "[^.:]*") +
            (snMatches[1][0] == "[" ||
            snMatches[1].match(
              /^(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])$/,
            )
              ? ""
              : ".?") +
            snMatches[2]
              .replace(/([.^$+?\-\\[\]{}])/g, "\\$1")
              .replace(/\*/g, "[^.]*") +
            "$",
          "i",
        );
      } catch (err) {
        // Can't replace regex, ignoring...
      }
    });
  } catch (err) {
    // SNI error
  }
}

// Add handlers to the server
server.on("request", requestHandler);
server.on("checkExpectation", requestHandler);
server.on("connect", proxyHandler);
server.on("clientError", clientErrorHandler);
server.on("error", function (err) {
  serverErrorHandler(err, false, server, start);
});
server.on("listening", () => {
  serverErrorHandler.resetAttempts(false);
  // TODO: listeningMessage();
});

if (process.serverConfig.secure) {
  server.prependListener("connection", function (sock) {
    sock.reallyDestroy = sock.destroy;
    sock.destroy = function () {
      sock.toDestroy = true;
    };
  });

  server.prependListener("tlsClientError", function (err, sock) {
    if (
      err.code == "ERR_SSL_HTTP_REQUEST" ||
      err.message.indexOf("http request") != -1
    ) {
      sock._parent.destroy = sock._parent.reallyDestroy;
      sock._readableState = sock._parent._readableState;
      sock._writableState = sock._parent._writableState;
      sock._parent.toDestroy = false;
      sock.pipe = function (a, b, c) {
        sock._parent.pipe(a, b, c);
      };
      sock.write = function (a, b, c) {
        sock._parent.write(a, b, c);
      };
      sock.end = function (a, b, c) {
        sock._parent.end(a, b, c);
      };
      sock.destroyed = sock._parent.destroyed;
      sock.readable = sock._parent.readable;
      sock.writable = sock._parent.writable;
      sock.remoteAddress = sock._parent.remoteAddress;
      sock.remotePort = sock._parent.remoteAddress;
      sock.destroy = function (a, b, c) {
        try {
          sock._parent.destroy(a, b, c);
          sock.destroyed = sock._parent.destroyed;
        } catch (err) {
          // Socket is probably already destroyed.
        }
      };
    } else {
      sock._parent.destroy = sock._parent.reallyDestroy;
      try {
        if (sock._parent.toDestroy) sock._parent.destroy();
      } catch (err) {
        // Socket is probably already destroyed.
      }
    }
  });

  server.prependListener("secureConnection", function (sock) {
    sock._parent.destroy = sock._parent.reallyDestroy;
    delete sock._parent.reallyDestroy;
  });

  if (process.serverConfig.enableOCSPStapling && !ocsp._errored) {
    server.on("OCSPRequest", function (cert, issuer, callback) {
      ocsp.getOCSPURI(cert, function (err, uri) {
        if (err) return callback(err);

        const req = ocsp.request.generate(cert, issuer);
        const options = {
          url: uri,
          ocsp: req.data,
        };

        ocspCache.request(req.id, options, callback);
      });
    });
  }
}

// TODO: close, open, stop, restart commands
// Base commands
let commands = {
  help: (args, log) => {
    log("Server commands:\n" + Object.keys(commands).join(" "));
  },
  mods: function (args, log) {
    log("Mods:");
    for (let i = 0; i < modInfos.length; i++) {
      log(
        (i + 1).toString() +
          ". " +
          modInfos[i].name +
          " " +
          modInfos[i].version,
      );
    }
    if (modInfos.length == 0) {
      log("No mods installed.");
    }
  },
  clear: function (args, log) {
    console.clear();
  },
};

// Load commands from middleware
middleware.forEach((middlewareO) => {
  if (middlewareO.commands) {
    Object.keys(middlewareO.commands).forEach((command) => {
      if (commands[command]) {
        commands[command] = (args, log) => {
          middlewareO.commands(args, log, commands[command]);
        };
      } else {
        commands[command] = (args, log) => {
          middlewareO.commands(args, log, () => {});
        };
      }
    });
  }
});

// SVR.JS worker spawn-related
let SVRJSInitialized = false;
let crashed = false;
let threadLimitWarned = false;

// SVR.JS worker forking function
function SVRJSFork() {
  // Log
  if (SVRJSInitialized)
    serverconsole.locmessage(
      "Starting next thread, because previous one hung up/crashed...",
    );
  // Fork new worker
  var newWorker = {};
  try {
    if (
      !threadLimitWarned &&
      cluster.__shimmed__ &&
      process.isBun &&
      process.versions.bun &&
      process.versions.bun[0] != "0"
    ) {
      threadLimitWarned = true;
      serverconsole.locwarnmessage(
        "SVR.JS limited the number of workers to one, because of startup problems in Bun 1.0 and newer with shimmed (not native) clustering module. Reliability may suffer.",
      );
    }
    if (
      !(
        cluster.__shimmed__ &&
        process.isBun &&
        process.versions.bun &&
        process.versions.bun[0] != "0" &&
        Object.keys(cluster.workers) > 0
      )
    ) {
      newWorker = cluster.fork();
    } else {
      if (SVRJSInitialized)
        serverconsole.locwarnmessage(
          "SVR.JS limited the number of workers to one, because of startup problems in Bun 1.0 and newer with shimmed (not native) clustering module. Reliability may suffer.",
        );
    }
  } catch (err) {
    if (err.name == "NotImplementedError") {
      // If cluster.fork throws a NotImplementedError, shim cluster module
      cluster.bunShim();
      if (
        !threadLimitWarned &&
        cluster.__shimmed__ &&
        process.isBun &&
        process.versions.bun &&
        process.versions.bun[0] != "0"
      ) {
        threadLimitWarned = true;
        serverconsole.locwarnmessage(
          "SVR.JS limited the number of workers to one, because of startup problems in Bun 1.0 and newer with shimmed (not native) clustering module. Reliability may suffer.",
        );
      }
      if (
        !(
          cluster.__shimmed__ &&
          process.isBun &&
          process.versions.bun &&
          process.versions.bun[0] != "0" &&
          Object.keys(cluster.workers) > 0
        )
      ) {
        newWorker = cluster.fork();
      } else {
        if (SVRJSInitialized)
          serverconsole.locwarnmessage(
            "SVR.JS limited the number of workers to one, because of startup problems in Bun 1.0 and newer with shimmed (not native) clustering module. Reliability may suffer.",
          );
      }
    } else {
      throw err;
    }
  }

  // Add event listeners
  if (newWorker.on) {
    newWorker.on("error", function (err) {
      if (!exiting)
        serverconsole.locwarnmessage(
          "There was a problem when handling SVR.JS worker! (from master process side) Reason: " +
            err.message,
        );
    });
    newWorker.on("exit", function () {
      if (!exiting && Object.keys(cluster.workers).length == 0) {
        crashed = true;
        SVRJSFork();
      }
    });
    // TODO: add listeners to workers
    // newWorker.on("message", bruteForceListenerWrapper(newWorker));
    // newWorker.on("message", listenConnListener);
  }
}

// Starting function
function start(init) {
  init = Boolean(init);
  if (cluster.isPrimary || cluster.isPrimary === undefined) {
    if (init) {
      for (i = 0; i < logo.length; i++) console.log(logo[i]); // Print logo
      console.log();
      console.log(
        "Welcome to \x1b[1m" +
          name +
          " - a web server running on Node.JS\x1b[0m",
      );

      // Print warnings
      if (version.indexOf("Nightly-") === 0)
        serverconsole.locwarnmessage(
          "This version is only for test purposes and may be unstable.",
        );
      if (process.serverConfig.enableHTTP2 && !process.serverConfig.secure)
        serverconsole.locwarnmessage(
          "HTTP/2 without HTTPS may not work in web browsers. Web browsers only support HTTP/2 with HTTPS!",
        );
      if (process.isBun) {
        serverconsole.locwarnmessage(
          "Bun support is experimental. Some features of " +
            name +
            ", " +
            name +
            " mods and " +
            name +
            " server-side JavaScript may not work as expected.",
        );
        if (
          process.isBun &&
          !(
            process.versions.bun &&
            !process.versions.bun.match(
              /^(?:0\.|1\.0\.|1\.1\.[0-9](?![0-9])|1\.1\.1[0-2](?![0-9]))/,
            )
          ) &&
          process.serverConfig.users.some(function (entry) {
            return entry.pbkdf2;
          })
        )
          serverconsole.locwarnmessage(
            "PBKDF2 password hashing function in Bun versions older than v1.1.13 blocks the event loop, which may result in denial of service.",
          );
      }
      if (cluster.isPrimary === undefined)
        serverconsole.locwarnmessage(
          "You're running " +
            name +
            " on single thread. Reliability may suffer, as the server is stopped after crash.",
        );
      if (crypto.__disabled__ !== undefined)
        serverconsole.locwarnmessage(
          "Your Node.JS version doesn't have crypto support! The 'crypto' module is essential for providing cryptographic functionality in Node.JS. Without crypto support, certain security features may be unavailable, and some functionality may not work as expected. It's recommended to use a Node.JS version that includes crypto support to ensure the security and proper functioning of your server.",
        );
      if (crypto.__disabled__ === undefined && !crypto.scrypt)
        serverconsole.locwarnmessage(
          "Your JavaScript runtime doesn't have native scrypt support. HTTP authentication involving scrypt hashes will not work.",
        );
      if (
        !process.isBun &&
        /^v(?:[0-9]\.|1[0-7]\.|18\.(?:[0-9]|1[0-8])\.|18\.19\.0|20\.(?:[0-9]|10)\.|20\.11\.0|21\.[0-5]\.|21\.6\.0|21\.6\.1(?![0-9]))/.test(
          process.version,
        )
      )
        serverconsole.locwarnmessage(
          "Your Node.JS version is vulnerable to HTTP server DoS (CVE-2024-22019).",
        );
      if (
        !process.isBun &&
        /^v(?:[0-9]\.|1[0-7]\.|18\.(?:1?[0-9])\.|18\.20\.0|20\.(?:[0-9]|1[01])\.|20\.12\.0|21\.[0-6]\.|21\.7\.0|21\.7\.1(?![0-9]))/.test(
          process.version,
        )
      )
        serverconsole.locwarnmessage(
          "Your Node.JS version is vulnerable to HTTP server request smuggling (CVE-2024-27982).",
        );
      if (process.getuid && process.getuid() == 0)
        serverconsole.locwarnmessage(
          "You're running " +
            name +
            " as root. It's recommended to run " +
            name +
            " as an non-root user. Running " +
            name +
            " as root may increase the risks of OS command execution vulnerabilities.",
        );
      if (
        !process.isBun &&
        process.serverConfig.secure &&
        process.versions &&
        process.versions.openssl &&
        process.versions.openssl.substring(0, 2) == "1."
      ) {
        if (new Date() > new Date("11 September 2023")) {
          serverconsole.locwarnmessage(
            "OpenSSL 1.x is no longer receiving security updates after 11th September 2023. Your HTTPS communication might be vulnerable. It is recommended to update to a newer version of Node.JS that includes OpenSSL 3.0 or higher to ensure the security of your server and data.",
          );
        } else {
          serverconsole.locwarnmessage(
            "OpenSSL 1.x will no longer receive security updates after 11th September 2023. Your HTTPS communication might be vulnerable in future. It is recommended to update to a newer version of Node.JS that includes OpenSSL 3.0 or higher to ensure the security of your server and data.",
          );
        }
      }
      if (
        process.serverConfig.secure &&
        process.serverConfig.enableOCSPStapling &&
        ocsp._errored
      )
        serverconsole.locwarnmessage(
          "Can't load OCSP module. OCSP stapling will be disabled. OCSP stapling is a security feature that improves the performance and security of HTTPS connections by caching the certificate status response. If you require this feature, consider updating your Node.JS version or checking for any issues with the 'ocsp' module.",
        );
      if (process.serverConfig.disableMods)
        serverconsole.locwarnmessage(
          "" +
            name +
            " is running without mods and server-side JavaScript enabled. Web applications may not work as expected",
        );
      if (process.serverConfig.optOutOfStatisticsServer)
        serverconsole.locmessage(
          "" +
            name +
            " is configured to opt out of sending data to the statistics server.",
        );
      console.log();

      // Display mod and server-side JavaScript errors
      if (process.isPrimary || process.isPrimary === undefined) {
        modLoadingErrors.forEach(function (modLoadingError) {
          serverconsole.locwarnmessage(
            'There was a problem while loading a "' +
              String(modLoadingError.modName).replace(/[\r\n]/g, "") +
              '" mod.',
          );
          serverconsole.locwarnmessage("Stack:");
          serverconsole.locwarnmessage(
            generateErrorStack(modLoadingError.error),
          );
        });
        if (SSJSError) {
          serverconsole.locwarnmessage(
            "There was a problem while loading server-side JavaScript.",
          );
          serverconsole.locwarnmessage("Stack:");
          serverconsole.locwarnmessage(generateErrorStack(SSJSError));
        }
        if (SSJSError || modLoadingErrors.length > 0) console.log();
      }

      // Print server information
      serverconsole.locmessage("Server version: " + version);
      if (process.isBun)
        serverconsole.locmessage("Bun version: v" + process.versions.bun);
      else serverconsole.locmessage("Node.JS version: " + process.version);
      const CPUs = os.cpus();
      if (CPUs.length > 0)
        serverconsole.locmessage(
          "CPU: " + (CPUs.length > 1 ? CPUs.length + "x " : "") + CPUs[0].model,
        );

      // Throw errors
      if (vnum < 64)
        throw new Error(
          "" +
            name +
            " requires Node.JS 10.0.0 and newer, but your Node.JS version isn't supported by " +
            name +
            ".",
        );
      if (configJSONRErr)
        throw new Error(
          "Can't read " +
            name +
            " configuration file: " +
            configJSONRErr.message,
        );
      if (configJSONPErr)
        throw new Error(
          "" + name + " configuration parse error: " + configJSONPErr.message,
        );
      if (
        process.serverConfig.enableHTTP2 &&
        !process.serverConfig.secure &&
        typeof process.serverConfig.port != "number"
      )
        throw new Error(
          "HTTP/2 without HTTPS, along with Unix sockets/Windows named pipes aren't supported by " +
            name +
            ".",
        );
      if (process.serverConfig.enableHTTP2 && http2.__disabled__ !== undefined)
        throw new Error(
          "HTTP/2 isn't supported by your Node.JS version! You may not be able to use HTTP/2 with " +
            name +
            "",
        );
      if (listenAddress) {
        if (listenAddress.match(/^[0-9]+$/))
          throw new Error(
            "Listening network address can't be numeric (it need to be either valid IP address, or valid domain name).",
          );
        if (
          listenAddress.match(
            /^(?:2(?:2[4-9]|3[0-9])\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$|ff[0-9a-f][0-9a-f]:[0-9a-f:])/i,
          )
        )
          throw new Error("" + name + " can't listen on multicast address.");
        if (brdIPs.indexOf(listenAddress) > -1)
          throw new Error("" + name + " can't listen on broadcast address.");
        if (netIPs.indexOf(listenAddress) > -1)
          throw new Error("" + name + " can't listen on subnet address.");
      }
      if (certificateError)
        throw new Error(
          "There was a problem with SSL certificate/private key: " +
            certificateError.message,
        );
      if (wwwrootError)
        throw new Error(
          "There was a problem with your web root: " + wwwrootError.message,
        );
      if (sniReDos)
        throw new Error(
          "Refusing to start, because the current SNI configuration would make the server vulnerable to ReDoS.",
        );
    }

    // Print server startup information
    if (
      !(
        process.serverConfig.secure &&
        process.serverConfig.disableNonEncryptedServer
      )
    )
      serverconsole.locmessage(
        "Starting HTTP server at " +
          (typeof process.serverConfig.port == "number"
            ? listenAddress
              ? (listenAddress.indexOf(":") > -1
                  ? "[" + listenAddress + "]"
                  : listenAddress) + ":"
              : "port "
            : "") +
          process.serverConfig.port.toString() +
          "...",
      );
    if (process.serverConfig.secure)
      serverconsole.locmessage(
        "Starting HTTPS server at " +
          (typeof process.serverConfig.sport == "number"
            ? sListenAddress
              ? (sListenAddress.indexOf(":") > -1
                  ? "[" + sListenAddress + "]"
                  : sListenAddress) + ":"
              : "port "
            : "") +
          process.serverConfig.sport.toString() +
          "...",
      );
  }

  if (!cluster.isPrimary) {
    try {
      if (
        typeof (process.serverConfig.secure
          ? process.serverConfig.sport
          : process.serverConfig.port) == "number" &&
        (process.serverConfig.secure ? sListenAddress : listenAddress)
      ) {
        server.listen(
          process.serverConfig.secure
            ? process.serverConfig.sport
            : process.serverConfig.port,
          process.serverConfig.secure ? sListenAddress : listenAddress,
        );
      } else {
        server.listen(
          process.serverConfig.secure
            ? process.serverConfig.sport
            : process.serverConfig.port,
        );
      }
    } catch (err) {
      if (err.code != "ERR_SERVER_ALREADY_LISTEN") throw err;
    }
    if (
      process.serverConfig.secure &&
      !process.serverConfig.disableNonEncryptedServer
    ) {
      try {
        if (typeof process.serverConfig.port == "number" && listenAddress) {
          server2.listen(process.serverConfig.port, listenAddress);
        } else {
          server2.listen(process.serverConfig.port);
        }
      } catch (err) {
        if (err.code != "ERR_SERVER_ALREADY_LISTEN") throw err;
      }
    }
  }

  // TODO: implement clustering and commands
  /*
  // SVR.JS commmands
  var commands = {
    close: function () {
      try {
        server.close();
        if (process.serverConfig.secure && !process.serverConfig.disableNonEncryptedServer) {
          server2.close();
        }
        if (cluster.isPrimary === undefined) serverconsole.climessage("Server closed.");
        else {
          process.send("Server closed.");
          process.send("\x12CLOSE");
        }
      } catch (err) {
        if (cluster.isPrimary === undefined) serverconsole.climessage("Cannot close server! Reason: " + err.message);
        else process.send("Cannot close server! Reason: " + err.message);
      }
    },
    open: function () {
      try {
        if (typeof (process.serverConfig.secure ? process.serverConfig.sport : process.serverConfig.port) == "number" && (process.serverConfig.secure ? sListenAddress : listenAddress)) {
          server.listen(process.serverConfig.secure ? process.serverConfig.sport : process.serverConfig.port, process.serverConfig.secure ? sListenAddress : listenAddress);
        } else {
          server.listen(process.serverConfig.secure ? process.serverConfig.sport : process.serverConfig.port);
        }
        if (process.serverConfig.secure && !process.serverConfig.disableNonEncryptedServer) {
          if (typeof process.serverConfig.port == "number" && listenAddress) {
            server2.listen(process.serverConfig.port, listenAddress);
          } else {
            server2.listen(process.serverConfig.port);
          }
        }
        if (cluster.isPrimary === undefined) serverconsole.climessage("Server opened.");
        else {
          process.send("Server opened.");
        }
      } catch (err) {
        if (cluster.isPrimary === undefined) serverconsole.climessage("Cannot open server! Reason: " + err.message);
        else process.send("Cannot open server! Reason: " + err.message);
      }
    },
    help: function () {
      if (cluster.isPrimary === undefined) serverconsole.climessage("Server commands:\n" + Object.keys(commands).join(" "));
      else process.send("Server commands:\n" + Object.keys(commands).join(" "));
    },
    mods: function () {
      if (cluster.isPrimary === undefined) serverconsole.climessage("Mods:");
      else process.send("Mods:");
      for (var i = 0; i < modInfos.length; i++) {
        if (cluster.isPrimary === undefined) serverconsole.climessage((i + 1).toString() + ". " + modInfos[i].name + " " + modInfos[i].version);
        else process.send((i + 1).toString() + ". " + modInfos[i].name + " " + modInfos[i].version);
      }
      if (modInfos.length == 0) {
        if (cluster.isPrimary === undefined) serverconsole.climessage("No mods installed.");
        else process.send("No mods installed.");
      }
    },
    stop: function (retcode) {
      reallyExiting = true;
      clearInterval(passwordHashCacheIntervalId);
      if ((!cluster.isPrimary && cluster.isPrimary !== undefined) && server.listening) {
        try {
          server.close(function () {
            if (server2.listening) {
              try {
                server2.close(function () {
                  if (!process.removeFakeIPC) {
                    if (typeof retcode == "number") {
                      process.exit(retcode);
                    } else {
                      process.exit(0);
                    }
                  }
                });
              } catch (err) {
                if (!process.removeFakeIPC) {
                  if (typeof retcode == "number") {
                    process.exit(retcode);
                  } else {
                    process.exit(0);
                  }
                }
              }
            } else {
              if (!process.removeFakeIPC) {
                if (typeof retcode == "number") {
                  process.exit(retcode);
                } else {
                  process.exit(0);
                }
              }
            }
          });
        } catch (err) {
          if (typeof retcode == "number") {
            process.exit(retcode);
          } else {
            process.exit(0);
          }
        }
        if (process.removeFakeIPC) process.removeFakeIPC();
      } else {
        if (typeof retcode == "number") {
          process.exit(retcode);
        } else {
          process.exit(0);
        }
      }
    },
    clear: function () {
      console.clear();
    },
    block: function (ip) {
      if (ip == undefined || JSON.stringify(ip) == "[]") {
        if (cluster.isPrimary === undefined) serverconsole.climessage("Cannot block non-existent IP.");
        else if (!cluster.isPrimary) process.send("Cannot block non-existent IP.");
      } else {
        for (var i = 0; i < ip.length; i++) {
          if (ip[i] != "localhost" && ip[i].indexOf(":") == -1) {
            ip[i] = "::ffff:" + ip[i];
          }
          if (!blocklist.check(ip[i])) {
            blocklist.add(ip[i]);
          }
        }
        if (cluster.isPrimary === undefined) serverconsole.climessage("IPs successfully blocked.");
        else if (!cluster.isPrimary) process.send("IPs successfully blocked.");
      }
    },
    unblock: function (ip) {
      if (ip == undefined || JSON.stringify(ip) == "[]") {
        if (cluster.isPrimary === undefined) serverconsole.climessage("Cannot unblock non-existent IP.");
        else if (!cluster.isPrimary) process.send("Cannot unblock non-existent IP.");
      } else {
        for (var i = 0; i < ip.length; i++) {
          if (ip[i].indexOf(":") == -1) {
            ip[i] = "::ffff:" + ip[i];
          }
          blocklist.remove(ip[i]);
        }
        if (cluster.isPrimary === undefined) serverconsole.climessage("IPs successfully unblocked.");
        else if (!cluster.isPrimary) process.send("IPs successfully unblocked.");
      }
    },
    restart: function () {
      if (cluster.isPrimary === undefined) serverconsole.climessage("This command is not supported on single-threaded " + name + ".");
      else process.send("This command need to be run in " + name + " master.");
    }
  };
  */

  /*if (init) {
    var workersToFork = 1;

    function getWorkerCountToFork() {
      var workersToFork = os.availableParallelism ? os.availableParallelism() : os.cpus().length;
      try {
        var useAvailableCores = Math.round((os.freemem()) / 50000000) - 1; // 1 core deleted for safety...
        if (workersToFork > useAvailableCores) workersToFork = useAvailableCores;
      } catch (err) {
        // Nevermind... Don't want SVR.JS to fail starting, because os.freemem function is not working.
      }
      if (workersToFork < 1) workersToFork = 1; // If SVR.JS is run on Haiku (os.cpus in Haiku returns empty array) or if useAvailableCores = 0
      return workersToFork;
    }

    function forkWorkers(workersToFork, callback) {
      for (var i = 0; i < workersToFork; i++) {
        if (i == 0) {
          SVRJSFork();
        } else {
          setTimeout((function (i) {
            return function () {
              SVRJSFork();
              if (i >= workersToFork - 1) callback();
            };
          })(i), i * 6.6);
        }
      }
    }

    if (cluster.isPrimary === undefined) {
      setInterval(function () {
        try {
          saveConfig();
          serverconsole.locmessage("Configuration saved.");
        } catch (err) {
          throw new Error(err);
        }
      }, 300000);
    } else if (cluster.isPrimary) {
      setInterval(function () {
        var allWorkers = Object.keys(cluster.workers);
        var goodWorkers = [];

        function checkWorker(callback, _id) {
          if (typeof _id === "undefined") _id = 0;
          if (_id >= allWorkers.length) {
            callback();
            return;
          }
          try {
            if (cluster.workers[allWorkers[_id]]) {
              isWorkerHungUpBuff2 = true;
              cluster.workers[allWorkers[_id]].on("message", msgListener);
              cluster.workers[allWorkers[_id]].send("\x14PINGPING");
              setTimeout(function () {
                if (isWorkerHungUpBuff2) {
                  checkWorker(callback, _id + 1);
                } else {
                  goodWorkers.push(allWorkers[_id]);
                  checkWorker(callback, _id + 1);
                }
              }, 250);
            } else {
              checkWorker(callback, _id + 1);
            }
          } catch (err) {
            if (cluster.workers[allWorkers[_id]]) {
              cluster.workers[allWorkers[_id]].removeAllListeners("message");
              cluster.workers[allWorkers[_id]].on("message", bruteForceListenerWrapper(cluster.workers[allWorkers[_id]]));
              cluster.workers[allWorkers[_id]].on("message", listenConnListener);
            }
            checkWorker(callback, _id + 1);
          }
        }
        checkWorker(function () {
          var wN = Math.floor(Math.random() * goodWorkers.length); //Send a configuration saving message to a random worker.
          try {
            if (cluster.workers[goodWorkers[wN]]) {
              isWorkerHungUpBuff2 = true;
              cluster.workers[goodWorkers[wN]].on("message", msgListener);
              cluster.workers[goodWorkers[wN]].send("\x14SAVECONF");
            }
          } catch (err) {
            if (cluster.workers[goodWorkers[wN]]) {
              cluster.workers[goodWorkers[wN]].removeAllListeners("message");
              cluster.workers[goodWorkers[wN]].on("message", bruteForceListenerWrapper(cluster.workers[goodWorkers[wN]]));
              cluster.workers[goodWorkers[wN]].on("message", listenConnListener);
            }
            serverconsole.locwarnmessage("There was a problem while saving configuration file. Reason: " + err.message);
          }
        });
      }, 300000);
    }
    if (!cluster.isPrimary && cluster.isPrimary !== undefined) {
      process.on("message", function (line) {
        try {
          if (line == "") {
            // Does Nothing
            process.send("\x12END");
          } else if (line == "\x14SAVECONF") {
            // Save configuration file
            try {
              saveConfig();
              process.send("\x12SAVEGOOD");
            } catch (err) {
              process.send("\x12SAVEERR" + err.message);
            }
            process.send("\x12END");
          } else if (line == "\x14KILLPING") {
            if (!reallyExiting) {
              process.send("\x12KILLOK");
              process.send("\x12END");
            }
            // Refuse to send, when it's really exiting. Main process will treat the worker as hung up anyway...
          } else if (line == "\x14PINGPING") {
            if (!reallyExiting) {
              process.send("\x12PINGOK");
              process.send("\x12END");
            }
            // Refuse to send, when it's really exiting. Main process will treat the worker as hung up anyway...
          } else if (line == "\x14KILLREQ") {
            if (reqcounter - reqcounterKillReq < 2) {
              process.send("\x12KILLTERMMSG");
              process.nextTick(commands.stop);
            } else {
              reqcounterKillReq = reqcounter;
            }
          } else if (commands[line.split(" ")[0]] !== undefined && commands[line.split(" ")[0]] !== null) {
            var argss = line.split(" ");
            var command = argss.shift();
            commands[command](argss);
            process.send("\x12END");
          } else {
            process.send("Unrecognized command \"" + line.split(" ")[0] + "\".");
            process.send("\x12END");
          }
        } catch (err) {
          if (line != "") {
            process.send("Can't execute command \"" + line.split(" ")[0] + "\".");
            process.send("\x12END");
          }
        }
      });
    } else {
      var rla = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: ""
      });
      rla.prompt();
      rla.on("line", function (line) {
        line = line.trim();
        var argss = line.split(" ");
        var command = argss.shift();
        if (line != "") {
          if (cluster.isPrimary !== undefined) {
            var allWorkers = Object.keys(cluster.workers);
            if (command == "block") commands.block(argss);
            if (command == "unblock") commands.unblock(argss);
            if (command == "restart") {
              var stopError = false;
              exiting = true;
              for (var i = 0; i < allWorkers.length; i++) {
                try {
                  if (cluster.workers[allWorkers[i]]) {
                    cluster.workers[allWorkers[i]].kill();
                  }
                } catch (err) {
                  stopError = true;
                }
              }
              if (stopError) serverconsole.climessage("Some " + name + " workers might not be stopped.");
              SVRJSInitialized = false;
              closedMaster = true;

              workersToFork = getWorkerCountToFork();
              forkWorkers(workersToFork, function () {
                SVRJSInitialized = true;
                exiting = false;
                serverconsole.climessage("" + name + " workers restarted.");
              });

              return;
            }
            if (command == "stop") {
              exiting = true;
              allWorkers = Object.keys(cluster.workers);
            }
            allWorkers.forEach(function (clusterID) {
              try {
                if (cluster.workers[clusterID]) {
                  cluster.workers[clusterID].on("message", msgListener);
                  cluster.workers[clusterID].send(line);
                }
              } catch (err) {
                if (cluster.workers[clusterID]) {
                  cluster.workers[clusterID].removeAllListeners("message");
                  cluster.workers[clusterID].on("message", bruteForceListenerWrapper(cluster.workers[clusterID]));
                  cluster.workers[clusterID].on("message", listenConnListener);
                }
                serverconsole.climessage("Can't run command \"" + command + "\".");
              }
            });
            if (command == "stop") {
              setTimeout(function () {
                reallyExiting = true;
                process.exit(0);
              }, 50);
            }
          } else {
            if (command == "stop") {
              reallyExiting = true;
              process.exit(0);
            }
            try {
              commands[command](argss);
            } catch (err) {
              serverconsole.climessage("Unrecognized command \"" + command + "\".");
            }
          }
        }
        rla.prompt();
      });
    }

    if (cluster.isPrimary || cluster.isPrimary === undefined) {
      // Cluster forking code
      if (cluster.isPrimary !== undefined && init) {
        workersToFork = getWorkerCountToFork();
        forkWorkers(workersToFork, function () {
          SVRJSInitialized = true;
        });

        cluster.workers[Object.keys(cluster.workers)[0]].on("message", function (msg) {
          if (msg.length >= 8 && msg.indexOf("\x12ERRLIST") == 0) {
            var tries = parseInt(msg.substring(8, 9));
            var errCode = msg.substring(9);
            serverconsole.locerrmessage(serverErrorDescs[errCode] ? serverErrorDescs[errCode] : serverErrorDescs["UNKNOWN"]);
            serverconsole.locmessage(tries + " attempts left.");
          }
          if (msg.length >= 9 && msg.indexOf("\x12ERRCRASH") == 0) {
            var errno = errors[msg.substring(9)];
            process.exit(errno ? errno : 1);
          }
        });

        // Hangup check and restart
        setInterval(function () {
          if (!closedMaster && !exiting) {
            var chksocket = {};
            if (process.serverConfig.secure && process.serverConfig.disableNonEncryptedServer) {
              chksocket = https.get({
                hostname: (typeof process.serverConfig.sport == "number" && sListenAddress) ? sListenAddress : "localhost",
                port: (typeof process.serverConfig.sport == "number") ? process.serverConfig.sport : undefined,
                socketPath: (typeof process.serverConfig.sport == "number") ? undefined : process.serverConfig.sport,
                headers: {
                  "X-SVR-JS-From-Main-Thread": "true",
                  "User-Agent": (exposeServerVersion ? "SVR.JS/" + version + " (" + getOS() + "; " + (process.isBun ? ("Bun/v" + process.versions.bun + "; like Node.JS/" + process.version) : ("Node.JS/" + process.version)) + ")" : "SVR.JS")
                },
                timeout: 1620,
                rejectUnauthorized: false
              }, function (res) {
                chksocket.removeAllListeners("timeout");
                res.destroy();
                res.on("data", function () {});
                res.on("end", function () {});
                crashed = false;
              }).on("error", function () {
                if (!exiting) {
                  if (!crashed) SVRJSFork();
                  else crashed = false;
                }
              }).on("timeout", function () {
                if (!exiting) SVRJSFork();
                crashed = true;
              });
            } else if ((process.serverConfig.enableHTTP2 == undefined ? false : process.serverConfig.enableHTTP2) && !process.serverConfig.secure) {
              // It doesn't support through Unix sockets or Windows named pipes
              var address = ((typeof process.serverConfig.port == "number" && listenAddress) ? listenAddress : "localhost").replace(/\/@/g, "");
              if (address.indexOf(":") > -1) {
                address = "[" + address + "]";
              }
              var connection = http2.connect("http://" + address + ":" + process.serverConfig.port.toString());
              connection.on("error", function () {
                if (!exiting) {
                  if (!crashed) SVRJSFork();
                  else crashed = false;
                }
              });
              connection.setTimeout(1620, function () {
                if (!exiting) SVRJSFork();
                crashed = true;
              });
              chksocket = connection.request({
                ":path": "/",
                "x-svr-js-from-main-thread": "true",
                "user-agent": (exposeServerVersion ? "SVR.JS/" + version + " (" + getOS() + "; " + (process.isBun ? ("Bun/v" + process.versions.bun + "; like Node.JS/" + process.version) : ("Node.JS/" + process.version)) + ")" : "SVR.JS")
              });
              chksocket.on("response", function () {
                connection.close();
                crashed = false;
              });
              chksocket.on("error", function () {
                if (!exiting) {
                  if (!crashed) SVRJSFork();
                  else crashed = false;
                }
              });
            } else {
              chksocket = http.get({
                hostname: (typeof process.serverConfig.port == "number" && listenAddress) ? listenAddress : "localhost",
                port: (typeof process.serverConfig.port == "number") ? process.serverConfig.port : undefined,
                socketPath: (typeof process.serverConfig.port == "number") ? undefined : process.serverConfig.port,
                headers: {
                  "X-SVR-JS-From-Main-Thread": "true",
                  "User-Agent": (exposeServerVersion ? "SVR.JS/" + version + " (" + getOS() + "; " + (process.isBun ? ("Bun/v" + process.versions.bun + "; like Node.JS/" + process.version) : ("Node.JS/" + process.version)) + ")" : "SVR.JS")
                },
                timeout: 1620
              }, function (res) {
                chksocket.removeAllListeners("timeout");
                res.destroy();
                res.on("data", function () {});
                res.on("end", function () {});
                crashed = false;
              }).on("error", function () {
                if (!exiting) {
                  if (!crashed) SVRJSFork();
                  else crashed = false;
                }
              }).on("timeout", function () {
                if (!exiting) SVRJSFork();
                crashed = true;
              });
            }
          }
        }, 4550);

        // Termination of unused good workers
        if (!disableUnusedWorkerTermination && cluster.isPrimary !== undefined) {
          setTimeout(function () {
            setInterval(function () {
              if (!closedMaster && !exiting) {
                var allWorkers = Object.keys(cluster.workers);

                var minWorkers = 0;
                minWorkers = Math.ceil(workersToFork * 0.625);
                if (minWorkers < 2) minWorkers = 2;
                if (minWorkers > 12) minWorkers = 12;

                var goodWorkers = [];

                function checkWorker(callback, _id) {
                  if (typeof _id === "undefined") _id = 0;
                  if (_id >= allWorkers.length) {
                    callback();
                    return;
                  }
                  try {
                    if (cluster.workers[allWorkers[_id]]) {
                      isWorkerHungUpBuff = true;
                      cluster.workers[allWorkers[_id]].on("message", msgListener);
                      cluster.workers[allWorkers[_id]].send("\x14KILLPING");
                      setTimeout(function () {
                        if (isWorkerHungUpBuff) {
                          checkWorker(callback, _id + 1);
                        } else {
                          goodWorkers.push(allWorkers[_id]);
                          checkWorker(callback, _id + 1);
                        }
                      }, 250);
                    } else {
                      checkWorker(callback, _id + 1);
                    }
                  } catch (err) {
                    if (cluster.workers[allWorkers[_id]]) {
                      cluster.workers[allWorkers[_id]].removeAllListeners("message");
                      cluster.workers[allWorkers[_id]].on("message", bruteForceListenerWrapper(cluster.workers[allWorkers[_id]]));
                      cluster.workers[allWorkers[_id]].on("message", listenConnListener);
                    }
                    checkWorker(callback, _id + 1);
                  }
                }
                checkWorker(function () {
                  if (goodWorkers.length > minWorkers) {
                    var wN = Math.floor(Math.random() * goodWorkers.length);
                    if (wN == goodWorkers.length) return;
                    try {
                      if (cluster.workers[goodWorkers[wN]]) {
                        isWorkerHungUpBuff = true;
                        cluster.workers[goodWorkers[wN]].on("message", msgListener);
                        cluster.workers[goodWorkers[wN]].send("\x14KILLREQ");
                      }
                    } catch (err) {
                      if (cluster.workers[goodWorkers[wN]]) {
                        cluster.workers[goodWorkers[wN]].removeAllListeners("message");
                        cluster.workers[goodWorkers[wN]].on("message", bruteForceListenerWrapper(cluster.workers[goodWorkers[wN]]));
                        cluster.workers[goodWorkers[wN]].on("message", listenConnListener);
                      }
                      serverconsole.locwarnmessage("There was a problem while terminating unused worker process. Reason: " + err.message);
                    }
                  }
                });
              }
            }, 300000);
          }, 2000);
        }
      }
    }
  }*/
}

modLoadingErrors.forEach((modLoadingError) => {
  console.log('Error while loading "' + modLoadingError.modName + '" mod:');
  console.log(modLoadingError.error);
});
if (SSJSError) {
  console.log("Error while loading server-side JavaScript:");
  console.log(SSJSError);
}

// Process event listeners
if (cluster.isPrimary || cluster.isPrimary === undefined) {
  // Crash handler
  function crashHandlerMaster(err) {
    serverconsole.locerrmessage("SVR.JS main process just crashed!!!");
    serverconsole.locerrmessage("Stack:");
    serverconsole.locerrmessage(
      err.stack ? generateErrorStack(err) : String(err),
    );
    process.exit(err.errno !== undefined ? err.errno : 1);
  }

  process.on("uncaughtException", crashHandlerMaster);
  process.on("unhandledRejection", crashHandlerMaster);

  process.on("exit", function (code) {
    try {
      // TODO: saveConfig function
      /*if (!configJSONRErr && !configJSONPErr) {
        saveConfig();
      }*/
    } catch (err) {
      serverconsole.locwarnmessage(
        "There was a problem while saving configuration file. Reason: " +
          err.message,
      );
    }
    try {
      deleteFolderRecursive(process.dirname + "/temp");
    } catch (err) {
      // Error!
    }
    try {
      fs.mkdirSync(process.dirname + "/temp");
    } catch (err) {
      // Error!
    }
    if (
      process.isBun &&
      process.versions.bun &&
      process.versions.bun[0] == "0"
    ) {
      try {
        fs.writeFileSync(
          process.dirname + "/temp/serverSideScript.js",
          "// Placeholder server-side JavaScript to workaround Bun bug.\r\n",
        );
      } catch (err) {
        // Error!
      }
    }
    serverconsole.locmessage("Server closed with exit code: " + code);
  });
  process.on("warning", function (warning) {
    serverconsole.locwarnmessage(warning.message);
    if (generateErrorStack(warning)) {
      serverconsole.locwarnmessage("Stack:");
      serverconsole.locwarnmessage(generateErrorStack(warning));
    }
  });
  process.on("SIGINT", function () {
    if (cluster.isPrimary !== undefined) {
      exiting = true;
      // TODO: commands
      //const allWorkers = Object.keys(cluster.workers);
      /*for (var i = 0; i < allWorkers.length; i++) {
        try {
          if (cluster.workers[allWorkers[i]]) {
            cluster.workers[allWorkers[i]].send("stop");
          }
        } catch (err) {
          // Worker will crash with EPIPE anyway.
        }
      }*/
    }
    serverconsole.locmessage("Server terminated using SIGINT");
    process.exit();
  });
} else {
  // Crash handler
  function crashHandler(err) {
    serverconsole.locerrmessage("SVR.JS worker just crashed!!!");
    serverconsole.locerrmessage("Stack:");
    serverconsole.locerrmessage(
      err.stack ? generateErrorStack(err) : String(err),
    );
    process.exit(err.errno !== undefined ? err.errno : 1);
  }

  process.on("uncaughtException", crashHandler);
  process.on("unhandledRejection", crashHandler);

  // Warning handler
  process.on("warning", function (warning) {
    serverconsole.locwarnmessage(warning.message);
    if (warning.stack) {
      serverconsole.locwarnmessage("Stack:");
      serverconsole.locwarnmessage(generateErrorStack(warning));
    }
  });
}

start(true);
