//DorianTech HTTP Server
//Uses Content-Type and Content-Length
//Events calling:
//|
//+--request
//|
//+--connect
//|
//+--error
//
//APIs:
// - https
// - readline
// - os
// - http
// - url
// - fs
// - path
// - hexstrbase64
// - crypto
// - svrmodpack
// - graceful-fs
// - formidable
if (typeof require === "undefined") {
  if (typeof ActiveXObject !== "undefined" && typeof WScript !== "undefined") {
    var shell = new ActiveXObject("WScript.Shell");
    shell.Popup("SVR.JS doesn't work on Windows Script Host. SVR.JS requires use of Node.JS (or compatible JS runtime).", undefined, "Can't start SVR.JS", 16);
    WScript.quit();
  } else {
    if (typeof alert !== "undefined" && typeof document !== "undefined") {
      alert("SVR.JS doesn't work on web browser. SVR.JS requires use of Node.JS (or compatible JS runtime).");
    }
    if (typeof document !== "undefined") {
      throw new Error("SVR.JS doesn't work on web browser. SVR.JS requires use of Node.JS (or compatible JS runtime).");
    } else {
      throw new Error("SVR.JS doesn't work on Deno/QuickJS. SVR.JS requires use of Node.JS (or compatible JS runtime).");
    }
  }
}
var secure = false;
var disableMods = false;
var logo = ["", "", "", "            \x1b[38;5;002m&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&", "          &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&", "         &&&\x1b[38;5;243m(((((((((((((((((((((((((((((((((((((((((((((((((((\x1b[38;5;002m&&&", "         \x1b[38;5;002m&&\x1b[38;5;243m((((((\x1b[38;5;241m###########\x1b[38;5;243m(((((((((((((((((((((((\x1b[38;5;011m***\x1b[38;5;243m(\x1b[38;5;011m***\x1b[38;5;243m(\x1b[38;5;011m***\x1b[38;5;243m((\x1b[38;5;002m&&", "         \x1b[38;5;002m&&&\x1b[38;5;243m(((((((((((((((((((((((((((((((((((((((((((((((((((\x1b[38;5;002m&&&", "         \x1b[38;5;002m&&&\x1b[38;5;243m(((((((((((((((((((((((((((((((((((((((((((((((((((\x1b[38;5;002m&&&", "         \x1b[38;5;002m&&\x1b[38;5;243m((((((\x1b[38;5;241m###########\x1b[38;5;243m(((((((((((((((((((((((\x1b[38;5;011m***\x1b[38;5;243m(\x1b[38;5;015m   \x1b[38;5;243m(\x1b[38;5;011m***\x1b[38;5;243m((\x1b[38;5;002m&&", "         \x1b[38;5;002m&&&\x1b[38;5;243m(((((((((((((((((((((((((((((((((((((((((((((((((((\x1b[38;5;002m&&&", "         \x1b[38;5;002m&&&\x1b[38;5;243m(((((((((((((((((((((((((((((((((((((((((((((((((((\x1b[38;5;002m&&&", "         \x1b[38;5;002m&&\x1b[38;5;243m((((((\x1b[38;5;241m###########\x1b[38;5;243m(((((((((((((((((((((((\x1b[38;5;015m   \x1b[38;5;243m(\x1b[38;5;015m   \x1b[38;5;243m(\x1b[38;5;015m   \x1b[38;5;243m((\x1b[38;5;002m&&", "         \x1b[38;5;002m&&&\x1b[38;5;243m(((((((((((((((((((((((((((((((((((((((((((((((((((\x1b[38;5;002m&&&", "         \x1b[38;5;002m&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&", "         \x1b[38;5;002m&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&", "         \x1b[38;5;002m&&&&&&&&\x1b[38;5;010m#########################################\x1b[38;5;002m&&&&&&&&", "         \x1b[38;5;002m&&&&&\x1b[38;5;010m###############################################\x1b[38;5;002m&&&&&", "         \x1b[38;5;002m&&&\x1b[38;5;010m###################################################\x1b[38;5;002m&&&", "         \x1b[38;5;002m&&\x1b[38;5;010m####\x1b[38;5;016m@@@@@@\x1b[38;5;010m#\x1b[38;5;016m@@@\x1b[38;5;010m###\x1b[38;5;016m@@@\x1b[38;5;010m#\x1b[38;5;016m@@@@@@@\x1b[38;5;010m###########\x1b[38;5;016m@@\x1b[38;5;010m##\x1b[38;5;016m@@@@@@\x1b[38;5;010m####\x1b[38;5;002m&&", "         \x1b[38;5;002m&&\x1b[38;5;010m###\x1b[38;5;016m@@\x1b[38;5;010m#######\x1b[38;5;016m@@\x1b[38;5;010m###\x1b[38;5;016m@@\x1b[38;5;010m##\x1b[38;5;016m@@\x1b[38;5;010m####\x1b[38;5;016m@@\x1b[38;5;010m##########\x1b[38;5;016m@@\x1b[38;5;010m#\x1b[38;5;016m@@\x1b[38;5;010m#########\x1b[38;5;002m&&", "         \x1b[38;5;002m&&\x1b[38;5;010m######\x1b[38;5;040m#\x1b[38;5;016m@@@@\x1b[38;5;010m##\x1b[38;5;016m@@\x1b[38;5;010m#\x1b[38;5;016m@@\x1b[38;5;010m###\x1b[38;5;016m@@@@@@@\x1b[38;5;010m#######\x1b[38;5;016m@@\x1b[38;5;010m##\x1b[38;5;016m@@\x1b[38;5;010m####\x1b[38;5;040m#\x1b[38;5;016m@@@@\x1b[38;5;010m###\x1b[38;5;002m&&", "         \x1b[38;5;002m&&\x1b[38;5;010m###\x1b[38;5;016m@@\x1b[38;5;034m%\x1b[38;5;010m###\x1b[38;5;016m@@\x1b[38;5;010m###\x1b[38;5;016m@@@\x1b[38;5;010m####\x1b[38;5;016m@@\x1b[38;5;010m####\x1b[38;5;016m@@\x1b[38;5;010m##\x1b[38;5;016m@@\x1b[38;5;010m###\x1b[38;5;016m@@@@\x1b[38;5;010m##\x1b[38;5;016m@@\x1b[38;5;034m%\x1b[38;5;010m###\x1b[38;5;016m@@\x1b[38;5;010m###\x1b[38;5;002m&&", "         \x1b[38;5;002m&&\x1b[38;5;010m#####################################################\x1b[38;5;002m&&", "         \x1b[38;5;002m&&&\x1b[38;5;010m###################################################\x1b[38;5;002m&&&", "         \x1b[38;5;002m&&&&&\x1b[38;5;010m###############################################\x1b[38;5;002m&&&&&", "         \x1b[38;5;002m&&&&&&&&\x1b[38;5;010m#########################################\x1b[38;5;002m&&&&&&&&", "         \x1b[38;5;002m&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&", "          &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&", "            &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&", "                                  \x1b[38;5;246m///////", "                                  ///////", "                                 \x1b[38;5;208m((((/))))", "                                \x1b[38;5;208m(((((/)))))", "            \x1b[38;5;246m/\x1b[38;5;247m*\x1b[38;5;246m///\x1b[38;5;247m*\x1b[38;5;246m///\x1b[38;5;247m*\x1b[38;5;246m///\x1b[38;5;247m*\x1b[38;5;246m///\x1b[38;5;247m*\x1b[38;5;246m/\x1b[38;5;247m/\x1b[38;5;208m(((((/)))))\x1b[38;5;246m//\x1b[38;5;247m*\x1b[38;5;246m///\x1b[38;5;247m*\x1b[38;5;246m///\x1b[38;5;247m*\x1b[38;5;246m///\x1b[38;5;247m*\x1b[38;5;246m///\x1b[38;5;247m*\x1b[38;5;246m/", "           //\x1b[38;5;247m*\x1b[38;5;246m///////\x1b[38;5;247m*\x1b[38;5;246m///////\x1b[38;5;247m*\x1b[38;5;246m/\x1b[38;5;247m/\x1b[38;5;208m(((((/)))))\x1b[38;5;246m//\x1b[38;5;247m*\x1b[38;5;246m///////\x1b[38;5;247m*\x1b[38;5;246m///////\x1b[38;5;247m*\x1b[38;5;246m//", "           *\x1b[38;5;246m/\x1b[38;5;247m*\x1b[38;5;246m/\x1b[38;5;247m*\x1b[38;5;246m/\x1b[38;5;247m*\x1b[38;5;246m/\x1b[38;5;247m*\x1b[38;5;246m/\x1b[38;5;247m*\x1b[38;5;246m/\x1b[38;5;247m*\x1b[38;5;246m/\x1b[38;5;247m*\x1b[38;5;246m/\x1b[38;5;247m*\x1b[38;5;246m/\x1b[38;5;247m*\x1b[38;5;246m/\x1b[38;5;247m*\x1b[38;5;208m(((((/)))))\x1b[38;5;247m*\x1b[38;5;246m/\x1b[38;5;247m*\x1b[38;5;246m/\x1b[38;5;247m*\x1b[38;5;246m/\x1b[38;5;247m*\x1b[38;5;246m/\x1b[38;5;247m*\x1b[38;5;246m/\x1b[38;5;247m*\x1b[38;5;246m/\x1b[38;5;247m*\x1b[38;5;246m/\x1b[38;5;247m*\x1b[38;5;246m/\x1b[38;5;247m*\x1b[38;5;246m/\x1b[38;5;247m*\x1b[38;5;246m/\x1b[38;5;247m*", "                                 \x1b[38;5;208m((((/))))", "", "", "", "\x1b[0m"];

var fs = require("fs");

function factoryReset() {
  console.log("Removing logs...");
  deleteFolderRecursive(__dirname + "/log");
  fs.mkdirSync(__dirname + "/log");
  console.log("Removing temp folder...");
  deleteFolderRecursive(__dirname + "/temp");
  fs.mkdirSync(__dirname + "/temp");
  console.log("Removing configuration file...");
  fs.unlinkSync("config.json");
  console.log("Done!");
  process.exit(0);
}

