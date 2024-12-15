const http = require("http");
const fs = require("fs");
const os = require("os");
const dns = require("dns");
const readline = require("readline");
const logo = require("./res/logo.js");
const generateServerString = require("./utils/generateServerString.js");
const deleteFolderRecursive = require("./utils/deleteFolderRecursive.js");
const svrjsInfo = require("../svrjs.json");
const { name, version } = svrjsInfo;

let inspector = undefined;
try {
  inspector = require("inspector");
  // eslint-disable-next-line no-unused-vars
} catch (err) {
  // Don't use inspector
}

let tar = {};
try {
  tar = require("tar");
} catch (err) {
  tar = {
    _errored: err
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
  // eslint-disable-next-line no-unused-vars
} catch (err) {
  http2.__disabled__ = null;
  http2.createServer = () => {
    throw new Error("HTTP/2 support is not present");
  };
  http2.createSecureServer = () => {
    throw new Error("HTTP/2 support is not present");
  };
  http2.connect = () => {
    throw new Error("HTTP/2 support is not present");
  };
  http2.get = () => {
    throw new Error("HTTP/2 support is not present");
  };
}
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
  crypto = require("crypto");
  https = require("https");
  // eslint-disable-next-line no-unused-vars
} catch (err) {
  http2.createSecureServer = () => {
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
    _errored: err
  };
}

process.dirname = __dirname;
process.filename = __filename;

let hexstrbase64 = undefined;
try {
  hexstrbase64 = require(process.dirname + "/hexstrbase64/index.js");
  // eslint-disable-next-line no-unused-vars
} catch (err) {
  // Don't use hexstrbase64
}

process.singleThreaded = false;

process.err4xxcounter = 0;
process.err5xxcounter = 0;
process.reqcounter = 0;
process.malformedcounter = 0;

process.messageEventListeners = [];

if (process.versions) process.versions.svrjs = version; // Inject SVR.JS into process.versions

// Function for printing the command line usage of SVR.JS
function printUsage() {
  console.log(`${name} usage:`);
  console.log(
    "node svr.js [-h] [--help] [-?] [/h] [/?] [--secure] [--reset] [--clean] [--disable-mods] [--single-threaded] [--stdout-notty] [--no-save-config] [-v] [--version]"
  );
  console.log("-h -? /h /? --help    -- Displays help");
  console.log("--clean               -- Cleans up files created by " + name);
  console.log(
    `--reset               -- Resets ${name} to default settings (WARNING: DANGEROUS)`
  );
  console.log("--secure              -- Runs HTTPS server");
  console.log("--disable-mods        -- Disables mods (safe mode)");
  console.log("--single-threaded     -- Run single-threaded");
  console.log(
    "--stdout-notty        -- Enable stdout even when stdout is not a TTY. May decrease the performance"
  );
  console.log("--no-save-config      -- Don't save configuration file");
  console.log("-v --version          -- Display server version");
}

let exiting = false;
let forceSecure = false;
let disableMods = false;
let stdoutNoTTY = false;
let noSaveConfig = false;

// Handle command line arguments
const args = process.argv;
for (
  let i =
    process.argv[0].indexOf("node") > -1 ||
    process.argv[0].indexOf("bun") > -1 ||
    process.argv[0].indexOf("deno") > -1
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
    printUsage();
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
    process.singleThreaded = true;
  } else if (args[i] == "--stdout-notty") {
    stdoutNoTTY = true;
  } else if (args[i] == "--no-save-config") {
    noSaveConfig = true;
  } else {
    console.log(`Unrecognized argument: ${args[i]}`);
    printUsage();
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

const cluster = require("./utils/clusterShim.js"); // Cluster module with shim for Bun and Deno
const legacyModWrapper = require("./utils/legacyModWrapper.js");
const generateErrorStack = require("./utils/generateErrorStack.js");
const {
  calculateNetworkIPv4FromCidr,
  calculateBroadcastIPv4FromCidr
} = require("./utils/ipSubnetUtils.js");
const sendStatistics = require("./utils/sendStatistics.js");
const deepClone = require("./utils/deepClone.js");
const {
  validateConfig,
  addConfigValidators
} = require("./utils/configValidation.js");

process.serverConfig = {};
let configJSONRErr = undefined;
let configJSONPErr = undefined;
let configJSONVErr = undefined;
if (fs.existsSync(process.dirname + "/config.json")) {
  let configJSONf = "";
  try {
    configJSONf = fs.readFileSync(process.dirname + "/config.json"); // Read JSON File
    try {
      process.serverConfig = deepClone(JSON.parse(configJSONf)); // Parse JSON and deep clone to null prototype object
    } catch (err2) {
      configJSONPErr = err2;
    }
  } catch (err) {
    configJSONRErr = err;
  }
}

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
  process.serverConfig.domain !== undefined
)
  process.serverConfig.domain = process.serverConfig.domain;
delete process.serverConfig.domain;
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
    "/.*\\.(?:mp[34]|mov|wm[av]|avi|webm|og[gv]|mk[va])$/"
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
if (process.serverConfig.disableConfigurationSaving === undefined)
  process.serverConfig.disableConfigurationSaving = false;
if (process.serverConfig.enableIncludingHeadAndFootInHTML === undefined)
  process.serverConfig.enableIncludingHeadAndFootInHTML = true;
if (process.serverConfig.wwwrootVHost === undefined)
  process.serverConfig.wwwrootVHost = [];

// Don't save configuration if disableConfigurationSaving option is set to true
if (process.serverConfig.disableConfigurationSaving) noSaveConfig = true;

// Compatibility for very old SVR.JS mods
process.serverConfig.version = version;
process.serverConfig.productName = name;

