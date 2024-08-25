const http = require("http");
const fs = require("fs");
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

process.serverConfig.version = version; // Compatiblity for very old SVR.JS mods

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

// Create HTTP server
if (process.serverConfig.enableHTTP2 == true) {
  if (process.serverConfig.secure) {
    server = http2.createSecureServer({
      allowHTTP1: true,
      requireHostHeader: false,
      key: key,
      cert: cert,
      requestCert: configJSON.useClientCertificate,
      rejectUnauthorized: configJSON.rejectUnauthorizedClientCertificates,
      ciphers: configJSON.cipherSuite,
      ecdhCurve: configJSON.ecdhCurve,
      minVersion: configJSON.tlsMinVersion,
      maxVersion: configJSON.tlsMaxVersion,
      sigalgs: configJSON.signatureAlgorithms,
      settings: configJSON.http2Settings,
    });
  } else {
    server = http2.createServer({
      allowHTTP1: true,
      requireHostHeader: false,
      settings: configJSON.http2Settings,
    });
  }
} else {
  if (process.serverConfig.secure) {
    server = https.createServer({
      key: key,
      cert: cert,
      requireHostHeader: false,
      requestCert: configJSON.useClientCertificate,
      rejectUnauthorized: configJSON.rejectUnauthorizedClientCertificates,
      ciphers: configJSON.cipherSuite,
      ecdhCurve: configJSON.ecdhCurve,
      minVersion: configJSON.tlsMinVersion,
      maxVersion: configJSON.tlsMaxVersion,
      sigalgs: configJSON.signatureAlgorithms,
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
if (secure) {
  try {
    sniCredentials.forEach(function (sniCredentialsSingle) {
      server.addContext(sniCredentialsSingle.name, {
        cert: sniCredentialsSingle.cert,
        key: sniCredentialsSingle.key
      });
      try {
        var snMatches = sniCredentialsSingle.name.match(/^([^:[]*|\[[^]]*\]?)((?::.*)?)$/);
        if (!snMatches[1][0].match(/^\.+$/)) snMatches[1][0] = snMatches[1][0].replace(/\.+$/, "");
        server._contexts[server._contexts.length - 1][0] = new RegExp("^" + snMatches[1].replace(/([.^$+?\-\\[\]{}])/g, "\\$1").replace(/\*/g, "[^.:]*") + ((snMatches[1][0] == "[" || snMatches[1].match(/^(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])$/)) ? "" : "\.?") + snMatches[2].replace(/([.^$+?\-\\[\]{}])/g, "\\$1").replace(/\*/g, "[^.]*") + "$", "i");
      } catch (ex) {
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

  // TODO: OCSP stapling
  /*if (process.serverConfig.enableOCSPStapling && !ocsp._errored) {
    server.on("OCSPRequest", function (cert, issuer, callback) {
      ocsp.getOCSPURI(cert, function (err, uri) {
        if (err) return callback(err);

        var req = ocsp.request.generate(cert, issuer);
        var options = {
          url: uri,
          ocsp: req.data
        };

        ocspCache.request(req.id, options, callback);
      });
    });
  }*/
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

// TODO: HTTP ports
// Listen HTTP server to port 3000
server.listen(3000);

// TODO: error logging
if (wwwrootError) throw wwwrootError;
if (configJSONRErr) throw configJSONRErr;
if (configJSONPErr) throw configJSONPErr;
if (certificateError) throw certificateError;
if (sniReDos) throw new Error("SNI REDOS!!!");
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
    serverconsole.locerrmessage("SVR.JS worker just crashed!!!");
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