function deleteFolderRecursive(path) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(function (file) {
      var curPath = path + "/" + file;
      if (fs.statSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
}

var os = require("os");
var version = "3.4.23";
var singlethreaded = false;

if (process.versions) process.versions.svrjs = version; //Inject SVR.JS into process.versions

var args = process.argv;
for (var i = (process.argv[0].indexOf("node") > -1 || process.argv[0].indexOf("bun") > -1 ? 2 : 1); i < args.length; i++) {
  if (args[i] == "-h" || args[i] == "--help" || args[i] == "-?" || args[i] == "/h" || args[i] == "/?") {
    console.log("SVR.JS usage:");
    console.log("node svr.js [-h] [--help] [-?] [/h] [/?] [--secure] [--reset] [--clean] [--disable-mods] [--single-threaded] [-v] [--version]");
    console.log("-h -? /h /? --help    -- Displays help");
    console.log("--clean               -- Cleans files, that SVR.JS created");
    console.log("--reset               -- Resets SVR.JS to factory settings (WARNING: DANGEROUS)");
    console.log("--secure              -- Runs HTTPS server");
    console.log("--disable-mods        -- Disables mods (safe mode)");
    console.log("--single-threaded     -- Run single-threaded");
    console.log("-v --version          -- Display server version");
    process.exit(0);
  } else if (args[i] == "--secure") {
    secure = true;
  } else if (args[i] == "-v" || args[i] == "--version") {
    console.log("SVR.JS/" + version + " (" + getOS() + "; " + (process.isBun ? ("Bun/v" + process.versions.bun + "; like Node.JS/" + process.version) : ("Node.JS/" + process.version)) + ")");
    process.exit(0);
  } else if (args[i] == "--clean") {
    console.log("Removing logs...");
    deleteFolderRecursive(__dirname + "/log");
    fs.mkdirSync(__dirname + "/log");
    console.log("Removing temp folder...");
    deleteFolderRecursive(__dirname + "/temp");
    fs.mkdirSync(__dirname + "/temp");
    console.log("Done!");
    process.exit(0);
  } else if (args[i] == "--reset") {
    factoryReset();
  } else if (args[i] == "--disable-mods") {
    disableMods = true;
  } else if (args[i] == "--single-threaded") {
    singlethreaded = true;
  } else {
    console.log("Unrecognized argument: " + args[i]);
    console.log("SVR.JS usage:");
    console.log("node svr.js [-h] [--help] [-?] [/h] [/?] [--secure] [--reset] [--clean] [--disable-mods] [--single-threaded] [-v] [--version]");
    console.log("-h -? /h /? --help    -- Displays help");
    console.log("--clean               -- Cleans files, that SVR.JS created");
    console.log("--reset               -- Resets SVR.JS to factory settings (WARNING: DANGEROUS)");
    console.log("--secure              -- Runs HTTPS server");
    console.log("--disable-mods        -- Disables mods (safe mode)");
    console.log("--single-threaded     -- Run single-threaded");
    console.log("-v --version          -- Display server version");
    process.exit(1);
  }
}

var readline = require("readline");
var net = require("net");
var child_process = require("child_process");
var cluster = {};
if (!singlethreaded) {
  try {
    // Import cluster module
    var cluster = require("cluster");
  } catch (ex) {
    // Clustering is not supported!
  }

  // Cluster & IPC shim for Bun

  cluster.bunShim = function () {
    cluster.isMaster = !process.env.NODE_UNIQUE_ID;
    cluster.isPrimary = cluster.isMaster;
    cluster.isWorker = !cluster.isMaster;

    if (cluster.isWorker) {
      // Shim the cluster.worker object for worker processes
      cluster.worker = {
        id: parseInt(process.env.NODE_UNIQUE_ID),
        process: process,
        isDead: function () {
          return false;
        },
        send: function (message, b, c, d) {
          process.send(message, b, c, d);
        }
      };

      if (!process.send) {
        // Shim the process.send function for worker processes
        var net = require("net");
        var os = require("os");
        var path = require("path");

        // Create a fake IPC server to receive messages
        var fakeIPCServer = net.createServer(function (socket) {
          var receivedData = "";

          socket.on("data", function (data) {
            receivedData += data.toString();
          });

          socket.on("end", function () {
            process.emit("message", receivedData);
          });
        });
        fakeIPCServer.listen(os.platform() === "win32" ? path.join("\\\\?\\pipe", __dirname, "temp/.W" + process.pid + ".ipc") : (__dirname + "/temp/.W" + process.pid + ".ipc"));

        process.send = function (message) {
          // Create a fake IPC connection to send messages
          var fakeIPCConnection = net.createConnection(os.platform() === "win32" ? path.join("\\\\?\\pipe", __dirname, "temp/.P" + process.pid + ".ipc") : (__dirname + "/temp/.P" + process.pid + ".ipc"), function () {
            fakeIPCConnection.end(message);
          });
        };

        process.removeFakeIPC = function() {
          // Close IPC server
          process.send = function() {};
          fakeIPCServer.close();
        }
      }
    }

    // Custom implementation for cluster.fork()
    cluster._workersCounter = 1;
    cluster.workers = {};
    cluster.fork = function (env) {
      var child_process = require("child_process");
      var newEnvironment = JSON.parse(JSON.stringify(env ? env : process.env));
      newEnvironment.NODE_UNIQUE_ID = cluster._workersCounter;
      var newArguments = JSON.parse(JSON.stringify(process.argv));
      var command = newArguments.shift();
      var newWorker = child_process.spawn(command, newArguments, {
        env: newEnvironment,
        stdio: ["inherit", "inherit", "inherit", "ipc"]
      });

      newWorker.process = newWorker;
      newWorker.isDead = function () {
        return newWorker.exitCode !== null || newWorker.killed;
      };
      newWorker.id = newEnvironment.NODE_UNIQUE_ID;

      function checkSendImplementation(worker) {
        var sendImplemented = true;

        if (!worker.send) {
          sendImplemented = false;
        }

        oldLog = console.log;
        console.log = function(a,b,c,d,e,f) {
          if(a == "ChildProcess.prototype.send() - Sorry! Not implemented yet") {
            throw new Error("NOT IMPLEMENTED");
          } else {
            oldLog(a,b,c,d,e,f);
          }
        }

        try {
          worker.send(undefined);
        } catch (err) {
          if (err.message === "NOT IMPLEMENTED") {
            sendImplemented = false;
          }
        }

        console.log = oldLog;

        return sendImplemented;
      }

      if (!checkSendImplementation(newWorker)) {
        var net = require("net");
        var os = require("os");

        // Create a fake IPC server for worker process to receive messages
        var fakeWorkerIPCServer = net.createServer(function (socket) {
          var receivedData = "";

          socket.on("data", function (data) {
            receivedData += data.toString();
          });

          socket.on("end", function () {
            newWorker.emit("message", receivedData);
          });
        });
        fakeWorkerIPCServer.listen(os.platform() === "win32" ? path.join("\\\\?\\pipe", __dirname, "temp/.P" + newWorker.process.pid + ".ipc") : (__dirname + "/temp/.P" + newWorker.process.pid + ".ipc"));

        // Cleanup when worker process exits
        newWorker.on("exit", function () {
          fakeWorkerIPCServer.close();
          delete cluster.workers[newWorker.id];
        });

        newWorker.send = function (message, fakeParam2, fakeParam3, fakeParam4, tries) {
          if (!tries) tries = 0;

          try {
            // Create a fake IPC connection to send messages to worker process
            var fakeWorkerIPCConnection = net.createConnection(os.platform() === "win32" ? path.join("\\\\?\\pipe", __dirname, "temp/.W" + newWorker.process.pid + ".ipc") : (__dirname + "/temp/.W" + newWorker.process.pid + ".ipc"), function () {
              fakeWorkerIPCConnection.end(message);
            });
          } catch (err) {
            if (tries > 50) throw err;
            newWorker.send(message, fakeParam2, fakeParam3, fakeParam4, tries + 1);
          }
        };
      }

      cluster.workers[newWorker.id] = newWorker;
      cluster._workersCounter++;
      return newWorker;
    };
  }

  if (process.isBun && (cluster.isMaster === undefined || (cluster.isMaster && process.env.NODE_UNIQUE_ID))) {
    cluster.bunShim();
  }

  // Shim cluster.isPrimary field
  if (cluster.isPrimary === undefined && cluster.isMaster !== undefined) cluster.isPrimary = cluster.isMaster;
}

var bruteForceDb = {};

var SVRJSInitialized = false;
var exiting = false;
var crashed = false;

function SVRJSFork() {
  //Log
  if (SVRJSInitialized) serverconsole.locmessage("Starting next thread, because previous one hung up/crashed...");
  //Fork new worker
  var newWorker = {};
  try {
    newWorker = cluster.fork();
  } catch (err) {
    if(err.name == "NotImplementedError") {
      // If cluster.fork throws a NotImplementedError, shim cluster module
      cluster.bunShim();
      newWorker = cluster.fork();
    } else {
      throw err;
    }
  }
  newWorker.on("error", function (err) {
    if(!reallyExiting) serverconsole.locwarnmessage("There was a problem when handling SVR.JS worker! (from master process side) Reason: " + err.message);
  });
  newWorker.on("exit", function () {
    if (!exiting && Object.keys(cluster.workers).length == 0) {
      crashed = true;
      SVRJSFork();
    }
  });
  newWorker.on("message", bruteForceListenerWrapper(newWorker));
  newWorker.on("message", listenConnListener);
}
var http = require("http");
http.STATUS_CODES[497] = "HTTP Request Sent to HTTPS Port";
http.STATUS_CODES[598] = "Network Read Timeout Error";
http.STATUS_CODES[599] = "Network Connect Timeout Error";
var url = require("url");
if (url.URL && typeof URL == "undefined") URL = url.URL;
try {
  var gracefulFs = require("graceful-fs");
  if (!process.isBun) gracefulFs.gracefulify(fs); //Bun + graceful-fs + SVR.JS + requests about static content = 500 Internal Server Error!
} catch (ex) {
  //Don't use graceful-fs
}
var path = require("path");
var hexstrbase64 = undefined;
try {
  hexstrbase64 = require("./hexstrbase64/index.js");
} catch (ex) {
  //Don't use hexstrbase64
}
var svrmodpack = undefined;
try {
  svrmodpack = require("svrmodpack");
} catch (ex) {
  svrmodpack = {
    _errored: ex
  };
}
var zlib = require("zlib");
var tar = undefined;
try {
  tar = require("tar");
} catch (ex) {
  tar = {
    _errored: ex
  };
}
var formidable = undefined;
try {
  formidable = require("formidable");
} catch (ex) {
  formidable = {
    _errored: ex
  };
}
var ocsp = undefined;
var ocspCache = undefined;
try {
  ocsp = require("ocsp");
  ocspCache = new ocsp.Cache();
} catch (ex) {
  ocsp = {
    _errored: ex
  };
}
var prettyBytes = undefined;
try {
  prettyBytes = require("pretty-bytes");
} catch (ex) {
  prettyBytes = {
    _errored: ex
  };
}
var http2 = {};
try {
  http2 = require("http2");
  if (process.isBun) {
    try {
      http2.Http2ServerRequest();
    } catch (ex) {
      if (ex.name == "NotImplementedError" || ex.code == "ERR_NOT_IMPLEMENTED") throw ex;
    }
  }
} catch (ex) {
  http2.__disabled__ = null;
  http2.createServer = function () {
    throw new Error("HTTP/2 support not present");
  };
  http2.createSecureServer = function () {
    throw new Error("HTTP/2 support not present");
  };
  http2.connect = function () {
    throw new Error("HTTP/2 support not present");
  };
  http2.get = function () {
    throw new Error("HTTP/2 support not present");
  };
}
var crypto = {};
var https = {};
try {
  crypto = require("crypto");
  https = require("https");
} catch (ex) {
  crypto = {};
  https = {};
  crypto.__disabled__ = null;
  https.createServer = function () {
    throw new Error("Crypto support not present");
  };
  http2.createSecureServer = function () {
    throw new Error("Crypto support not present");
  };
  https.connect = function () {
    throw new Error("Crypto support not present");
  };
  https.get = function () {
    throw new Error("Crypto support not present");
  };
}
var mime = require("mime-types");
var pubip = "";
var pubport = 80;
var port = 80;
var domain = "";
var spubport = 443;
var sport = 443;
var mods = [];

if (!fs.existsSync(__dirname + "/log")) fs.mkdirSync(__dirname + "/log");
if (!fs.existsSync(__dirname + "/mods")) fs.mkdirSync(__dirname + "/mods");
if (!fs.existsSync(__dirname + "/temp")) fs.mkdirSync(__dirname + "/temp");

var modFiles = fs.readdirSync(__dirname + "/mods").sort();
var modInfos = [];

function sizify(x) {
  try {
    if (prettyBytes._errored) throw prettyBytes._errored;
    return prettyBytes(parseInt(x), {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).replace(/ /g, "").replace(/B/ig, "").replace(/k/g, "K");
  } catch (ex) {
    if (x < 1000) return x.toString();
    if (x < 10000) return (Math.round(x / 10) / 100).toString() + "K";
    if (x < 100000) return (Math.round(x / 100) / 10).toString() + "K";
    if (x < 1000000) return (Math.round(x / 1000)).toString() + "K";
    if (x < 10000000) return (Math.round(x / 10000) / 100).toString() + "M";
    if (x < 100000000) return (Math.round(x / 100000) / 10).toString() + "M";
    if (x < 1000000000) return (Math.round(x / 1000000)).toString() + "M";
    if (x < 10000000000) return (Math.round(x / 10000000) / 100).toString() + "G";
    if (x < 100000000000) return (Math.round(x / 100000000) / 10).toString() + "G";
    if (x < 1000000000000) return (Math.round(x / 1000000000)).toString() + "G";
    if (x < 10000000000000) return (Math.round(x / 10000000000) / 100).toString() + "T";
    if (x < 100000000000000) return (Math.round(x / 100000000000) / 10).toString() + "T";
    if (x < 1000000000000000) return (Math.round(x / 1000000000000)).toString() + "T";
    if (x < 10000000000000000) return (Math.round(x / 10000000000000) / 100).toString() + "P";
    if (x < 100000000000000000) return (Math.round(x / 100000000000000) / 10).toString() + "P";
    return (Math.round(x / 1000000000000000)).toString() + "P";
  }
}

function getOS() {
  var osType = os.type();
  var platform = os.platform();
  if (platform == "android") {
    return "Android";
  } else if (osType == "Windows_NT" || osType == "WindowsNT") {
    var arch = os.arch();
    if (arch == "ia32") {
      return "Win32";
    } else if (arch == "x64") {
      return "Win64";
    } else {
      return "Win" + arch.toUpperCase();
    }
  } else if (osType.indexOf("CYGWIN") == 0) {
    return "Cygwin";
  } else if (osType.indexOf("MINGW") == 0) {
    return "MinGW";
  } else if (osType.indexOf("MSYS") == 0) {
    return "MSYS";
  } else if (osType.indexOf("UWIN") == 0) {
    return "UWIN";
  } else if (osType == "GNU") {
    return "GNU Hurd";
  } else {
    return osType;
  }
}

function createRegex(regex) {
  var regexObj = regex.split("/");
  if (regexObj.length == 0) throw new Error("Invalid regex!");
  var modifiers = regexObj.pop();
  regexObj.shift();
  var searchString = regexObj.join("/");
  return new RegExp(searchString, modifiers);
}

//IP Block list object
function ipBlockList(rawBlockList) {
  function normalizeIPv4Address(address) {
    return address.replace(/(^|\.)(?:0(?!\.|$))+/g, "");
  }

  function expandIPv6Address(address) {
    var fullAddress = "";
    var expandedAddress = "";
    var validGroupCount = 8;
    var validGroupSize = 4;

    var ipv4 = "";
    var extractIpv4 = /([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})/;
    var validateIpv4 = /((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})/;

    if (validateIpv4.test(address)) {
      groups = address.match(extractIpv4);
      for (var i = 1; i < groups.length; i++) {
        ipv4 += ("00" + (parseInt(groups[i], 10).toString(16))).slice(-2) + (i == 2 ? ":" : "");
      }
      address = address.replace(extractIpv4, ipv4);
    }

    if (address.indexOf("::") == -1) {
      fullAddress = address;
    } else {
      var sides = address.split("::");
      var groupsPresent = 0;
      for (var i = 0; i < sides.length; i++) {
        groupsPresent += sides[i].split(":").length;
      }
      fullAddress += sides[0] + ":";
      for (var i = 0; i < validGroupCount - groupsPresent; i++) {
        fullAddress += "0000:";
      }
      fullAddress += sides[1];
    }
    var groups = fullAddress.split(":");
    for (var i = 0; i < validGroupCount; i++) {
      while (groups[i].length < validGroupSize) {
        groups[i] = "0" + groups[i];
      }
      expandedAddress += (i != validGroupCount - 1) ? groups[i] + ":" : groups[i];
    }
    return expandedAddress;
  }

  function ipv4ToInt(ip) {
    var ips = ip.split(".");
    return parseInt(ips[0]) * 16777216 + parseInt(ips[1]) * 65536 + parseInt(ips[2]) * 256 + parseInt(ips[3]);
  }

  function getIPv4CIDRLimits(ip, cidrMask) {
    var ipInt = ipv4ToInt(ip);
    var exp = Math.pow(2, 32 - cidrMask);
    var ipMin = Math.floor(ipInt / exp) * exp;
    var ipMax = ipMin + exp - 1;
    return {
      min: ipMin,
      max: ipMax
    };
  }

  function ipv6ToBlocks(ip) {
    var ips = ip.split(":");
    var ip2s = [];
    for (var i = 0; i < ips.length; i++) {
      ip2s.push(parseInt(ips[i]));
    }
    return ip2s;
  }

  function getIPv6CIDRLimits(ip, cidrMask) {
    var ipBlocks = ipv6ToBlocks(ip);
    var fieldsToDelete = Math.floor((128 - cidrMask) / 16);
    var fieldMaskModify = (128 - cidrMask) % 16;
    var ipBlockMin = [];
    var ipBlockMax = [];
    for (var i = 0; i < 8; i++) {
      ipBlockMin.push((i < 8 - fieldsToDelete) ? ((i < 7 - fieldsToDelete) ? ipBlocks[i] : (ipBlocks[i] >> fieldMaskModify << fieldMaskModify)) : 0);
    }
    for (var i = 0; i < 8; i++) {
      ipBlockMax.push((i < 8 - fieldsToDelete) ? ((i < 7 - fieldsToDelete) ? ipBlocks[i] : ((ipBlocks[i] >> fieldMaskModify << fieldMaskModify) + Math.pow(2, fieldMaskModify) - 1)) : 65535);
    }
    return {
      min: ipBlockMin,
      max: ipBlockMax
    };
  }

  function checkIfIPv4CIDRMatches(ipInt, cidrObject) {
    if (cidrObject.v6) return false;
    return ipInt >= cidrObject.min && ipInt <= cidrObject.max;
  }

  function checkIfIPv6CIDRMatches(ipBlock, cidrObject) {
    if (!cidrObject.v6) return false;
    for (var i = 0; i < 8; i++) {
      if (ipBlock[i] < cidrObject.min[i] || ipBlock[i] > cidrObject.max[i]) return true;
    }
    return false;
  }
  if (rawBlockList === undefined) rawBlockList = [];
  var instance = {};
  instance.raw = [];
  instance.rawtoPreparedMap = [];
  instance.prepared = [];
  instance.cidrs = [];
  instance.add = function (rawValue) {
    instance.raw.push(rawValue);
    var beginIndex = instance.prepared.length;
    var cidrIndex = instance.cidrs.length;
    var cidrMask = null;
    var isIPv6 = false;
    if (rawValue.indexOf("/") > -1) {
      var rwArray = rawValue.split("/");
      cidrMask = rwArray.pop();
      rawValue = rwArray.join("/");
    }
    rawValue = rawValue.toLowerCase();
    if (rawValue.indexOf("::ffff:") == 0) rawValue = rawValue.substr(7);
    if (rawValue.indexOf(":") > -1) {
      isIPv6 = true;
      rawValue = expandIPv6Address(rawValue);
    } else {
      rawValue = normalizeIPv4Address(rawValue);
    }
    if (cidrMask) {
      var cidrLimits = {};
      if (isIPv6) {
        cidrLimits = getIPv6CIDRLimits(rawValue, cidrMask);
        cidrLimits.v6 = true;
      } else {
        cidrLimits = getIPv4CIDRLimits(rawValue, cidrMask);
        cidrLimits.v6 = false;
      }
      instance.cidrs.push(cidrLimits);
      instance.rawtoPreparedMap.push({
        cidr: true,
        index: cidrIndex
      });
    } else {
      instance.prepared.push(rawValue);
      instance.rawtoPreparedMap.push({
        cidr: false,
        index: beginIndex
      });
    }
  };
  instance.remove = function (ip) {
    var index = instance.raw.indexOf(ip);
    if (index == -1) return false;
    var map = instance.rawtoPreparedMap[index];
    instance.raw.splice(index, 1);
    instance.rawtoPreparedMap.splice(index, 1);
    if (map.cidr) {
      instance.cidrs.splice(map.index, 1);
    } else {
      instance.prepared.splice(map.index, 1);
    }
    return true;
  };
  instance.check = function (rawValue) {
    if (instance.raw.length == 0) return false;
    var isIPv6 = false;
    rawValue = rawValue.toLowerCase();
    if (rawValue == "localhost") rawValue = "127.0.0.1";
    if (rawValue.indexOf("::ffff:") == 0) rawValue = rawValue.substr(7);
    if (rawValue.indexOf(":") > -1) {
      isIPv6 = true;
      rawValue = expandIPv6Address(rawValue);
    } else {
      rawValue = normalizeIPv4Address(rawValue);
    }
    if (instance.prepared.indexOf(rawValue) > -1) return true;
    if (instance.cidrs.length == 0) return false;
    var ipParsedObject = (!isIPv6 ? ipv4ToInt : ipv6ToBlocks)(rawValue);
    var checkMethod = (!isIPv6 ? checkIfIPv4CIDRMatches : checkIfIPv6CIDRMatches);
    for (var i = 0; i < instance.cidrs.length; i++) {
      if (checkMethod(ipParsedObject, instance.cidrs[i])) return true;
    }
    return false;
  };
  for (var i = 0; i < rawBlockList.length; i++) {
    instance.add(rawBlockList[i]);
  }
  return instance;
}

//Error stack generator from Error objects.
function generateErrorStack(ex) {
  var errStack = ex.stack ? ex.stack.split("\n") : [];
  for (var i = 0; i < errStack.length; i++) {
    if (errStack[i].indexOf(ex.name) == 0) return ex.stack;
  }
  var nErrStack = [ex.name + (ex.code ? ": " + ex.code : "") + (ex.message == "" ? "" : ": " + ex.message)];
  for (var i = 0; i < errStack.length; i++) {
    if (errStack[i] != "") {
      var ef = errStack[i].split("@");
      var location = "";
      if (ef.length > 1) location = ef.pop();
      var func = ef.join("@");
      nErrStack.push("    at " + (func == "" ? (!location || location == "" ? "<anonymous>" : location) : (func + (!location || location == "" ? "" : " (" + location + ")"))));
    }
  }
  return nErrStack.join("\n");
}

var ifaces = {};
var ifaceEx = null;
try {
  ifaces = os.networkInterfaces();
} catch (ex) {
  ifaceEx = ex;
}
var ips = [];
var attmts = 5;
var attmtsRedir = 5;
var errors = os.constants.errno;
var timestamp = new Date().getTime();
var wwwredirect = false;
Object.keys(ifaces).forEach(function (ifname) {
  var alias = 0;
  ifaces[ifname].forEach(function (iface) {
    if (iface.family !== "IPv4" || iface.internal !== false) {
      return;
    }
    if (alias >= 1) {
      ips.push(ifname + ":" + alias, iface.address);
    } else {
      ips.push(ifname, iface.address);
    }
    ++alias;
  });
});
if (ips.length == 0) {
  Object.keys(ifaces).forEach(function (ifname) {
    var alias = 0;
    ifaces[ifname].forEach(function (iface) {
      if (iface.family !== "IPv6" || iface.internal !== false) {
        return;
      }
      if (alias >= 1) {
        ips.push(ifname + ":" + alias, iface.address);
      } else {
        ips.push(ifname, iface.address);
      }
      ++alias;
    });
  });
}
var host = ips[(ips.length) - 1];
if (!host) host = "[offline]";
var hp = host + ":" + port.toString();

var ipRequestCompleted = false;
var ipRequestGotError = false;
if (host != "[offline]" || ifaceEx) {
  var ipRequest = (crypto.__disabled__ !== undefined ? http : https).get({
    host: "api64.ipify.org",
    port: (crypto.__disabled__ !== undefined ? 80 : 443),
    path: "/",
    headers: {
      "User-Agent": (exposeServerVersion ? "SVR.JS/" + version + " (" + getOS() + "; " + (process.isBun ? ("Bun/v" + process.versions.bun + "; like Node.JS/" + process.version) : ("Node.JS/" + process.version)) + ")" : "SVR.JS")
    },
    timeout: 5000
  }, function (res) {
    ipRequest.removeAllListeners("timeout");
    res.on("data", function (d) {
      if (res.statusCode != 200) {
        ipRequestCompleted = true;
        process.emit("ipRequestCompleted");
        return;
      }
      pubip = d.toString();
      if (!domain) {
        if (pubip.indexOf(":") == -1) {
          var parts = pubip.split(".");
          var p1 = parseInt(parts[0]).toString(16);
          var p2 = parseInt(parts[1]).toString(16);
          var p3 = parseInt(parts[2]).toString(16);
          var p4 = parseInt(parts[3]).toString(16);
          var pp = parseInt(pubport).toString(16);
          domain = p1 + p2 + p3 + p4 + pp + ".nodesvr.doriantech.com";
        } else {
          domain = pubip.replace(/[^0-9a-zA-Z]/gi, "").toLowerCase() + ".nodesvrip6.doriantech.com";
        }
      }
      ipRequestCompleted = true;
      process.emit("ipRequestCompleted");
    });
  });
  ipRequest.on("error", function () {
    if (crypto.__disabled__ || ipRequestGotError) {
      ipRequestCompleted = true;
      process.emit("ipRequestCompleted");
    } else {
      ipRequestGotError = true;
    }
  });
  ipRequest.on("timeout", function () {
    if (crypto.__disabled__ || ipRequestGotError) {
      ipRequestCompleted = true;
      process.emit("ipRequestCompleted");
    } else {
      ipRequestGotError = true;
    }
  });

  if (!crypto.__disabled) {
    var ipRequest2 = https.get({
      host: "api.seeip.org",
      port: 443,
      path: "/",
      headers: {
        "User-Agent": (exposeServerVersion ? "SVR.JS/" + version + " (" + getOS() + "; " + (process.isBun ? ("Bun/v" + process.versions.bun + "; like Node.JS/" + process.version) : ("Node.JS/" + process.version)) + ")" : "SVR.JS")
      },
      timeout: 5000
    }, function (res) {
      ipRequest2.removeAllListeners("timeout");
      res.on("data", function (d) {
        if (res.statusCode != 200) {
          ipRequestCompleted = true;
          process.emit("ipRequestCompleted");
          return;
        }
        pubip = d.toString();
        if (!domain) {
          if (pubip.indexOf(":") == -1) {
            var parts = pubip.split(".");
            var p1 = parseInt(parts[0]).toString(16);
            var p2 = parseInt(parts[1]).toString(16);
            var p3 = parseInt(parts[2]).toString(16);
            var p4 = parseInt(parts[3]).toString(16);
            var pp = parseInt(pubport).toString(16);
            domain = p1 + p2 + p3 + p4 + pp + ".nodesvr.doriantech.com";
          } else {
            domain = pubip.replace(/[^0-9a-zA-Z]/gi, "").toLowerCase() + ".nodesvrip6.doriantech.com";
          }
        }
        ipRequestCompleted = true;
        process.emit("ipRequestCompleted");
      });
    });
    ipRequest2.on("error", function () {
      if (crypto.__disabled__ || ipRequestGotError) {
        ipRequestCompleted = true;
        process.emit("ipRequestCompleted");
      } else {
        ipRequestGotError = true;
      }
    });
    ipRequest2.on("timeout", function () {
      if (crypto.__disabled__ || ipRequestGotError) {
        ipRequestCompleted = true;
        process.emit("ipRequestCompleted");
      } else {
        ipRequestGotError = true;
      }
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

var configJSON = {};
if (fs.existsSync(__dirname + "/config.json")) {
  var configJSONf = "";
  try {
    configJSONf = fs.readFileSync(__dirname + "/config.json"); //Read JSON File
  } catch (ex) {
    throw new Error("Cannot read JSON file.");
  }
  try {
    configJSON = JSON.parse(configJSONf); //Parse JSON
  } catch (ex) {
    throw new Error("JSON Parse error.");
  }
}

var rawBlackList = [];
var users = [];
var page404 = "404.html";
var serverAdmin = "[no contact information]";
var stackHidden = false;
var exposeServerVersion = true;
var rewriteMap = [];
var allowStatus = true;
var dontCompress = [];
var enableIPSpoofing = false;
var sni = {};
var disableNonEncryptedServer = false;
var disableToHTTPSRedirect = false;
var nonStandardCodesRaw = [];
if (configJSON.blacklist != undefined) rawBlackList = configJSON.blacklist;
if (configJSON.wwwredirect != undefined) wwwredirect = configJSON.wwwredirect;
if (configJSON.port != undefined) port = configJSON.port;
if (configJSON.pubport != undefined) pubport = configJSON.pubport;
if (configJSON.domian != undefined) domain = configJSON.domian;
if (configJSON.domain != undefined) domain = configJSON.domain;
if (configJSON.sport != undefined) sport = configJSON.sport;
if (configJSON.spubport != undefined) spubport = configJSON.spubport;
if (configJSON.page404 != undefined) page404 = configJSON.page404;
if (configJSON.serverAdministratorEmail != undefined) serverAdmin = configJSON.serverAdministratorEmail;
if (configJSON.nonStandardCodes != undefined) nonStandardCodesRaw = configJSON.nonStandardCodes;
if (configJSON.stackHidden != undefined) stackHidden = configJSON.stackHidden;
if (configJSON.users != undefined) users = configJSON.users;
if (configJSON.exposeServerVersion != undefined) exposeServerVersion = configJSON.exposeServerVersion;
if (configJSON.rewriteMap != undefined) rewriteMap = configJSON.rewriteMap;
if (configJSON.allowStatus != undefined) allowStatus = configJSON.allowStatus;
if (configJSON.dontCompress != undefined) dontCompress = configJSON.dontCompress;
if (configJSON.enableIPSpoofing != undefined) enableIPSpoofing = configJSON.enableIPSpoofing;
if (configJSON.secure != undefined) secure = secure || configJSON.secure;
if (configJSON.sni != undefined) sni = configJSON.sni;
if (configJSON.disableNonEncryptedServer != undefined) disableNonEncryptedServer = configJSON.disableNonEncryptedServer;
if (configJSON.disableToHTTPSRedirect != undefined) disableToHTTPSRedirect = configJSON.disableToHTTPSRedirect;
if (configJSON.wwwroot != undefined) {
  var wwwroot = configJSON.wwwroot;
  if (cluster.isPrimary || cluster.isPrimary === undefined) process.chdir(wwwroot);
} else {
  if (cluster.isPrimary || cluster.isPrimary === undefined) process.chdir(__dirname);
}

//Compability for older mods
configJSON.version = version;
configJSON.productName = "SVR.JS";

var blacklist = ipBlockList(rawBlackList);

var nonStandardCodes = [];
for (var i = 0; i < nonStandardCodesRaw.length; i++) {
  var nO = {};
  var nsKeys = Object.keys(nonStandardCodesRaw[i]);
  for (var j = 0; j < nsKeys.length; j++) {
    if (nsKeys[j] != "users") {
      nO[nsKeys[j]] = nonStandardCodesRaw[i][nsKeys[j]];
    } else {
      nO["users"] = ipBlockList(nonStandardCodesRaw[i].users);
    }
  }
  nonStandardCodes.push(nO);
}

var customHeaders = (configJSON.customHeaders == undefined ? {} : JSON.parse(JSON.stringify(configJSON.customHeaders)));
if (exposeServerVersion) {
  customHeaders["Server"] = "SVR.JS/" + version + " (" + getOS() + "; " + (process.isBun ? ("Bun/v" + process.versions.bun + "; like Node.JS/" + process.version) : ("Node.JS/" + process.version)) + ")";
} else {
  customHeaders["Server"] = "SVR.JS";
}

function getCustomHeaders() {
  return JSON.parse(JSON.stringify(customHeaders));
}

var vnum = 0;
try {
  vnum = process.config.variables.node_module_version;
} catch (ex) {
  //Version number not retrieved
}
if (vnum === undefined) vnum = 0;
if (process.isBun) vnum = 59;
// NOTE: One of regexes used here is reported as vulnerable according to Devina ReDOS checker, but it's actually just FALSE POSITIVE.
function sanitizeURL(resource) {
  if (resource == "*") return "*";
  if (resource == "") return "";
  // Remove null characters
  resource = resource.replace(/%00/ig, "").replace(/\0/g,"");
  // Check if URL is malformed (e.g. %c0%af or %u002f or simply %as)
  if (resource.match(/%(?:c[01]|f[ef]|(?![0-9a-f]{2}).{2}|.{0,1}$)/gi)) throw new URIError("URI malformed");
  // Decode URL-encoded characters while preserving certain characters
  resource = resource.replace(/%([0-9a-f]{2})/gi, function (match, hex) {
    var decodedChar = String.fromCharCode(parseInt(hex, 16));
    return /(?!["<>^`{|}?#%])[!-~]/.test(decodedChar) ? decodedChar : "%" + hex;
  });
  // Encode certain characters
  resource = resource.replace(/[<>^`{|}]]/g, function (character) {
    var charCode = character.charCodeAt(0);
    return "%" + (charcode < 16 ? "0" : "") + charCode.toString(16).toUpperCase();
  });
  var sanitizedResource = resource;
  // Ensure the resource starts with a slash
  if (resource[0] != "/") sanitizedResource = "/" + sanitizedResource;
  // Convert backslashes to slashes and remove duplicate slashes
  sanitizedResource = sanitizedResource.replace(/\\/g, "/").replace(/\/+/g, "/");
  // Handle relative navigation (e.g., "/./", "/../", "../", "./"), also remove trailing dots in paths
  sanitizedResource = sanitizedResource.replace(/\/\.(?:\.{2,})?(?=($|\/))/g, "$1").replace(/([^.\/])\.+(?=($|\/))/g, "$1$2").replace(/\/+/g, "/");
  while (sanitizedResource.match(/\/(?!\.\.\/)[^\/]+\/\.\.(?=(\/|$))/g)) {
    sanitizedResource = sanitizedResource.replace(/\/(?!\.\.\/)[^\/]+\/\.\.(?=(\/|$))/g, "$1").replace(/\/+/g, "/");
  }
  sanitizedResource = sanitizedResource.replace(/\/\.\.(?=(\/|$))/g, "$1").replace(/\/+/g, "/");
  if (sanitizedResource.length == 0) return "/";
  else return sanitizedResource;
}

function fixNodeMojibakeURL(string) {
  var encoded = "";
  Buffer.from(string, "latin1").forEach(function (value) {
    if(value > 127) {
      encoded += "%" + (value < 16 ? "0" : "") + value.toString(16).toUpperCase();
    } else {
      encoded += String.fromCodePoint(value);
    }
  });
  return encoded.replace(/%[0-9a-f-A-F]{2}/g, function (match) {
    return match.toUpperCase();
  });
}

var key = "";
var cert = "";

if (secure) {
  if (!configJSON.key) configJSON.key = "cert/key.key";
  if (!configJSON.cert) configJSON.cert = "cert/cert.crt";
} else {
  key = "SSL DISABLED";
  cert = "SSL DISABLED";
  configJSON.cert = "SSL DISABLED";
  configJSON.key = "SSL DISABLED";
}

if (!fs.existsSync(__dirname + "/config.json")) {
  saveConfig();
}

if (secure) {
  key = fs.readFileSync((configJSON.key[0] != "/" && !configJSON.key.match(/^[A-Z0-9]:\\/)) ? __dirname + "/" + configJSON.key : configJSON.key).toString();
  cert = fs.readFileSync((configJSON.cert[0] != "/" && !configJSON.cert.match(/^[A-Z0-9]:\\/)) ? __dirname + "/" + configJSON.cert : configJSON.cert).toString();
  var sniNames = Object.keys(sni);
  var sniCredentials = [];
  for (var i = 0; i < sniNames.length; i++) {
    sniCredentials.push({
      name: sniNames[i],
      cert: fs.readFileSync((sni[sniNames[i]].cert[0] != "/" && !sni[sniNames[i]].cert.match(/^[A-Z0-9]:\\/)) ? __dirname + "/" + sni[sniNames[i]].cert : sni[sniNames[i]].cert).toString(),
      key: fs.readFileSync((sni[sniNames[i]].key[0] != "/" && !sni[sniNames[i]].key.match(/^[A-Z0-9]:\\/)) ? __dirname + "/" + sni[sniNames[i]].key : sni[sniNames[i]].key).toString()
    });
  }
}

var logFile = undefined;
var logSync = false;

function LOG(s) {
  try {
    if (configJSON.enableLogging || configJSON.enableLogging == undefined) {
      if (logSync) {
        fs.appendFileSync(__dirname + "/log/" + (cluster.isPrimary ? "master" : (cluster.isPrimary === undefined ? "singlethread" : "worker")) + "-" + timestamp + ".log", "[" + new Date().toISOString() + "] " + s + "\r\n");
      } else {
        if (!logFile) {
          logFile = fs.createWriteStream(__dirname + "/log/" + (cluster.isPrimary ? "master" : (cluster.isPrimary === undefined ? "singlethread" : "worker")) + "-" + timestamp + ".log", {
            flags: "a",
            autoClose: false
          });
        }
        if (logFile.writable) {
          logFile.write("[" + new Date().toISOString() + "] " + s + "\r\n");
        } else {
          throw new Error("Log file stream is closed.");
        }
      }
    }
  } catch (ex) {
    if (!s.match(/^SERVER WARNING MESSAGE(?: \[Request Id: [0-9a-f]{6}\])?: There was a problem while saving logs! Logs will not be kept in log file\. Reason: /)) serverconsole.locwarnmessage("There was a problem while saving logs! Logs will not be kept in log file. Reason: " + ex.message);
  }
}

var serverconsole = {
  climessage: function (msg) {
    if (msg.indexOf("\n") != -1) {
      var nmsg = msg.split("\n");
      for (var i = 0; i < nmsg.length; i++) {
        serverconsole.climessage(nmsg[i]);
      }
      return;
    }
    console.log("SERVER CLI MESSAGE: " + msg);
    LOG("SERVER CLI MESSAGE: " + msg);
    return;
  },
  reqmessage: function (msg) {
    if (msg.indexOf("\n") != -1) {
      var nmsg = msg.split("\n");
      for (var i = 0; i < nmsg.length; i++) {
        serverconsole.reqmessage(nmsg[i]);
      }
      return;
    }
    console.log("\x1b[34mSERVER REQUEST MESSAGE: " + msg + "\x1b[37m\x1b[0m");
    LOG("SERVER REQUEST MESSAGE: " + msg);
    return;
  },
  resmessage: function (msg) {
    if (msg.indexOf("\n") != -1) {
      var nmsg = msg.split("\n");
      for (var i = 0; i < nmsg.length; i++) {
        serverconsole.resmessage(nmsg[i]);
      }
      return;
    }
    console.log("\x1b[32mSERVER RESPONSE MESSAGE: " + msg + "\x1b[37m\x1b[0m");
    LOG("SERVER RESPONSE MESSAGE: " + msg);
    return;
  },
  errmessage: function (msg) {
    if (msg.indexOf("\n") != -1) {
      var nmsg = msg.split("\n");
      for (var i = 0; i < nmsg.length; i++) {
        serverconsole.errmessage(nmsg[i]);
      }
      return;
    }
    console.log("\x1b[31mSERVER RESPONSE ERROR MESSAGE: " + msg + "\x1b[37m\x1b[0m");
    LOG("SERVER RESPONSE ERROR MESSAGE: " + msg);
    return;
  },
  locerrmessage: function (msg) {
    if (msg.indexOf("\n") != -1) {
      var nmsg = msg.split("\n");
      for (var i = 0; i < nmsg.length; i++) {
        serverconsole.locerrmessage(nmsg[i]);
      }
      return;
    }
    console.log("\x1b[41mSERVER ERROR MESSAGE: " + msg + "\x1b[40m\x1b[0m");
    LOG("SERVER ERROR MESSAGE: " + msg);
    return;
  },
  locwarnmessage: function (msg) {
    if (msg.indexOf("\n") != -1) {
      var nmsg = msg.split("\n");
      for (var i = 0; i < nmsg.length; i++) {
        serverconsole.locwarnmessage(nmsg[i]);
      }
      return;
    }
    console.log("\x1b[43mSERVER WARNING MESSAGE: " + msg + "\x1b[40m\x1b[0m");
    LOG("SERVER WARNING MESSAGE: " + msg);
    return;
  },
  locmessage: function (msg) {
    if (msg.indexOf("\n") != -1) {
      var nmsg = msg.split("\n");
      for (var i = 0; i < nmsg.length; i++) {
        serverconsole.locmessage(nmsg[i]);
      }
      return;
    }
    console.log("SERVER MESSAGE: " + msg);
    LOG("SERVER MESSAGE: " + msg);
    return;
  }
};

//Wrap around process.exit, so log contents can flush.
process.unsafeExit = process.exit;
process.exit = function (code) {
  if (logFile && logFile.writable && !logFile.pending) {
    try {
      logFile.close(function () {
        logFile = undefined;
        logSync = true;
        process.unsafeExit(code);
        if (process.isBun) {
          setInterval(function () {
            if (!logFile.writable) {
              logFile = undefined
              logSync = true;
              process.unsafeExit(code);
            }
          }, 50); //Interval
        }
      });
      setTimeout(function () {
        logFile = undefined;
        logSync = true;
        process.unsafeExit(code);
      }, 10000); //timeout
    } catch (ex) {
      logFile = undefined;
      logSync = true;
      process.unsafeExit(code);
    }
  } else {
    logSync = true;
    process.unsafeExit(code);
  }
};

if (!disableMods) {
  var modloaderFolderName = "modloader";
  if (cluster.isPrimary === false) {
    modloaderFolderName = ".modloader_w" + Math.floor(Math.random() * 65536);
  }
  var tempServerSideScriptName = "serverSideScript.js";
  if (!process.isBun && cluster.isPrimary === false) {
    tempServerSideScriptName = ".serverSideScript_w" + Math.floor(Math.random() * 65536) + ".js";
  }
  for (var i = 0; i < modFiles.length; i++) {
    var modFile = __dirname + "/mods/" + modFiles[i];
    try {
      try {
        fs.mkdirSync(__dirname + "/temp/" + modloaderFolderName);
      } catch (ex) {
        if (ex.code != "EEXIST") {
          fs.mkdirSync(__dirname + "/temp");
          try {
            fs.mkdirSync(__dirname + "/temp/" + modloaderFolderName);
          } catch (ex) {
            if (ex.code != "EEXIST") throw ex;
          }
        }
      }
      fs.mkdirSync(__dirname + "/temp/" + modloaderFolderName + "/" + modFiles[i]);
    } catch (ex) {
      if (ex.code != "EEXIST" && ex.code != "ENOENT") throw ex;
      //Some other SVR.JS process may have create files.
    }
    if (fs.statSync(modFile).isFile()) {
      try {
        function extract() {
          if (modFile.indexOf(".tar.gz") == modFile.length - 7) {
            if (tar._errored) throw tar._errored;
            tar.x({
              file: modFile,
              sync: true,
              C: __dirname + "/temp/" + modloaderFolderName + "/" + modFiles[i]
            });
          } else {
            if (svrmodpack._errored) throw svrmodpack._errored;
            svrmodpack.unpack(modFile, __dirname + "/temp/" + modloaderFolderName + "/" + modFiles[i]);
          }
        }
        extract();
        var Mod = undefined;
        var mod = undefined;
        var modSloaded = false;
        for (var j = 0; j < 3; j++) {
          try {
            Mod = require("./temp/" + modloaderFolderName + "/" + modFiles[i] + "/index.js");
            mod = new Mod();
            break;
          } catch (ex) {
            if (j >= 2 || ex.name == "SyntaxError") throw ex;
            var now = Date.now();
            while (Date.now() - now < 2);
            //Try reloading mod
          }
        }
        mods.push(mod);
        for (var j = 0; j < 3; j++) {
          try {
            modInfos.push(JSON.parse(fs.readFileSync(__dirname + "/temp/" + modloaderFolderName + "/" + modFiles[i] + "/mod.info")));
            break;
          } catch (ex) {
            if (j >= 2) {
              modInfos.push({
                name: "Unknown mod (" + modFiles[i] + ";" + ex.message + ")",
                version: "ERROR"
              });
            }
            //Try reloading mod info
          }
        }
      } catch (ex) {
        if (cluster.isPrimary || cluster.isPrimary === undefined) {
          serverconsole.locwarnmessage("There was a problem while loading a \"" + modFiles[i] + "\" mod.");
          serverconsole.locwarnmessage("Stack:");
          serverconsole.locwarnmessage(generateErrorStack(ex));
        }
      }
    }
  }
  if (fs.existsSync("./serverSideScript.js") && fs.statSync("./serverSideScript.js").isFile()) {
    try {
      var modhead = "var readline = require('readline');\r\nvar os = require('os');\r\nvar http = require('http');\r\nvar url = require('url');\r\nvar fs = require('fs');\r\nvar path = require('path');\r\n" + (hexstrbase64 === undefined ? "" : "var hexstrbase64 = require('../hexstrbase64/index.js');\r\n") + (crypto.__disabled__ === undefined ? "var crypto = require('crypto');\r\nvar https = require('https');\r\n" : "") + "var stream = require('stream');\r\nvar customvar1;\r\nvar customvar2;\r\nvar customvar3;\r\nvar customvar4;\r\n\r\nfunction Mod() {}\r\nMod.prototype.callback = function callback(req, res, serverconsole, responseEnd, href, ext, uobject, search, defaultpage, users, page404, head, foot, fd, elseCallback, configJSON, callServerError, getCustomHeaders, origHref, redirect, parsePostData) {\r\nreturn function () {\r\nvar disableEndElseCallbackExecute = false;\r\nfunction filterHeaders(headers){for(var jsn=JSON.stringify(headers,null,2).split('\\n'),njsn=[\"{\"],i=1;i<jsn.length-1;i++)0!==jsn[i].replace(/ /g,\"\").indexOf('\":')&&(eval(\"var value = \"+(\",\"==jsn[i][jsn[i].length-1]?jsn[i].substring(0,jsn[i].length-1):jsn[i]).split('\": ')[1]),\",\"==jsn[i][jsn[i].length-1]&&i==jsn.length-2?njsn.push(jsn[i].substring(0,jsn[i].length-1)):null!=value&&njsn.push(jsn[i]));return njsn.push(\"}\"),JSON.parse(njsn.join(os.EOL))}\r\n";
      var modfoot = "\r\nif(!disableEndElseCallbackExecute) {\r\ntry{\r\nelseCallback();\r\n} catch(ex) {\r\n}\r\n}\r\n}\r\n}\r\nmodule.exports = Mod;";
      fs.writeFileSync(__dirname + "/temp/" + tempServerSideScriptName, modhead + fs.readFileSync("./serverSideScript.js") + modfoot);
      var aMod = undefined;
      var amod = undefined;
      for (var i = 0; i < 5; i++) {
        try {
          aMod = require("./temp/" + tempServerSideScriptName);
          amod = new aMod();
          break;
        } catch (ex) {
          if (i >= 4 || ex.name == "SyntaxError") throw ex;
          var now = Date.now();
          while (Date.now() - now < 2);
          //Try reloading mod
        }
      }
      mods.push(amod);
    } catch (ex) {
      if (cluster.isPrimary || cluster.isPrimary === undefined) {
        serverconsole.locwarnmessage("There was a problem while loading server side JavaScript.");
        serverconsole.locwarnmessage("Stack:");
        serverconsole.locwarnmessage(generateErrorStack(ex));
      }
    }
  }
}

function sha256(s) {
  if (crypto.__disabled__ === undefined) {
    var hash = crypto.createHash("SHA256");
    hash.update(s);
    return hash.digest("hex");
  } else {

    var chrsz = 8;
    var hexcase = 0;

    function safeAdd(x, y) {
      var lsw = (x & 0xFFFF) + (y & 0xFFFF);
      var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
      return (msw << 16) | (lsw & 0xFFFF);
    }

    function S(X, n) {
      return (X >>> n) | (X << (32 - n));
    }

    function R(X, n) {
      return (X >>> n);
    }

    function Ch(x, y, z) {
      return ((x & y) ^ ((~x) & z));
    }

    function Maj(x, y, z) {
      return ((x & y) ^ (x & z) ^ (y & z));
    }

    function Sigma0256(x) {
      return (S(x, 2) ^ S(x, 13) ^ S(x, 22));
    }

    function Sigma1256(x) {
      return (S(x, 6) ^ S(x, 11) ^ S(x, 25));
    }

    function Gamma0256(x) {
      return (S(x, 7) ^ S(x, 18) ^ R(x, 3));
    }

    function Gamma1256(x) {
      return (S(x, 17) ^ S(x, 19) ^ R(x, 10));
    }

    function coreSha256(m, l) {
      var K = new Array(0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5, 0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5, 0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3, 0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174, 0xE49B69C1, 0xEFBE4786, 0xFC19DC6, 0x240CA1CC, 0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA, 0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7, 0xC6E00BF3, 0xD5A79147, 0x6CA6351, 0x14292967, 0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13, 0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85, 0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3, 0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070, 0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5, 0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3, 0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208, 0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2);
      var HASH = new Array(0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A, 0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19);
      var W = new Array(64);
      var a, b, c, d, e, f, g, h, i, j;
      var T1, T2;

      m[l >> 5] |= 0x80 << (24 - l % 32);
      m[((l + 64 >> 9) << 4) + 15] = l;

      for (var i = 0; i < m.length; i += 16) {
        a = HASH[0];
        b = HASH[1];
        c = HASH[2];
        d = HASH[3];
        e = HASH[4];
        f = HASH[5];
        g = HASH[6];
        h = HASH[7];

        for (var j = 0; j < 64; j++) {
          if (j < 16) W[j] = m[j + i];
          else W[j] = safeAdd(safeAdd(safeAdd(Gamma1256(W[j - 2]), W[j - 7]), Gamma0256(W[j - 15])), W[j - 16]);

          T1 = safeAdd(safeAdd(safeAdd(safeAdd(h, Sigma1256(e)), Ch(e, f, g)), K[j]), W[j]);
          T2 = safeAdd(Sigma0256(a), Maj(a, b, c));

          h = g;
          g = f;
          f = e;
          e = safeAdd(d, T1);
          d = c;
          c = b;
          b = a;
          a = safeAdd(T1, T2);
        }

        HASH[0] = safeAdd(a, HASH[0]);
        HASH[1] = safeAdd(b, HASH[1]);
        HASH[2] = safeAdd(c, HASH[2]);
        HASH[3] = safeAdd(d, HASH[3]);
        HASH[4] = safeAdd(e, HASH[4]);
        HASH[5] = safeAdd(f, HASH[5]);
        HASH[6] = safeAdd(g, HASH[6]);
        HASH[7] = safeAdd(h, HASH[7]);
      }
      return HASH;
    }

    function str2binb(str) {
      var bin = Array();
      var mask = (1 << chrsz) - 1;
      for (var i = 0; i < str.length * chrsz; i += chrsz) {
        bin[i >> 5] |= (str.charCodeAt(i / chrsz) & mask) << (24 - i % 32);
      }
      return bin;
    }

    function Utf8Encode(string) {
      string = string.replace(/\r\n/g, "\n");
      var utftext = "";

      for (var n = 0; n < string.length; n++) {

        var c = string.charCodeAt(n);

        if (c < 128) {
          utftext += String.fromCharCode(c);
        } else if ((c > 127) && (c < 2048)) {
          utftext += String.fromCharCode((c >> 6) | 192);
          utftext += String.fromCharCode((c & 63) | 128);
        } else {
          utftext += String.fromCharCode((c >> 12) | 224);
          utftext += String.fromCharCode(((c >> 6) & 63) | 128);
          utftext += String.fromCharCode((c & 63) | 128);
        }

      }

      return utftext;
    }

    function binb2hex(binarray) {
      var hexTab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
      var str = "";
      for (var i = 0; i < binarray.length * 4; i++) {
        str += hexTab.charAt((binarray[i >> 2] >> ((3 - i % 4) * 8 + 4)) & 0xF) +
          hexTab.charAt((binarray[i >> 2] >> ((3 - i % 4) * 8)) & 0xF);
      }
      return str;
    }

    s = Utf8Encode(s);
    return binb2hex(coreSha256(str2binb(s), s.length * chrsz));
  }
}

function getInitializePath(to) {
  var cwd = process.cwd();
  if (os.platform() == "win32") {
    to = to.replace(/\//g, "\\");
    if (to[0] == "\\") to = cwd.split("\\")[0] + to;
  }
  var absoluteTo = path.isAbsolute(to) ? to : (__dirname + (os.platform() == "win32" ? "\\" : "/") + to);
  if (os.platform() == "win32" && cwd[0] != absoluteTo[0]) return "";
  var relative = path.relative(cwd, absoluteTo);
  if (os.platform() == "win32") {
    return "/" + relative.replace(/\\/g, "/");
  } else {
    return "/" + relative;
  }
}

function checkIfForbiddenPath(decodedHref, match) {
  var mo = forbiddenPaths[match];
  if (!mo) return false;
  if (typeof mo == "string") return decodedHref == mo || (os.platform() == "win32" && decodedHref.toLowerCase() == mo.toLowerCase());
  if (typeof mo == "object") {
    for (var i = 0; i < mo.length; i++) {
      if (decodedHref == mo[i] || (os.platform() == "win32" && decodedHref.toLowerCase() == mo[i].toLowerCase())) return true;
    }
  }
  return false;
}

function checkIfIndexOfForbiddenPath(decodedHref, match) {
  var mo = forbiddenPaths[match];
  if (!mo) return false;
  if (typeof mo == "string") return decodedHref == mo || decodedHref.indexOf(mo + "/") == 0 || (os.platform() == "win32" && (decodedHref.toLowerCase() == mo.toLowerCase() || decodedHref.toLowerCase().indexOf(mo.toLowerCase() + "/") == 0));
  if (typeof mo == "object") {
    for (var i = 0; i < mo.length; i++) {
      if (decodedHref == mo[i] || decodedHref.indexOf(mo[i] + "/") == 0 || (os.platform() == "win32" && (decodedHref.toLowerCase() == mo[i].toLowerCase() || decodedHref.toLowerCase().indexOf(mo[i].toLowerCase() + "/") == 0))) return true;
    }
  }
  return false;
}

var forbiddenPaths = {};

forbiddenPaths.config = getInitializePath("./config.json");
forbiddenPaths.certificates = [];
if (secure) {
  forbiddenPaths.certificates.push(getInitializePath(configJSON.cert));
  forbiddenPaths.certificates.push(getInitializePath(configJSON.key));
  for (var i = 0; i < Object.keys(sni).length; i++) {
    forbiddenPaths.certificates.push(getInitializePath(sni[Object.keys(sni)[i]].cert));
    forbiddenPaths.certificates.push(getInitializePath(sni[Object.keys(sni)[i]].key));
  }
}
forbiddenPaths.svrjs = getInitializePath("./" + ((__dirname[__dirname.length - 1] != "/") ? __filename.replace(__dirname + "/", "") : __filename.replace(__dirname, "")));
forbiddenPaths.serverSideScripts = [];
forbiddenPaths.serverSideScripts.push("/serverSideScript.js");
forbiddenPaths.serverSideScripts.push(getInitializePath("./temp/serverSideScript.js"));
forbiddenPaths.serverSideScriptDirectories = [];
forbiddenPaths.serverSideScriptDirectories.push(getInitializePath("./temp/modloader"));
forbiddenPaths.serverSideScriptDirectories.push(getInitializePath("./node_modules"));
forbiddenPaths.serverSideScriptDirectories.push(getInitializePath("./mods"));
forbiddenPaths.log = getInitializePath("./log");

//Create server
if (!cluster.isPrimary) {
  var reqcounter = 0;
  var server = {};
  var server2 = {};
  try {
    server2 = http.createServer({
      requireHostHeader: false
    });
  } catch (ex) {
    server2 = http.createServer();
  }
  if (!disableToHTTPSRedirect) {
    server2.on("request", redirhandler);
    server2.on("connect", function (request, socket) {
      var reqIdInt = Math.round(Math.random() * 16777216);
      var reqId = "0".repeat(6 - reqIdInt.toString(16).length) + reqIdInt.toString(16);
      var serverconsole = {
        climessage: function (msg) {
          if (msg.indexOf("\n") != -1) {
            var nmsg = msg.split("\n");
            for (var i = 0; i < nmsg.length; i++) {
              serverconsole.climessage(nmsg[i]);
            }
            return;
          }
          console.log("SERVER CLI MESSAGE [Request Id: " + reqId + "]: " + msg);
          LOG("SERVER CLI MESSAGE [Request Id: " + reqId + "]: " + msg);
          return;
        },
        reqmessage: function (msg) {
          if (msg.indexOf("\n") != -1) {
            var nmsg = msg.split("\n");
            for (var i = 0; i < nmsg.length; i++) {
              serverconsole.reqmessage(nmsg[i]);
            }
            return;
          }
          console.log("\x1b[34mSERVER REQUEST MESSAGE [Request Id: " + reqId + "]: " + msg + "\x1b[37m\x1b[0m");
          LOG("SERVER REQUEST MESSAGE [Request Id: " + reqId + "]: " + msg);
          return;
        },
        resmessage: function (msg) {
          if (msg.indexOf("\n") != -1) {
            var nmsg = msg.split("\n");
            for (var i = 0; i < nmsg.length; i++) {
              serverconsole.resmessage(nmsg[i]);
            }
            return;
          }
          console.log("\x1b[32mSERVER RESPONSE MESSAGE [Request Id: " + reqId + "]: " + msg + "\x1b[37m\x1b[0m");
          LOG("SERVER RESPONSE MESSAGE [Request Id: " + reqId + "]: " + msg);
          return;
        },
        errmessage: function (msg) {
          if (msg.indexOf("\n") != -1) {
            var nmsg = msg.split("\n");
            for (var i = 0; i < nmsg.length; i++) {
              serverconsole.errmessage(nmsg[i]);
            }
            return;
          }
          console.log("\x1b[31mSERVER RESPONSE ERROR MESSAGE [Request Id: " + reqId + "]: " + msg + "\x1b[37m\x1b[0m");
          LOG("SERVER RESPONSE ERROR MESSAGE [Request Id: " + reqId + "]: " + msg);
          return;
        },
        locerrmessage: function (msg) {
          if (msg.indexOf("\n") != -1) {
            var nmsg = msg.split("\n");
            for (var i = 0; i < nmsg.length; i++) {
              serverconsole.locerrmessage(nmsg[i]);
            }
            return;
          }
          console.log("\x1b[41mSERVER ERROR MESSAGE [Request Id: " + reqId + "]: " + msg + "\x1b[40m\x1b[0m");
          LOG("SERVER ERROR MESSAGE [Request Id: " + reqId + "]: " + msg);
          return;
        },
        locwarnmessage: function (msg) {
          if (msg.indexOf("\n") != -1) {
            var nmsg = msg.split("\n");
            for (var i = 0; i < nmsg.length; i++) {
              serverconsole.locwarnmessage(nmsg[i]);
            }
            return;
          }
          console.log("\x1b[43mSERVER WARNING MESSAGE [Request Id: " + reqId + "]: " + msg + "\x1b[40m\x1b[0m");
          LOG("SERVER WARNING MESSAGE [Request Id: " + reqId + "]: " + msg);
          return;
        },
        locmessage: function (msg) {
          if (msg.indexOf("\n") != -1) {
            var nmsg = msg.split("\n");
            for (var i = 0; i < nmsg.length; i++) {
              serverconsole.locmessage(nmsg[i]);
            }
            return;
          }
          console.log("SERVER MESSAGE [Request Id: " + reqId + "]: " + msg);
          LOG("SERVER MESSAGE [Request Id: " + reqId + "]: " + msg);
          return;
        }
      };
      socket.on("close", function (hasError) {
        if (!hasError) serverconsole.locmessage("Client disconnected.");
        else serverconsole.locmessage("Client disconnected due to error.");
      });
      socket.on("error", function () {});
      var reqip = socket.remoteAddress;
      var reqport = socket.remotePort;
      serverconsole.locmessage("Somebody connected to port " + port + "...");
      serverconsole.reqmessage("Client " + ((!reqip || reqip == "") ? "[unknown client]" : (reqip + ((reqport && reqport !== 0) && reqport != "" ? ":" + reqport : ""))) + " wants to proxy " + request.url + " through this server");
      if (request.headers["user-agent"] != undefined) serverconsole.reqmessage("Client uses " + request.headers["user-agent"]);
      serverconsole.errmessage("This server will never be a proxy.");
      if (!socket.destroyed) socket.end("HTTP/1.1 501 Not Implemented\n\n");
    });
    server2.on("clientError", function (err, socket) {
      reqerrhandler(err, socket, false);
    });
    server2.on("checkExpectation", redirhandler);
  } else {
    server2.on("request", function (req, res) {
      reqhandler(req, res, false);
    });
    server2.on("checkExpectation", reqhandler);
    server2.on("connect", connhandler);
    server2.on("clientError", function (err, socket) {
      reqerrhandler(err, socket, false);
    });

  }
  server2.on("error", function (err) {
    if (err.code == "EADDRINUSE" || err.code == "EADDRNOTAVAIL" || err.code == "EACCES") {
      attmtsRedir--;
      if (cluster.isPrimary === undefined) {
        if (err.code == "EADDRINUSE") {
          serverconsole.locerrmessage("Address in use by another process.");
        } else if (err.code == "EADDRNOTAVAIL") {
          serverconsole.locerrmessage("Address not available.");
        } else if (err.code == "EACCES") {
          serverconsole.locerrmessage("Access denied.");
        }
        serverconsole.locmessage(attmtsRedir + " attempts left.");
      } else {
        process.send("\x12ERRLIST" + attmtsRedir + err.code);
      }
      if (attmtsRedir > 0) {
        server2.close();
        setTimeout(start, 900);
      } else {
        if (cluster.isPrimary !== undefined) process.send("\x12" + err.code);
        process.exit(errors[err.code]);
      }
    } else {
      serverconsole.locerrmessage("There was a problem starting SVR.JS!!!");
      serverconsole.locerrmessage("Stack:");
      serverconsole.locerrmessage(generateErrorStack(err));
      if (cluster.isPrimary !== undefined) process.send("\x12CRASH");
      process.exit(err.code ? errors[err.code] : 1);
    }
  });

  server2.once("listening", function () {
    listeningMessage();
  });

  if (configJSON.enableHTTP2 == true) {
    if (secure) {
      server = http2.createSecureServer({
        allowHTTP1: true,
        requireHostHeader: false,
        key: key,
        cert: cert
      });
    } else {
      server = http2.createServer({
        allowHTTP1: true,
        requireHostHeader: false
      });
    }
  } else {
    if (secure) {
      server = https.createServer({
        key: key,
        cert: cert,
        requireHostHeader: false
      });
    } else {
      try {
        server = http.createServer({
          requireHostHeader: false
        });
      } catch (ex) {
        server = http.createServer();
      }
    }
  }
  if (secure) {
    for (var i = 0; i < sniCredentials.length; i++) {
      server.addContext(sniCredentials[i].name, {
        cert: sniCredentials[i].cert,
        key: sniCredentials[i].key
      });
    }
  }
  server.on("request", reqhandler);
  server.on("checkExpectation", reqhandler);
  server.on("connect", connhandler);
  server.on("clientError", reqerrhandler);

  if (secure) {
    server.prependListener("connection", function (sock) {
      sock.reallyDestroy = sock.destroy;
      sock.destroy = function () {
        sock.toDestroy = true;
      };
    });

    server.prependListener("tlsClientError", function (err, sock) {
      if (err.code == "ERR_SSL_HTTP_REQUEST" || err.message.indexOf("http request") != -1) {
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
          } catch (ex) {
            //Socket is probably already destroyed.
          }
        };
      } else {
        sock._parent.destroy = sock._parent.reallyDestroy;
        try {
          if (sock._parent.toDestroy) sock._parent.destroy();
        } catch (ex) {
          //Socket is probably already destroyed.
        }
      }
    });

    server.prependListener("secureConnection", function (sock) {
      sock._parent.destroy = sock._parent.reallyDestroy;
      delete sock._parent.reallyDestroy;
    });

    if (configJSON.enableOCSPStapling && !ocsp._errored) {
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
    }
  }

  //Patches from Node.JS v18.0.0
  if (server.requestTimeout !== undefined && server.requestTimeout === 0) server.requestTimeout = 300000;
  if (server2.requestTimeout !== undefined && server2.requestTimeout === 0) server2.requestTimeout = 300000;

  function redirhandler(req, res) {
    if (req.headers["force-insecure"] == "true" || req.headers["x-force-insecure"] == "true" || req.headers["x-svr-js-force-insecure"] == "true") {
      reqhandler(req, res, false);
    } else {
      var reqIdInt = Math.round(Math.random() * 16777216);
      var reqId = "0".repeat(6 - reqIdInt.toString(16).length) + reqIdInt.toString(16);
      var serverconsole = {
        climessage: function (msg) {
          if (msg.indexOf("\n") != -1) {
            var nmsg = msg.split("\n");
            for (var i = 0; i < nmsg.length; i++) {
              serverconsole.climessage(nmsg[i]);
            }
            return;
          }
          console.log("SERVER CLI MESSAGE [Request Id: " + reqId + "]: " + msg);
          LOG("SERVER CLI MESSAGE [Request Id: " + reqId + "]: " + msg);
          return;
        },
        reqmessage: function (msg) {
          if (msg.indexOf("\n") != -1) {
            var nmsg = msg.split("\n");
            for (var i = 0; i < nmsg.length; i++) {
              serverconsole.reqmessage(nmsg[i]);
            }
            return;
          }
          console.log("\x1b[34mSERVER REQUEST MESSAGE [Request Id: " + reqId + "]: " + msg + "\x1b[37m\x1b[0m");
          LOG("SERVER REQUEST MESSAGE [Request Id: " + reqId + "]: " + msg);
          return;
        },
        resmessage: function (msg) {
          if (msg.indexOf("\n") != -1) {
            var nmsg = msg.split("\n");
            for (var i = 0; i < nmsg.length; i++) {
              serverconsole.resmessage(nmsg[i]);
            }
            return;
          }
          console.log("\x1b[32mSERVER RESPONSE MESSAGE [Request Id: " + reqId + "]: " + msg + "\x1b[37m\x1b[0m");
          LOG("SERVER RESPONSE MESSAGE [Request Id: " + reqId + "]: " + msg);
          return;
        },
        errmessage: function (msg) {
          if (msg.indexOf("\n") != -1) {
            var nmsg = msg.split("\n");
            for (var i = 0; i < nmsg.length; i++) {
              serverconsole.errmessage(nmsg[i]);
            }
            return;
          }
          console.log("\x1b[31mSERVER RESPONSE ERROR MESSAGE [Request Id: " + reqId + "]: " + msg + "\x1b[37m\x1b[0m");
          LOG("SERVER RESPONSE ERROR MESSAGE [Request Id: " + reqId + "]: " + msg);
          return;
        },
        locerrmessage: function (msg) {
          if (msg.indexOf("\n") != -1) {
            var nmsg = msg.split("\n");
            for (var i = 0; i < nmsg.length; i++) {
              serverconsole.locerrmessage(nmsg[i]);
            }
            return;
          }
          console.log("\x1b[41mSERVER ERROR MESSAGE [Request Id: " + reqId + "]: " + msg + "\x1b[40m\x1b[0m");
          LOG("SERVER ERROR MESSAGE [Request Id: " + reqId + "]: " + msg);
          return;
        },
        locwarnmessage: function (msg) {
          if (msg.indexOf("\n") != -1) {
            var nmsg = msg.split("\n");
            for (var i = 0; i < nmsg.length; i++) {
              serverconsole.locwarnmessage(nmsg[i]);
            }
            return;
          }
          console.log("\x1b[43mSERVER WARNING MESSAGE [Request Id: " + reqId + "]: " + msg + "\x1b[40m\x1b[0m");
          LOG("SERVER WARNING MESSAGE [Request Id: " + reqId + "]: " + msg);
          return;
        },
        locmessage: function (msg) {
          if (msg.indexOf("\n") != -1) {
            var nmsg = msg.split("\n");
            for (var i = 0; i < nmsg.length; i++) {
              serverconsole.locmessage(nmsg[i]);
            }
            return;
          }
          console.log("SERVER MESSAGE [Request Id: " + reqId + "]: " + msg);
          LOG("SERVER MESSAGE [Request Id: " + reqId + "]: " + msg);
          return;
        }
      };

      function getCustomHeaders() {
        var ph = JSON.parse(JSON.stringify(customHeaders));
        var phk = Object.keys(ph);
        for (var i = 0; i < phk.length; i++) {
          if (typeof ph[phk[i]] == "string") ph[phk[i]] = ph[phk[i]].replace(/\{path\}/g, req.url);
        }
        return ph;
      }
      if (req.headers["x-svr-js-from-main-thread"] == "true") {
        res.writeHead(204, "No Content", getCustomHeaders());
        res.end();
        return;
      }
      
      req.url = fixNodeMojibakeURL(req.url);
      
      res.writeHeadNative = res.writeHead;
      res.writeHead = function (a, b, c) {
        if (parseInt(a) >= 400 && parseInt(a) <= 599) {
          serverconsole.errmessage("Server responded with " + a.toString() + " code.");
        } else {
          serverconsole.resmessage("Server responded with " + a.toString() + " code.");
        }
        res.writeHeadNative(a, b, c);
      };
      var finished = false;
      res.on("finish", function () {
        if (!finished) {
          finished = true;
          serverconsole.locmessage("Client disconnected.");
        }
      });
      res.on("close", function () {
        if (!finished) {
          finished = true;
          serverconsole.locmessage("Client disconnected.");
        }
      });

      serverconsole.locmessage("Somebody connected to port " + port + "...");

      if (req.socket == null) {
        serverconsole.errmessage("Client socket is null!!!");
        return;
      }

      var isProxy = false;
      if (req.url.indexOf("/") != 0 && req.url != "*") isProxy = true;

      var head = fs.existsSync("./.head") ? fs.readFileSync("./.head").toString() : (fs.existsSync("./head.html") ? fs.readFileSync("./head.html").toString() : ""); // header
      var foot = fs.existsSync("./.foot") ? fs.readFileSync("./.foot").toString() : (fs.existsSync("./foot.html") ? fs.readFileSync("./foot.html").toString() : ""); // footer
      var fd = "";

      function responseEnd(d) {
        if (d === undefined) d = fd;
        res.write(head + d + foot);
        res.end();
      }

      //Error descriptions
      var serverErrorDescs = {
        400: "The request you made is invalid.",
        417: "Expectation in Expect property couldn't be satisfied.",
        500: "The server had an unexpected error. Below, the error stack is shown: </p><code>{stack}</code><p>Please contact with developer/administrator at <i>{contact}</i>.",
        501: "The request requires use of a function, which isn't currently implemented by the server."
      };

      //Server error calling method
      function callServerError(errorCode, extName, stack, ch) {
        var errorFile = errorCode.toString() + ".html";
        var errorFile2 = "." + errorCode.toString();
        if (fs.existsSync(errorFile2)) errorFile = errorFile2;
        if (errorCode == 404 && fs.existsSync(page404)) errorFile = page404;
        if (Object.prototype.toString.call(stack) === "[object Error]") stack = generateErrorStack(stack);
        if (stack === undefined) stack = generateErrorStack(new Error("Unknown error"));
        if (errorCode == 500 || errorCode == 502) {
          serverconsole.errmessage("There was an error while processing the request!");
          serverconsole.errmessage("Stack:");
          serverconsole.errmessage(stack);
        }
        if (stackHidden) stack = "[error stack hidden]";
        if (serverErrorDescs[errorCode] === undefined) {
          callServerError(501, extName, stack);
        } else {
          var cheaders = getCustomHeaders();
          if (ch) {
            var chon = Object.keys(cheaders);
            var chn = Object.keys(ch);
            for (var i = 0; i < chn.length; i++) {
              var nhn = chn[i];
              for (var j = 0; j < chon.length; j++) {
                if (chon[j].toLowerCase() == chn[i].toLowerCase()) {
                  nhn = chon[j];
                  break;
                }
              }
              if (ch[chn[i]]) cheaders[nhn] = ch[chn[i]];
            }
          }
          cheaders["Content-Type"] = "text/html; charset=utf-8";
          if (errorCode == 405 && !cheaders["Allow"]) cheaders["Allow"] = "GET, POST, HEAD, OPTIONS";
          fs.readFile(errorFile, function (err, data) {
            try {
              if (err) throw err;
              res.writeHead(errorCode, http.STATUS_CODES[errorCode], cheaders);
              fd += data.toString().replace(/{errorMessage}/g, errorCode.toString() + " " + http.STATUS_CODES[errorCode]).replace(/{errorDesc}/g, serverErrorDescs[errorCode]).replace(/{stack}/g, stack.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\r\n/g, "<br/>").replace(/\n/g, "<br/>").replace(/\r/g, "<br/>").replace(/ {2}/g, "&nbsp;&nbsp;")).replace(/{path}/g, req.url.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")).replace(/{server}/g, "" + (exposeServerVersion ? "SVR.JS/" + version + " (" + getOS() + "; " + (process.isBun ? ("Bun/v" + process.versions.bun + "; like Node.JS/" + process.version) : ("Node.JS/" + process.version)) + ")" : "SVR.JS") + (extName == undefined ? "" : " " + extName) + ((req.headers.host == undefined || isProxy) ? "" : " on " + String(req.headers.host).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"))).replace(/{contact}/g, serverAdmin.replace(/\./g, "[dot]").replace(/@/g, "[at]"));
              responseEnd();
            } catch (ex) {
              var additionalError = 500;
              if (ex.code == "ENOENT") {
                additionalError = 404;
              } else if (ex.code == "ENOTDIR") {
                additionalError = 404;
              } else if (ex.code == "EACCES") {
                additionalError = 403;
              } else if (ex.code == "ENAMETOOLONG") {
                additionalError = 414;
              } else if (ex.code == "EMFILE") {
                additionalError = 503;
              } else if (ex.code == "ELOOP") {
                additionalError = 508;
              }
              res.writeHead(errorCode, http.STATUS_CODES[errorCode], cheaders);
              res.write(("<html><head><title>{errorMessage}</title><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" /></head><body><h1>{errorMessage}</h1><p>{errorDesc}</p>" + ((additionalError == 404) ? "" : "<p>Additionally, a {additionalError} error occurred while loading an error page.</p>") + "<p><i>{server}</i></p></body></html>").replace(/{errorMessage}/g, errorCode.toString() + " " + http.STATUS_CODES[errorCode]).replace(/{errorDesc}/g, serverErrorDescs[errorCode]).replace(/{stack}/g, stack.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\r\n/g, "<br/>").replace(/\n/g, "<br/>").replace(/\r/g, "<br/>").replace(/ {2}/g, "&nbsp;&nbsp;")).replace(/{path}/g, req.url.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")).replace(/{server}/g, "" + (exposeServerVersion ? "SVR.JS/" + version + " (" + getOS() + "; " + (process.isBun ? ("Bun/v" + process.versions.bun + "; like Node.JS/" + process.version) : ("Node.JS/" + process.version)) + ")" : "SVR.JS") + (extName == undefined ? "" : " " + extName) + ((req.headers.host == undefined || isProxy) ? "" : " on " + String(req.headers.host).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"))).replace(/{contact}/g, serverAdmin.replace(/\./g, "[dot]").replace(/@/g, "[at]")).replace(/{additionalError}/g, additionalError.toString()));
              res.end();
            }
          });

        }
      }

      var reqport = "";
      var reqip = "";
      var oldport = "";
      var oldip = "";
      if (req.headers["x-svr-js-client"] != undefined && enableIPSpoofing) {
        var kl = req.headers["x-svr-js-client"].split(":");
        reqport = kl.pop();
        reqip = kl.join(":");
        try {
          oldport = req.socket.remotePort;
          oldip = req.socket.remoteAddress;
          req.socket.realRemotePort = reqport;
          req.socket.realRemoteAddress = reqip;
          req.socket.originalRemotePort = oldport;
          req.socket.originalRemoteAddress = oldip;
          res.socket.realRemotePort = reqport;
          res.socket.realRemoteAddress = reqip;
          res.socket.originalRemotePort = oldport;
          res.socket.originalRemoteAddress = oldip;
        } catch (ex) {
          //Nevermind...
        }
      } else if (req.headers["x-forwarded-for"] != undefined && enableIPSpoofing) {
        reqport = null;
        reqip = req.headers["x-forwarded-for"].split(",")[0].replace(/ /g, "");
        if (reqip.indexOf(":") == -1) reqip = "::ffff:" + reqip;
        try {
          oldport = req.socket.remotePort;
          oldip = req.socket.remoteAddress;
          req.socket.realRemotePort = reqport;
          req.socket.realRemoteAddress = reqip;
          req.socket.originalRemotePort = oldport;
          req.socket.originalRemoteAddress = oldip;
          res.socket.realRemotePort = reqport;
          res.socket.realRemoteAddress = reqip;
          res.socket.originalRemotePort = oldport;
          res.socket.originalRemoteAddress = oldip;
        } catch (ex) {
          //Nevermind...
        }
      } else {
        reqip = req.socket.remoteAddress;
        reqport = req.socket.remotePort;
      }

      if (!isProxy) serverconsole.reqmessage("Client " + ((!reqip || reqip == "") ? "[unknown client]" : (reqip + ((reqport && reqport !== 0) && reqport != "" ? ":" + reqport : ""))) + " wants " + (req.method == "GET" ? "content in " : (req.method == "POST" ? "to post content in " : (req.method == "PUT" ? "to add content in " : (req.method == "DELETE" ? "to delete content in " : (req.method == "PATCH" ? "to patch content in " : "to access content using " + req.method + " method in "))))) + (req.headers.host == undefined ? "" : req.headers.host) + req.url);
      else serverconsole.reqmessage("Client " + ((!reqip || reqip == "") ? "[unknown client]" : (reqip + ((reqport && reqport !== 0) && reqport != "" ? ":" + reqport : ""))) + " wants " + (req.method == "GET" ? "content in " : (req.method == "POST" ? "to post content in " : (req.method == "PUT" ? "to add content in " : (req.method == "DELETE" ? "to delete content in " : (req.method == "PATCH" ? "to patch content in " : "to access content using " + req.method + " method in "))))) + req.url);
      if (req.headers["user-agent"] != undefined) serverconsole.reqmessage("Client uses " + req.headers["user-agent"]);

      try {
        if (req.headers["expect"] && req.headers["expect"] != "100-continue") {
          serverconsole.errmessage("Expectation not satified!");
          callServerError(417);
          return;
        }
        var hostx = req.headers.host;
        if (hostx === undefined) {
          serverconsole.errmessage("Bad request!");
          callServerError(400);
          return;
        }

        if (req.method == "CONNECT") {
          callServerError(501);
          serverconsole.errmessage("CONNECT requests aren't supported. Your JS runtime probably doesn't support 'connect' handler for HTTP library.");
          return;
        }

        if (isProxy) {
          callServerError(501);
          serverconsole.errmessage("This server will never be a proxy.");
          return;
        }

        function urlParse(uri) {
          if (typeof URL != "undefined" && url.Url) {
            try {
              var uobject = new URL(uri, "http" + (req.socket.encrypted ? "s" : "") + "://" + (req.headers.host ? req.headers.host : (domain ? domain : "unknown.invalid")));
              var nuobject = new url.Url();
              if (uri.indexOf("/") != -1) nuobject.slashes = true;
              if (uobject.protocol != "") nuobject.protocol = uobject.protocol;
              if (uobject.username != "" && uobject.password != "") nuobject.auth = uobject.username + ":" + uobject.password;
              if (uobject.host != "") nuobject.host = uobject.host;
              if (uobject.hostname != "") nuobject.hostname = uobject.hostname;
              if (uobject.port != "") nuobject.port = uobject.port;
              if (uobject.pathname != "") nuobject.pathname = uobject.pathname;
              if (uobject.search != "") nuobject.search = uobject.search;
              if (uobject.hash != "") nuobject.hash = uobject.hash;
              if (uobject.href != "") nuobject.href = uobject.href;
              if (uri.indexOf("/") != 0) {
                if (nuobject.pathname) {
                  nuobject.pathname = nuobject.pathname.substr(1);
                  nuobject.href = nuobject.pathname + (nuobject.search ? nuobject.search : "");
                }
              }
              if (nuobject.pathname) {
                nuobject.path = nuobject.pathname + (nuobject.search ? nuobject.search : "");
              }
              //if(nuobject.path != "" && uobject.password != "") nuobject.path = nuobject.pathname + nuobject.href;
              nuobject.query = {};
              uobject.searchParams.forEach(function (value, key) {
                nuobject.query[key] = value;
              });
              return nuobject;
            } catch (ex) {
              return url.parse(uri, true);
            }
          } else {
            return url.parse(uri, true);
          }
        }
        var urlp = urlParse("http://" + hostx);
        try {
          if (urlp.path.indexOf("//") == 0) {
            urlp = urlParse("http:" + url.path);
          }
        } catch (ex) {
          //URL parse error...
        }
        if (urlp.host == "localhost" || urlp.host == "localhost:" + port.toString() || urlp.host == "127.0.0.1" || urlp.host == "127.0.0.1:" + port.toString() || urlp.host == "::1" || urlp.host == "::1:" + port.toString()) {
          urlp.protocol = "https:";
          if (sport == 443) {
            urlp.host = urlp.hostname;
          } else {
            urlp.host = urlp.hostname + ":" + sport.toString();
            urlp.port = sport.toString();
          }
        } else if (urlp.host == host || urlp.host == host + ":" + port.toString()) {
          urlp.protocol = "https:";
          if (sport == 443) {
            urlp.host = urlp.hostname;
          } else {
            urlp.host = urlp.hostname + ":" + sport.toString();
            urlp.port = sport.toString();
          }
        } else if (urlp.host == pubip || urlp.host == pubip + ":" + pubport.toString()) {
          urlp.protocol = "https:";
          if (spubport == 443) {
            urlp.host = urlp.hostname;
          } else {
            urlp.host = urlp.hostname + ":" + spubport.toString();
            urlp.port = spubport.toString();
          }
        } else if (urlp.hostname == domain || urlp.hostname.indexOf(domain) != -1) {
          urlp.protocol = "https:";
          if (spubport == 443) {
            urlp.host = urlp.hostname;
          } else {
            urlp.host = urlp.hostname + ":" + spubport.toString();
            urlp.port = spubport.toString();
          }
        } else {
          urlp.protocol = "https:";
        }
        urlp.path = null;
        urlp.pathname = null;
        var lloc = url.format(urlp);
        var requestURL = req.url;
        try {
          if (requestURL.split("/")[1].indexOf(".onion") != -1) {
            requestURL = requestURL.split("/");
            requestURL.shift();
            requestURL.shift();
            requestURL.unshift("");
            requestURL = requestURL.join("/");
          }
        } catch (ex) {
          //Leave URL as it is...
        }
        var rheaders = getCustomHeaders();
        rheaders["Location"] = lloc + requestURL;
        res.writeHead(301, "Redirect to HTTPS", rheaders);
        res.end();
      } catch (ex) {
        serverconsole.errmessage("There was an error while processing the request!");
        serverconsole.errmessage("Stack:");
        serverconsole.errmessage(generateErrorStack(ex));
        callServerError(500, undefined, generateErrorStack(ex));
      }

    }
  }

  function reqerrhandler(err, socket, fromMain) {
    if (fromMain === undefined) fromMain = true;
    //Define response object similar to Node.JS native one
    var res = {};
    res.socket = socket;
    res.write = function (x) {
      if (err.code === "ECONNRESET" || !socket.writable) {
        return;
      }
      socket.write(x);
    };
    res.end = function (x) {
      if (err.code === "ECONNRESET" || !socket.writable) {
        return;
      }
      socket.end(x, function () {
        try {
          socket.destroy();
        } catch (ex) {
          //Socket is probably already destroyed
        }
      });
    };
    res.writeHead = function (code, name, headers) {
      var head = ("HTTP/1.1 " + code.toString() + " " + name + "\r\n");
      var headers = JSON.parse(JSON.stringify(headers));
      headers["Date"] = (new Date()).toGMTString();
      headers["Connection"] = "close";
      var headernames = Object.keys(headers);
      for (var i = 0; i < headernames.length; i++) {
        if (headernames[i].toLowerCase() == "set-cookie") {
          for (var j = 0; j < headers[headernames[i]]; j++) {
            if (headernames[i].match(/[^\x09\x20-\x7e\x80-\xff]|.:/) || headers[headernames[i]][j].match(/[^\x09\x20-\x7e\x80-\xff]/)) throw new Error("Invalid header!!! (" + headernames[i] + ")");
            head += (headernames[i] + ": " + headers[headernames[i]][j]);
          }
        } else {
          if (headernames[i].match(/[^\x09\x20-\x7e\x80-\xff]|.:/) || headers[headernames[i]].match(/[^\x09\x20-\x7e\x80-\xff]/)) throw new Error("Invalid header!!! (" + headernames[i] + ")");
          head += (headernames[i] + ": " + headers[headernames[i]]);
        }
        head += "\r\n";
      }
      head += ("\r\n");
      res.write(head);
    };

    var reqIdInt = Math.round(Math.random() * 16777216);
    var reqId = "0".repeat(6 - reqIdInt.toString(16).length) + reqIdInt.toString(16);
    var serverconsole = {
      climessage: function (msg) {
        if (msg.indexOf("\n") != -1) {
          var nmsg = msg.split("\n");
          for (var i = 0; i < nmsg.length; i++) {
            serverconsole.climessage(nmsg[i]);
          }
          return;
        }
        console.log("SERVER CLI MESSAGE [Request Id: " + reqId + "]: " + msg);
        LOG("SERVER CLI MESSAGE [Request Id: " + reqId + "]: " + msg);
        return;
      },
      reqmessage: function (msg) {
        if (msg.indexOf("\n") != -1) {
          var nmsg = msg.split("\n");
          for (var i = 0; i < nmsg.length; i++) {
            serverconsole.reqmessage(nmsg[i]);
          }
          return;
        }
        console.log("\x1b[34mSERVER REQUEST MESSAGE [Request Id: " + reqId + "]: " + msg + "\x1b[37m\x1b[0m");
        LOG("SERVER REQUEST MESSAGE [Request Id: " + reqId + "]: " + msg);
        return;
      },
      resmessage: function (msg) {
        if (msg.indexOf("\n") != -1) {
          var nmsg = msg.split("\n");
          for (var i = 0; i < nmsg.length; i++) {
            serverconsole.resmessage(nmsg[i]);
          }
          return;
        }
        console.log("\x1b[32mSERVER RESPONSE MESSAGE [Request Id: " + reqId + "]: " + msg + "\x1b[37m\x1b[0m");
        LOG("SERVER RESPONSE MESSAGE [Request Id: " + reqId + "]: " + msg);
        return;
      },
      errmessage: function (msg) {
        if (msg.indexOf("\n") != -1) {
          var nmsg = msg.split("\n");
          for (var i = 0; i < nmsg.length; i++) {
            serverconsole.errmessage(nmsg[i]);
          }
          return;
        }
        console.log("\x1b[31mSERVER RESPONSE ERROR MESSAGE [Request Id: " + reqId + "]: " + msg + "\x1b[37m\x1b[0m");
        LOG("SERVER RESPONSE ERROR MESSAGE [Request Id: " + reqId + "]: " + msg);
        return;
      },
      locerrmessage: function (msg) {
        if (msg.indexOf("\n") != -1) {
          var nmsg = msg.split("\n");
          for (var i = 0; i < nmsg.length; i++) {
            serverconsole.locerrmessage(nmsg[i]);
          }
          return;
        }
        console.log("\x1b[41mSERVER ERROR MESSAGE [Request Id: " + reqId + "]: " + msg + "\x1b[40m\x1b[0m");
        LOG("SERVER ERROR MESSAGE [Request Id: " + reqId + "]: " + msg);
        return;
      },
      locwarnmessage: function (msg) {
        if (msg.indexOf("\n") != -1) {
          var nmsg = msg.split("\n");
          for (var i = 0; i < nmsg.length; i++) {
            serverconsole.locwarnmessage(nmsg[i]);
          }
          return;
        }
        console.log("\x1b[43mSERVER WARNING MESSAGE [Request Id: " + reqId + "]: " + msg + "\x1b[40m\x1b[0m");
        LOG("SERVER WARNING MESSAGE [Request Id: " + reqId + "]: " + msg);
        return;
      },
      locmessage: function (msg) {
        if (msg.indexOf("\n") != -1) {
          var nmsg = msg.split("\n");
          for (var i = 0; i < nmsg.length; i++) {
            serverconsole.locmessage(nmsg[i]);
          }
          return;
        }
        console.log("SERVER MESSAGE [Request Id: " + reqId + "]: " + msg);
        LOG("SERVER MESSAGE [Request Id: " + reqId + "]: " + msg);
        return;
      }
    };
    socket.on("close", function (hasError) {
      if (!hasError || err.code == "ERR_SSL_HTTP_REQUEST" || err.message.indexOf("http request") != -1) serverconsole.locmessage("Client disconnected.");
      else serverconsole.locmessage("Client disconnected due to error.");
    });
    socket.on("error", function () {});

    var head = fs.existsSync("./.head") ? fs.readFileSync("./.head").toString() : (fs.existsSync("./head.html") ? fs.readFileSync("./head.html").toString() : ""); // header
    var foot = fs.existsSync("./.foot") ? fs.readFileSync("./.foot").toString() : (fs.existsSync("./foot.html") ? fs.readFileSync("./foot.html").toString() : ""); // footer

    var fd = "";

    function responseEnd(d) {
      if (d === undefined) d = fd;
      res.write(head + d + foot);
      res.end();
    }

    var serverErrorDescs = {
      400: "The request you made is invalid.",
      405: "Method used to access the requested file isn't allowed.",
      408: "You have timed out.",
      414: "URL you sent is too long.",
      431: "The request you sent contains headers, that are too large.",
      451: "The requested file isn't accessible for legal reasons.",
      497: "You sent non-TLS request to the HTTPS server."
    };

    //Server error calling method
    function callServerError(errorCode, extName, stack, ch) {
      var errorFile = errorCode.toString() + ".html";
      var errorFile2 = "." + errorCode.toString();
      if (fs.existsSync(errorFile2)) errorFile = errorFile2;
      if (errorCode == 404 && fs.existsSync(page404)) errorFile = page404;
      if (Object.prototype.toString.call(stack) === "[object Error]") stack = generateErrorStack(stack);
      if (stack === undefined) stack = generateErrorStack(new Error("Unknown error"));
      if (errorCode == 500 || errorCode == 502) {
        serverconsole.errmessage("There was an error while processing the request!");
        serverconsole.errmessage("Stack:");
        serverconsole.errmessage(stack);
      }
      if (stackHidden) stack = "[error stack hidden]";
      if (serverErrorDescs[errorCode] === undefined) {
        callServerError(501, extName, stack);
      } else {
        var cheaders = getCustomHeaders();
        if (ch) {
          var chon = Object.keys(cheaders);
          var chn = Object.keys(ch);
          for (var i = 0; i < chn.length; i++) {
            var nhn = chn[i];
            for (var j = 0; j < chon.length; j++) {
              if (chon[j].toLowerCase() == chn[i].toLowerCase()) {
                nhn = chon[j];
                break;
              }
            }
            if (ch[chn[i]]) cheaders[nhn] = ch[chn[i]];
          }
        }
        cheaders["Content-Type"] = "text/html; charset=utf-8";
        if (errorCode == 405 && !cheaders["Allow"]) cheaders["Allow"] = "GET, POST, HEAD, OPTIONS";
        fs.readFile(errorFile, function (err, data) {
          try {
            if (err) throw err;
            res.writeHead(errorCode, http.STATUS_CODES[errorCode], cheaders);
            fd += data.toString().replace(/{errorMessage}/g, errorCode.toString() + " " + http.STATUS_CODES[errorCode]).replace(/{errorDesc}/g, serverErrorDescs[errorCode]).replace(/{stack}/g, stack.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\r\n/g, "<br/>").replace(/\n/g, "<br/>").replace(/\r/g, "<br/>").replace(/ {2}/g, "&nbsp;&nbsp;")).replace(/{server}/g, "" + (exposeServerVersion ? "SVR.JS/" + version + " (" + getOS() + "; " + (process.isBun ? ("Bun/v" + process.versions.bun + "; like Node.JS/" + process.version) : ("Node.JS/" + process.version)) + ")" : "SVR.JS") + (extName == undefined ? "" : " " + extName)).replace(/{contact}/g, serverAdmin.replace(/\./g, "[dot]").replace(/@/g, "[at]"));
            responseEnd();
          } catch (ex) {
            var additionalError = 500;
            if (ex.code == "ENOENT") {
              additionalError = 404;
            } else if (ex.code == "ENOTDIR") {
              additionalError = 404;
            } else if (ex.code == "EACCES") {
              additionalError = 403;
            } else if (ex.code == "ENAMETOOLONG") {
              additionalError = 414;
            } else if (ex.code == "EMFILE") {
              additionalError = 503;
            } else if (ex.code == "ELOOP") {
              additionalError = 508;
            }
            res.writeHead(errorCode, http.STATUS_CODES[errorCode], cheaders);
            res.write(("<html><head><title>{errorMessage}</title><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" /></head><body><h1>{errorMessage}</h1><p>{errorDesc}</p>" + ((additionalError == 404) ? "" : "<p>Additionally, a {additionalError} error occurred while loading an error page.</p>") + "<p><i>{server}</i></p></body></html>").replace(/{errorMessage}/g, errorCode.toString() + " " + http.STATUS_CODES[errorCode]).replace(/{errorDesc}/g, serverErrorDescs[errorCode]).replace(/{stack}/g, stack.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\r\n/g, "<br/>").replace(/\n/g, "<br/>").replace(/\r/g, "<br/>").replace(/ {2}/g, "&nbsp;&nbsp;")).replace(/{server}/g, "" + (exposeServerVersion ? "SVR.JS/" + version + " (" + getOS() + "; " + (process.isBun ? ("Bun/v" + process.versions.bun + "; like Node.JS/" + process.version) : ("Node.JS/" + process.version)) + ")" : "SVR.JS") + (extName == undefined ? "" : " " + extName)).replace(/{contact}/g, serverAdmin.replace(/\./g, "[dot]").replace(/@/g, "[at]")).replace(/{additionalError}/g, additionalError.toString()));
            res.end();
          }
        });

      }
    }
    var reqip = socket.remoteAddress;
    var reqport = socket.remotePort;
    serverconsole.locmessage("Somebody connected to port " + (secure && fromMain ? sport : port) + "...");
    serverconsole.reqmessage("Client " + ((!reqip || reqip == "") ? "[unknown client]" : (reqip + ((reqport && reqport !== 0) && reqport != "" ? ":" + reqport : ""))) + " sent invalid request.");
    try {
      if ((err.code && (err.code.indexOf("ERR_SSL_") == 0 || err.code.indexOf("ERR_TLS_") == 0)) || (!err.code && err.message.indexOf("SSL routines") != -1)) {
        if (err.code == "ERR_SSL_HTTP_REQUEST" || err.message.indexOf("http request") != -1) {
          serverconsole.errmessage("Client sent HTTP request to HTTPS port.");
          callServerError(497);
          return;
        } else {
          serverconsole.errmessage("An SSL error occured: " + (err.code ? err.code : err.message));
          callServerError(400);
          return;
        }
      }

      if (err.code && err.code == "ERR_HTTP_REQUEST_TIMEOUT") {
        serverconsole.errmessage("Client timed out.");
        callServerError(408);
        return;
      }

      if (!err.rawPacket) {
        serverconsole.errmessage("Connection ended prematurely.");
        callServerError(400);
        return;
      }

      var packetLines = err.rawPacket.toString().split("\r\n");
      if (packetLines.length == 0) {
        serverconsole.errmessage("Invalid request.");
        callServerError(400);
        return;
      }

      function checkHeaders(beginsFromFirst) {
        for (var i = (beginsFromFirst ? 0 : 1); i < packetLines.length; i++) {
          var header = packetLines[i];
          if (header == "") return false; //Beginning of body
          else if (header.indexOf(":") < 1) {
            serverconsole.errmessage("Invalid header.");
            callServerError(400);
            return true;
          } else if (header.length > 8192) {
            serverconsole.errmessage("Header too large.");
            callServerError(431); //Headers too large
            return true;
          }
        }
        return false;
      }
      var packetLine1 = packetLines[0].split(" ");
      var method = "GET";
      var httpVersion = "HTTP/1.1";
      if (String(packetLine1[0]).indexOf(":") > 0) {
        if (!checkHeaders(true)) {
          serverconsole.errmessage("The request is invalid.");
          callServerError(400); //Also malformed Packet
          return;
        }
      }
      if (String(packetLine1[0]).length < 50) method = packetLine1.shift();
      if (String(packetLine1[packetLine1.length - 1]).length < 50) httpVersion = packetLine1.pop();
      if (packetLine1.length != 1) {
        serverconsole.errmessage("The head of request is invalid.");
        callServerError(400); //Malformed Packet
      } else if (!httpVersion.toString().match(/^HTTP[\/]/i)) {
        serverconsole.errmessage("Invalid protocol.");
        callServerError(400); //bad protocol version
      } else if (http.METHODS.indexOf(method) == -1) {
        serverconsole.errmessage("Invalid method.");
        callServerError(405); //Also malformed Packet
      } else {
        if (checkHeaders(false)) return;
        if (packetLine1[0].length > 255) {
          serverconsole.errmessage("URI too long.");
          callServerError(414); //Also malformed Packet
        } else {
          serverconsole.errmessage("Bad request.");
          callServerError(400); //Also malformed Packet
        }
      }
    } catch (ex) {
      serverconsole.errmessage("There was an error while determining type of malformed request.");
      callServerError(400);
    }
  }

  function connhandler(request, socket, head) {
    var reqIdInt = Math.round(Math.random() * 16777216);
    var reqId = "0".repeat(6 - reqIdInt.toString(16).length) + reqIdInt.toString(16);
    var serverconsole = {
      climessage: function (msg) {
        if (msg.indexOf("\n") != -1) {
          var nmsg = msg.split("\n");
          for (var i = 0; i < nmsg.length; i++) {
            serverconsole.climessage(nmsg[i]);
          }
          return;
        }
        console.log("SERVER CLI MESSAGE [Request Id: " + reqId + "]: " + msg);
        LOG("SERVER CLI MESSAGE [Request Id: " + reqId + "]: " + msg);
        return;
      },
      reqmessage: function (msg) {
        if (msg.indexOf("\n") != -1) {
          var nmsg = msg.split("\n");
          for (var i = 0; i < nmsg.length; i++) {
            serverconsole.reqmessage(nmsg[i]);
          }
          return;
        }
        console.log("\x1b[34mSERVER REQUEST MESSAGE [Request Id: " + reqId + "]: " + msg + "\x1b[37m\x1b[0m");
        LOG("SERVER REQUEST MESSAGE [Request Id: " + reqId + "]: " + msg);
        return;
      },
      resmessage: function (msg) {
        if (msg.indexOf("\n") != -1) {
          var nmsg = msg.split("\n");
          for (var i = 0; i < nmsg.length; i++) {
            serverconsole.resmessage(nmsg[i]);
          }
          return;
        }
        console.log("\x1b[32mSERVER RESPONSE MESSAGE [Request Id: " + reqId + "]: " + msg + "\x1b[37m\x1b[0m");
        LOG("SERVER RESPONSE MESSAGE [Request Id: " + reqId + "]: " + msg);
        return;
      },
      errmessage: function (msg) {
        if (msg.indexOf("\n") != -1) {
          var nmsg = msg.split("\n");
          for (var i = 0; i < nmsg.length; i++) {
            serverconsole.errmessage(nmsg[i]);
          }
          return;
        }
        console.log("\x1b[31mSERVER RESPONSE ERROR MESSAGE [Request Id: " + reqId + "]: " + msg + "\x1b[37m\x1b[0m");
        LOG("SERVER RESPONSE ERROR MESSAGE [Request Id: " + reqId + "]: " + msg);
        return;
      },
      locerrmessage: function (msg) {
        if (msg.indexOf("\n") != -1) {
          var nmsg = msg.split("\n");
          for (var i = 0; i < nmsg.length; i++) {
            serverconsole.locerrmessage(nmsg[i]);
          }
          return;
        }
        console.log("\x1b[41mSERVER ERROR MESSAGE [Request Id: " + reqId + "]: " + msg + "\x1b[40m\x1b[0m");
        LOG("SERVER ERROR MESSAGE [Request Id: " + reqId + "]: " + msg);
        return;
      },
      locwarnmessage: function (msg) {
        if (msg.indexOf("\n") != -1) {
          var nmsg = msg.split("\n");
          for (var i = 0; i < nmsg.length; i++) {
            serverconsole.locwarnmessage(nmsg[i]);
          }
          return;
        }
        console.log("\x1b[43mSERVER WARNING MESSAGE [Request Id: " + reqId + "]: " + msg + "\x1b[40m\x1b[0m");
        LOG("SERVER WARNING MESSAGE [Request Id: " + reqId + "]: " + msg);
        return;
      },
      locmessage: function (msg) {
        if (msg.indexOf("\n") != -1) {
          var nmsg = msg.split("\n");
          for (var i = 0; i < nmsg.length; i++) {
            serverconsole.locmessage(nmsg[i]);
          }
          return;
        }
        console.log("SERVER MESSAGE [Request Id: " + reqId + "]: " + msg);
        LOG("SERVER MESSAGE [Request Id: " + reqId + "]: " + msg);
        return;
      }
    };
    var req = request;
    socket.on("close", function (hasError) {
      if (!hasError) serverconsole.locmessage("Client disconnected.");
      else serverconsole.locmessage("Client disconnected due to error.");
    });
    socket.on("error", function () {});

    var reqip = socket.remoteAddress;
    var reqport = socket.remotePort;
    serverconsole.locmessage("Somebody connected to port " + (secure ? sport : port) + "...");
    serverconsole.reqmessage("Client " + ((!reqip || reqip == "") ? "[unknown client]" : (reqip + ((reqport && reqport !== 0) && reqport != "" ? ":" + reqport : ""))) + " wants to proxy " + request.url + " through this server");
    if (request.headers["user-agent"] != undefined) serverconsole.reqmessage("Client uses " + request.headers["user-agent"]);

    function modExecute(mods, ffinals) {
      var proxyMods = [];
      for (var i = 0; i < mods.length; i++) {
        if (mods[i].proxyCallback !== undefined) proxyMods.push(mods[i]);
      }

      var modFunction = ffinals;
      for (var i = proxyMods.length - 1; i >= 0; i--) {
        modFunction = proxyMods[i].proxyCallback(req, socket, head, configJSON, serverconsole, modFunction);
      }
      modFunction();
    }

    function vres(req, socket, head, serverconsole) {
      return function () {
        serverconsole.errmessage("SVR.JS doesn't support proxy without proxy mod.");
        if (!socket.destroyed) socket.end("HTTP/1.1 501 Not Implemented\n\n");
      };
    }
    modExecute(mods, vres(req, socket, head, serverconsole));
  }

  function reqhandler(request, response, fromMain) {
    if (fromMain === undefined) fromMain = true;
    var reqIdInt = Math.round(Math.random() * 16777216);
    var reqId = "0".repeat(6 - reqIdInt.toString(16).length) + reqIdInt.toString(16);
    var serverconsole = {
      climessage: function (msg) {
        if (msg.indexOf("\n") != -1) {
          var nmsg = msg.split("\n");
          for (var i = 0; i < nmsg.length; i++) {
            serverconsole.climessage(nmsg[i]);
          }
          return;
        }
        console.log("SERVER CLI MESSAGE [Request Id: " + reqId + "]: " + msg);
        LOG("SERVER CLI MESSAGE [Request Id: " + reqId + "]: " + msg);
        return;
      },
      reqmessage: function (msg) {
        if (msg.indexOf("\n") != -1) {
          var nmsg = msg.split("\n");
          for (var i = 0; i < nmsg.length; i++) {
            serverconsole.reqmessage(nmsg[i]);
          }
          return;
        }
        console.log("\x1b[34mSERVER REQUEST MESSAGE [Request Id: " + reqId + "]: " + msg + "\x1b[37m\x1b[0m");
        LOG("SERVER REQUEST MESSAGE [Request Id: " + reqId + "]: " + msg);
        return;
      },
      resmessage: function (msg) {
        if (msg.indexOf("\n") != -1) {
          var nmsg = msg.split("\n");
          for (var i = 0; i < nmsg.length; i++) {
            serverconsole.resmessage(nmsg[i]);
          }
          return;
        }
        console.log("\x1b[32mSERVER RESPONSE MESSAGE [Request Id: " + reqId + "]: " + msg + "\x1b[37m\x1b[0m");
        LOG("SERVER RESPONSE MESSAGE [Request Id: " + reqId + "]: " + msg);
        return;
      },
      errmessage: function (msg) {
        if (msg.indexOf("\n") != -1) {
          var nmsg = msg.split("\n");
          for (var i = 0; i < nmsg.length; i++) {
            serverconsole.errmessage(nmsg[i]);
          }
          return;
        }
        console.log("\x1b[31mSERVER RESPONSE ERROR MESSAGE [Request Id: " + reqId + "]: " + msg + "\x1b[37m\x1b[0m");
        LOG("SERVER RESPONSE ERROR MESSAGE [Request Id: " + reqId + "]: " + msg);
        return;
      },
      locerrmessage: function (msg) {
        if (msg.indexOf("\n") != -1) {
          var nmsg = msg.split("\n");
          for (var i = 0; i < nmsg.length; i++) {
            serverconsole.locerrmessage(nmsg[i]);
          }
          return;
        }
        console.log("\x1b[41mSERVER ERROR MESSAGE [Request Id: " + reqId + "]: " + msg + "\x1b[40m\x1b[0m");
        LOG("SERVER ERROR MESSAGE [Request Id: " + reqId + "]: " + msg);
        return;
      },
      locwarnmessage: function (msg) {
        if (msg.indexOf("\n") != -1) {
          var nmsg = msg.split("\n");
          for (var i = 0; i < nmsg.length; i++) {
            serverconsole.locwarnmessage(nmsg[i]);
          }
          return;
        }
        console.log("\x1b[43mSERVER WARNING MESSAGE [Request Id: " + reqId + "]: " + msg + "\x1b[40m\x1b[0m");
        LOG("SERVER WARNING MESSAGE [Request Id: " + reqId + "]: " + msg);
        return;
      },
      locmessage: function (msg) {
        if (msg.indexOf("\n") != -1) {
          var nmsg = msg.split("\n");
          for (var i = 0; i < nmsg.length; i++) {
            serverconsole.locmessage(nmsg[i]);
          }
          return;
        }
        console.log("SERVER MESSAGE [Request Id: " + reqId + "]: " + msg);
        LOG("SERVER MESSAGE [Request Id: " + reqId + "]: " + msg);
        return;
      }
    };

    function getCustomHeaders() {
      var ph = JSON.parse(JSON.stringify(customHeaders));
      var phk = Object.keys(ph);
      for (var i = 0; i < phk.length; i++) {
        if (typeof ph[phk[i]] == "string") ph[phk[i]] = ph[phk[i]].replace(/\{path\}/g, request.url);
      }
      return ph;
    }

    //Make HTTP/1.x API-based scripts compatible with HTTP/2.0 API
    if (configJSON.enableHTTP2 == true && request.httpVersion == "2.0") {
      try {
        //Set HTTP/1.x methods (to prevent process warnings) 
        response.writeHeadNodeApi = response.writeHead;
        response.setHeaderNodeApi = response.setHeader;
        response.writeHead = function (a, b, c) {
          var table = c;
          if (typeof (b) == "object") table = b;
          if (table == undefined) table = this.tHeaders;
          table = JSON.parse(JSON.stringify(table));
          if (table["content-type"] != undefined && table["Content-Type"] != undefined) {
            delete table["content-type"];
          }
          delete table["transfer-encoding"];
          delete table["connection"];
          delete table["keep-alive"];
          delete table["upgrade"];
          return response.writeHeadNodeApi(a, table);
        };

        response.setHeader = function (a, b) {
          if (a != "transfer-encoding" && a != "connection" && a != "keep-alive" && a != "upgrade") return response.setHeaderNodeApi(a, b);
          return false;
        };
        //Set HTTP/1.x headers
        if (!request.headers.host) request.headers.host = request.headers[":authority"];
        (request.headers[":path"] == undefined ? (function () {})() : request.url = request.headers[":path"]);
        request.protocol = request.headers[":scheme"];
        var headers = [":path" || ":method"];
        for (var i = 0; i < headers.length; i++) {
          if (request.headers[headers[i]] == undefined) {
            var cheaders = getCustomHeaders();
            cheaders["Content-Type"] = "text/html; charset=utf-8";
            response.writeHead(400, "Bad Request", cheaders);
            response.write("<html><head><title>400 Bad Request</title><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" /></head><body><h1>400 Bad Request</h1><p>The request you sent is invalid. <p><i>" + (exposeServerVersion ? "SVR.JS/" + version + " (" + getOS() + "; " + (process.isBun ? ("Bun/v" + process.versions.bun + "; like Node.JS/" + process.version) : ("Node.JS/" + process.version)) + ")" : "SVR.JS") + (request.headers[":authority"] == undefined ? "" : " on " + request.headers[":authority"]) + "</i></p></body></html>");
            response.end();
            return;
          }
        }
      } catch (ex) {
        var cheaders = getCustomHeaders();
        cheaders["Content-Type"] = "text/html; charset=utf-8";
        cheaders[":status"] = "500";
        response.stream.respond(cheaders);
        response.stream.write("<html><head><title>500 Internal Server Error</title><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" /></head><body><h1>500 Internal Server Error</h1><p>The server had an unexpected error. Below, error stack is shown: </p><code>" + (stackHidden ? "[error stack hidden]" : generateErrorStack(ex)).replace(/\r\n/g, "<br/>").replace(/\n/g, "<br/>").replace(/\r/g, "<br/>").replace(/ {2}/g, "&nbsp;&nbsp;") + "</code><p>Please contact with developer/administrator of the website.</p><p><i>" + (exposeServerVersion ? "SVR.JS/" + version + " (" + getOS() + "; " + (process.isBun ? ("Bun/v" + process.versions.bun + "; like Node.JS/" + process.version) : ("Node.JS/" + process.version)) + ")" : "SVR.JS") + (request.headers[":authority"] == undefined ? "" : " on " + request.headers[":authority"]) + "</i></p></body></html>");
        response.stream.end();
        return;
      }
    }

    if (request.headers["x-svr-js-from-main-thread"] == "true") {
      response.writeHead(204, "No Content", getCustomHeaders());
      var lastStatusCode = null;
      response.end();
      return;
    }

    request.url = fixNodeMojibakeURL(request.url);

    var headWritten = false;
    response.writeHeadNative = response.writeHead;
    response.writeHead = function (a, b, c) {
      if (!(headWritten && process.isBun && a === lastStatusCode && b === undefined && c === undefined)) {
        if (headWritten) {
          process.emitWarning("res.writeHead called multiple times.", {
            code: "WARN_SVRJS_MULTIPLE_WRITEHEAD"
          });
          return response;
        } else {
          headWritten = true;
        }
        if (parseInt(a) >= 400 && parseInt(a) <= 599) {
          serverconsole.errmessage("Server responded with " + a.toString() + " code.");
        } else {
          serverconsole.resmessage("Server responded with " + a.toString() + " code.");
        }
        lastStatusCode = a;
      }
      response.writeHeadNative(a, b, c);
    };
    if (wwwredirect) {
      var hostname = request.headers.host.split[":"];
      var hostport = null;
      if (hostname.length > 1 && (hostname[0] != "[" || hostname[hostname.length - 1] != "]")) hostport = hostname.pop();
      hostname = hostname.join(":");
    }
    if (wwwredirect && hostname == domain && hostname.indexOf("www.") != 0) {
      var lloc = (request.socket.encrypted ? "https" : "http") + "://" + hostname + (hostport ? ":" + hostport : "");
      try {
        var rheaders = getCustomHeaders();
        rheaders["Location"] = lloc + (request.url.replace(/\/+/g, "/"));
        response.writeHead(301, "Redirect to WWW", rheaders);
        response.end();
      } catch (ex) {
        var cheaders = getCustomHeaders();
        cheaders["Content-Type"] = "text/html; charset=utf-8";
        res.writeHead(500, "Internal Server Error", cheaders);
        res.write("<html><head><title>500 Internal Server Error</title><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" /></head><body><h1>500 Internal Server Error</h1><p>The server had an unexpected error. Below, error stack is shown: </p><code>" + (stackHidden ? "[error stack hidden]" : generateErrorStack(ex)).replace(/\r\n/g, "<br/>").replace(/\n/g, "<br/>").replace(/\r/g, "<br/>").replace(/ {2}/g, "&nbsp;&nbsp;") + "</code><p>Please contact with developer/administrator of the website.</p><p><i>" + (exposeServerVersion ? "SVR.JS/" + version + " (" + getOS() + "; " + (process.isBun ? ("Bun/v" + process.versions.bun + "; like Node.JS/" + process.version) : ("Node.JS/" + process.version)) + ")" : "SVR.JS") + (req.headers.host == undefined ? "" : " on " + String(req.headers.host).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")) + "</i></p></body></html>");
        response.end();
      }
    } else {
      var finished = false;
      response.on("finish", function () {
        if (!finished) {
          finished = true;
          serverconsole.locmessage("Client disconnected.");
        }
      });
      response.on("close", function () {
        if (!finished) {
          finished = true;
          serverconsole.locmessage("Client disconnected.");
        }
      });
      var isProxy = false;
      if (request.url.indexOf("/") != 0 && request.url != "*") isProxy = true;
      serverconsole.locmessage("Somebody connected to port " + (secure && fromMain ? sport : port) + "...");

      if (request.socket == null) {
        serverconsole.errmessage("Client socket is null!!!");
        return;
      }

      var reqport = "";
      var reqip = "";
      var oldport = "";
      var oldip = "";
      if (request.headers["x-svr-js-client"] != undefined && enableIPSpoofing) {
        var kl = request.headers["x-svr-js-client"].split(":");
        reqport = kl.pop();
        reqip = kl.join(":");
        try {
          oldport = request.socket.remotePort;
          oldip = request.socket.remoteAddress;
          request.socket.realRemotePort = reqport;
          request.socket.realRemoteAddress = reqip;
          request.socket.originalRemotePort = oldport;
          request.socket.originalRemoteAddress = oldip;
          response.socket.realRemotePort = reqport;
          response.socket.realRemoteAddress = reqip;
          response.socket.originalRemotePort = oldport;
          response.socket.originalRemoteAddress = oldip;
        } catch (ex) {
          //Address setting failed
        }
      } else if (request.headers["x-forwarded-for"] != undefined && enableIPSpoofing) {
        reqport = null;
        reqip = request.headers["x-forwarded-for"].split(",")[0].replace(/ /g, "");
        if (reqip.indexOf(":") == -1) reqip = "::ffff:" + reqip;
        try {
          oldport = request.socket.remotePort;
          oldip = request.socket.remoteAddress;
          request.socket.realRemotePort = reqport;
          request.socket.realRemoteAddress = reqip;
          request.socket.originalRemotePort = oldport;
          request.socket.originalRemoteAddress = oldip;
          response.socket.realRemotePort = reqport;
          response.socket.realRemoteAddress = reqip;
          response.socket.originalRemotePort = oldport;
          response.socket.originalRemoteAddress = oldip;
        } catch (ex) {
          //Address setting failed
        }
      } else {
        reqip = request.socket.remoteAddress;
        reqport = request.socket.remotePort;
      }

      if (!isProxy) serverconsole.reqmessage("Client " + ((!reqip || reqip == "") ? "[unknown client]" : (reqip + ((reqport && reqport !== 0) && reqport != "" ? ":" + reqport : ""))) + " wants " + (request.method == "GET" ? "content in " : (request.method == "POST" ? "to post content in " : (request.method == "PUT" ? "to add content in " : (request.method == "DELETE" ? "to delete content in " : (request.method == "PATCH" ? "to patch content in " : "to access content using " + request.method + " method in "))))) + (request.headers.host == undefined ? "" : request.headers.host) + request.url);
      else serverconsole.reqmessage("Client " + ((!reqip || reqip == "") ? "[unknown client]" : (reqip + ((reqport && reqport !== 0) && reqport != "" ? ":" + reqport : ""))) + " wants " + (request.method == "GET" ? "content in " : (request.method == "POST" ? "to post content in " : (request.method == "PUT" ? "to add content in " : (request.method == "DELETE" ? "to delete content in " : (request.method == "PATCH" ? "to patch content in " : "to access content using " + request.method + " method in "))))) + request.url);
      if (request.headers["user-agent"] != undefined) serverconsole.reqmessage("Client uses " + request.headers["user-agent"]);

      var acceptEncoding = request.headers["accept-encoding"];
      if (!acceptEncoding) acceptEncoding = "";

      var head = fs.existsSync("./.head") ? fs.readFileSync("./.head").toString() : (fs.existsSync("./head.html") ? fs.readFileSync("./head.html").toString() : ""); // header
      var foot = fs.existsSync("./.foot") ? fs.readFileSync("./.foot").toString() : (fs.existsSync("./foot.html") ? fs.readFileSync("./foot.html").toString() : ""); // footer

      var fd = "";

      function responseEnd(d) {
        if (d === undefined) d = fd;
        res.write(head + d + foot);
        res.end();
      }

      // function responseEndGzip(d) {
      //   if (d === undefined) d = fd;
      //   zlib.gzip(head + d + foot, function (err, buff) {
      //     if (err) {
      //       throw err;
      //     } else {
      //       res.write(buff);
      //       res.end();
      //     }
      //   });
      // }
      // 
      // function responseEndDeflate(d) {
      //   if (d === undefined) d = fd;
      //   zlib.deflateRaw(head + d + foot, function (err, buff) {
      //     if (err) {
      //       throw err;
      //     } else {
      //       res.write(buff);
      //       res.end();
      //     }
      //   });
      // }

      var req = request; // request var is req = request
      var res = response; // response var is res = response

      //Error descriptions
      var serverErrorDescs = {
        200: "The request succeeded! :)",
        201: "New resource has been created.",
        202: "The request has been accepted for processing, but the processing has not been completed.",
        400: "The request you made is invalid.",
        401: "You need to authenticate yourself in order to access the requested file.",
        402: "You need to pay in order to access the requested file.",
        403: "You don't have access to the requested file.",
        404: "The requested file doesn't exist. If you have typed URL manually, then please check the spelling.",
        405: "Method used to access the requested file isn't allowed.",
        406: "The request is capable of generating only not acceptable content.",
        407: "You need to authenticate yourself in order to use the proxy.",
        408: "You have timed out.",
        409: "The request you sent conflicts with the current state of the server.",
        410: "The requested file is permanently deleted.",
        411: "Content-Length property is required.",
        412: "The server doesn't meet preconditions you put in the request.",
        413: "The request you sent is too large.",
        414: "URL you sent is too long.",
        415: "The media type of request you sent isn't supported by the server.",
        416: "Content-Range you sent is unsatisfiable.",
        417: "Expectation in Expect property couldn't be satisfied.",
        418: "The server (teapot) can't brew any coffee! ;)",
        421: "The request you made isn't intended for this server.",
        422: "The server couldn't process content sent by you.",
        423: "The requested file is locked.",
        424: "The request depends on another failed request.",
        425: "The server is unwilling to risk processing a request that might be replayed.",
        426: "You need to upgrade protocols you use to request a file.",
        428: "The request you sent needs to be conditional, but it isn't.",
        429: "You sent too much requests to the server.",
        431: "The request you sent contains headers, that are too large.",
        451: "The requested file isn't accessible for legal reasons.",
        500: "The server had an unexpected error. Below, the error stack is shown: </p><code>{stack}</code><p>Please contact with developer/administrator at <i>{contact}</i>.",
        501: "The request requires use of a function, which isn't currently implemented by the server.",
        502: "The server had an error, while it was acting as a gateway.</p><p>Please contact with developer/administrator at <i>{contact}</i>.",
        503: "The service provided by the server is currently unavailable, possibly due to maintenance downtime or capacity problems. Please try again later.</p><p>Please contact with developer/administrator at <i>{contact}</i>.",
        504: "The server couldn't get response in time, while it was acting as a gateway.</p><p>Please contact with developer/administrator at <i>{contact}</i>.",
        505: "The server doesn't support HTTP version used in the request.",
        506: "Variant header is configured to be engaged in content negotiation.</p><p>Please contact with developer/administrator at <i>{contact}</i>.",
        507: "The server ran out of disk space neccessary to complete the request.",
        508: "The server detected an infinite loop while processing the request.",
        509: "The server has it's bandwidth limit exceeded.</p><p>Please contact with developer/administrator at <i>{contact}</i>.",
        510: "The server requires an extended HTTP request. The request you made isn't an extended HTTP request.",
        511: "You need to authenticate yourself in order to get network access.",
        598: "The server couldn't get response in time, while it was acting as a proxy.",
        599: "The server couldn't connect in time, while it was acting as a proxy."
      };

      //Server error calling method
      // Server error calling method
      function callServerError(errorCode, extName, stack, ch) {
        if (typeof errorCode !== "number") {
          throw new TypeError("HTTP error code parameter needs to be an integer.");
        }

        // Handle optional parameters
        if (extName && typeof extName === "object") {
          ch = stack;
          stack = extName;
          extName = undefined;
        } else if (typeof extName !== "string" && extName !== null && extName !== undefined) {
          throw new TypeError("Extension name parameter needs to be a string.");
        }

        if (stack && typeof stack === "object" && Object.prototype.toString.call(stack) !== "[object Error]") {
          ch = stack;
          stack = undefined;
        } else if (typeof stack !== "object" && typeof stack !== "string" && stack) {
          throw new TypeError("Error stack parameter needs to be either a string or an instance of Error object.");
        }

        var errorFile = errorCode.toString() + ".html";
        var errorFile2 = "." + errorCode.toString();
        if (fs.existsSync(errorFile2)) errorFile = errorFile2;
        if (errorCode == 404 && fs.existsSync(page404)) errorFile = page404;

        // Generate error stack if not provided
        if (Object.prototype.toString.call(stack) === "[object Error]") stack = generateErrorStack(stack);
        if (stack === undefined) stack = generateErrorStack(new Error("Unknown error"));

        if (errorCode == 500 || errorCode == 502) {
          serverconsole.errmessage("There was an error while processing the request!");
          serverconsole.errmessage("Stack:");
          serverconsole.errmessage(stack);
        }

        // Hide the error stack if specified
        if (stackHidden) stack = "[error stack hidden]";

        // Validate the error code and handle unknown codes
        if (serverErrorDescs[errorCode] === undefined) {
          callServerError(501, extName, stack);
        } else {
          var cheaders = getCustomHeaders();

          // Process custom headers if provided
          if (ch) {
            var chon = Object.keys(cheaders);
            var chn = Object.keys(ch);
            for (var i = 0; i < chn.length; i++) {
              var nhn = chn[i];
              for (var j = 0; j < chon.length; j++) {
                if (chon[j].toLowerCase() == chn[i].toLowerCase()) {
                  nhn = chon[j];
                  break;
                }
              }
              if (ch[chn[i]]) cheaders[nhn] = ch[chn[i]];
            }
          }

          cheaders["Content-Type"] = "text/html; charset=utf-8";

          // Set default Allow header for 405 error if not provided
          if (errorCode == 405 && !cheaders["Allow"]) cheaders["Allow"] = "GET, POST, HEAD, OPTIONS";

          // Read the error file and replace placeholders with error information
          fs.readFile(errorFile, function (err, data) {
            try {
              if (err) throw err;
              response.writeHead(errorCode, http.STATUS_CODES[errorCode], cheaders);
              fd += data.toString().replace(/{errorMessage}/g, errorCode.toString() + " " + http.STATUS_CODES[errorCode]).replace(/{errorDesc}/g, serverErrorDescs[errorCode]).replace(/{stack}/g, stack.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\r\n/g, "<br/>").replace(/\n/g, "<br/>").replace(/\r/g, "<br/>").replace(/ {2}/g, "&nbsp;&nbsp;")).replace(/{path}/g, request.url.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")).replace(/{server}/g, "" + (exposeServerVersion ? "SVR.JS/" + version + " (" + getOS() + "; " + (process.isBun ? ("Bun/v" + process.versions.bun + "; like Node.JS/" + process.version) : ("Node.JS/" + process.version)) + ")" : "SVR.JS") + (extName == undefined ? "" : " " + extName) + ((req.headers.host == undefined || isProxy) ? "" : " on " + String(req.headers.host).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"))).replace(/{contact}/g, serverAdmin.replace(/\./g, "[dot]").replace(/@/g, "[at]")); // Replace placeholders in error response
              responseEnd();
            } catch (ex) {
              var additionalError = 500;
              // Handle additional error cases
              if (ex.code == "ENOENT") {
                additionalError = 404;
              } else if (ex.code == "ENOTDIR") {
                additionalError = 404;
              } else if (ex.code == "EACCES") {
                additionalError = 403;
              } else if (ex.code == "ENAMETOOLONG") {
                additionalError = 414;
              } else if (ex.code == "EMFILE") {
                additionalError = 503;
              } else if (ex.code == "ELOOP") {
                additionalError = 508;
              }

              response.writeHead(errorCode, http.STATUS_CODES[errorCode], cheaders);
              response.write(("<html><head><title>{errorMessage}</title><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" /></head><body><h1>{errorMessage}</h1><p>{errorDesc}</p>" + ((additionalError == 404) ? "" : "<p>Additionally, a {additionalError} error occurred while loading an error page.</p>") + "<p><i>{server}</i></p></body></html>").replace(/{errorMessage}/g, errorCode.toString() + " " + http.STATUS_CODES[errorCode]).replace(/{errorDesc}/g, serverErrorDescs[errorCode]).replace(/{stack}/g, stack.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\r\n/g, "<br/>").replace(/\n/g, "<br/>").replace(/\r/g, "<br/>").replace(/ {2}/g, "&nbsp;&nbsp;")).replace(/{path}/g, request.url.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")).replace(/{server}/g, "" + (exposeServerVersion ? "SVR.JS/" + version + " (" + getOS() + "; " + (process.isBun ? ("Bun/v" + process.versions.bun + "; like Node.JS/" + process.version) : ("Node.JS/" + process.version)) + ")" : "SVR.JS") + (extName == undefined ? "" : " " + extName) + ((req.headers.host == undefined || isProxy) ? "" : " on " + String(req.headers.host).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"))).replace(/{contact}/g, serverAdmin.replace(/\./g, "[dot]").replace(/@/g, "[at]")).replace(/{additionalError}/g, additionalError.toString())); // Replace placeholders in error response
              response.end();
            }
          });
        }
      }


      function redirect(dest, isTemporary, headers) {
        if (headers === undefined) headers = getCustomHeaders();
        headers["Location"] = dest;
        var scode = isTemporary ? 302 : 301;
        res.writeHead(scode, http.STATUS_CODES[scode], headers);
        serverconsole.resmessage("Client redirected to " + dest);
        res.end();
        return;
      }

      function parsePostData(options, callback) {
        if (req.method != "POST") {
          var h = getCustomHeaders();
          h["Allow"] = "POST";
          callServerError(405, undefined, undefined, h);
          return;
        }
        var formidableOptions = options;
        if (!callback) {
          callback = options;
          formidableOptions = {};
        }
        if (formidable._errored) callServerError(500, undefined, generateErrorStack(formidable._errored));
        var form = formidable(formidableOptions);
        form.parse(req, function (err, fields, files) {
          if (err) {
            if(err.httpCode) callServerError(err.httpCode);
            else callServerError(400);
            return;
          }
          callback(fields, files);
        });
      }

      function urlParse(uri) {
        if (typeof URL != "undefined" && url.Url) {
          try {
            var uobject = new URL(uri, "http" + (req.socket.encrypted ? "s" : "") + "://" + (req.headers.host ? req.headers.host : (domain ? domain : "unknown.invalid")));
            var nuobject = new url.Url();
            if (uri.indexOf("/") != -1) nuobject.slashes = true;
            if (uobject.protocol != "") nuobject.protocol = uobject.protocol;
            if (uobject.username != "" && uobject.password != "") nuobject.auth = uobject.username + ":" + uobject.password;
            if (uobject.host != "") nuobject.host = uobject.host;
            if (uobject.hostname != "") nuobject.hostname = uobject.hostname;
            if (uobject.port != "") nuobject.port = uobject.port;
            if (uobject.pathname != "") nuobject.pathname = uobject.pathname;
            if (uobject.search != "") nuobject.search = uobject.search;
            if (uobject.hash != "") nuobject.hash = uobject.hash;
            if (uobject.href != "") nuobject.href = uobject.href;
            if (uri.indexOf("/") != 0) {
              if (nuobject.pathname) {
                nuobject.pathname = nuobject.pathname.substr(1);
                nuobject.href = nuobject.pathname + (nuobject.search ? nuobject.search : "");
              }
            }
            if (nuobject.pathname) {
              nuobject.path = nuobject.pathname + (nuobject.search ? nuobject.search : "");
            }
            nuobject.query = {};
            uobject.searchParams.forEach(function (value, key) {
              nuobject.query[key] = value;
            });
            return nuobject;
          } catch (ex) {
            return url.parse(uri, true);
          }
        } else {
          return url.parse(uri, true);
        }
      }

      var uobject = urlParse(req.url);
      var search = uobject.search;
      var href = uobject.pathname;
      var ext = path.extname(href).toLowerCase();
      ext = ext.substr(1, ext.length);
      var decodedHref = "";
      try {
        decodedHref = decodeURIComponent(href);
      } catch (ex) {
        //Return 400 error
        callServerError(400);
        serverconsole.errmessage("Bad request!");
        return;
      }

      if (req.headers["expect"] && req.headers["expect"] != "100-continue") {
        callServerError(417);
        return;
      }

      //MOD EXCECUTION FUNCTION
      function modExecute(mods, ffinals) {
        var modFunction = ffinals;
        for (var i = mods.length - 1; i >= 0; i--) {
          modFunction = mods[i].callback(req, res, serverconsole, responseEnd, href, ext, uobject, search, "index.html", users, page404, head, foot, fd, modFunction, configJSON, callServerError, getCustomHeaders, origHref, redirect, parsePostData);
        }
        modFunction();
      }

      var vresCalled = false;

      function vres(req, res, serverconsole, responseEnd, href, ext, uobject, search, defaultpage, users, page404, head, foot, fd, callServerError, getCustomHeaders, origHref, redirect, parsePostData) {
        return function () {
          if (vresCalled) {
            process.emitWarning("elseCallback() invoked multiple times.", {
              code: "WARN_SVRJS_MULTIPLE_ELSECALLBACK"
            });
            return;
          } else {
            vresCalled = true;
          }
          //     function responseEndGzip(d) {
          //       if (d === undefined) d = fd;
          //       zlib.gzip(head + d + foot, function (err, buff) {
          //         if (err) {
          //           throw err;
          //         } else {
          //           res.write(buff);
          //           res.end();
          //         }
          //       });
          //     }
          // 
          //     function responseEndDeflate(d) {
          //       if (d === undefined) d = fd;
          //       zlib.deflateRaw(head + d + foot, function (err, buff) {
          //         if (err) {
          //           throw err;
          //         } else {
          //           res.write(buff);
          //           res.end();
          //         }
          //       });
          //     }

          function responseEnd(d) {
            if (d === undefined) d = fd;
            res.write(head + d + foot);
            res.end();
          }

          if (req.socket == null) {
            serverconsole.errmessage("Client socket is null!!!");
            return;
          }

          var reqport = "";
          var reqip = "";
          var oldport = "";
          var oldip = "";
          if (req.headers["x-svr-js-client"] != undefined && enableIPSpoofing) {
            var kl = req.headers["x-svr-js-client"].split(":");
            reqport = kl.pop();
            reqip = kl.join(":");
            try {
              oldport = req.socket.remotePort;
              oldip = req.socket.remoteAddress;
              req.socket.realRemotePort = reqport;
              req.socket.realRemoteAddress = reqip;
              req.socket.originalRemotePort = oldport;
              req.socket.originalRemoteAddress = oldip;
              res.socket.realRemotePort = reqport;
              res.socket.realRemoteAddress = reqip;
              res.socket.originalRemotePort = oldport;
              res.socket.originalRemoteAddress = oldip;
            } catch (ex) {
              //Nevermind...
            }
          } else if (req.headers["x-forwarded-for"] != undefined && enableIPSpoofing) {
            reqport = null;
            reqip = req.headers["x-forwarded-for"].split(",")[0].replace(/ /g, "");
            if (reqip.indexOf(":") == -1) reqip = "::ffff:" + reqip;
            try {
              oldport = req.socket.remotePort;
              oldip = req.socket.remoteAddress;
              req.socket.realRemotePort = reqport;
              req.socket.realRemoteAddress = reqip;
              req.socket.originalRemotePort = oldport;
              req.socket.originalRemoteAddress = oldip;
              res.socket.realRemotePort = reqport;
              res.socket.realRemoteAddress = reqip;
              res.socket.originalRemotePort = oldport;
              res.socket.originalRemoteAddress = oldip;
            } catch (ex) {
              //Nevermind...
            }
          } else {
            reqip = req.socket.remoteAddress;
            reqport = req.socket.remotePort;
          }

          function checkLevel(e) {
            for (var n = e.split("/"), r = 0, t = 0; t < n.length; t += 1) ".." == n[t] ? r -= 1 : "." !== n[t] && "" !== n[t] && (r += 1);
            return r;
          }

          if (isProxy) {
            var eheaders = getCustomHeaders();
            eheaders["Content-Type"] = "text/html; charset=utf-8";
            res.writeHead(501, "Not implemented", eheaders);
            res.write("<html><head><title>Proxy not implemented</title><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" /></head><body><h1>Proxy not implemented</h1><p>SVR.JS doesn't support proxy without proxy mod. If you're administator of this server, then install this mod in order to use SVR.JS as a proxy.</p><p><i>" + (exposeServerVersion ? "SVR.JS/" + version + " (" + getOS() + "; " + (process.isBun ? ("Bun/v" + process.versions.bun + "; like Node.JS/" + process.version) : ("Node.JS/" + process.version)) + ")" : "SVR.JS") + "</i></p></body></html>");
            res.end();
            serverconsole.errmessage("SVR.JS doesn't support proxy without proxy mod.");
            return;
          }

          if (req.method == "OPTIONS") {
            var hdss = getCustomHeaders();
            hdss["Allow"] = "GET, POST, HEAD, OPTIONS";
            res.writeHead(204, "No Content", hdss);
            res.end();
            return;
          } else if (req.method != "GET" && req.method != "POST" && req.method != "HEAD") {
            callServerError(405);
            serverconsole.errmessage("Invaild method: " + req.method);
            return;
          }

          if (version.indexOf("Nightly-") === 0 && (href == "/invoke500.svr" || (os.platform() == "win32" && href.toLowerCase() == "/invoke500.svr"))) {
            if (uobject.query.crash !== undefined) throw new Error("Intentionally crashed");
            try {
              throw new Error("This page is intended to return 500 code.");
            } catch (ex) {
              callServerError(500, undefined, generateErrorStack(ex));
              return;
            }
          } else if (allowStatus && (href == "/svrjsstatus.svr" || (os.platform() == "win32" && href.toLowerCase() == "/svrjsstatus.svr"))) {
            function formatRelativeTime(relativeTime) {
              var days = Math.floor(relativeTime / 60 / (60 * 24));
              var dateDiff = new Date(relativeTime * 1000);
              return days + " days, " + dateDiff.getUTCHours() + " hours, " + dateDiff.getUTCMinutes() + " minutes, " + dateDiff.getUTCSeconds() + " seconds";
            }
            var hdhds = getCustomHeaders();
            hdhds["Content-Type"] = "text/html; charset=utf-8";
            res.writeHead(200, "OK", hdhds);
            res.end((head == "" ? "<html><head><title>SVR.JS status" + (request.headers.host == undefined ? "" : " for " + String(req.headers.host).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")) + "</title><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" /></head><body>" : head.replace(/<head>/i, "<head><title>SVR.JS status" + (request.headers.host == undefined ? "" : " for " + String(req.headers.host).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")) + "</title>")) + "<h1>SVR.JS status" + (request.headers.host == undefined ? "" : " for " + String(req.headers.host).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")) + "</h1>Server version: " + (exposeServerVersion ? "SVR.JS/" + version + " (" + getOS() + "; " + (process.isBun ? ("Bun/v" + process.versions.bun + "; like Node.JS/" + process.version) : ("Node.JS/" + process.version)) + ")" : "SVR.JS") + "<br/><hr/>Current time: " + new Date().toString() + "<br/>Thread start time: " + new Date(new Date() - (process.uptime() * 1000)).toString() + "<br/>Thread uptime: " + formatRelativeTime(Math.floor(process.uptime())) + "<br/>OS uptime: " + formatRelativeTime(os.uptime()) + "<br/>Total request count: " + reqcounter + "<br/>Average request rate: " + (Math.round((reqcounter / process.uptime()) * 100) / 100) + " requests/s" + (process.memoryUsage ? ("<br/>Memory usage of thread: " + sizify(process.memoryUsage().rss) + "B") : "") + (process.cpuUsage ? ("<br/>Total CPU usage by thread: u" + (process.cpuUsage().user / 1000) + "ms s" + (process.cpuUsage().system / 1000) + "ms - " + (Math.round((((process.cpuUsage().user + process.cpuUsage().system) / 1000000) / process.uptime()) * 1000) / 1000) + "%") : "") + "<br/>Thread PID: " + process.pid + "<br/>" + (foot == "" ? "</body></html>" : foot));
            return;
          } else if (version.indexOf("Nightly-") === 0 && (href == "/crash.svr" || (os.platform() == "win32" && href.toLowerCase() == "/crash.svr"))) {
            throw new Error("Intentionally crashed");
          }

          /////////////////////////////////////////////
          ////THERE IS NO MORE "THE BOOK OF ZSOIE"!////
          //// But it's in easteregg.tar.gz mod... ////
          /////////////////////////////////////////////
          
          var pth = decodeURIComponent(href).replace(/\/+/g, "/").substr(1);
          fs.stat("./" + pth, function (err, stats) {
            if (err) {
              if (err.code == "ENOENT") {
                callServerError(404);
                serverconsole.errmessage("Resource not found.");
              } else if (err.code == "ENOTDIR") {
                callServerError(404);
                serverconsole.errmessage("Resource not found.");
              } else if (err.code == "EACCES") {
                callServerError(403);
                serverconsole.errmessage("Access denied.");
              } else if (err.code == "ENAMETOOLONG") {
                callServerError(414);
              } else if (err.code == "EMFILE") {
                callServerError(503);
              } else if (err.code == "ELOOP") {
                callServerError(508);
              } else {
                callServerError(500, undefined, generateErrorStack(err));
              }
              return;
            }
            //Check if index file exists
            if (req.url == "/" || stats.isDirectory()) {
              fs.stat("./" + pth + "/.notindex".replace(/\/+/g, "/"), function (e) {
                if (e) {
                  fs.stat(("./" + pth + "/index.html").replace(/\/+/g, "/"), function (e, s) {
                    if (e || !s.isFile()) {
                      fs.stat(("./" + pth + "/index.htm").replace(/\/+/g, "/"), function (e, s) {
                        if (e || !s.isFile()) {
                          fs.stat(("./" + pth + "/index.xhtml").replace(/\/+/g, "/"), function (e, s) {
                            if (e || !s.isFile()) {
                              properServe()
                            } else {
                              stats = s;
                              pth = (pth + "/index.xhtml").replace(/\/+/g, "/");
                              ext = "xhtml";
                              properServe();
                            }
                          });
                        } else {
                          stats = s;
                          pth = (pth + "/index.htm").replace(/\/+/g, "/");
                          ext = "htm";
                          properServe();
                        }
                      });
                    } else {
                      stats = s;
                      pth = (pth + "/index.html").replace(/\/+/g, "/");
                      ext = "html";
                      properServe();
                    }
                  });
                }
              });
            } else {
              properServe();
            }

            function properServe() {
              if (stats.isDirectory()) {
                if (configJSON.enableDirectoryListing || configJSON.enableDirectoryListing === undefined) {
                  var dheaders = getCustomHeaders();
                  dheaders["Content-Type"] = "text/html; charset=utf-8";
                  res.writeHead(200, http.STATUS_CODES[200], dheaders);
                  var heada = fs.existsSync(("." + decodeURIComponent(href) + "/.dirhead").replace(/\/+/g, "/")) ? fs.readFileSync(("." + decodeURIComponent(href) + "/.dirhead").replace(/\/+/g, "/")).toString() : ((fs.existsSync(("." + decodeURIComponent(href) + "/HEAD.html").replace(/\/+/g, "/")) && (os.platform != "win32" || href != "/")) ? fs.readFileSync(("." + decodeURIComponent(href) + "/HEAD.html").replace(/\/+/g, "/")).toString() : ""); // header
                  var foota = fs.existsSync(("." + decodeURIComponent(href) + "/.dirfoot").replace(/\/+/g, "/")) ? fs.readFileSync(("." + decodeURIComponent(href) + "/.dirfoot").replace(/\/+/g, "/")).toString() : ((fs.existsSync(("." + decodeURIComponent(href) + "/FOOT.html").replace(/\/+/g, "/")) && (os.platform != "win32" || href != "/")) ? fs.readFileSync(("." + decodeURIComponent(href) + "/FOOT.html").replace(/\/+/g, "/")).toString() : ""); // footer
                  //Check if header has HTML tag
                  var headerHasHTMLTag = heada.replace(/<!--(?:(?:(?!--\>).)*|)(?:-->|$)/gs, "").match(/<html(?![a-zA-Z0-9])(?:"(?:\\(?:.|$)|[^\\"])*(?:"|$)|'(?:\\(?:.|$)|[^\\'])*(?:'|$)|[^'">])*(?:>|$)/si);
                  var htmlHead = (configJSON.enableDirectoryListingWithDefaultHead == undefined || configJSON.enableDirectoryListingWithDefaultHead == false || (fs.existsSync("./head.html") == false && fs.existsSync("./.head") == false) || head == "" || head == " " || head == "\r\n" || head == "\n" ? (!headerHasHTMLTag ? "<!doctype html><html><head><title>Directory: " + decodeURIComponent(origHref).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</title><meta charset=\"UTF-8\" /><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" /></head><body>" : heada.replace(/<head>/i, "<head><title>Directory: " + decodeURIComponent(origHref).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</title>")) : head.replace(/<head>/i, "<head><title>Directory: " + decodeURIComponent(origHref).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</title>")) + (!headerHasHTMLTag ? heada : "") + "<h1>Directory: " + decodeURIComponent(origHref).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</h1><table id=\"directoryListing\"> <tr> <th></th> <th>Filename</th> <th>Size</th> <th>Date</th> </tr>" + (checkLevel(decodeURIComponent(origHref)) < 1 ? "" : "<tr><td style=\"width: 24px;\"><img src=\"/.dirimages/return.png\" width=\"24px\" height=\"24px\" alt=\"[RET]\" /></td><td style=\"word-wrap: break-word; word-break: break-word; overflow-wrap: break-word;\"><a href=\"" + (origHref).replace(/\/+/g, "/").replace(/\/[^\/]*\/?$/, "/") + "\">Return</a></td><td></td><td></td></tr>");
                  var htmlFoot = "</table><p><i>" + (exposeServerVersion ? "SVR.JS/" + version + " (" + getOS() + "; " + (process.isBun ? ("Bun/v" + process.versions.bun + "; like Node.JS/" + process.version) : ("Node.JS/" + process.version)) + ")" : "SVR.JS") + (req.headers.host == undefined ? "" : " on " + String(req.headers.host).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")) + "</i></p>" + foota + (configJSON.enableDirectoryListingWithDefaultHead == undefined || configJSON.enableDirectoryListingWithDefaultHead == false || (fs.existsSync("./foot.html") == false && fs.existsSync("./.foot") == false) || foot == "" || foot == " " || foot == "\r\n" || foot == "\n" ? "</body></html>" : foot);
                  if (fs.existsSync(("." + req.url.split("?")[0] + "/.maindesc").replace(/\/+/g, "/"))) {
                    htmlFoot = "</table><hr/>" + fs.readFileSync(("." + req.url.split("?")[0] + "/.maindesc").replace(/\/+/g, "/")) + htmlFoot;
                  }
                  fs.readdir("." + decodeURIComponent(href), function (err, list) {
                    try {
                      if (err) throw err;
                      list = list.sort();

                      function getStatsForAllFilesI(fileList, callback, prefix, pushArray, index) {
                        if (fileList.length == 0) {
                          callback(pushArray);
                          return;
                        }
                        fs.stat((prefix + "/" + fileList[index]).replace(/\/+/g, "/"), function (err, stats) {
                          if (err) {
                            fs.lstat((prefix + "/" + fileList[index]).replace(/\/+/g, "/"), function (err, stats) {
                              if (err) {
                                pushArray.push({
                                  name: fileList[index],
                                  stats: null,
                                  errored: true
                                });
                                if (index < fileList.length - 1) {
                                  getStatsForAllFilesI(fileList, callback, prefix, pushArray, index + 1);
                                } else {
                                  callback(pushArray);
                                }
                              } else {
                                pushArray.push({
                                  name: fileList[index],
                                  stats: stats,
                                  errored: true
                                });
                                if (index < fileList.length - 1) {
                                  getStatsForAllFilesI(fileList, callback, prefix, pushArray, index + 1);
                                } else {
                                  callback(pushArray);
                                }
                              }
                            });
                          } else {
                            pushArray.push({
                              name: fileList[index],
                              stats: stats,
                              errored: false
                            });
                            if (index < fileList.length - 1) {
                              getStatsForAllFilesI(fileList, callback, prefix, pushArray, index + 1);
                            } else {
                              callback(pushArray);
                            }
                          }
                        });
                      }

                      function getStatsForAllFiles(fileList, prefix, callback) {
                        if (!prefix) prefix = "";
                        getStatsForAllFilesI(fileList, callback, prefix, [], 0);
                      }

                      getStatsForAllFiles(list, "." + decodeURIComponent(href), function (filelist) {
                        function checkEXT(filename, ext) {
                          if (filename.length < ext.length) return false;
                          return (filename.toLowerCase().indexOf(ext) == (filename.length - ext.length));
                        }
                        var statsa = [];
                        for (var i = 0; i < filelist.length; i++) {
                          if (filelist[i].name[0] !== ".") {
                            var estats = filelist[i].stats;
                            var ename = filelist[i].name;
                            if (filelist[i].errored) {
                              if (estats) {
                                statsa.push("<tr><td style=\"width: 24px;\"><img src=\"/.dirimages/bad.png\" alt=[BAD] width=\"24px\" height=\"24px\" /></td><td style=\"word-wrap: break-word; word-break: break-word; overflow-wrap: break-word;\"><a href=\"" + (href + "/" + encodeURI(ename)).replace(/\/+/g, "/") + "\"><nocode>" + ename.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</nocode></a></td><td>-</td><td>" + estats.mtime.toDateString() + "</td></tr>\r\n");
                              } else {
                                statsa.push("<tr><td style=\"width: 24px;\"><img src=\"/.dirimages/bad.png\" alt=[BAD] width=\"24px\" height=\"24px\" /></td><td style=\"word-wrap: break-word; word-break: break-word; overflow-wrap: break-word;\"><a href=\"" + (href + "/" + encodeURI(ename)).replace(/\/+/g, "/") + "\"><nocode>" + ename.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</nocode></a></td><td>-</td><td>-</td></tr>\r\n");
                              }

                            } else {
                              var entry = "<tr><td style=\"width: 24px;\"><img src=\"[img]\" alt=\"[alt]\" width=\"24px\" height=\"24px\" /></td><td style=\"word-wrap: break-word; word-break: break-word; overflow-wrap: break-word;\"><a href=\"" + (origHref + "/" + encodeURIComponent(ename)).replace(/\/+/g, "/") + (estats.isDirectory() ? "/" : "") + "\">" + ename.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</a></td><td>" + (estats.isDirectory() ? "-" : sizify(estats.size.toString())) + "</td><td>" + estats.mtime.toDateString() + "</td></tr>\r\n";
                              if (estats.isDirectory()) {
                                entry = entry.replace("[img]", "/.dirimages/directory.png").replace("[alt]", "[DIR]");
                              } else if (!estats.isFile()) {
                                entry = "<tr><td style=\"width: 24px;\"><img src=\"[img]\" alt=\"[alt]\" width=\"24px\" height=\"24px\" /></td><td style=\"word-wrap: break-word; word-break: break-word; overflow-wrap: break-word;\"><a href=\"" + (origHref + "/" + encodeURIComponent(ename)).replace(/\/+/g, "/") + "\">" + ename.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</a></td><td>-</td><td>" + estats.mtime.toDateString() + "</td></tr>\r\n";
                                if (estats.isBlockDevice()) {
                                  entry = entry.replace("[img]", "/.dirimages/hwdevice.png").replace("[alt]", "[BLK]");
                                } else if (estats.isCharacterDevice()) {
                                  entry = entry.replace("[img]", "/.dirimages/hwdevice.png").replace("[alt]", "[CHR]");
                                } else if (estats.isFIFO()) {
                                  entry = entry.replace("[img]", "/.dirimages/fifo.png").replace("[alt]", "[FIF]");
                                } else if (estats.isSocket()) {
                                  entry = entry.replace("[img]", "/.dirimages/socket.png").replace("[alt]", "[SCK]");
                                }
                              } else if ((/README/ig).test(ename) || (/LICEN[SC]E/ig).test(ename)) {
                                entry = entry.replace("[img]", "/.dirimages/important.png").replace("[alt]", "[IMP]");
                              } else if (checkEXT(ename, ".html") || checkEXT(ename, ".htm") || checkEXT(ename, ".xml") || checkEXT(ename, ".xhtml") || checkEXT(ename, ".shtml")) {
                                entry = entry.replace("[img]", "/.dirimages/html.png").replace("[alt]", (checkEXT(ename, ".xml") ? "[XML]" : "[HTM]"));
                              } else if (checkEXT(ename, ".js")) {
                                entry = entry.replace("[img]", "/.dirimages/javascript.png").replace("[alt]", "[JS ]");
                              } else if (checkEXT(ename, ".php")) {
                                entry = entry.replace("[img]", "/.dirimages/php.png").replace("[alt]", "[PHP]");
                              } else if (checkEXT(ename, ".css")) {
                                entry = entry.replace("[img]", "/.dirimages/css.png").replace("[alt]", "[CSS]");
                              } else if (checkEXT(ename, ".png") || checkEXT(ename, ".jpg") || checkEXT(ename, ".gif") || checkEXT(ename, ".bmp") || checkEXT(ename, ".webm") || checkEXT(ename, ".jpeg") || checkEXT(ename, ".svg") || checkEXT(ename, ".jfif") || checkEXT(ename, ".webp")) {
                                entry = entry.replace("[img]", "/.dirimages/image.png").replace("[alt]", "[IMG]");
                              } else if (checkEXT(ename, ".ico") || checkEXT(ename, ".icn")) {
                                entry = entry.replace("[img]", "/.dirimages/image.png").replace("[alt]", "[ICO]");
                              } else if (checkEXT(ename, ".ttf") || checkEXT(ename, ".otf") || checkEXT(ename, ".fon")) {
                                entry = entry.replace("[img]", "/.dirimages/font.png").replace("[alt]", "[FON]");
                              } else if (checkEXT(ename, ".mp3") || checkEXT(ename, ".ogg") || checkEXT(ename, ".aac") || checkEXT(ename, ".wav") || checkEXT(ename, ".mid") || checkEXT(ename, ".midi") || checkEXT(ename, ".mka")) {
                                entry = entry.replace("[img]", "/.dirimages/audio.png").replace("[alt]", "[AUD]");
                              } else if (checkEXT(ename, ".txt") || checkEXT(ename, ".log") || checkEXT(ename, ".json")) {
                                entry = entry.replace("[img]", "/.dirimages/text.png").replace("[alt]", (checkEXT(ename, ".json") ? "[JSO]" : "[TXT]"));
                              } else if (checkEXT(ename, ".mp5") || checkEXT(ename, ".avi") || checkEXT(ename, ".mkv") || checkEXT(ename, ".mov") || checkEXT(ename, ".mp2") || checkEXT(ename, ".mp4") || checkEXT(ename, ".ogv")) {
                                entry = entry.replace("[img]", "/.dirimages/video.png").replace("[alt]", "[VID]");
                              } else if (checkEXT(ename, ".zip") || checkEXT(ename, ".rar") || checkEXT(ename, ".bz2") || checkEXT(ename, ".gz") || checkEXT(ename, ".bz") || checkEXT(ename, ".7z") || checkEXT(ename, ".xz") || checkEXT(ename, ".lzma") || checkEXT(ename, ".tar")) {
                                entry = entry.replace("[img]", "/.dirimages/archive.png").replace("[alt]", "[ARC]");
                              } else if (checkEXT(ename, ".img") || checkEXT(ename, ".dmg") || checkEXT(ename, ".iso") || checkEXT(ename, ".flp")) {
                                entry = entry.replace("[img]", "/.dirimages/diskimage.png").replace("[alt]", "[DSK]");
                              } else {
                                entry = entry.replace("[img]", "/.dirimages/other.png").replace("[alt]", "[OTH]");
                              }
                              statsa.push(entry);
                            }
                          }
                        }
                        if (statsa.length == 0) {
                          statsa.push("<tr><td></td><td>No files found</td><td></td><td></td></tr>");
                        }
                        res.end(htmlHead + statsa.join("") + htmlFoot);
                        serverconsole.resmessage("Client successfully recieved content.");
                      });
                    } catch (ex) {
                      if (ex.code == "ENOENT") {
                        callServerError(404);
                        serverconsole.errmessage("Resource not found.");
                      } else if (ex.code == "ENOTDIR") {
                        callServerError(404);
                        serverconsole.errmessage("Resource not found.");
                      } else if (ex.code == "EACCES") {
                        callServerError(403);
                        serverconsole.errmessage("Access denied.");
                      } else if (err.code == "ENAMETOOLONG") {
                        callServerError(414);
                      } else if (err.code == "EMFILE") {
                        callServerError(503);
                      } else if (ex.code == "ELOOP") {
                        callServerError(508);
                      } else {
                        callServerError(500, undefined, generateErrorStack(ex));
                      }
                    }
                  });
                } else {
                  callServerError(403);
                  serverconsole.errmessage("Directory listing disabled.");
                  return;
                }
              } else {
                var acceptEncoding = req.headers["accept-encoding"];
                if (!acceptEncoding) acceptEncoding = "";

                // Check if the requested file exists and handle errors
                fs.stat("./" + pth, function (err, stats) {
                  if (err) {
                    if (err.code == "ENOENT") {
                      callServerError(404);
                      serverconsole.errmessage("Resource not found.");
                    } else if (err.code == "ENOTDIR") {
                      callServerError(404);
                      serverconsole.errmessage("Resource not found.");
                    } else if (err.code == "EACCES") {
                      callServerError(403);
                      serverconsole.errmessage("Access denied.");
                    } else if (err.code == "ENAMETOOLONG") {
                      callServerError(414);
                    } else if (err.code == "EMFILE") {
                      callServerError(503);
                    } else if (err.code == "ELOOP") {
                      callServerError(508);
                    } else {
                      callServerError(500, undefined, generateErrorStack(err));
                    }
                    return;
                  }

                  // Check if the requested resource is a directory
                  if (stats.isDirectory()) {
                    callServerError(501);
                    serverconsole.errmessage("SVR.JS expected file but got directory instead.");
                    return;
                  } else if (!stats.isFile()) {
                    callServerError(501);
                    serverconsole.errmessage("SVR.JS doesn't support block devices, character devices, FIFOs nor sockets.");
                    return;
                  }

                  var filelen = stats.size;

                  // Helper function to check if compression is allowed for the file
                  function canCompress(path, list) {
                    var canCompress = true;
                    for (var i = 0; i < list.length; i++) {
                      if (createRegex(list[i]).test(path)) {
                        canCompress = false;
                        break;
                      }
                    }
                    return canCompress;
                  }

                  var isCompressable = canCompress(href, dontCompress);

                  // Check for browser quirks and adjust compression accordingly
                  if (ext != "html" && ext != "htm" && ext != "xhtml" && ext != "xht" && ext != "shtml" && /^Mozilla\/4\.[0-9]+(( *\[[^)]*\] *| *)\([^)\]]*\))? *$/.test(req.headers["user-agent"]) && !(/https?:\/\/|[bB][oO][tT]|[sS][pP][iI][dD][eE][rR]|[sS][uU][rR][vV][eE][yY]|MSI[E]/.test(req.headers["user-agent"]))) {
                    isCompressable = false; //Netscape 4.x doesn't handle compressed data properly outside of HTML documents.
                  } else if (/^Mozilla\/4\.0[6-8](( *\[[^)]*\] *| *)\([^)\]]*\))? *$/.test(req.headers["user-agent"]) && !(/https?:\/\/|[bB][oO][tT]|[sS][pP][iI][dD][eE][rR]|[sS][uU][rR][vV][eE][yY]|MSI[E]/.test(req.headers["user-agent"]))) {
                    isCompressable = false; //Netscape 4.06-4.08 doesn't handle compressed data properly.
                  } else if (ext != "html" && ext != "htm" && ext != "xhtml" && ext != "xht" && ext != "shtml" && /^w3m\/[^ ]*$/.test(req.headers["user-agent"])) {
                    isCompressable = false; //w3m doesn't handle compressed data properly outside of HTML documents.
                  }

                  // Handle partial content request
                  if (ext != "html" && req.headers["range"]) {
                    try {
                      if (err) throw err;
                      var rhd = getCustomHeaders();
                      rhd["Accept-Ranges"] = "bytes";
                      rhd["Content-Range"] = "bytes */" + filelen;
                      var regexmatch = req.headers["range"].match(/bytes=([0-9]*)-([0-9]*)/);
                      if (!regexmatch) {
                        callServerError(416, undefined, undefined, rhd);
                      } else {
                        // Process the partial content request
                        var beginOrig = regexmatch[1];
                        var endOrig = regexmatch[2];
                        var begin = 0;
                        var end = filelen - 1;
                        if (beginOrig == "" && endOrig == "") {
                          callServerError(416, undefined, undefined, rhd);
                          return;
                        } else if (beginOrig == "") {
                          begin = end - parseInt(endOrig) + 1;
                        } else {
                          begin = parseInt(beginOrig);
                          if (endOrig != "") end = parseInt(endOrig);
                        }
                        if (begin > end || begin < 0 || begin > filelen - 1) {
                          callServerError(416, undefined, undefined, rhd);
                          return;
                        }
                        if (end > filelen - 1) end = filelen - 1;
                        rhd["Content-Range"] = "bytes " + begin + "-" + end + "/" + filelen;
                        rhd["Content-Length"] = end - begin + 1;
                        if (!(mime.contentType(ext) == false) && ext != "") rhd["Content-Type"] = mime.contentType(ext);

                        if (req.method != "HEAD") {
                          var readStream = fs.createReadStream("./" + pth, {
                            start: begin,
                            end: end
                          });
                          readStream.on("error", function (err) {
                            if (err.code == "ENOENT") {
                              callServerError(404);
                              serverconsole.errmessage("Resource not found.");
                            } else if (err.code == "ENOTDIR") {
                              callServerError(404);
                              serverconsole.errmessage("Resource not found.");
                            } else if (err.code == "EACCES") {
                              callServerError(403);
                              serverconsole.errmessage("Access denied.");
                            } else if (err.code == "ENAMETOOLONG") {
                              callServerError(414);
                            } else if (err.code == "EMFILE") {
                              callServerError(503);
                            } else if (err.code == "ELOOP") {
                              callServerError(508);
                            } else {
                              callServerError(500, undefined, generateErrorStack(err));
                            }
                          }).on("open", function () {
                            try {
                              res.writeHead(206, http.STATUS_CODES[206], rhd);
                              readStream.pipe(res);
                              serverconsole.resmessage("Client successfully received content.");
                            } catch (ex) {
                              callServerError(500, undefined, generateErrorStack(ex));
                            }
                          });
                        } else {
                          res.writeHead(206, http.STATUS_CODES[206], rhd);
                          res.end();
                        }
                      }
                    } catch (ex) {
                      callServerError(500, undefined, generateErrorStack(ex));
                    }
                  } else {
                    try {
                      if (err) throw err;
                      var hdhds = getCustomHeaders();
                      if (configJSON.enableCompression === true && ext != "br" && filelen > 256 && isCompressable && zlib.createBrotliCompress && acceptEncoding.match(/\bbr\b/)) {
                        hdhds["Content-Encoding"] = "br";
                      } else if (configJSON.enableCompression === true && ext != "zip" && filelen > 256 && isCompressable && acceptEncoding.match(/\bdeflate\b/)) {
                        hdhds["Content-Encoding"] = "deflate";
                      } else if (configJSON.enableCompression === true && ext != "gz" && filelen > 256 && isCompressable && acceptEncoding.match(/\bgzip\b/)) {
                        hdhds["Content-Encoding"] = "gzip";
                      } else {
                        if (ext == "html") {
                          hdhds["Content-Length"] = head.length + filelen + foot.length;
                        } else {
                          hdhds["Content-Length"] = filelen;
                        }
                      }
                      if (ext != "html") hdhds["Accept-Ranges"] = "bytes";
                      delete hdhds["Content-Type"];
                      if (!(mime.contentType(ext) == false) && ext != "") hdhds["Content-Type"] = mime.contentType(ext);

                      if (req.method != "HEAD") {
                        var readStream = fs.createReadStream("./" + pth);
                        readStream.on("error", function (ex) {
                          if (ex.code == "ENOENT") {
                            callServerError(404);
                            serverconsole.errmessage("Resource not found.");
                          } else if (ex.code == "ENOTDIR") {
                            callServerError(404);
                            serverconsole.errmessage("Resource not found.");
                          } else if (ex.code == "EACCES") {
                            callServerError(403);
                            serverconsole.errmessage("Access denied.");
                          } else if (err.code == "ENAMETOOLONG") {
                            callServerError(414);
                          } else if (err.code == "EMFILE") {
                            callServerError(503);
                          } else if (ex.code == "ELOOP") {
                            callServerError(508);
                          } else {
                            callServerError(500, undefined, generateErrorStack(ex));
                          }
                        }).on("open", function () {
                          try {
                            res.writeHead(200, http.STATUS_CODES[200], hdhds);
                            var resStream = {};
                            if (configJSON.enableCompression === true && ext != "br" && filelen > 256 && isCompressable && zlib.createBrotliCompress && acceptEncoding.match(/\bbr\b/)) {
                              resStream = zlib.createBrotliCompress();
                              resStream.pipe(res);
                            } else if (configJSON.enableCompression === true && ext != "zip" && filelen > 256 && isCompressable && acceptEncoding.match(/\bdeflate\b/)) {
                              resStream = zlib.createDeflateRaw();
                              resStream.pipe(res);
                            } else if (configJSON.enableCompression === true && ext != "gz" && filelen > 256 && isCompressable && acceptEncoding.match(/\bgzip\b/)) {
                              resStream = zlib.createGzip();
                              resStream.pipe(res);
                            } else {
                              resStream = res;
                            }
                            if (ext == "html") {
                              function afterWriteCallback() {
                                readStream.on("end", function () {
                                  resStream.end(foot);
                                });
                                readStream.pipe(resStream, {
                                  end: false
                                });
                              }
                              if (!resStream.write(head)) {
                                resStream.on("drain", afterWriteCallback);
                              } else {
                                process.nextTick(afterWriteCallback);
                              }
                            } else {
                              readStream.pipe(resStream);
                            }
                            serverconsole.resmessage("Client successfully received content.");
                          } catch (ex) {
                            callServerError(500, undefined, generateErrorStack(ex));
                          }
                        });
                      } else {
                        res.writeHead(200, http.STATUS_CODES[200], hdhds);
                        res.end();
                        serverconsole.resmessage("Client successfully received content.");
                      }
                    } catch (ex) {
                      callServerError(500, undefined, generateErrorStack(ex));
                    }
                  }
                });
              }
            }
          });
        };
      }
      //    }

      try {

        //scan blacklist
        if (blacklist.check(reqip) && href != "/favicon.ico") {
          var bheaders = getCustomHeaders();
          bheaders["Content-Type"] = "text/html; charset=utf8";
          response.writeHead(403, "Client blocked", bheaders);
          response.write("<!DOCTYPE html><html><head><title>Access denied - SVR.JS</title><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><br/><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" /></head><body><div style=\"height: auto; width: 70%; border-style: solid; border-width: 5; border-color: red; text-align: center; margin: 0 auto;\"><h1>ACCESS DENIED</h1><p style=\"font-size:20px\">Request from " + reqip + " is denied. The client is now in the blacklist.</p><p style=\"font-style: italic; font-weight: normal;\">SVR.JS/" + version + " (" + getOS() + "; " + (process.isBun ? ("Bun/v" + process.versions.bun + "; like Node.JS/" + process.version) : ("Node.JS/" + process.version)) + ")" + (req.headers.host == undefined ? "" : " on " + String(req.headers.host).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")) + "</p></div></body></html>");
          serverconsole.errmessage("Client blocked");
          response.end();
          return;
        }

        if (req.url == "*") {
          if (req.method == "OPTIONS") {
            var hdss = getCustomHeaders();
            hdss["Allow"] = "GET, POST, HEAD, OPTIONS";
            res.writeHead(204, "No Content", hdss);
            res.end();
            return;
          } else {
            callServerError(400);
            return;
          }
        }

        if (req.method == "CONNECT") {
          callServerError(501);
          serverconsole.errmessage("CONNECT requests aren't supported. Your JS runtime probably doesn't support 'connect' handler for HTTP library.");
          return;
        }

        //SANITIZE URL
        var sanitizedHref = sanitizeURL(href);

        if (href.toLowerCase() != sanitizedHref.toLowerCase() && !isProxy) {
          var sanitizedURL = uobject;
          sanitizedURL.path = null;
          sanitizedURL.href = null;
          sanitizedURL.pathname = sanitizedHref;
          sanitizedURL.hostname = null;
          sanitizedURL.host = null;
          sanitizedURL.port = null;
          sanitizedURL.protocol = null;
          sanitizedURL.slashes = null;
          sanitizedURL = url.format(sanitizedURL);
          serverconsole.resmessage("URL sanitized: " + req.url + " => " + sanitizedURL);
          redirect(sanitizedURL, false);
          return;
        }
        //URL REWRITING

        function rewriteURL(address, map) {
          var rewrittenAddress = address;
          for (var i = 0; i < map.length; i++) {
            if (createRegex(map[i].definingRegex).test(address)) {
              for (var j = 0; j < map[i].replacements.length; j++) {
                rewrittenAddress = rewrittenAddress.replace(createRegex(map[i].replacements[j].regex), map[i].replacements[j].replacement);
              }
              if (map[i].append) rewrittenAddress += map[i].append;
              break;
            }
          }
          return rewrittenAddress;
        }
        var origHref = href;
        if (!isProxy) {
          var rewrittenURL = rewriteURL(req.url, rewriteMap);
          if (rewrittenURL != req.url) {
            serverconsole.resmessage("URL rewritten: " + req.url + " => " + rewrittenURL);
            req.url = rewrittenURL;
            uobject = urlParse(req.url);
            search = uobject.search;
            href = uobject.pathname;
            ext = path.extname(href).toLowerCase();
            ext = ext.substr(1, ext.length);

            try {
              decodedHref = decodeURIComponent(href);
            } catch (ex) {
              //Return 400 error
              callServerError(400);
              serverconsole.errmessage("Bad request!");
              return;
            }

            var sHref = sanitizeURL(href);
            if (sHref != href.replace(/\/\.(?=\/|$)/g, "/").replace(/\/+/g, "/")) {
              callServerError(403);
              serverconsole.errmessage("Content blocked.");
              return;
            } else if (sHref != href) {
              var rewrittenAgainURL = uobject;
              rewrittenAgainURL.path = null;
              rewrittenAgainURL.href = null;
              rewrittenAgainURL.pathname = sHref;
              rewrittenAgainURL = url.format(rewrittenAgainURL);
              serverconsole.resmessage("URL sanitized: " + req.url + " => " + rewrittenAgainURL);
              req.url = rewrittenAgainURL;
              uobject = urlParse(req.url);
              search = uobject.search;
              href = uobject.pathname;
              ext = path.extname(href).toLowerCase();
              ext = ext.substr(1, ext.length);
              try {
                decodedHref = decodeURIComponent(href);
              } catch (ex) {
                //Return 400 error
                callServerError(400);
                serverconsole.errmessage("Bad request!");
                return;
              }
            }
          }
        }
        if (!isProxy) {
          reqcounter++;
          var hkh = getCustomHeaders();
          var hk = Object.keys(hkh);
          for (var i = 0; i < hk.length; i++) {
            try {
              response.setHeader(hk[i], hkh[hk[i]]);
            } catch (ex) {
              //Headers will not be set.
            }
          }
        }
        if ((checkIfForbiddenPath(decodedHref, "config") || checkIfForbiddenPath(decodedHref, "certificates")) && !isProxy) {
          callServerError(403);
          serverconsole.errmessage("Access to configuration file/certificates is denied.");
          return;
        } else if (checkIfIndexOfForbiddenPath(decodedHref, "log") && !isProxy && (configJSON.enableLogging || configJSON.enableLogging == undefined) && !(configJSON.enableRemoteLogBrowsing || configJSON.enableRemoteLogBrowsing == undefined)) {
          callServerError(403);
          serverconsole.errmessage("Access to log files is denied.");
          return;
        } else if (checkIfForbiddenPath(decodedHref, "svrjs") && !isProxy && !exposeServerVersion && process.cwd() == __dirname) {
          callServerError(403);
          serverconsole.errmessage("Access to SVR.JS script is denied.");
          return;
        } else if ((checkIfForbiddenPath(decodedHref, "svrjs") || checkIfForbiddenPath(decodedHref, "serverSideScripts") || checkIfIndexOfForbiddenPath(decodedHref, "serverSideScriptDirectories")) && !isProxy && (configJSON.disableServerSideScriptExpose && configJSON.disableServerSideScriptExpose != undefined)) {
          callServerError(403);
          serverconsole.errmessage("Access to sources is denied.");
          return;
        } else {
          var nonscodeIndex = -1;
          var authIndex = -1;
          var regexI = [];
          if (!isProxy && nonStandardCodes != undefined) {
            for (var i = 0; i < nonStandardCodes.length; i++) {
              var mth = false;
              if (nonStandardCodes[i].regex) {
                var regexObj = nonStandardCodes[i].regex.split("/");
                if (regexObj.length == 0) throw new Error("Invalid regex!");
                var modifiers = regexObj.pop();
                if (!modifiers.match(/i/i) && os.platform() == "win32") modifiers += "i";
                regexObj.shift();
                var searchString = regexObj.join("/");
                var rx = RegExp(searchString, modifiers);
                mth = req.url.match(rx) || href.match(rx);
                regexI.push(rx);
              } else {
                mth = nonStandardCodes[i].url == href || (os.platform() == "win32" && nonStandardCodes[i].url.toLowerCase() == href.toLowerCase());
              }
              if (mth) {
                if (nonStandardCodes[i].scode == 401) {
                  if (authIndex == -1) {
                    authIndex = i;
                  }
                } else {
                  if (nonscodeIndex == -1) {
                    if ((nonStandardCodes[i].scode == 403 || nonStandardCodes[i].scode == 451) && nonStandardCodes[i].users !== undefined) {
                      var lpk = false;
                      if (nonStandardCodes[i].users.check(reqip)) {
                        nonscodeIndex = i;
                        lpk = true;
                      }
                      if (lpk) break;
                    } else {
                      nonscodeIndex = i;
                    }
                  }
                }
              }
            }
          }

          if (nonscodeIndex > -1) {
            var nonscode = nonStandardCodes[nonscodeIndex];
            if (nonscode.scode == 301 || nonscode.scode == 302) {
              var location = "";
              if (regexI[nonscodeIndex]) {
                location = req.url.replace(regexI[nonscodeIndex], nonscode.location);
              } else if (req.url.split("?")[1] == undefined || req.url.split("?")[1] == null || req.url.split("?")[1] == "" || req.url.split("?")[1] == " ") {
                location = nonscode.location;
              } else {
                location = nonscode.location + "?" + req.url.split("?")[1];
              }
              redirect(location, nonscode.scode == 302);
              return;
            } else if (nonscode.scode == 403) {
              callServerError(403);
              serverconsole.errmessage("Content blocked.");
              return;
            } else if (nonscode.scode == 410) {
              callServerError(410);
              serverconsole.errmessage("Content is gone.");
              return;
            } else if (nonscode.scode == 418) {
              callServerError(418);
              serverconsole.errmessage("SVR.JS is always a teapot ;)");
              return;
            } else {
              callServerError(nonscode.scode);
              serverconsole.errmessage("Client fails recieving content.");
              return;
            }
          }
          if (authIndex > -1) {
            var authcode = nonStandardCodes[authIndex];

            function authorizedCallback(bruteProtection) {
              var ha = getCustomHeaders();
              ha["WWW-Authenticate"] = "Basic realm=\"" + (authcode.realm ? authcode.realm.replace(/(\\|")/g, "\\$1") : "SVR.JS HTTP Basic Authorization") + "\", charset=\"UTF-8\"";
              var credentials = req.headers["authorization"];
              if (!credentials) {
                callServerError(401, undefined, undefined, ha);
                serverconsole.errmessage("Content needs authorization.");
                return;
              }
              var cmatch = credentials.match(/^Basic (.+)$/);
              if (!cmatch) {
                callServerError(401, undefined, undefined, ha);
                serverconsole.errmessage("Malformed credentials.");
                return;
              }
              var c2 = Buffer.from(cmatch[1], "base64").toString("utf8");
              var c2match = c2.match(/^([^:]*):(.*)$/);
              if (!c2match) {
                callServerError(401, undefined, undefined, ha);
                serverconsole.errmessage("Malformed credentials.");
                return;
              }
              var username = c2match[1];
              var password = c2match[2];
              var authorized = false;
              for (var i = 0; i < users.length; i++) {
                var hash = sha256(password + users[i].salt);
                if (users[i].name == username && users[i].pass == hash) {
                  authorized = true;
                  break;
                }
              }
              if (!authorized) {
                if (bruteProtection) {
                  if (process.send) {
                    process.send("\x12AUTHW" + reqip);
                  } else {
                    if (!bruteForceDb[reqip]) bruteForceDb[reqip] = {
                      invalidAttempts: 0
                    };
                    bruteForceDb[reqip].invalidAttempts++;
                    if (bruteForceDb[reqip].invalidAttempts >= 10) {
                      bruteForceDb[reqip].lastAttemptDate = new Date();
                    }
                  }
                }
                callServerError(401, undefined, undefined, ha);
                serverconsole.errmessage("User " + username + " failed to log in.");
              } else {
                if (bruteProtection) {
                  if (process.send) {
                    process.send("\x12AUTHR" + reqip);
                  } else {
                    if (bruteForceDb[reqip]) bruteForceDb[reqip] = {
                      invalidAttempts: 0
                    };
                  }
                }
                modExecute(mods, vres(req, res, serverconsole, responseEnd, href, ext, uobject, search, "index.html", users, page404, head, foot, fd, callServerError, getCustomHeaders, origHref, redirect, parsePostData));
              }
            }
            if (authcode.disableBruteProtection) {
              authorizedCallback(false);
            } else if (!process.send) {
              if (!bruteForceDb[reqip] || !bruteForceDb[reqip].lastAttemptDate || (new Date() - 300000 >= bruteForceDb[reqip].lastAttemptDate)) {
                if (bruteForceDb[reqip] && bruteForceDb[reqip].invalidAttempts >= 10) bruteForceDb[reqip] = {
                  invalidAttempts: 5
                };
                authorizedCallback(true);
              } else {
                callServerError(429);
                serverconsole.errmessage("Brute force limit reached!");
              }
            } else {
              var listenerEmitted = false;

              function authMessageListener(message) {
                if (listenerEmitted) return;
                if (message == "\x14AUTHA" + reqip || message == "\x14AUTHD" + reqip) {
                  process.removeListener("message", authMessageListener);
                  listenerEmitted = true;
                }
                if (message == "\x14AUTHD" + reqip) {
                  callServerError(429);
                  serverconsole.errmessage("Brute force limit reached!");
                } else if (message == "\x14AUTHA" + reqip) {
                  authorizedCallback(true);
                }
              }
              process.on("message", authMessageListener);
              process.send("\x12AUTHQ" + reqip);
            }
          } else {
            modExecute(mods, vres(req, res, serverconsole, responseEnd, href, ext, uobject, search, "index.html", users, page404, head, foot, fd, callServerError, getCustomHeaders, origHref, redirect, parsePostData));
          }
        }
      } catch (ex) {
        //CRASH HANDLER
        if (ex.message == "Intentionally crashed") throw ex; //If intentionally crashed, then crash SVR.JS
        callServerError(500, undefined, generateErrorStack(ex)); //Else just return 500 error
      }
    }

  }
  //Listen port to server
  server.on("error", function (err) {
    if (err.code == "EADDRINUSE" || err.code == "EADDRNOTAVAIL" || err.code == "EACCES") {
      attmts--;
      if (cluster.isPrimary === undefined) {
        if (err.code == "EADDRINUSE") {
          serverconsole.locerrmessage("Address in use by another process.");
        } else if (err.code == "EADDRNOTAVAIL") {
          serverconsole.locerrmessage("Address not available.");
        } else if (err.code == "EACCES") {
          serverconsole.locerrmessage("Access denied.");
        }
        serverconsole.locmessage(attmts + " attempts left.");
      } else {
        process.send("\x12ERRLIST" + attmts + err.code);
      }
      if (attmts > 0) {
        server2.close();
        setTimeout(start, 900);
      } else {
        if (cluster.isPrimary !== undefined) process.send("\x12" + err.code);
        process.exit(errors[err.code]);
      }
    } else {
      serverconsole.locerrmessage("There was a problem starting SVR.JS!!!");
      serverconsole.locerrmessage("Stack:");
      serverconsole.locerrmessage(generateErrorStack(err));
      if (cluster.isPrimary !== undefined) process.send("\x12CRASH");
      process.exit(err.code ? errors[err.code] : 1);
    }
  });

  server.once("listening", function () {
    listeningMessage();
  });
}

function listenConnListener(msg) {
  if (msg == "\x12LISTEN") {
    listeningMessage();
  }
}

function bruteForceListenerWrapper(worker) {
  return function bruteForceListener(message) {
    var ip = "";
    if (message.substr(0, 6) == "\x12AUTHQ") {
      ip = message.substr(6);
      if (!bruteForceDb[ip] || !bruteForceDb[ip].lastAttemptDate || (new Date() - 300000 >= bruteForceDb[ip].lastAttemptDate)) {
        if (bruteForceDb[ip] && bruteForceDb[ip].invalidAttempts >= 10) bruteForceDb[ip] = {
          invalidAttempts: 5
        };
        worker.send("\x14AUTHA" + ip);
      } else {
        worker.send("\x14AUTHD" + ip);
      }
    } else if (message.substr(0, 6) == "\x12AUTHR") {
      ip = message.substr(6);
      if (bruteForceDb[ip]) bruteForceDb[ip] = {
        invalidAttempts: 0
      };
    } else if (message.substr(0, 6) == "\x12AUTHW") {
      ip = message.substr(6);
      if (!bruteForceDb[ip]) bruteForceDb[ip] = {
        invalidAttempts: 0
      };
      bruteForceDb[ip].invalidAttempts++;
      if (bruteForceDb[ip].invalidAttempts >= 10) {
        bruteForceDb[ip].lastAttemptDate = new Date();
      }
    }
  };
}

function msgListener(msg) {
  for (var i = 0; i < Object.keys(cluster.workers).length; i++) {
    if (msg == "\x12END") {
      cluster.workers[Object.keys(cluster.workers)[i]].removeAllListeners("message");
      cluster.workers[Object.keys(cluster.workers)[i]].on("message", bruteForceListenerWrapper(cluster.workers[Object.keys(cluster.workers)[i]]));
      cluster.workers[Object.keys(cluster.workers)[i]].on("message", listenConnListener);
    }
  }
  if (msg == "\x12CLOSE") {
    closedMaster = true;
  } else if (msg == "\x12LISTEN" || msg.substr(0, 4) == "\x12AUTH") {
    //Do nothing!
  } else if (msg == "\x12SAVEGOOD") {
    serverconsole.locmessage("Configuration saved.");
  } else if (msg.indexOf("\x12SAVEERR") == 0) {
    serverconsole.locwarnmessage("There was a problem, while saving configuration file. Reason: " + msg.substr(8));
  } else if (msg == "\x12OPEN") {
    closedMaster = false;
  } else if (msg == "\x12END") {
    cluster.workers[Object.keys(cluster.workers)[0]].on("message", function (msg) {
      if (msg.length > 9 && msg.indexOf("\x12ERRLIST") == 0) {
        var tries = parseInt(msg.substr(8, 1));
        var errCode = msg.substr(9);
        if (errCode == "EADDRINUSE") {
          serverconsole.locerrmessage("Address in use by another process.");
        } else if (errCode == "EADDRNOTAVAIL") {
          serverconsole.locerrmessage("Address not available.");
        } else if (errCode == "EACCES") {
          serverconsole.locerrmessage("Access denied.");
        }
        serverconsole.locmessage(tries + " attempts left.");
      }
      if (msg == "\x12CRASH") process.exit(1);
      if (msg == "\x12EADDRINUSE" || msg == "\x12EADDRNOTAVAIL" || msg == "\x12EACCES") process.exit(errors[msg.substr(1)]);
    });
  } else {
    serverconsole.climessage(msg);
  }
}

var messageTransmitted = false;

function listeningMessage() {
  if (messageTransmitted) return;
  messageTransmitted = true;
  if (!cluster.isPrimary && cluster.isPrimary !== undefined) {
    process.send("\x12LISTEN");
    return;
  }
  serverconsole.locmessage("Started server at: ");
  if (secure) serverconsole.locmessage("* https://localhost" + (sport == 443 ? "" : (":" + sport)));
  if (!(secure && disableNonEncryptedServer)) serverconsole.locmessage("* http://localhost" + (port == 80 ? "" : (":" + port)));
  if (host != "" && host != "[offline]") {
    if (secure) serverconsole.locmessage("* https://" + (host.indexOf(":") > -1 ? "[" + host + "]" : host) + (sport == 443 ? "" : (":" + sport)));
    if (!(secure && disableNonEncryptedServer)) serverconsole.locmessage("* http://" + (host.indexOf(":") > -1 ? "[" + host + "]" : host) + (port == 80 ? "" : (":" + port)));
  }
  ipStatusCallback(function () {
    if (pubip != "") {
      if (secure) serverconsole.locmessage("* https://" + (pubip.indexOf(":") > -1 ? "[" + pubip + "]" : pubip) + (spubport == 443 ? "" : (":" + spubport)));
      if (!(secure && disableNonEncryptedServer)) serverconsole.locmessage("* http://" + (pubip.indexOf(":") > -1 ? "[" + pubip + "]" : pubip) + (pubport == 80 ? "" : (":" + pubport)));
    }
    if (domain != "") {
      if (secure) serverconsole.locmessage("* https://" + domain + (spubport == 443 ? "" : (":" + spubport)));
      if (!(secure && disableNonEncryptedServer)) serverconsole.locmessage("* http://" + domain + (pubport == 80 ? "" : (":" + pubport)));
    }
    serverconsole.locmessage("For CLI help type \"help\"");
  });
}

var closedMaster = false;

function start(init) {
  init = Boolean(init);
  if (cluster.isPrimary || cluster.isPrimary === undefined) {
    if (init) {
      for (i = 0; i < logo.length; i++) console.log(logo[i]); //Print logo
      console.log();
      console.log("Welcome to DorianTech SVR.JS server.");
      if (version.indexOf("Nightly-") === 0) serverconsole.locwarnmessage("This version is only for test purposes and may be unstable.");
      if (vnum <= 57 && JSON.stringify(rewriteMap) != "[]") serverconsole.locwarnmessage("Some URL rewriting regexes will not work in Node.JS 8.x and earlier.");
      if (http2.__disabled__ !== undefined) serverconsole.locwarnmessage("HTTP/2 isn't supported by your Node.JS version!");
      if (process.isBun) serverconsole.locwarnmessage("Bun support is experimental.");
      if (cluster.isPrimary === undefined) serverconsole.locwarnmessage("You're running SVR.JS on single thread. Reliability may suffer.");
      if (crypto.__disabled__ !== undefined) serverconsole.locwarnmessage("Your Node.JS version doesn't have crypto support!");
      if (!process.isBun && process.version == "v8.5.0") serverconsole.locwarnmessage("Your Node.JS version is vulnerable to path validation vulnerability (CVE-2017-14849).");
      if (process.getuid && process.getuid() == 0) serverconsole.locwarnmessage("You're running SVR.JS as root. It's recommended to run SVR.JS as an non-root user.");
      if (secure && process.versions && process.versions.openssl && process.versions.openssl.substr(0, 2) == "1.") {
        if (new Date() > new Date("11 September 2023")) {
          serverconsole.locwarnmessage("OpenSSL 1.x is no longer recieving security updates after 11th September 2023. Your HTTPS communication might be vulnerable.");
        } else {
          serverconsole.locwarnmessage("OpenSSL 1.x will no longer recieve security updates after 11th September 2023. Your HTTPS communication might be vulnerable in future.");
        }
      }
      if (secure && configJSON.enableOCSPStapling && ocsp._errored) serverconsole.locwarnmessage("Can't load OCSP module. OCSP stapling will be disabled");
      if (vnum < 64) serverconsole.locwarnmessage("SVR.JS 3.5.0 and newer are no longer supported on Node.JS 8.x and 9.x");
      if (disableMods) serverconsole.locwarnmessage("SVR.JS is running without mods and server-side JavaScript enabled.");
      console.log();
      serverconsole.locmessage("Server version: " + version);
      if (process.isBun) serverconsole.locmessage("Bun version: v" + process.versions.bun);
      else serverconsole.locmessage("Node.JS version: " + process.version);
      var CPUs = os.cpus();
      if (CPUs.length > 0) serverconsole.locmessage("CPU: " + (CPUs.length > 1 ? CPUs.length + "x " : "") + CPUs[0].model);
      if (vnum < 57) {
        throw new Error("SVR.JS requires Node.JS 8.4.0 and newer, but your Node.JS version isn't supported by SVR.JS.");
      }
    }
    if (!(secure && disableNonEncryptedServer)) serverconsole.locmessage("Starting HTTP server at localhost:" + port.toString() + "...");
    if (secure) serverconsole.locmessage("Starting HTTPS server at localhost:" + sport.toString() + "...");
  }


  if (!cluster.isPrimary) {
    try {
      server.listen(secure ? sport : port);
    } catch(err) {
      if(err.code != "ERR_SERVER_ALREADY_LISTEN") throw err;
    }
    if (secure && !disableNonEncryptedServer) {
      try {
        server2.listen(port);
      } catch(err) {
        if(err.code != "ERR_SERVER_ALREADY_LISTEN") throw err;
      }
    }
  }


  var commands = {
    close: function () {
      try {
        server.close();
        if (secure && !disableNonEncryptedServer) {
          server2.close();
        }
        if (cluster.isPrimary === undefined) serverconsole.climessage("Server closed.");
        else {
          process.send("Server closed.");
          process.send("\x12CLOSE");
        }
      } catch (ex) {
        if (cluster.isPrimary === undefined) serverconsole.climessage("Cannot close server! Reason: " + ex.message);
        else process.send("Cannot close server! Reason: " + ex.message);
      }
    },
    open: function () {
      try {
        if (secure) {
          server.listen(sport);
          if (!disableNonEncryptedServer) server2.listen(port);
        } else {
          server.listen(port); // ReOpen Server
        }
        if (cluster.isPrimary === undefined) serverconsole.climessage("Server opened.");
        else {
          process.send("Server opened.");
          process.send("\x12OPEN");
        }
      } catch (ex) {
        if (cluster.isPrimary === undefined) serverconsole.climessage("Cannot open server! Reason: " + ex.message);
        else process.send("Cannot open server! Reason: " + ex.message);
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
      if (typeof retcode == "number") {
        process.exit(retcode);
      } else {
        process.exit(0);
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
          if (ip[i].indexOf(":") == -1) {
            ip[i] = "::ffff:" + ip[i];
          }
          if (!blacklist.check(ip[i])) {
            blacklist.add(ip[i]);
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
          blacklist.remove(ip[i]);
        }
        if (cluster.isPrimary === undefined) serverconsole.climessage("IPs successfully unblocked.");
        else if (!cluster.isPrimary) process.send("IPs successfully unblocked.");
      }
    },
    restart: function () {
      if (cluster.isPrimary === undefined) serverconsole.climessage("This command is not supported on single-threaded SVR.JS.");
      else process.send("This command need to be run in SVR.JS master.");
    }
  };


  if (init) {
    if (cluster.isPrimary === undefined) {
      setInterval(function () {
        try {
          saveConfig();
          serverconsole.locmessage("Configuration saved.");
        } catch (ex) {
          throw new Error(ex);
        }
      }, 300000);
    } else if (cluster.isPrimary) {
      setInterval(function () {
        var allClusters = Object.keys(cluster.workers);
        for (var i = 0; i < allClusters.length; i++) {
          try {
            if (cluster.workers[allClusters[i]]) {
              cluster.workers[allClusters[i]].on("message", msgListener);
              cluster.workers[allClusters[i]].send("\x14SAVECONF");
            }
          } catch (ex) {
            if (cluster.workers[allClusters[i]]) {
              cluster.workers[allClusters[i]].removeAllListeners("message");
              cluster.workers[allClusters[i]].on("message", bruteForceListenerWrapper(cluster.workers[allClusters[i]]));
              cluster.workers[allClusters[i]].on("message", listenConnListener);
            }
            serverconsole.locwarnmessage("There was a problem, while saving configuration file. Reason: " + ex.message);
          }
        }
      }, 300000);
    }
    if (!cluster.isPrimary && cluster.isPrimary !== undefined) {
      process.on("message", function (line) {
        try {
          if (line == "") {
            //Does Nothing
            process.send("\x12END");
          } else if (line == "\x14SAVECONF") {
            //Save configuration file
            try {
              saveConfig();
              process.send("\x12SAVEGOOD");
            } catch (ex) {
              process.send("\x12SAVEERR" + ex.message);
            }
            process.send("\x12END");
          } else if (commands[line.split(" ")[0]] !== undefined && commands[line.split(" ")[0]] !== null) {
            var argss = line.split(" ");
            var command = argss.shift();
            commands[command](argss);
            process.send("\x12END");
          } else {
            process.send("Unrecognized command \"" + line.split(" ")[0] + "\".");
            process.send("\x12END");
          }
        } catch (ex) {
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
            var allClusters = Object.keys(cluster.workers);
            if (command == "block") commands.block(argss);
            if (command == "unblock") commands.unblock(argss);
            if (command == "restart") {
              var stopError = false;
              exiting = true;
              for (var i = 0; i < allClusters.length; i++) {
                try {
                  if (cluster.workers[allClusters[i]]) {
                    cluster.workers[allClusters[i]].kill();
                  }
                } catch (ex) {
                  stopError = true;
                }
              }
              if (stopError) serverconsole.climessage("Some SVR.JS workers might not be stopped.");
              SVRJSInitialized = false;
              var cpus = os.cpus().length;
              if (cpus > 16) cpus = 16;
              try {
                var useAvailableCores = Math.round((os.freemem()) / 50000000) - 1; //1 core deleted for safety...
                if (cpus > useAvailableCores) cpus = useAvailableCores;
              } catch (ex) {
                //Nevermind... Don't want SVR.JS to fail starting, because os.freemem function is not working.
              }
              if (cpus < 1) cpus = 1; //If SVR.JS is run on Haiku or if useAvailableCores = 0
              for (var i = 0; i < cpus; i++) {
                if (i == 0) {
                  SVRJSFork();
                } else {
                  setTimeout((function (i) {
                    return function () {
                      SVRJSFork();
                      if (i >= cpus - 1) {
                        SVRJSInitialized = true;
                        exiting = false;
                        serverconsole.climessage("SVR.JS workers restarted.");
                      }
                    };
                  })(i), i * 6.6);
                }
              }
              return;
            }
            if (command == "stop") {
              exiting = true;
              allClusters = Object.keys(cluster.workers);
            }
            for (var i = 0; i < allClusters.length; i++) {
              try {
                if (cluster.workers[allClusters[i]]) {
                  cluster.workers[allClusters[i]].on("message", msgListener);
                  cluster.workers[allClusters[i]].send(line);
                }
              } catch (ex) {
                if (cluster.workers[allClusters[i]]) {
                  cluster.workers[allClusters[i]].removeAllListeners("message");
                  cluster.workers[allClusters[i]].on("message", bruteForceListenerWrapper(cluster.workers[allClusters[i]]));
                  cluster.workers[allClusters[i]].on("message", listenConnListener);
                }
                serverconsole.climessage("Can't run command \"" + command + "\".");
              }
            }
            if (command == "stop") {
              setTimeout(function () {
                process.exit(0);
              }, 50);
            }
          } else {
            if (command == "stop") process.exit(0);
            try {
              commands[command](argss);
            } catch (ex) {
              serverconsole.climessage("Unrecognized command \"" + command + "\".");
            }
          }
        }
        rla.prompt();
      });
    }

    if (cluster.isPrimary || cluster.isPrimary === undefined) {
      //Cluster forking code
      if (cluster.isPrimary !== undefined && init) {
        var cpus = os.cpus().length;
        if (cpus > 16) cpus = 16;
        try {
          var useAvailableCores = Math.round((os.freemem()) / 50000000) - 1; //1 core deleted for safety...
          if (cpus > useAvailableCores) cpus = useAvailableCores;
        } catch (ex) {
          //Nevermind... Don't want SVR.JS to fail starting, because os.freemem function is not working.
        }
        if (cpus < 1) cpus = 1; //If SVR.JS is run on Haiku or if useAvailableCores = 0
        for (var i = 0; i < cpus; i++) {
          if (i == 0) {
            SVRJSFork();
          } else {
            setTimeout((function (i) {
              return function () {
                SVRJSFork();
                if (i >= cpus - 1) SVRJSInitialized = true;
              };
            })(i), i * 6.6);
          }
        }
        cluster.workers[Object.keys(cluster.workers)[0]].on("message", function (msg) {
          if (msg.length > 9 && msg.indexOf("\x12ERRLIST") == 0) {
            var tries = parseInt(msg.substr(8, 1));
            var errCode = msg.substr(9);
            if (errCode == "EADDRINUSE") {
              serverconsole.locerrmessage("Address in use by another process.");
            } else if (errCode == "EADDRNOTAVAIL") {
              serverconsole.locerrmessage("Address not available.");
            } else if (errCode == "EACCES") {
              serverconsole.locerrmessage("Access denied.");
            }
            serverconsole.locmessage(tries + " attempts left.");
          }
          if (msg == "\x12CRASH") process.exit(1);
          if (msg == "\x12EADDRINUSE" || msg == "\x12EADDRNOTAVAIL" || msg == "\x12EACCES") process.exit(errors[msg.substr(1)]);
        });

        setInterval(function () {
          if (!closedMaster && !exiting) {
            var chksocket = {};
            if (secure && disableNonEncryptedServer) {
              chksocket = https.get({
                port: sport,
                headers: {
                  "X-SVR-JS-From-Main-Thread": "true",
                  "User-Agent": (exposeServerVersion ? "SVR.JS/" + version + " (" + getOS() + "; " + (process.isBun ? ("Bun/v" + process.versions.bun + "; like Node.JS/" + process.version) : ("Node.JS/" + process.version)) + ")" : "SVR.JS")
                },
                timeout: 2000,
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
            } else if ((configJSON.enableHTTP2 == undefined ? false : configJSON.enableHTTP2) && !secure) {
              var connection = http2.connect("http://localhost:" + port.toString());
              connection.on("error", function () {
                if (!exiting) {
                  if (!crashed) SVRJSFork();
                  else crashed = false;
                }
              });
              connection.setTimeout(2000, function () {
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
                port: port,
                headers: {
                  "X-SVR-JS-From-Main-Thread": "true",
                  "User-Agent": (exposeServerVersion ? "SVR.JS/" + version + " (" + getOS() + "; " + (process.isBun ? ("Bun/v" + process.versions.bun + "; like Node.JS/" + process.version) : ("Node.JS/" + process.version)) + ")" : "SVR.JS")
                },
                timeout: 2000
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
        }, 5000);
      }
    }
  }
}

//Save configuration file
function saveConfig() {
  for (var i = 0; i < 3; i++) {
    try {
      var configJSONobj = {};
      if (fs.existsSync(__dirname + "/config.json")) configJSONobj = JSON.parse(fs.readFileSync(__dirname + "/config.json").toString());
      if (configJSONobj.users === undefined) configJSONobj.users = [];
      if (secure) {
        if (configJSONobj.key === undefined) configJSONobj.key = "cert/key.key";
        if (configJSONobj.cert === undefined) configJSONobj.cert = "cert/cert.crt";
        if (configJSONobj.sport === undefined) configJSONobj.sport = 443;
        if (configJSONobj.spubport === undefined) configJSONobj.spubport = 443;
        if (configJSONobj.sni === undefined) configJSONobj.sni = {};
        if (configJSONobj.enableOCSPStapling === undefined) configJSONobj.enableOCSPStapling = false;
      }
      if (configJSONobj.port === undefined) configJSONobj.port = 80;
      if (configJSONobj.pubport === undefined) configJSONobj.pubport = 80;
      if (configJSONobj.domain === undefined && configJSONobj.domian !== undefined) configJSONobj.domain = configJSONobj.domian;
      delete configJSONobj.domian;
      if (configJSONobj.page404 === undefined) configJSONobj.page404 = "404.html";
      configJSONobj.timestamp = timestamp;
      configJSONobj.blacklist = blacklist.raw;
      if (configJSONobj.nonStandardCodes === undefined) configJSONobj.nonStandardCodes = [];
      if (configJSONobj.enableCompression === undefined) configJSONobj.enableCompression = true;
      if (configJSONobj.customHeaders === undefined) configJSONobj.customHeaders = {};
      if (configJSONobj.enableHTTP2 === undefined) configJSONobj.enableHTTP2 = false;
      if (configJSONobj.enableLogging === undefined) configJSONobj.enableLogging = true;
      if (configJSONobj.enableDirectoryListing === undefined) configJSONobj.enableDirectoryListing = true;
      if (configJSONobj.enableDirectoryListingWithDefaultHead === undefined) configJSONobj.enableDirectoryListingWithDefaultHead = false;
      if (configJSONobj.serverAdministratorEmail === undefined) configJSONobj.serverAdministratorEmail = "[no contact information]";
      if (configJSONobj.stackHidden === undefined) configJSONobj.stackHidden = false;
      if (configJSONobj.enableRemoteLogBrowsing === undefined) configJSONobj.enableRemoteLogBrowsing = true;
      if (configJSONobj.exposeServerVersion === undefined) configJSONobj.exposeServerVersion = true;
      if (configJSONobj.disableServerSideScriptExpose === undefined) configJSONobj.disableServerSideScriptExpose = false;
      if (configJSONobj.allowStatus === undefined) configJSONobj.allowStatus = true;
      if (configJSONobj.rewriteMap === undefined) configJSONobj.rewriteMap = [];
      if (configJSONobj.dontCompress === undefined) configJSONobj.dontCompress = [];
      if (configJSONobj.enableIPSpoofing === undefined) configJSONobj.enableIPSpoofing = false;
      if (configJSONobj.secure === undefined) configJSONobj.secure = false;
      if (configJSONobj.disableNonEncryptedServer === undefined) configJSONobj.disableNonEncryptedServer = false;
      if (configJSONobj.disableToHTTPSRedirect === undefined) configJSONobj.disableToHTTPSRedirect = false;
      //configJSONobj.wwwroot = configJSON.wwwroot;

      var configString = JSON.stringify(configJSONobj, null, 2);
      fs.writeFileSync(__dirname + "/config.json", configString);
      break;
    } catch (ex) {
      if (i >= 2) throw ex;
      var now = Date.now();
      while (Date.now() - now < 2);
    }
  }
}

//Process event listeners
if (cluster.isPrimary || cluster.isPrimary === undefined) {
  process.on("uncaughtException", function (ex) {
    //CRASH HANDLER
    serverconsole.locerrmessage("SVR.JS master process just crashed!!!");
    serverconsole.locerrmessage("Stack:");
    serverconsole.locerrmessage(generateErrorStack(ex));
    process.exit(ex.errno);
  });
  process.on("unhandledRejection", function (ex) {
    //CRASH HANDLER
    serverconsole.locerrmessage("SVR.JS master process just crashed!!!");
    serverconsole.locerrmessage("Stack:");
    serverconsole.locerrmessage(ex.stack ? generateErrorStack(ex) : String(ex));
    process.exit(ex.errno);
  });
  process.on("exit", function (code) {
    try {
      saveConfig();
    } catch (ex) {
      serverconsole.locwarnmessage("There was a problem, while saving configuration file. Reason: " + ex.message);
    }
    try {
      deleteFolderRecursive(__dirname + "/temp");
    } catch (ex) {
      //Error!
    }
    try {
      fs.mkdirSync(__dirname + "/temp");
    } catch (ex) {
      //Error!
    }
    serverconsole.locmessage("Server closed with exit code: " + code);
  });
  process.on("warning", function (warning) {
    serverconsole.locwarnmessage(warning.message);
    if (generateErrorStack(warning)) {}
    if (process.isBun) {
      try {
        fs.writeFileSync(__dirname + "/temp/serverSideScript.js", "//Placeholder server-side JavaScript to workaround Bun bug.\r\n");
      } catch (ex) {
        //Error!
      }
      serverconsole.locwarnmessage("Stack:");
      serverconsole.locwarnmessage(generateErrorStack(warning));
    }
  });
  process.on("SIGINT", function () {
    if (cluster.isPrimary !== undefined) {
      exiting = true;
      var allClusters = Object.keys(cluster.workers);
      for (var i = 0; i < allClusters.length; i++) {
        try {
          if (cluster.workers[allClusters[i]]) {
            cluster.workers[allClusters[i]].send("stop");
          }
        } catch (ex) {
          //Worker will crash with EPIPE anyway.
        }
      }
    }
    serverconsole.locmessage("Server terminated using SIGINT");
    process.exit();
  });
} else {
  process.on("uncaughtException", function (ex) {
    //CRASH HANDLER
    serverconsole.locerrmessage("SVR.JS worker just crashed!!!");
    serverconsole.locerrmessage("Stack:");
    serverconsole.locerrmessage(generateErrorStack(ex));
    process.exit(ex.errno);
  });
  process.on("unhandledRejection", function (ex) {
    //CRASH HANDLER
    serverconsole.locerrmessage("SVR.JS worker just crashed!!!");
    serverconsole.locerrmessage("Stack:");
    serverconsole.locerrmessage(ex.stack ? generateErrorStack(ex) : String(ex));
    process.exit(ex.errno);
  });
  process.on("warning", function (warning) {
    serverconsole.locwarnmessage(warning.message);
    if (warning.stack) {
      serverconsole.locwarnmessage("Stack:");
      serverconsole.locwarnmessage(generateErrorStack(warning));
    }
  });
}
//Call start
try {
  start(true);
} catch (ex) {
  serverconsole.locerrmessage("There was a problem starting SVR.JS!!!");
  serverconsole.locerrmessage("Stack:");
  serverconsole.locerrmessage(generateErrorStack(ex));
  process.exit(ex.errno);
}