let listenAddress = undefined;
let sListenAddress = undefined;
if (typeof process.serverConfig.port === "string") {
  if (process.serverConfig.port.match(/^[0-9]+$/)) {
    process.serverConfig.port = parseInt(process.serverConfig.port);
  } else {
    const portLMatch = process.serverConfig.port.match(
      /^(\[[^ \]@/\\]+\]|[^ \][:@/\\]+):([0-9]+)$/
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
      /^(\[[^ \]@/\\]+\]|[^ \][:@/\\]+):([0-9]+)$/
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

function addListenersToWorker(worker) {
  process.messageEventListeners.forEach((messageEventListener) =>
    worker.on("message", messageEventListener(worker, serverconsole))
  );
}

let inspectorURL = undefined;
try {
  if (inspector) {
    inspectorURL = inspector.url();
  }
  // eslint-disable-next-line no-unused-vars
} catch (err) {
  // Failed to get inspector URL
}

if (!stdoutNoTTY && !process.stdout.isTTY && !inspectorURL) {
  // When stdout is not a terminal and not attached to an Node.JS inspector, disable it to improve performance of SVR.JS
  console.log = () => {};
  process.stdout.write = () => {};
  process.stdout._write = () => {};
  process.stdout._writev = () => {};
}

let wwwrootError = null;
try {
  if (cluster.isPrimary || cluster.isPrimary === undefined)
    process.chdir(
      process.serverConfig.wwwroot != undefined
        ? process.serverConfig.wwwroot
        : process.dirname
    );
} catch (err) {
  wwwrootError = err;
}

// IP and network interface-related
let ifaces = {};
let ifaceEx = null;
try {
  ifaces = os.networkInterfaces();
} catch (err) {
  ifaceEx = err;
}
let ips = [];
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
let host = ips[ips.length - 1];
if (!host) host = "[offline]";

// Public IP address-related
let ipRequestCompleted = false;
let ipRequestGotError = false;
let domain = process.serverConfig.domain ? process.serverConfig.domain : "";
let pubip = "";

function doIpRequest(isHTTPS, options) {
  const ipRequest = (isHTTPS ? https : http).get(options, (res) => {
    ipRequest.removeAllListeners("timeout");
    res.on("data", (d) => {
      if (res.statusCode != 200) {
        ipRequestCompleted = true;
        process.emit("ipRequestCompleted");
        return;
      }
      pubip = d.toString();
      if (domain) {
        ipRequestCompleted = true;
        process.emit("ipRequestCompleted");
      } else {
        let callbackDone = false;

        const dnsTimeout = setTimeout(() => {
          callbackDone = true;
          ipRequestCompleted = true;
          process.emit("ipRequestCompleted");
        }, 3000);

        try {
          dns.reverse(pubip, (err, hostnames) => {
            if (callbackDone) return;
            clearTimeout(dnsTimeout);
            if (!err && hostnames.length > 0) domain = hostnames[0];
            ipRequestCompleted = true;
            process.emit("ipRequestCompleted");
          });
          // eslint-disable-next-line no-unused-vars
        } catch (err) {
          clearTimeout(dnsTimeout);
          callbackDone = true;
          ipRequestCompleted = true;
          process.emit("ipRequestCompleted");
        }
      }
    });
  });
  ipRequest.on("error", () => {
    if (crypto.__disabled__ || ipRequestGotError) {
      ipRequestCompleted = true;
      process.emit("ipRequestCompleted");
    } else {
      ipRequestGotError = true;
    }
  });
  ipRequest.on("timeout", () => {
    if (crypto.__disabled__ || ipRequestGotError) {
      ipRequestCompleted = true;
      process.emit("ipRequestCompleted");
    } else {
      ipRequestGotError = true;
    }
  });
  return ipRequest;
}

if (host != "[offline]" || ifaceEx) {
  doIpRequest(crypto.__disabled__ === undefined, {
    host: "api64.ipify.org",
    port: crypto.__disabled__ !== undefined ? 80 : 443,
    path: "/",
    headers: {
      "User-Agent": generateServerString(true)
    },
    timeout: 5000
  });

  if (crypto.__disabled__ === undefined) {
    doIpRequest(true, {
      host: "api.seeip.org",
      port: 443,
      path: "/",
      headers: {
        "User-Agent": generateServerString(true)
      },
      timeout: 5000
    });
  }
} else {
  ipRequestCompleted = true;
}

function ipStatusCallback(callback) {
  if (ipRequestCompleted) {
    callback();
  } else {
    process.once("ipRequestCompleted", callback);
  }
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
          : process.serverConfig.key
      )
      .toString();
    cert = fs
      .readFileSync(
        process.serverConfig.cert[0] != "/" &&
          !process.serverConfig.cert.match(/^[A-Z0-9]:\\/)
          ? process.dirname + "/" + process.serverConfig.cert
          : process.serverConfig.cert
      )
      .toString();
    const sniNames = Object.keys(process.serverConfig.sni);
    sniNames.forEach((sniName) => {
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
              : process.serverConfig.sni[sniName].cert
          )
          .toString(),
        key: fs
          .readFileSync(
            process.serverConfig.sni[sniName].key[0] != "/" &&
              !process.serverConfig.sni[sniName].key.match(/^[A-Z0-9]:\\/)
              ? process.dirname + "/" + process.serverConfig.sni[sniName].key
              : process.serverConfig.sni[sniName].key
          )
          .toString()
      });
    });
  } catch (err) {
    certificateError = err;
  }
}

let vnum = 0;
try {
  vnum = process.config.variables.node_module_version;
  // eslint-disable-next-line no-unused-vars
} catch (err) {
  // Version number not retrieved
}

if (vnum === undefined) vnum = 0;
if (process.versions && process.versions.deno) vnum = 64;
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
              name: `Unknown mod (${modFileRaw}; module.exports.modInfo not set)`,
              version: "ERROR"
            });
          }
        } catch (err) {
          modLoadingErrors.push({
            error: err,
            modName: modFileRaw
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

          try {
            // Try creating the modloader folder (if not already exists)
            try {
              fs.mkdirSync(process.dirname + "/temp/" + modloaderFolderName);
            } catch (err) {
              // If the folder already exists, continue to the next step
              if (err.code != "EEXIST") {
                // If there was another error, try creating the temp folder and then the modloader folder again
                fs.mkdirSync(process.dirname + "/temp");
                try {
                  fs.mkdirSync(
                    process.dirname + "/temp/" + modloaderFolderName
                  );
                } catch (err) {
                  // If there was another error, throw it
                  if (err.code != "EEXIST") throw err;
                }
              }
            }

            // Create a subfolder for the current mod within the modloader folder
            fs.mkdirSync(
              process.dirname +
                "/temp/" +
                modloaderFolderName +
                "/" +
                modFileRaw
            );
          } catch (err) {
            // If there was an error creating the folder, ignore it if it's a known error
            if (err.code != "EEXIST" && err.code != "ENOENT") throw err;
            // Some other SVR.JS process may have created the files.
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
                modFileRaw
            });
          } else {
            // If it's not a ".tar.gz" file, throw an error about `svrmodpack` support being dropped
            throw new Error(
              "This version of " +
                name +
                ' no longer supports "svrmodpack" library for ' +
                name +
                " mods. Please consider using newer mods with .tar.gz format."
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
                  "/index.js"
              )
            )
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
                    "/mod.info"
                )
              )
            );
          } catch (err) {
            // If failed to read info file, add a placeholder entry to modInfos with an error message
            modInfos.push({
              name: `Unknown mod (${modFileRaw}; ${err.message})`,
              version: "ERROR"
            });
          }
        } catch (err) {
          modLoadingErrors.push({
            error: err,
            modName: modFileRaw
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
  let SSJSPath = `${
    process.serverConfig.wwwroot != undefined
      ? process.serverConfig.wwwroot
      : process.dirname
  }/serverSideScript.js`;
  if (!process.serverConfig.useWebRootServerSideScript)
    SSJSPath = process.dirname + "/serverSideScript.js";

  // Check if a custom server side script file exists
  if (fs.existsSync(SSJSPath) && fs.statSync(SSJSPath).isFile()) {
    try {
      // Prepend necessary modules and variables to the custom server side script
      const modhead = `var readline = require('readline');\r\nvar os = require('os');\r\nvar http = require('http');\r\nvar url = require('url');\r\nvar fs = require('fs');\r\nvar path = require('path');\r\n${
        hexstrbase64 === undefined
          ? ""
          : "var hexstrbase64 = require('../hexstrbase64/index.js');\r\n"
      }${
        crypto.__disabled__ === undefined
          ? "var crypto = require('crypto');\r\nvar https = require('https');\r\n"
          : ""
      }var stream = require('stream');\r\nvar customvar1;\r\nvar customvar2;\r\nvar customvar3;\r\nvar customvar4;\r\n\r\nfunction Mod() {}\r\nMod.prototype.callback = function callback(req, res, serverconsole, responseEnd, href, ext, uobject, search, defaultpage, users, page404, head, foot, fd, elseCallback, configJSON, callServerError, getCustomHeaders, origHref, redirect, parsePostData, authUser) {\r\nreturn function() {\r\nvar disableEndElseCallbackExecute = false;\r\nfunction filterHeaders(e){var r={};return Object.keys(e).forEach((function(t){null!==e[t]&&void 0!==e[t]&&("object"==typeof e[t]?r[t]=JSON.parse(JSON.stringify(e[t])):r[t]=e[t])})),r}\r\nfunction checkHostname(e){if(void 0===e||"*"==e)return!0;if(req.headers.host&&0==e.indexOf("*.")&&"*."!=e){var r=e.substring(2);if(req.headers.host==r||req.headers.host.indexOf("."+r)==req.headers.host.length-r.length-1)return!0}else if(req.headers.host&&req.headers.host==e)return!0;return!1}\r\nfunction checkHref(e){return href==e||"win32"==os.platform()&&href.toLowerCase()==e.toLowerCase()}\r\n`;
      const modfoot =
        "\r\nif(!disableEndElseCallbackExecute) {\r\ntry{\r\nelseCallback();\r\n} catch(err) {\r\n}\r\n}\r\n}\r\n}\r\nmodule.exports = Mod;";
      // Write the modified server side script to the temp folder
      fs.writeFileSync(
        process.dirname + "/temp/" + tempServerSideScriptName,
        modhead + fs.readFileSync(SSJSPath) + modfoot
      );

      // Add the server side script to the mods list
      mods.push(
        legacyModWrapper(
          require(process.dirname + "/temp/" + tempServerSideScriptName)
        )
      );
    } catch (err) {
      SSJSError = err;
    }
  }
}

// Middleware
const middleware = [
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
  require("./middleware/staticFileServingAndDirectoryListings.js")
];

// Validate SVR.JS configuration (including validators from SVR.JS mods and built-in middleware)
try {
  middleware.forEach((middlewareOne) => {
    if (middlewareOne.configValidators)
      addConfigValidators(middlewareOne.configValidators);
  });
  validateConfig(process.serverConfig);
} catch (err) {
  configJSONVErr = err;
}

// HTTP server handlers
const requestHandler = require("./handlers/requestHandler.js")(
  serverconsole,
  middleware
);

const proxyHandler = require("./handlers/proxyHandler.js")(
  serverconsole,
  middleware
);

const noproxyHandler = require("./handlers/noproxyHandler.js")(serverconsole);

const clientErrorHandler = require("./handlers/clientErrorHandler.js")(
  serverconsole
);

const serverErrorHandler = require("./handlers/serverErrorHandler.js")(
  serverconsole
);

let messageTransmitted = false;

function listeningMessage() {
  closedMaster = false;
  if (!cluster.isPrimary && cluster.isPrimary !== undefined) {
    process.send("\x12LISTEN");
    return;
  }
  const listenToLocalhost =
    listenAddress &&
    (listenAddress == "localhost" ||
      listenAddress.match(/^127\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/) ||
      listenAddress.match(/^(?:0{0,4}:)+0{0,3}1$/));
  const listenToAny =
    !listenAddress ||
    listenAddress.match(/^0{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/) ||
    listenAddress.match(/^(?:0{0,4}:)+0{0,4}$/);
  const sListenToLocalhost =
    sListenAddress &&
    (sListenAddress == "localhost" ||
      sListenAddress.match(/^127\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/) ||
      sListenAddress.match(/^(?:0{0,4}:)+0{0,3}1$/));
  const sListenToAny =
    !sListenAddress ||
    sListenAddress.match(/^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/) ||
    sListenAddress.match(/^(?:0{0,4}:)+0{0,4}$/);
  let accHost = host;
  let sAccHost = host;
  if (!listenToAny) accHost = listenAddress;
  if (!sListenToAny) sAccHost = sListenAddress;
  if (messageTransmitted) return;
  messageTransmitted = true;
  serverconsole.locmessage("Started server at: ");
  if (process.serverConfig.secure && (sListenToLocalhost || sListenToAny)) {
    if (typeof process.serverConfig.sport === "number") {
      serverconsole.locmessage(
        `* https://localhost${
          process.serverConfig.sport == 443
            ? ""
            : ":" + process.serverConfig.sport
        }`
      );
    } else {
      serverconsole.locmessage("* " + process.serverConfig.sport); // Unix socket or Windows named pipe
    }
  }
  if (
    !(
      process.serverConfig.secure &&
      process.serverConfig.disableNonEncryptedServer
    ) &&
    (listenToLocalhost || listenToAny)
  ) {
    if (typeof process.serverConfig.port === "number") {
      serverconsole.locmessage(
        `* http://localhost${
          process.serverConfig.port == 80 ? "" : ":" + process.serverConfig.port
        }`
      );
    } else {
      serverconsole.locmessage("* " + process.serverConfig.port); // Unix socket or Windows named pipe
    }
  }
  if (
    process.serverConfig.secure &&
    typeof process.serverConfig.sport === "number" &&
    !sListenToLocalhost &&
    (!sListenToAny || (host != "" && host != "[offline]"))
  )
    serverconsole.locmessage(
      `* https://${sAccHost.indexOf(":") > -1 ? "[" + sAccHost + "]" : sAccHost}${
        process.serverConfig.sport == 443
          ? ""
          : ":" + process.serverConfig.sport
      }`
    );
  if (
    !(
      process.serverConfig.secure &&
      process.serverConfig.disableNonEncryptedServer
    ) &&
    !listenToLocalhost &&
    (!listenToAny || (host != "" && host != "[offline]")) &&
    typeof process.serverConfig.port === "number"
  )
    serverconsole.locmessage(
      `* http://${accHost.indexOf(":") > -1 ? "[" + accHost + "]" : accHost}${
        process.serverConfig.port == 80 ? "" : ":" + process.serverConfig.port
      }`
    );
  ipStatusCallback(() => {
    if (pubip != "") {
      if (process.serverConfig.secure && !sListenToLocalhost)
        serverconsole.locmessage(
          `* https://${pubip.indexOf(":") > -1 ? "[" + pubip + "]" : pubip}${
            process.serverConfig.spubport == 443
              ? ""
              : ":" + process.serverConfig.spubport
          }`
        );
      if (
        !(
          process.serverConfig.secure &&
          process.serverConfig.disableNonEncryptedServer
        ) &&
        !listenToLocalhost
      )
        serverconsole.locmessage(
          `* http://${pubip.indexOf(":") > -1 ? "[" + pubip + "]" : pubip}${
            process.serverConfig.pubport == 80
              ? ""
              : ":" + process.serverConfig.pubport
          }`
        );
    }
    if (domain != "") {
      if (process.serverConfig.secure && !sListenToLocalhost)
        serverconsole.locmessage(
          `* https://${domain}${
            process.serverConfig.spubport == 443
              ? ""
              : ":" + process.serverConfig.spubport
          }`
        );
      if (
        !(
          process.serverConfig.secure &&
          process.serverConfig.disableNonEncryptedServer
        ) &&
        !listenToLocalhost
      )
        serverconsole.locmessage(
          `* http://${domain}${
            process.serverConfig.pubport == 80
              ? ""
              : ":" + process.serverConfig.pubport
          }`
        );
    }
    serverconsole.locmessage('For CLI help, you can type "help"');

    // Code for sending data to a statistics server
    if (!process.serverConfig.optOutOfStatisticsServer) {
      if (crypto.__disabled__ !== undefined) {
        serverconsole.locwarnmessage(
          "Sending data to statistics server is disabled, because the server only supports HTTPS, and your Node.JS version doesn't have crypto support."
        );
      } else {
        sendStatistics(modInfos, (err) => {
          if (err)
            serverconsole.locwarnmessage(
              `There was a problem, when sending data to statistics server! Reason: ${err.message}`
            );
        });
      }
    }
  });
}

let reqcounterKillReq = 0;
let closedMaster = true;

let server = {};
let server2 = {};

// Create secondary HTTP server
try {
  server2 = http.createServer({
    requireHostHeader: false
  });
  // eslint-disable-next-line no-unused-vars
} catch (err) {
  server2 = http.createServer();
}

// Add handlers to secondary HTTP server
server2.on("request", requestHandler);
server2.on("checkExpectation", requestHandler);
server2.on("clientError", clientErrorHandler);
server2.on(
  "connect",
  process.serverConfig.disableToHTTPSRedirect ? proxyHandler : noproxyHandler
);
server2.on("error", (err) => {
  serverErrorHandler(err, true, server2, start);
});
server2.on("listening", () => {
  serverErrorHandler.resetAttempts(true);
  listeningMessage();
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
      settings: process.serverConfig.http2Settings
    });
  } else {
    server = http2.createServer({
      allowHTTP1: true,
      requireHostHeader: false,
      settings: process.serverConfig.http2Settings
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
      sigalgs: process.serverConfig.signatureAlgorithms
    });
  } else {
    try {
      server = http.createServer({
        requireHostHeader: false
      });
      // eslint-disable-next-line no-unused-vars
    } catch (err) {
      server = http.createServer();
    }
  }
}

// Load SNI contexts into HTTP server
if (process.serverConfig.secure) {
  try {
    sniCredentials.forEach((sniCredentialsSingle) => {
      server.addContext(sniCredentialsSingle.name, {
        cert: sniCredentialsSingle.cert,
        key: sniCredentialsSingle.key
      });
      try {
        let snMatches = sniCredentialsSingle.name.match(
          /^([^:[]*|\[[^]]*\]?)((?::.*)?)$/
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
              /^(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])$/
            )
              ? ""
              : ".?") +
            snMatches[2]
              .replace(/([.^$+?\-\\[\]{}])/g, "\\$1")
              .replace(/\*/g, "[^.]*") +
            "$",
          "i"
        );
        // eslint-disable-next-line no-unused-vars
      } catch (err) {
        // Can't replace regex, ignoring...
      }
    });
    // eslint-disable-next-line no-unused-vars
  } catch (err) {
    // SNI error
  }
}

// Add handlers to the server
server.on("request", requestHandler);
server.on("checkExpectation", requestHandler);
server.on("connect", proxyHandler);
server.on("clientError", clientErrorHandler);
server.on("error", (err) => {
  serverErrorHandler(err, false, server, start);
});
server.on("listening", () => {
  serverErrorHandler.resetAttempts(false);
  listeningMessage();
});

if (process.serverConfig.secure) {
  server.prependListener("connection", (sock) => {
    sock.reallyDestroy = sock.destroy;
    sock.destroy = () => {
      sock.toDestroy = true;
    };
  });

  server.prependListener("tlsClientError", (err, sock) => {
    if (
      err.code == "ERR_SSL_HTTP_REQUEST" ||
      err.message.indexOf("http request") != -1
    ) {
      sock._parent.destroy = sock._parent.reallyDestroy;
      sock._readableState = sock._parent._readableState;
      sock._writableState = sock._parent._writableState;
      sock._parent.toDestroy = false;
      sock.pipe = (a, b, c) => {
        sock._parent.pipe(a, b, c);
      };
      sock.write = (a, b, c) => {
        sock._parent.write(a, b, c);
      };
      sock.end = (a, b, c) => {
        sock._parent.end(a, b, c);
      };
      sock.destroyed = sock._parent.destroyed;
      sock.readable = sock._parent.readable;
      sock.writable = sock._parent.writable;
      sock.remoteAddress = sock._parent.remoteAddress;
      sock.remotePort = sock._parent.remoteAddress;
      sock.destroy = (a, b, c) => {
        try {
          sock._parent.destroy(a, b, c);
          sock.destroyed = sock._parent.destroyed;
          // eslint-disable-next-line no-unused-vars
        } catch (err) {
          // Socket is probably already destroyed.
        }
      };
    } else {
      sock._parent.destroy = sock._parent.reallyDestroy;
      try {
        if (sock._parent.toDestroy) sock._parent.destroy();
        // eslint-disable-next-line no-unused-vars
      } catch (err) {
        // Socket is probably already destroyed.
      }
    }
  });

  server.prependListener("secureConnection", (sock) => {
    sock._parent.destroy = sock._parent.reallyDestroy;
    delete sock._parent.reallyDestroy;
  });

  if (process.serverConfig.enableOCSPStapling && !ocsp._errored) {
    server.on("OCSPRequest", (cert, issuer, callback) => {
      ocsp.getOCSPURI(cert, (err, uri) => {
        if (err) return callback(err);

        const req = ocsp.request.generate(cert, issuer);
        const options = {
          url: uri,
          ocsp: req.data
        };

        ocspCache.request(req.id, options, callback);
      });
    });
  }
}

// Base commands
let commands = {
  close: (args, log) => {
    try {
      server.close();
      if (
        process.serverConfig.secure &&
        !process.serverConfig.disableNonEncryptedServer
      ) {
        server2.close();
      }
      log("Server closed.");
      if (cluster.isPrimary !== undefined) process.send("\x12CLOSE");
    } catch (err) {
      log(`Cannot close server! Reason: ${err.message}`);
    }
  },
  open: (args, log) => {
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
          process.serverConfig.secure ? sListenAddress : listenAddress
        );
      } else {
        server.listen(
          process.serverConfig.secure
            ? process.serverConfig.sport
            : process.serverConfig.port
        );
      }
      if (
        process.serverConfig.secure &&
        !process.serverConfig.disableNonEncryptedServer
      ) {
        if (typeof process.serverConfig.port == "number" && listenAddress) {
          server2.listen(process.serverConfig.port, listenAddress);
        } else {
          server2.listen(process.serverConfig.port);
        }
      }
      log("Server opened.");
    } catch (err) {
      log(`Cannot open server! Reason: ${err.message}`);
    }
  },
  help: (args, log) => {
    log(`Server commands:\n${Object.keys(commands).join(" ")}`);
  },
  mods: (args, log) => {
    log("Mods:");
    for (let i = 0; i < modInfos.length; i++) {
      log(`${(i + 1).toString()}. ${modInfos[i].name} ${modInfos[i].version}`);
    }
    if (modInfos.length == 0) {
      log("No mods installed.");
    }
  },
  // eslint-disable-next-line no-unused-vars
  clear: (args, log) => {
    console.clear();
  },
  // eslint-disable-next-line no-unused-vars
  stop: (args, log) => {
    let retcode = args[0];
    if (
      !cluster.isPrimary &&
      cluster.isPrimary !== undefined &&
      server.listening
    ) {
      try {
        server.close(() => {
          if (server2.listening) {
            try {
              server2.close(() => {
                if (!process.removeFakeIPC) {
                  if (typeof retcode == "number") {
                    process.exit(retcode);
                  } else {
                    process.exit(0);
                  }
                }
              });
              // eslint-disable-next-line no-unused-vars
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
        // eslint-disable-next-line no-unused-vars
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
  restart: (args, log) => {
    if (cluster.isPrimary === undefined)
      log(`This command is not supported on single-threaded ${name}.`);
    else log(`This command need to be run in ${name} master.`);
  }
};

// Load commands from middleware
middleware.forEach((middlewareO) => {
  if (middlewareO.commands) {
    Object.keys(middlewareO.commands).forEach((command) => {
      const prevCommand = commands[command];
      if (prevCommand) {
        commands[command] = (args, log) =>
          middlewareO.commands[command](args, log, prevCommand);
      } else {
        commands[command] = (args, log) =>
          middlewareO.commands[command](args, log, () => {});
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
      "Starting next thread, because previous one hung up/crashed..."
    );
  // Fork new worker
  let newWorker = {};
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
        `${name} limited the number of workers to one, because of startup problems in Bun 1.0 and newer with shimmed (not native) clustering module. Reliability may suffer.`
      );
    } else if (
      !threadLimitWarned &&
      cluster.__shimmed__ &&
      process.versions &&
      process.versions.deno
    ) {
      threadLimitWarned = true;
      serverconsole.locwarnmessage(
        `${name} limited the number of workers to one, because of startup problems in Deno with shimmed (not native) clustering module. Reliability may suffer.`
      );
    }
    if (
      !(
        cluster.__shimmed__ &&
        ((process.isBun &&
          process.versions.bun &&
          process.versions.bun[0] != "0") ||
          (process.versions && process.versions.deno)) &&
        Object.keys(cluster.workers) > 0
      )
    ) {
      newWorker = cluster.fork();
    } else {
      if (SVRJSInitialized) {
        if (
          process.isBun &&
          process.versions.bun &&
          process.versions.bun[0] != "0"
        )
          serverconsole.locwarnmessage(
            `${name} limited the number of workers to one, because of startup problems in Bun 1.0 and newer with shimmed (not native) clustering module. Reliability may suffer.`
          );
        else if (process.versions && process.versions.deno)
          serverconsole.locwarnmessage(
            `${name} limited the number of workers to one, because of startup problems in Deno with shimmed (not native) clustering module. Reliability may suffer.`
          );
      }
    }
  } catch (err) {
    if (
      err.name == "NotImplementedError" ||
      err.message == "Not implemented: cluster.fork"
    ) {
      // If cluster.fork throws a NotImplementedError, shim cluster module
      cluster.shim();
      if (
        !threadLimitWarned &&
        cluster.__shimmed__ &&
        process.isBun &&
        process.versions.bun &&
        process.versions.bun[0] != "0"
      ) {
        threadLimitWarned = true;
        serverconsole.locwarnmessage(
          `${name} limited the number of workers to one, because of startup problems in Bun 1.0 and newer with shimmed (not native) clustering module. Reliability may suffer.`
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
            `${name} limited the number of workers to one, because of startup problems in Bun 1.0 and newer with shimmed (not native) clustering module. Reliability may suffer.`
          );
      }
    } else {
      throw err;
    }
  }

  // Add event listeners
  if (newWorker.on) {
    newWorker.on("error", (err) => {
      if (!exiting)
        serverconsole.locwarnmessage(
          `There was a problem when handling ${name} worker! (from master process side) Reason: ${err.message}`
        );
    });
    newWorker.on("exit", () => {
      if (!exiting && Object.keys(cluster.workers).length == 0) {
        crashed = true;
        SVRJSFork();
      }
    });
    addListenersToWorker(newWorker);
  }
}

function getWorkerCountToFork() {
  let workersToFork = os.availableParallelism
    ? os.availableParallelism()
    : os.cpus().length;
  try {
    const useAvailableCores = Math.round(os.freemem() / 50000000) - 1; // 1 core deleted for safety...
    if (workersToFork > useAvailableCores) workersToFork = useAvailableCores;
    // eslint-disable-next-line no-unused-vars
  } catch (err) {
    // Nevermind... Don't want SVR.JS to fail starting, because os.freemem function is not working.
  }
  if (workersToFork < 1) workersToFork = 1; // If SVR.JS is run on Haiku (os.cpus in Haiku returns empty array) or if useAvailableCores = 0
  return workersToFork;
}

function forkWorkers(workersToFork, callback) {
  for (let i = 0; i < workersToFork; i++) {
    if (i == 0) {
      SVRJSFork();
    } else {
      setTimeout(
        ((i) => {
          return () => {
            SVRJSFork();
            if (i >= workersToFork - 1) callback();
          };
        })(i),
        i * 6.6
      );
    }
  }
}

// Listening message event listener
// eslint-disable-next-line no-unused-vars
process.messageEventListeners.push((worker, serverconsole) => {
  return (message) => {
    if (message == "\x12LISTEN") {
      listeningMessage();
    }
  };
});

let isWorkerHungUpBuff = true;
let isWorkerHungUpBuff2 = true;

function msgListener(message) {
  if (message == "\x12END") {
    for (let i = 0; i < Object.keys(cluster.workers).length; i++) {
      cluster.workers[Object.keys(cluster.workers)[i]].removeAllListeners(
        "message"
      );
      addListenersToWorker(cluster.workers[Object.keys(cluster.workers)[i]]);
    }
  }
  if (message == "\x12END") {
    // Do nothing
  } else if (message == "\x12CLOSE") {
    closedMaster = true;
  } else if (message == "\x12KILLOK") {
    if (typeof isWorkerHungUpBuff != "undefined") isWorkerHungUpBuff = false;
  } else if (message == "\x12PINGOK") {
    if (typeof isWorkerHungUpBuff2 != "undefined") isWorkerHungUpBuff2 = false;
  } else if (message == "\x12KILLTERMMSG") {
    serverconsole.locmessage("Terminating unused worker process...");
  } else if (message == "\x12SAVEGOOD") {
    serverconsole.locmessage("Configuration saved.");
  } else if (message.indexOf("\x12SAVEERR") == 0) {
    serverconsole.locwarnmessage(
      `There was a problem while saving configuration file. Reason: ${message.substring(8)}`
    );
  } else if (message[0] == "\x12") {
    // Discard unrecognized control messages
  } else {
    serverconsole.climessage(message);
  }
}

// Save configuration file
function saveConfig() {
  for (let i = 0; i < 3; i++) {
    try {
      let configJSONobj = {};
      if (fs.existsSync(process.dirname + "/config.json"))
        configJSONobj = JSON.parse(
          fs.readFileSync(process.dirname + "/config.json").toString()
        );
      if (configJSONobj.users === undefined) configJSONobj.users = [];
      if (process.serverConfig.secure) {
        if (configJSONobj.key === undefined) configJSONobj.key = "cert/key.key";
        if (configJSONobj.cert === undefined)
          configJSONobj.cert = "cert/cert.crt";
        if (configJSONobj.sport === undefined) configJSONobj.sport = 443;
        if (configJSONobj.spubport === undefined) configJSONobj.spubport = 443;
        if (configJSONobj.sni === undefined) configJSONobj.sni = {};
        if (configJSONobj.enableOCSPStapling === undefined)
          configJSONobj.enableOCSPStapling = false;
      }
      if (configJSONobj.port === undefined) configJSONobj.port = 80;
      if (configJSONobj.pubport === undefined) configJSONobj.pubport = 80;
      if (
        configJSONobj.domain === undefined &&
        configJSONobj.domain !== undefined
      )
        configJSONobj.domain = configJSONobj.domain;
      delete configJSONobj.domain;
      if (configJSONobj.page404 === undefined)
        configJSONobj.page404 = "404.html";
      configJSONobj.timestamp = process.serverConfig.timestamp;
      configJSONobj.blacklist = process.serverConfig.blacklist;
      if (configJSONobj.nonStandardCodes === undefined)
        configJSONobj.nonStandardCodes = [];
      if (configJSONobj.enableCompression === undefined)
        configJSONobj.enableCompression = true;
      if (configJSONobj.customHeaders === undefined)
        configJSONobj.customHeaders = {};
      if (configJSONobj.enableHTTP2 === undefined)
        configJSONobj.enableHTTP2 = false;
      if (configJSONobj.enableLogging === undefined)
        configJSONobj.enableLogging = true;
      if (configJSONobj.enableDirectoryListing === undefined)
        configJSONobj.enableDirectoryListing = true;
      if (configJSONobj.enableDirectoryListingWithDefaultHead === undefined)
        configJSONobj.enableDirectoryListingWithDefaultHead = false;
      if (configJSONobj.serverAdministratorEmail === undefined)
        configJSONobj.serverAdministratorEmail = "[no contact information]";
      if (configJSONobj.stackHidden === undefined)
        configJSONobj.stackHidden = false;
      if (configJSONobj.enableRemoteLogBrowsing === undefined)
        configJSONobj.enableRemoteLogBrowsing = false;
      if (configJSONobj.exposeServerVersion === undefined)
        configJSONobj.exposeServerVersion = true;
      if (configJSONobj.disableServerSideScriptExpose === undefined)
        configJSONobj.disableServerSideScriptExpose = true;
      if (configJSONobj.allowStatus === undefined)
        configJSONobj.allowStatus = true;
      if (configJSONobj.rewriteMap === undefined) configJSONobj.rewriteMap = [];
      if (configJSONobj.dontCompress === undefined)
        configJSONobj.dontCompress = [
          "/.*\\.ipxe$/",
          "/.*\\.(?:jpe?g|png|bmp|tiff|jfif|gif|webp)$/",
          "/.*\\.(?:[id]mg|iso|flp)$/",
          "/.*\\.(?:zip|rar|bz2|[gb7x]z|lzma|tar)$/",
          "/.*\\.(?:mp[34]|mov|wm[av]|avi|webm|og[gv]|mk[va])$/"
        ];
      if (configJSONobj.enableIPSpoofing === undefined)
        configJSONobj.enableIPSpoofing = false;
      if (configJSONobj.secure === undefined) configJSONobj.secure = false;
      if (configJSONobj.disableNonEncryptedServer === undefined)
        configJSONobj.disableNonEncryptedServer = false;
      if (configJSONobj.disableToHTTPSRedirect === undefined)
        configJSONobj.disableToHTTPSRedirect = false;
      if (configJSONobj.enableETag === undefined)
        configJSONobj.enableETag = true;
      if (configJSONobj.disableUnusedWorkerTermination === undefined)
        configJSONobj.disableUnusedWorkerTermination = false;
      if (configJSONobj.rewriteDirtyURLs === undefined)
        configJSONobj.rewriteDirtyURLs = false;
      if (configJSONobj.errorPages === undefined) configJSONobj.errorPages = [];
      if (configJSONobj.useWebRootServerSideScript === undefined)
        configJSONobj.useWebRootServerSideScript = true;
      if (configJSONobj.exposeModsInErrorPages === undefined)
        configJSONobj.exposeModsInErrorPages = true;
      if (configJSONobj.disableTrailingSlashRedirects === undefined)
        configJSONobj.disableTrailingSlashRedirects = false;
      if (configJSONobj.environmentVariables === undefined)
        configJSONobj.environmentVariables = {};
      if (configJSONobj.allowDoubleSlashes === undefined)
        configJSONobj.allowDoubleSlashes = false;
      if (configJSONobj.optOutOfStatisticsServer === undefined)
        configJSONobj.optOutOfStatisticsServer = false;
      if (configJSONobj.disableConfigurationSaving === undefined)
        configJSONobj.disableConfigurationSaving = false;
      if (configJSONobj.enableIncludingHeadAndFootInHTML === undefined)
        configJSONobj.enableIncludingHeadAndFootInHTML = true;

      fs.writeFileSync(
        process.dirname + "/config.json",
        JSON.stringify(configJSONobj, null, 2) + "\n"
      );
      break;
    } catch (err) {
      if (i >= 2) throw err;
      const now = Date.now();
      while (Date.now() - now < 2);
    }
  }
}

// Starting function
function start(init) {
  init = Boolean(init);
  if (cluster.isPrimary || cluster.isPrimary === undefined) {
    if (init) {
      for (let i = 0; i < logo.length; i++) console.log(logo[i]); // Print logo
      console.log();
      console.log(
        `Welcome to \x1b[1m${name} - a web server running on Node.JS\x1b[0m`
      );

      // Print warnings
      if (version.indexOf("Nightly-") === 0)
        serverconsole.locwarnmessage(
          "This version is only for test purposes and may be unstable."
        );
      if (process.serverConfig.enableHTTP2 && !process.serverConfig.secure)
        serverconsole.locwarnmessage(
          "HTTP/2 without HTTPS may not work in web browsers. Web browsers only support HTTP/2 with HTTPS!"
        );
      if (process.isBun) {
        serverconsole.locwarnmessage(
          `Bun support is experimental. Some features of ${name}, ${name} mods and ${name} server-side JavaScript may not work as expected.`
        );
        if (
          process.isBun &&
          !(
            process.versions.bun &&
            !process.versions.bun.match(
              /^(?:0\.|1\.0\.|1\.1\.[0-9](?![0-9])|1\.1\.1[0-2](?![0-9]))/
            )
          ) &&
          process.serverConfig.users.some((entry) => entry.pbkdf2)
        )
          serverconsole.locwarnmessage(
            "PBKDF2 password hashing function in Bun versions older than v1.1.13 blocks the event loop, which may result in denial of service."
          );
      } else if (process.versions && process.versions.deno) {
        serverconsole.locwarnmessage(
          `Deno support is experimental. Some features of ${name}, ${name} mods and ${name} server-side JavaScript may not work as expected.`
        );
      }
      if (cluster.isPrimary === undefined)
        serverconsole.locwarnmessage(
          `You're running ${name} on single thread. Reliability may suffer, as the server is stopped after crash.`
        );
      if (crypto.__disabled__ !== undefined)
        serverconsole.locwarnmessage(
          "Your Node.JS version doesn't have crypto support! The 'crypto' module is essential for providing cryptographic functionality in Node.JS. Without crypto support, certain security features may be unavailable, and some functionality may not work as expected. It's recommended to use a Node.JS version that includes crypto support to ensure the security and proper functioning of your server."
        );
      if (crypto.__disabled__ === undefined && !crypto.scrypt)
        serverconsole.locwarnmessage(
          "Your JavaScript runtime doesn't have native scrypt support. HTTP authentication involving scrypt hashes will not work."
        );
      if (
        !process.isBun &&
        !(process.versions && process.versions.deno) &&
        /^v(?:[0-9]\.|1[0-7]\.|18\.(?:[0-9]|1[0-8])\.|18\.19\.0|20\.(?:[0-9]|10)\.|20\.11\.0|21\.[0-5]\.|21\.6\.0|21\.6\.1(?![0-9]))/.test(
          process.version
        )
      )
        serverconsole.locwarnmessage(
          "Your Node.JS version is vulnerable to HTTP server DoS (CVE-2024-22019)."
        );
      if (
        !process.isBun &&
        !(process.versions && process.versions.deno) &&
        /^v(?:[0-9]\.|1[0-7]\.|18\.(?:1?[0-9])\.|18\.20\.0|20\.(?:[0-9]|1[01])\.|20\.12\.0|21\.[0-6]\.|21\.7\.0|21\.7\.1(?![0-9]))/.test(
          process.version
        )
      )
        serverconsole.locwarnmessage(
          "Your Node.JS version is vulnerable to HTTP server request smuggling (CVE-2024-27982)."
        );
      if (process.getuid && process.getuid() == 0)
        serverconsole.locwarnmessage(
          `You're running ${name} as root. It's recommended to run ${name} as an non-root user. Running ${name} as root may increase the risks of OS command execution vulnerabilities.`
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
            "OpenSSL 1.x is no longer receiving security updates after 11th September 2023. Your HTTPS communication might be vulnerable. It is recommended to update to a newer version of Node.JS that includes OpenSSL 3.0 or higher to ensure the security of your server and data."
          );
        } else {
          serverconsole.locwarnmessage(
            "OpenSSL 1.x will no longer receive security updates after 11th September 2023. Your HTTPS communication might be vulnerable in future. It is recommended to update to a newer version of Node.JS that includes OpenSSL 3.0 or higher to ensure the security of your server and data."
          );
        }
      }
      if (
        process.serverConfig.secure &&
        process.serverConfig.enableOCSPStapling &&
        ocsp._errored
      )
        serverconsole.locwarnmessage(
          "Can't load OCSP module. OCSP stapling will be disabled. OCSP stapling is a security feature that improves the performance and security of HTTPS connections by caching the certificate status response. If you require this feature, consider updating your Node.JS version or checking for any issues with the 'ocsp' module."
        );
      if (disableMods)
        serverconsole.locwarnmessage(
          `${name} is running without mods and server-side JavaScript enabled. Web applications may not work as expected`
        );
      if (process.serverConfig.optOutOfStatisticsServer)
        serverconsole.locmessage(
          `${name} is configured to opt out of sending data to the statistics server.`
        );
      console.log();

      // Display mod and server-side JavaScript errors
      if (process.isPrimary || process.isPrimary === undefined) {
        modLoadingErrors.forEach((modLoadingError) => {
          serverconsole.locwarnmessage(
            `There was a problem while loading a "${String(modLoadingError.modName).replace(/[\r\n]/g, "")}" mod.`
          );
          serverconsole.locwarnmessage("Stack:");
          serverconsole.locwarnmessage(
            generateErrorStack(modLoadingError.error)
          );
        });
        if (SSJSError) {
          serverconsole.locwarnmessage(
            "There was a problem while loading server-side JavaScript."
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
      else if (process.versions && process.versions.deno)
        serverconsole.locmessage("Deno version: " + process.versions.deno);
      else serverconsole.locmessage("Node.JS version: " + process.version);
      const CPUs = os.cpus();
      if (CPUs.length > 0)
        serverconsole.locmessage(
          `CPU: ${CPUs.length > 1 ? CPUs.length + "x " : ""}${CPUs[0].model}`
        );

      // Throw errors
      if (vnum < 64)
        throw new Error(
          `${name} requires Node.JS 10.0.0 and newer, but your Node.JS version isn't supported by ${name}.`
        );
      if (configJSONRErr)
        throw new Error(
          `Can't read ${name} configuration file: ${configJSONRErr.message}`
        );
      if (configJSONPErr)
        throw new Error(
          `${name} configuration parse error: ${configJSONPErr.message}`
        );
      if (configJSONVErr)
        throw new Error(
          `${name} configuration validation error: ${configJSONVErr.message}`
        );
      if (
        process.serverConfig.enableHTTP2 &&
        !process.serverConfig.secure &&
        typeof process.serverConfig.port != "number"
      )
        throw new Error(
          `HTTP/2 without HTTPS, along with Unix sockets/Windows named pipes aren't supported by ${name}.`
        );
      if (process.serverConfig.enableHTTP2 && http2.__disabled__ !== undefined)
        throw new Error(
          `HTTP/2 isn't supported by your Node.JS version! You may not be able to use HTTP/2 with ${name}`
        );
      if (listenAddress) {
        if (listenAddress.match(/^[0-9]+$/))
          throw new Error(
            "Listening network address can't be numeric (it need to be either valid IP address, or valid domain name)."
          );
        if (
          listenAddress.match(
            /^(?:2(?:2[4-9]|3[0-9])\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$|ff[0-9a-f][0-9a-f]:[0-9a-f:])/i
          )
        )
          throw new Error(`${name} can't listen on multicast address.`);
        if (brdIPs.indexOf(listenAddress) > -1)
          throw new Error(`${name} can't listen on broadcast address.`);
        if (netIPs.indexOf(listenAddress) > -1)
          throw new Error(`${name} can't listen on subnet address.`);
      }
      if (certificateError)
        throw new Error(
          `There was a problem with SSL certificate/private key: ${certificateError.message}`
        );
      if (wwwrootError)
        throw new Error(
          `There was a problem with your web root: ${wwwrootError.message}`
        );
      if (sniReDos)
        throw new Error(
          "Refusing to start, because the current SNI configuration would make the server vulnerable to ReDoS."
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
        `Starting HTTP server at ${
          typeof process.serverConfig.port == "number"
            ? listenAddress
              ? (listenAddress.indexOf(":") > -1
                  ? "[" + listenAddress + "]"
                  : listenAddress) + ":"
              : "port "
            : ""
        }${process.serverConfig.port.toString()}...`
      );
    if (process.serverConfig.secure)
      serverconsole.locmessage(
        `Starting HTTPS server at ${
          typeof process.serverConfig.sport == "number"
            ? sListenAddress
              ? (sListenAddress.indexOf(":") > -1
                  ? "[" + sListenAddress + "]"
                  : sListenAddress) + ":"
              : "port "
            : ""
        }${process.serverConfig.sport.toString()}...`
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
          process.serverConfig.secure ? sListenAddress : listenAddress
        );
      } else {
        server.listen(
          process.serverConfig.secure
            ? process.serverConfig.sport
            : process.serverConfig.port
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

  if (init) {
    let workersToFork = 1;

    if (cluster.isPrimary === undefined) {
      if (!noSaveConfig) {
        setInterval(() => {
          try {
            saveConfig();
            serverconsole.locmessage("Configuration saved.");
          } catch (err) {
            throw new Error(err);
          }
        }, 300000);
      }
    } else if (cluster.isPrimary) {
      if (!noSaveConfig) {
        setInterval(() => {
          let allWorkers = Object.keys(cluster.workers);
          let goodWorkers = [];

          const checkWorker = (callback, _id) => {
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
                setTimeout(() => {
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
              // eslint-disable-next-line no-unused-vars
            } catch (err) {
              if (cluster.workers[allWorkers[_id]]) {
                cluster.workers[allWorkers[_id]].removeAllListeners("message");
                addListenersToWorker(cluster.workers[allWorkers[_id]]);
              }
              checkWorker(callback, _id + 1);
            }
          };
          checkWorker(() => {
            const wN = Math.floor(Math.random() * goodWorkers.length); //Send a configuration saving message to a random worker.
            try {
              if (cluster.workers[goodWorkers[wN]]) {
                isWorkerHungUpBuff2 = true;
                cluster.workers[goodWorkers[wN]].on("message", msgListener);
                cluster.workers[goodWorkers[wN]].send("\x14SAVECONF");
              }
            } catch (err) {
              if (cluster.workers[goodWorkers[wN]]) {
                cluster.workers[goodWorkers[wN]].removeAllListeners("message");
                addListenersToWorker(cluster.workers[goodWorkers[wN]]);
              }
              serverconsole.locwarnmessage(
                `There was a problem while saving configuration file. Reason: ${err.message}`
              );
            }
          });
        }, 300000);
      }
    }

    if (!cluster.isPrimary && cluster.isPrimary !== undefined) {
      process.on("message", (line) => {
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
            process.send("\x12KILLOK");
            process.send("\x12END");
          } else if (line == "\x14PINGPING") {
            process.send("\x12PINGOK");
            process.send("\x12END");
          } else if (line == "\x14KILLREQ") {
            if (process.reqcounter - reqcounterKillReq < 2) {
              process.send("\x12KILLTERMMSG");
              process.nextTick(() => {
                commands.stop([], () => {});
              });
            } else {
              reqcounterKillReq = process.reqcounter;
            }
          } else if (line[0] == "\x14") {
            // Discard unrecognized control messages
          } else if (
            commands[line.split(" ")[0]] !== undefined &&
            commands[line.split(" ")[0]] !== null
          ) {
            let argss = line.split(" ");
            const command = argss.shift();
            commands[command](argss, (msg) => process.send(msg));
            process.send("\x12END");
          } else {
            process.send(`Unrecognized command "${line.split(" ")[0]}".`);
            process.send("\x12END");
          }
          // eslint-disable-next-line no-unused-vars
        } catch (err) {
          if (line != "") {
            process.send(`Can't execute command "${line.split(" ")[0]}".`);
            process.send("\x12END");
          }
        }
      });
    } else {
      const rla = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: ""
      });
      rla.prompt();
      rla.on("line", (line) => {
        line = line.trim();
        const argss = line.split(" ");
        const command = argss.shift();
        if (line != "") {
          if (cluster.isPrimary !== undefined) {
            let allWorkers = Object.keys(cluster.workers);
            if (command == "block")
              commands.block(argss, serverconsole.climessage);
            if (command == "unblock")
              commands.unblock(argss, serverconsole.climessage);
            if (command == "restart") {
              let stopError = false;
              exiting = true;
              for (let i = 0; i < allWorkers.length; i++) {
                try {
                  if (cluster.workers[allWorkers[i]]) {
                    cluster.workers[allWorkers[i]].kill();
                  }
                  // eslint-disable-next-line no-unused-vars
                } catch (err) {
                  stopError = true;
                }
              }
              if (stopError)
                serverconsole.climessage(
                  `Some ${name} workers might not be stopped.`
                );
              SVRJSInitialized = false;
              closedMaster = true;

              workersToFork = getWorkerCountToFork();
              forkWorkers(workersToFork, () => {
                SVRJSInitialized = true;
                exiting = false;
                serverconsole.climessage(`${name} workers restarted.`);
              });

              return;
            }
            if (command == "stop") {
              exiting = true;
              allWorkers = Object.keys(cluster.workers);
            }
            allWorkers.forEach((clusterID) => {
              try {
                if (cluster.workers[clusterID]) {
                  cluster.workers[clusterID].on("message", msgListener);
                  cluster.workers[clusterID].send(line);
                }
                // eslint-disable-next-line no-unused-vars
              } catch (err) {
                if (cluster.workers[clusterID]) {
                  cluster.workers[clusterID].removeAllListeners("message");
                  addListenersToWorker(cluster.workers[clusterID]);
                }
                serverconsole.climessage(`Can't run command "${command}".`);
              }
            });
            if (command == "stop") {
              setTimeout(() => {
                commands[command](argss, serverconsole.climessage);
              }, 50);
            }
          } else {
            try {
              commands[command](argss, serverconsole.climessage);
              // eslint-disable-next-line no-unused-vars
            } catch (err) {
              serverconsole.climessage(`Unrecognized command "${command}".`);
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
        forkWorkers(workersToFork, () => {
          SVRJSInitialized = true;
        });

        // Hangup check and restart
        setInterval(() => {
          if (!closedMaster && !exiting) {
            let chksocket = {};
            if (
              process.serverConfig.secure &&
              process.serverConfig.disableNonEncryptedServer
            ) {
              chksocket = https
                .get(
                  {
                    hostname:
                      typeof process.serverConfig.sport == "number" &&
                      sListenAddress
                        ? sListenAddress
                        : "localhost",
                    port:
                      typeof process.serverConfig.sport == "number"
                        ? process.serverConfig.sport
                        : undefined,
                    socketPath:
                      typeof process.serverConfig.sport == "number"
                        ? undefined
                        : process.serverConfig.sport,
                    headers: {
                      "X-SVR-JS-From-Main-Thread": "true",
                      "User-Agent": generateServerString(true)
                    },
                    timeout: 1620,
                    rejectUnauthorized: false
                  },
                  (res) => {
                    chksocket.removeAllListeners("timeout");
                    res.destroy();
                    res.on("data", () => {});
                    res.on("end", () => {});
                    crashed = false;
                  }
                )
                .on("error", () => {
                  if (!exiting) {
                    if (!crashed) SVRJSFork();
                    else crashed = false;
                  }
                })
                .on("timeout", () => {
                  if (!exiting) SVRJSFork();
                  crashed = true;
                });
            } else if (
              (process.serverConfig.enableHTTP2 == undefined
                ? false
                : process.serverConfig.enableHTTP2) &&
              !process.serverConfig.secure
            ) {
              // It doesn't support through Unix sockets or Windows named pipes
              let address = (
                typeof process.serverConfig.port == "number" && listenAddress
                  ? listenAddress
                  : "localhost"
              ).replace(/\/@/g, "");
              if (address.indexOf(":") > -1) {
                address = "[" + address + "]";
              }
              const connection = http2.connect(
                "http://" + address + ":" + process.serverConfig.port.toString()
              );
              connection.on("error", () => {
                if (!exiting) {
                  if (!crashed) SVRJSFork();
                  else crashed = false;
                }
              });
              connection.setTimeout(1620, () => {
                if (!exiting) SVRJSFork();
                crashed = true;
              });
              chksocket = connection.request({
                ":path": "/",
                "x-svr-js-from-main-thread": "true",
                "user-agent": generateServerString(true)
              });
              chksocket.on("response", () => {
                connection.close();
                crashed = false;
              });
              chksocket.on("error", () => {
                if (!exiting) {
                  if (!crashed) SVRJSFork();
                  else crashed = false;
                }
              });
            } else {
              chksocket = http
                .get(
                  {
                    hostname:
                      typeof process.serverConfig.port == "number" &&
                      listenAddress
                        ? listenAddress
                        : "localhost",
                    port:
                      typeof process.serverConfig.port == "number"
                        ? process.serverConfig.port
                        : undefined,
                    socketPath:
                      typeof process.serverConfig.port == "number"
                        ? undefined
                        : process.serverConfig.port,
                    headers: {
                      "X-SVR-JS-From-Main-Thread": "true",
                      "User-Agent": generateServerString(true)
                    },
                    timeout: 1620
                  },
                  (res) => {
                    chksocket.removeAllListeners("timeout");
                    res.destroy();
                    res.on("data", () => {});
                    res.on("end", () => {});
                    crashed = false;
                  }
                )
                .on("error", () => {
                  if (!exiting) {
                    if (!crashed) SVRJSFork();
                    else crashed = false;
                  }
                })
                .on("timeout", () => {
                  if (!exiting) SVRJSFork();
                  crashed = true;
                });
            }
          }
        }, 4550);

        // Termination of unused good workers
        if (
          !process.serverConfig.disableUnusedWorkerTermination &&
          cluster.isPrimary !== undefined
        ) {
          setTimeout(() => {
            setInterval(() => {
              if (!closedMaster && !exiting) {
                const allWorkers = Object.keys(cluster.workers);

                let minWorkers = 0;
                minWorkers = Math.ceil(workersToFork * 0.625);
                if (minWorkers < 2) minWorkers = 2;
                if (minWorkers > 12) minWorkers = 12;

                let goodWorkers = [];

                const checkWorker = (callback, _id) => {
                  if (typeof _id === "undefined") _id = 0;
                  if (_id >= allWorkers.length) {
                    callback();
                    return;
                  }
                  try {
                    if (cluster.workers[allWorkers[_id]]) {
                      isWorkerHungUpBuff = true;
                      cluster.workers[allWorkers[_id]].on(
                        "message",
                        msgListener
                      );
                      cluster.workers[allWorkers[_id]].send("\x14KILLPING");
                      setTimeout(() => {
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
                    // eslint-disable-next-line no-unused-vars
                  } catch (err) {
                    if (cluster.workers[allWorkers[_id]]) {
                      cluster.workers[allWorkers[_id]].removeAllListeners(
                        "message"
                      );
                      addListenersToWorker(cluster.workers[allWorkers[_id]]);
                    }
                    checkWorker(callback, _id + 1);
                  }
                };
                checkWorker(() => {
                  if (goodWorkers.length > minWorkers) {
                    const wN = Math.floor(Math.random() * goodWorkers.length);
                    if (wN == goodWorkers.length) return;
                    try {
                      if (cluster.workers[goodWorkers[wN]]) {
                        isWorkerHungUpBuff = true;
                        cluster.workers[goodWorkers[wN]].on(
                          "message",
                          msgListener
                        );
                        cluster.workers[goodWorkers[wN]].send("\x14KILLREQ");
                      }
                    } catch (err) {
                      if (cluster.workers[goodWorkers[wN]]) {
                        cluster.workers[goodWorkers[wN]].removeAllListeners(
                          "message"
                        );
                        addListenersToWorker(cluster.workers[goodWorkers[wN]]);
                      }
                      serverconsole.locwarnmessage(
                        `There was a problem while terminating unused worker process. Reason: ${err.message}`
                      );
                    }
                  }
                });
              }
            }, 300000);
          }, 2000);
        }
      }
    }
  }
}

// Process event listeners
if (cluster.isPrimary || cluster.isPrimary === undefined) {
  // Crash handler
  function crashHandlerMaster(err) {
    serverconsole.locerrmessage(`${name} main process just crashed!!!`);
    serverconsole.locerrmessage("Stack:");
    serverconsole.locerrmessage(
      err.stack ? generateErrorStack(err) : String(err)
    );
    process.exit(err.errno !== undefined ? err.errno : 1);
  }

  process.on("uncaughtException", crashHandlerMaster);
  process.on("unhandledRejection", crashHandlerMaster);

  process.on("exit", (code) => {
    try {
      if (!configJSONRErr && !configJSONPErr && !noSaveConfig) {
        saveConfig();
      }
    } catch (err) {
      serverconsole.locwarnmessage(
        `There was a problem while saving configuration file. Reason: ${err.message}`
      );
    }
    try {
      deleteFolderRecursive(process.dirname + "/temp");
      // eslint-disable-next-line no-unused-vars
    } catch (err) {
      // Error!
    }
    try {
      fs.mkdirSync(process.dirname + "/temp");
      // eslint-disable-next-line no-unused-vars
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
          "// Placeholder server-side JavaScript to workaround Bun bug.\r\n"
        );
        // eslint-disable-next-line no-unused-vars
      } catch (err) {
        // Error!
      }
    }
    serverconsole.locmessage("Server closed with exit code: " + code);
  });
  process.on("warning", (warning) => {
    serverconsole.locwarnmessage(warning.message);
    if (generateErrorStack(warning)) {
      serverconsole.locwarnmessage("Stack:");
      serverconsole.locwarnmessage(generateErrorStack(warning));
    }
  });
  process.on("SIGINT", () => {
    if (cluster.isPrimary !== undefined) {
      exiting = true;
      const allWorkers = Object.keys(cluster.workers);
      for (var i = 0; i < allWorkers.length; i++) {
        try {
          if (cluster.workers[allWorkers[i]]) {
            cluster.workers[allWorkers[i]].send("stop");
          }
          // eslint-disable-next-line no-unused-vars
        } catch (err) {
          // Worker will crash with EPIPE anyway.
        }
      }
    }
    serverconsole.locmessage("Server terminated using SIGINT");
    process.exit();
  });
} else {
  // Crash handler
  function crashHandler(err) {
    serverconsole.locerrmessage(`${name} worker just crashed!!!`);
    serverconsole.locerrmessage("Stack:");
    serverconsole.locerrmessage(
      err.stack ? generateErrorStack(err) : String(err)
    );
    process.exit(err.errno !== undefined ? err.errno : 1);
  }

  process.on("uncaughtException", crashHandler);
  process.on("unhandledRejection", crashHandler);

  // Warning handler
  process.on("warning", (warning) => {
    serverconsole.locwarnmessage(warning.message);
    if (warning.stack) {
      serverconsole.locwarnmessage("Stack:");
      serverconsole.locwarnmessage(generateErrorStack(warning));
    }
  });
}

// Start SVR.JS!
try {
  start(true);
} catch (err) {
  serverconsole.locerrmessage(`There was a problem starting ${name}!!!`);
  serverconsole.locerrmessage("Stack:");
  serverconsole.locerrmessage(generateErrorStack(err));
  setTimeout(() => {
    process.exit(err.errno !== undefined ? err.errno : 1);
  }, 10);
}
