
/////////////////////////////////////////
//                                     //
//             S V R . J S             //
//        S O U R C E   C O D E        //
//                                     //
/////////////////////////////////////////
/////////////////////////////////////////
//////      DorianTech SVR.JS      //////
//////web server running on Node.JS//////
/////////////////////////////////////////
/////////////////////////////////////////


/*
 * MIT License
 * 
 * Copyright (c) 2020 DorianTech S.A.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

//Check if SVR.JS is running on Node.JS-compatible runtime. If not, just error it out.
if (typeof require === "undefined") {
  if (typeof ActiveXObject !== "undefined" && typeof WScript !== "undefined") {
    // If it runs on Windows Script Host, display an error message.
    var shell = new ActiveXObject("WScript.Shell");
    shell.Popup("SVR.JS doesn't work on Windows Script Host. SVR.JS requires use of Node.JS (or compatible JS runtime).", undefined, "Can't start SVR.JS", 16);
    WScript.quit();
  } else {
    if (typeof alert !== "undefined" && typeof document !== "undefined") {
      // If it runs on web browser, display an alert.
      alert("SVR.JS doesn't work on web browser. SVR.JS requires use of Node.JS (or compatible JS runtime).");
    }
    // If it's not, throw an error.
    if (typeof document !== "undefined") {
      throw new Error("SVR.JS doesn't work on web browser. SVR.JS requires use of Node.JS (or compatible JS runtime).");
    } else {
      throw new Error("SVR.JS doesn't work on Deno/QuickJS. SVR.JS requires use of Node.JS (or compatible JS runtime).");
    }
  }
}

var secure = false;
var disableMods = false;

//ASCII art SVR.JS logo ;)
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
var version = "3.7.0";
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
var cluster = {};
if (!singlethreaded) {
  try {
    // Import cluster module
    var cluster = require("cluster");
  } catch (err) {
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

// ETag-related
var ETagDB = {};
function generateETag(filePath, stat) {
  if(!ETagDB[filePath + "-" + stat.size + "-" + stat.mtime]) ETagDB[filePath + "-" + stat.size + "-" + stat.mtime] = sha256(filePath + "-" + stat.size + "-" + stat.mtime);
  return ETagDB[filePath + "-" + stat.size + "-" + stat.mtime];
}

// Brute force-related
var bruteForceDb = {};

// PBKDF2 cache
var pbkdf2Cache = [];
var scryptCache = [];
var pbkdf2CacheIntervalId = -1;

// SVR.JS worker spawn-related
var SVRJSInitialized = false;
var exiting = false;
var reallyExiting = false;
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
try {
  var gracefulFs = require("graceful-fs");
  if (!process.isBun) gracefulFs.gracefulify(fs); //Bun + graceful-fs + SVR.JS + requests about static content = 500 Internal Server Error!
} catch (err) {
  //Don't use graceful-fs
}
var path = require("path");
var hexstrbase64 = undefined;
try {
  hexstrbase64 = require("./hexstrbase64/index.js");
} catch (err) {
  //Don't use hexstrbase64
}
var svrmodpack = undefined;
try {
  svrmodpack = require("svrmodpack");
} catch (err) {
  svrmodpack = {
    _errored: err
  };
}
var zlib = require("zlib");
var tar = undefined;
try {
  tar = require("tar");
} catch (err) {
  tar = {
    _errored: err
  };
}
var formidable = undefined;
try {
  formidable = require("formidable");
} catch (err) {
  formidable = {
    _errored: err
  };
}
var ocsp = undefined;
var ocspCache = undefined;
try {
  ocsp = require("ocsp");
  ocspCache = new ocsp.Cache();
} catch (err) {
  ocsp = {
    _errored: err
  };
}
var prettyBytes = undefined;
try {
  prettyBytes = require("pretty-bytes");
} catch (err) {
  prettyBytes = {
    _errored: err
  };
}
var http2 = {};
try {
  http2 = require("http2");
  if (process.isBun) {
    try {
      http2.Http2ServerRequest();
    } catch (err) {
      if (err.name == "NotImplementedError" || err.code == "ERR_NOT_IMPLEMENTED") throw err;
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
var crypto = {};
var https = {};
try {
  crypto = require("crypto");
  https = require("https");
} catch (err) {
  crypto = {};
  https = {};
  crypto.__disabled__ = null;
  https.createServer = function () {
    throw new Error("Crypto support is not present");
  };
  http2.createSecureServer = function () {
    throw new Error("Crypto support is not present");
  };
  https.connect = function () {
    throw new Error("Crypto support is not present");
  };
  https.get = function () {
    throw new Error("Crypto support is not present");
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
  } catch (err) {
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

function createRegex(regex, isPath) {
  var regexStrMatch = regex.match(/^\/((?:\\.|[^\/\\])*)\/([a-zA-Z0-9]*)$/);
  if (!regexStrMatch) throw new Error("Invalid regex!");
  var searchString = regexStrMatch[1];
  var modifiers = regexStrMatch[2];
  if (isPath && !modifiers.match(/i/i) && os.platform() == "win32") modifiers += "i";
  return new RegExp(searchString, modifiers);
}

//IP Block list object
function ipBlockList(rawBlockList) {

  // Initialize the instance with empty arrays
  if (rawBlockList === undefined) rawBlockList = [];
  var instance = {
    raw: [],
    rawtoPreparedMap: [],
    prepared: [],
    cidrs: []
  };

  // Function to normalize IPv4 address (remove leading zeros)
  function normalizeIPv4Address(address) {
    return address.replace(/(^|\.)(?:0(?!\.|$))+/g, "");
  }

  // Function to expand IPv6 address to full format
  function expandIPv6Address(address) {
    var fullAddress = "";
    var expandedAddress = "";
    var validGroupCount = 8;
    var validGroupSize = 4;

    var ipv4 = "";
    var extractIpv4 = /([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})/;
    var validateIpv4 = /((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})/;

    if (validateIpv4.test(address)) {
      var oldGroups = address.match(extractIpv4);
      for (var i = 1; i < oldGroups.length; i++) {
        ipv4 += ("00" + (parseInt(oldGroups[i], 10).toString(16))).slice(-2) + (i == 2 ? ":" : "");
      }
      address = address.replace(extractIpv4, ipv4);
    }

    if (address.indexOf("::") == -1) {
      fullAddress = address;
    } else {
      var sides = address.split("::");
      var groupsPresent = 0;
      sides.forEach(function (side) {
        groupsPresent += side.split(":").length;
      });
      fullAddress += sides[0] + ":";
      if(validGroupCount - groupsPresent > 1) {
        fullAddress += "0000:".repeat(validGroupCount - groupsPresent);
      }
      fullAddress += sides[1];
    }
    var groups = fullAddress.split(":");
    for (var i = 0; i < validGroupCount; i++) {
      if (groups[i].length < validGroupSize) {
        groups[i] = "0".repeat(validGroupSize - groups[i].length) + groups[i];
      }
      expandedAddress += (i != validGroupCount - 1) ? groups[i] + ":" : groups[i];
    }
    return expandedAddress;
  }

  // Convert IPv4 address to an integer representation
  function ipv4ToInt(ip) {
    var ips = ip.split(".");
    return parseInt(ips[0]) * 16777216 + parseInt(ips[1]) * 65536 + parseInt(ips[2]) * 256 + parseInt(ips[3]);
  }

  // Get IPv4 CIDR block limits (min and max)
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

  // Convert IPv6 address to an array of blocks
  function ipv6ToBlocks(ip) {
    var ips = ip.split(":");
    var ip2s = [];
    ips.forEach(function (ipe) {
      ip2s.push(parseInt(ipe));
    });
    return ip2s;
  }

  // Get IPv6 CIDR block limits (min and max)
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

  // Check if the IPv4 address matches the given CIDR block
  function checkIfIPv4CIDRMatches(ipInt, cidrObject) {
    if (cidrObject.v6) return false;
    return ipInt >= cidrObject.min && ipInt <= cidrObject.max;
  }

  // Check if the IPv6 address matches the given CIDR block
  function checkIfIPv6CIDRMatches(ipBlock, cidrObject) {
    if (!cidrObject.v6) return false;
    for (var i = 0; i < 8; i++) {
      if (ipBlock[i] < cidrObject.min[i] || ipBlock[i] > cidrObject.max[i]) return true;
    }
    return false;
  }

  // Function to add an IP or CIDR block to the block list
  instance.add = function (rawValue) {
    // Initialize variables
    var beginIndex = instance.prepared.length;
    var cidrIndex = instance.cidrs.length;
    var cidrMask = null;
    var isIPv6 = false;

    // Check if the input contains CIDR notation
    if (rawValue.indexOf("/") > -1) {
      var rwArray = rawValue.split("/");
      cidrMask = rwArray.pop();
      rawValue = rwArray.join("/");
    }

    // Normalize the IP address or expand the IPv6 address
    rawValue = rawValue.toLowerCase();
    if (rawValue.indexOf("::ffff:") == 0) rawValue = rawValue.substr(7);
    if (rawValue.indexOf(":") > -1) {
      isIPv6 = true;
      rawValue = expandIPv6Address(rawValue);
    } else {
      rawValue = normalizeIPv4Address(rawValue);
    }

    // Add the IP or CIDR block to the appropriate list
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

  // Function to remove an IP or CIDR block from the block list
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

  // Function to check if an IP is blocked by the block list
  instance.check = function (rawValue) {
    if (instance.raw.length == 0) return false;
    var isIPv6 = false;

    // Normalize or expand the IP address
    rawValue = rawValue.toLowerCase();
    if (rawValue == "localhost") rawValue = "127.0.0.1";
    if (rawValue.indexOf("::ffff:") == 0) rawValue = rawValue.substr(7);
    if (rawValue.indexOf(":") > -1) {
      isIPv6 = true;
      rawValue = expandIPv6Address(rawValue);
    } else {
      rawValue = normalizeIPv4Address(rawValue);
    }

    // Check if the IP is in the prepared list
    if (instance.prepared.indexOf(rawValue) > -1) return true;

    // Check if the IP is within any CIDR block in the block list
    if (instance.cidrs.length == 0) return false;
    var ipParsedObject = (!isIPv6 ? ipv4ToInt : ipv6ToBlocks)(rawValue);
    var checkMethod = (!isIPv6 ? checkIfIPv4CIDRMatches : checkIfIPv6CIDRMatches);
    
    return instance.cidrs.some(function(iCidr) {
      return checkMethod(ipParsedObject, iCidr);
    });
  };

  // Add initial raw block list values to the instance
  rawBlockList.forEach(function (rbe) {
    instance.add(rbe);
  });

  return instance;
}

// Generate V8-style error stack from Error object.
function generateErrorStack(errorObject) {
  // Split the error stack by newlines.
  var errorStack = errorObject.stack ? errorObject.stack.split("\n") : [];

  // If the error stack starts with the error name, return the original stack (it is V8-style then).
  if (errorStack.some(function (errorStackLine) {
      return (errorStackLine.indexOf(errorObject.name) == 0);
    })) {
    return errorObject.stack;
  }

  // Create a new error stack with the error name and code (if available).
  var newErrorStack = [errorObject.name + (errorObject.code ? ": " + errorObject.code : "") + (errorObject.message == "" ? "" : ": " + errorObject.message)];

  // Process each line of the original error stack.
  errorStack.forEach(function (errorStackLine) {
    if (errorStackLine != "") {
      // Split the line into function and location parts (if available).
      var errorFrame = errorStackLine.split("@");
      var location = "";
      if (errorFrame.length > 1) location = errorFrame.pop();
      var func = errorFrame.join("@");

      // Build the new error stack entry with function and location information.
      newErrorStack.push("    at " + (func == "" ? (!location || location == "" ? "<anonymous>" : location) : (func + (!location || location == "" ? "" : " (" + location + ")"))));
    }
  });

  // Join the new error stack entries with newlines and return the final stack.
  return newErrorStack.join("\n");
}


var ifaces = {};
var ifaceEx = null;
try {
  ifaces = os.networkInterfaces();
} catch (err) {
  ifaceEx = err;
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
    alias++;
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
      alias++;
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
  } catch (err) {
    throw new Error("Cannot read JSON file.");
  }
  try {
    configJSON = JSON.parse(configJSONf); //Parse JSON
  } catch (err) {
    throw new Error("JSON Parse error.");
  }
}

//Default server configuration properties
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
var disableUnusedWorkerTermination = false;
var rewriteDirtyURLs = false;

//Get properties from config.json
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
if (configJSON.disableUnusedWorkerTermination != undefined) disableUnusedWorkerTermination = configJSON.disableUnusedWorkerTermination;
if (configJSON.rewriteDirtyURLs != undefined) rewriteDirtyURLs = configJSON.rewriteDirtyURLs;
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
nonStandardCodesRaw.forEach(function (nonStandardCodeRaw) {
  var nO = {};
  Object.keys(nonStandardCodeRaw).forEach(function (nsKey) {
    if (nsKey != "users") {
      nO[nsKey] = nonStandardCodeRaw[nsKey];
    } else {
      nO["users"] = ipBlockList(nonStandardCodeRaw.users);
    }
  });
  nonStandardCodes.push(nO);
});

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
} catch (err) {
  //Version number not retrieved
}

if (vnum === undefined) vnum = 0;
if (process.isBun) vnum = 64;

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

//Load SNI
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

//Logging function
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
  } catch (err) {
    if (!s.match(/^SERVER WARNING MESSAGE(?: \[Request Id: [0-9a-f]{6}\])?: There was a problem while saving logs! Logs will not be kept in log file\. Reason: /) && !reallyExiting) serverconsole.locwarnmessage("There was a problem while saving logs! Logs will not be kept in log file. Reason: " + err.message);
  }
}

var serverconsole = {
  climessage: function (msg) {
    if (msg.indexOf("\n") != -1) {
      msg.split("\n").forEach(function (nmsg) {
        serverconsole.climessage(nmsg);
      });
      return;
    }
    console.log("SERVER CLI MESSAGE: " + msg);
    LOG("SERVER CLI MESSAGE: " + msg);
    return;
  },
  reqmessage: function (msg) {
    if (msg.indexOf("\n") != -1) {
      msg.split("\n").forEach(function (nmsg) {
        serverconsole.reqmessage(nmsg);
      });
      return;
    }
    console.log("\x1b[34mSERVER REQUEST MESSAGE: " + msg + "\x1b[37m\x1b[0m");
    LOG("SERVER REQUEST MESSAGE: " + msg);
    return;
  },
  resmessage: function (msg) {
    if (msg.indexOf("\n") != -1) {
      msg.split("\n").forEach(function (nmsg) {
        serverconsole.resmessage(nmsg);
      });
      return;
    }
    console.log("\x1b[32mSERVER RESPONSE MESSAGE: " + msg + "\x1b[37m\x1b[0m");
    LOG("SERVER RESPONSE MESSAGE: " + msg);
    return;
  },
  errmessage: function (msg) {
    if (msg.indexOf("\n") != -1) {
      msg.split("\n").forEach(function (nmsg) {
        serverconsole.errmessage(nmsg);
      });
      return;
    }
    console.log("\x1b[31mSERVER RESPONSE ERROR MESSAGE: " + msg + "\x1b[37m\x1b[0m");
    LOG("SERVER RESPONSE ERROR MESSAGE: " + msg);
    return;
  },
  locerrmessage: function (msg) {
    if (msg.indexOf("\n") != -1) {
      msg.split("\n").forEach(function (nmsg) {
        serverconsole.locerrmessage(nmsg);
      });
      return;
    }
    console.log("\x1b[41mSERVER ERROR MESSAGE: " + msg + "\x1b[40m\x1b[0m");
    LOG("SERVER ERROR MESSAGE: " + msg);
    return;
  },
  locwarnmessage: function (msg) {
    if (msg.indexOf("\n") != -1) {
      msg.split("\n").forEach(function (nmsg) {
        serverconsole.locwarnmessage(nmsg);
      });
      return;
    }
    console.log("\x1b[43mSERVER WARNING MESSAGE: " + msg + "\x1b[40m\x1b[0m");
    LOG("SERVER WARNING MESSAGE: " + msg);
    return;
  },
  locmessage: function (msg) {
    if (msg.indexOf("\n") != -1) {
      msg.split("\n").forEach(function (nmsg) {
        serverconsole.locmessage(nmsg);
      });
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
      });
      if (process.isBun) {
        setInterval(function () {
          if (!logFile.writable) {
            logFile = undefined;
            logSync = true;
            process.unsafeExit(code);
          }
        }, 50); //Interval
      }
      setTimeout(function () {
        logFile = undefined;
        logSync = true;
        process.unsafeExit(code);
      }, 10000); //timeout
    } catch (err) {
      logFile = undefined;
      logSync = true;
      process.unsafeExit(code);
    }
  } else {
    logSync = true;
    process.unsafeExit(code);
  }
};

// Load mods if the `disableMods` flag is not set
if (!disableMods) {
  // Define the modloader folder name
  var modloaderFolderName = "modloader";
  if (cluster.isPrimary === false) {
    // If not the master process, create a unique modloader folder name for each worker
    modloaderFolderName = ".modloader_w" + Math.floor(Math.random() * 65536);
  }

  // Define the temporary server-side JavaScript file name
  var tempServerSideScriptName = "serverSideScript.js";
  if (!process.isBun && cluster.isPrimary === false) {
    // If not the master process and it's not Bun, create a unique temporary server-side JavaScript file name for each worker
    tempServerSideScriptName = ".serverSideScript_w" + Math.floor(Math.random() * 65536) + ".js";
  }

  // Iterate through the list of mod files
  modFiles.forEach(function (modFileRaw) {
    // Build the path to the current mod file
    var modFile = __dirname + "/mods/" + modFileRaw;

    try {
      // Try creating the modloader folder (if not already exists)
      try {
        fs.mkdirSync(__dirname + "/temp/" + modloaderFolderName);
      } catch (err) {
        // If the folder already exists, continue to the next step
        if (err.code != "EEXIST") {
          // If there was another error, try creating the temp folder and then the modloader folder again
          fs.mkdirSync(__dirname + "/temp");
          try {
            fs.mkdirSync(__dirname + "/temp/" + modloaderFolderName);
          } catch (err) {
            // If there was another error, throw it
            if (err.code != "EEXIST") throw err;
          }
        }
      }

      // Create a subfolder for the current mod within the modloader folder
      fs.mkdirSync(__dirname + "/temp/" + modloaderFolderName + "/" + modFileRaw);
    } catch (err) {
      // If there was an error creating the folder, ignore it if it's a known error
      if (err.code != "EEXIST" && err.code != "ENOENT") throw err;
      // Some other SVR.JS process may have created the files.
    }

    // Check if the current mod file is a regular file
    if (fs.statSync(modFile).isFile()) {
      try {
        // Determine if the mod file is a ".tar.gz" file or not
        if (modFile.indexOf(".tar.gz") == modFile.length - 7) {
          // If it's a ".tar.gz" file, extract its contents using `tar`
          if (tar._errored) throw tar._errored;
          tar.x({
            file: modFile,
            sync: true,
            C: __dirname + "/temp/" + modloaderFolderName + "/" + modFileRaw
          });
        } else {
          // If it's not a ".tar.gz" file, unpack it using `svrmodpack`
          if (svrmodpack._errored) throw svrmodpack._errored;
          svrmodpack.unpack(modFile, __dirname + "/temp/" + modloaderFolderName + "/" + modFileRaw);
        }

        // Initialize variables for mod loading
        var Mod = undefined;
        var mod = undefined;

        // Attempt to require the mod's index.js file, retrying up to 3 times in case of syntax errors
        for (var j = 0; j < 3; j++) {
          try {
            Mod = require("./temp/" + modloaderFolderName + "/" + modFileRaw + "/index.js");
            mod = new Mod();
            break;
          } catch (err) {
            if (j >= 2 || err.name == "SyntaxError") throw err;
            // Wait for a short time before retrying
            var now = Date.now();
            while (Date.now() - now < 2);
            // Try reloading mod
          }
        }

        // Add the loaded mod to the mods list
        mods.push(mod);

        // Attempt to read the mod's info file, retrying up to 3 times
        for (var j = 0; j < 3; j++) {
          try {
            modInfos.push(JSON.parse(fs.readFileSync(__dirname + "/temp/" + modloaderFolderName + "/" + modFileRaw + "/mod.info")));
            break;
          } catch (err) {
            if (j >= 2) {
              // If failed to read info file, add a placeholder entry to modInfos with an error message
              modInfos.push({
                name: "Unknown mod (" + modFileRaw + ";" + err.message + ")",
                version: "ERROR"
              });
            }
            // Wait for a short time before retrying
            var now = Date.now();
            while (Date.now() - now < 2);
            // Try reloading mod info
          }
        }
      } catch (err) {
        // If there was an error during mod loading, log it to the console
        if (cluster.isPrimary || cluster.isPrimary === undefined) {
          serverconsole.locwarnmessage("There was a problem while loading a \"" + modFileRaw + "\" mod.");
          serverconsole.locwarnmessage("Stack:");
          serverconsole.locwarnmessage(generateErrorStack(err));
        }
      }
    }
  });

  // Check if a custom server side script file exists
  if (fs.existsSync("./serverSideScript.js") && fs.statSync("./serverSideScript.js").isFile()) {
    try {
      // Prepend necessary modules and variables to the custom server side script
      var modhead = "var readline = require('readline');\r\nvar os = require('os');\r\nvar http = require('http');\r\nvar url = require('url');\r\nvar fs = require('fs');\r\nvar path = require('path');\r\n" + (hexstrbase64 === undefined ? "" : "var hexstrbase64 = require('../hexstrbase64/index.js');\r\n") + (crypto.__disabled__ === undefined ? "var crypto = require('crypto');\r\nvar https = require('https');\r\n" : "") + "var stream = require('stream');\r\nvar customvar1;\r\nvar customvar2;\r\nvar customvar3;\r\nvar customvar4;\r\n\r\nfunction Mod() {}\r\nMod.prototype.callback = function callback(req, res, serverconsole, responseEnd, href, ext, uobject, search, defaultpage, users, page404, head, foot, fd, elseCallback, configJSON, callServerError, getCustomHeaders, origHref, redirect, parsePostData) {\r\nreturn function () {\r\nvar disableEndElseCallbackExecute = false;\r\nfunction filterHeaders(headers){for(var jsn=JSON.stringify(headers,null,2).split('\\n'),njsn=[\"{\"],i=1;i<jsn.length-1;i++)0!==jsn[i].replace(/ /g,\"\").indexOf('\":')&&(eval(\"var value = \"+(\",\"==jsn[i][jsn[i].length-1]?jsn[i].substring(0,jsn[i].length-1):jsn[i]).split('\": ')[1]),\",\"==jsn[i][jsn[i].length-1]&&i==jsn.length-2?njsn.push(jsn[i].substring(0,jsn[i].length-1)):null!=value&&njsn.push(jsn[i]));return njsn.push(\"}\"),JSON.parse(njsn.join(os.EOL))}\r\n";
      var modfoot = "\r\nif(!disableEndElseCallbackExecute) {\r\ntry{\r\nelseCallback();\r\n} catch(err) {\r\n}\r\n}\r\n}\r\n}\r\nmodule.exports = Mod;";
      // Write the modified server side script to the temp folder
      fs.writeFileSync(__dirname + "/temp/" + tempServerSideScriptName, modhead + fs.readFileSync("./serverSideScript.js") + modfoot);

      // Initialize variables for server side script loading
      var aMod = undefined;
      var amod = undefined;

      // Attempt to require the custom server side script, retrying up to 5 times
      for (var i = 0; i < 5; i++) {
        try {
          aMod = require("./temp/" + tempServerSideScriptName);
          amod = new aMod();
          break;
        } catch (err) {
          if (i >= 4 || err.name == "SyntaxError") throw err;
          // Wait for a short time before retrying
          var now = Date.now();
          while (Date.now() - now < 2);
          // Try reloading mod
        }
      }

      // Add the loaded server side script to the mods list
      mods.push(amod);
    } catch (err) {
      // If there was an error during server side script loading, log it to the console
      if (cluster.isPrimary || cluster.isPrimary === undefined) {
        serverconsole.locwarnmessage("There was a problem while loading server side JavaScript.");
        serverconsole.locwarnmessage("Stack:");
        serverconsole.locwarnmessage(generateErrorStack(err));
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

function isForbiddenPath(decodedHref, match) {
  var forbiddenPath = forbiddenPaths[match];
  if (!forbiddenPath) return false;
  if (typeof forbiddenPath === "string") {
    return decodedHref === forbiddenPath || (os.platform() === "win32" && decodedHref.toLowerCase() === forbiddenPath.toLowerCase());
  }
  if (typeof forbiddenPath === "object") {
    return forbiddenPath.some(function (forbiddenPathSingle) {
      return (decodedHref === forbiddenPathSingle || (os.platform() === "win32" && decodedHref.toLowerCase() === forbiddenPathSingle.toLowerCase()));
    });
  }
  return false;
}

function isIndexOfForbiddenPath(decodedHref, match) {
  var forbiddenPath = forbiddenPaths[match];
  if (!forbiddenPath) return false;
  if (typeof forbiddenPath === "string") {
    return decodedHref === forbiddenPath || decodedHref.indexOf(forbiddenPath + "/") === 0 || (os.platform() === "win32" && (decodedHref.toLowerCase() === forbiddenPath.toLowerCase() || decodedHref.toLowerCase().indexOf(forbiddenPath.toLowerCase() + "/") === 0));
  }
  if (typeof forbiddenPath === "object") {
    return forbiddenPath.some(function (forbiddenPathSingle) {
      return (decodedHref === forbiddenPathSingle || decodedHref.indexOf(forbiddenPathSingle + "/") === 0 || (os.platform() === "win32" && (decodedHref.toLowerCase() === forbiddenPathSingle.toLowerCase() || decodedHref.toLowerCase().indexOf(forbiddenPathSingle.toLowerCase() + "/") === 0)));
    });
  }
  return false;
}


var forbiddenPaths = {};

forbiddenPaths.config = getInitializePath("./config.json");
forbiddenPaths.certificates = [];
if (secure) {
  forbiddenPaths.certificates.push(getInitializePath(configJSON.cert));
  forbiddenPaths.certificates.push(getInitializePath(configJSON.key));
  Object.keys(sni).forEach(function (sniHostName) {
    forbiddenPaths.certificates.push(getInitializePath(sni[sniHostName].cert));
    forbiddenPaths.certificates.push(getInitializePath(sni[sniHostName].key));
  });
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
  var reqcounterKillReq = 0;
  var server = {};
  var server2 = {};
  try {
    server2 = http.createServer({
      requireHostHeader: false
    });
  } catch (err) {
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
            msg.split("\n").forEach(function (nmsg) {
              serverconsole.climessage(nmsg);
            });
            return;
          }
          console.log("SERVER CLI MESSAGE [Request Id: " + reqId + "]: " + msg);
          LOG("SERVER CLI MESSAGE [Request Id: " + reqId + "]: " + msg);
          return;
        },
        reqmessage: function (msg) {
          if (msg.indexOf("\n") != -1) {
            msg.split("\n").forEach(function (nmsg) {
              serverconsole.reqmessage(nmsg);
            });
            return;
          }
          console.log("\x1b[34mSERVER REQUEST MESSAGE [Request Id: " + reqId + "]: " + msg + "\x1b[37m\x1b[0m");
          LOG("SERVER REQUEST MESSAGE [Request Id: " + reqId + "]: " + msg);
          return;
        },
        resmessage: function (msg) {
          if (msg.indexOf("\n") != -1) {
            msg.split("\n").forEach(function (nmsg) {
              serverconsole.resmessage(nmsg);
            });
            return;
          }
          console.log("\x1b[32mSERVER RESPONSE MESSAGE [Request Id: " + reqId + "]: " + msg + "\x1b[37m\x1b[0m");
          LOG("SERVER RESPONSE MESSAGE [Request Id: " + reqId + "]: " + msg);
          return;
        },
        errmessage: function (msg) {
          if (msg.indexOf("\n") != -1) {
            msg.split("\n").forEach(function (nmsg) {
              serverconsole.errmessage(nmsg);
            });
            return;
          }
          console.log("\x1b[31mSERVER RESPONSE ERROR MESSAGE [Request Id: " + reqId + "]: " + msg + "\x1b[37m\x1b[0m");
          LOG("SERVER RESPONSE ERROR MESSAGE [Request Id: " + reqId + "]: " + msg);
          return;
        },
        locerrmessage: function (msg) {
          if (msg.indexOf("\n") != -1) {
            msg.split("\n").forEach(function (nmsg) {
              serverconsole.locerrmessage(nmsg);
            });
            return;
          }
          console.log("\x1b[41mSERVER ERROR MESSAGE [Request Id: " + reqId + "]: " + msg + "\x1b[40m\x1b[0m");
          LOG("SERVER ERROR MESSAGE [Request Id: " + reqId + "]: " + msg);
          return;
        },
        locwarnmessage: function (msg) {
          if (msg.indexOf("\n") != -1) {
            msg.split("\n").forEach(function (nmsg) {
              serverconsole.locwarnmessage(nmsg);
            });
            return;
          }
          console.log("\x1b[43mSERVER WARNING MESSAGE [Request Id: " + reqId + "]: " + msg + "\x1b[40m\x1b[0m");
          LOG("SERVER WARNING MESSAGE [Request Id: " + reqId + "]: " + msg);
          return;
        },
        locmessage: function (msg) {
          if (msg.indexOf("\n") != -1) {
            msg.split("\n").forEach(function (nmsg) {
              serverconsole.locmessage(nmsg);
            });
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
      serverconsole.locmessage("Somebody connected to " + (typeof port == "number" ? "port " : "socket ") + port + "...");
      reqcounter++;
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
    attmtsRedir--;
    if (cluster.isPrimary === undefined && attmtsRedir >= 0) {
      if (err.code == "EADDRINUSE") {
        serverconsole.locerrmessage("Address is already in use by another process.");
      } else if (err.code == "EADDRNOTAVAIL") {
        serverconsole.locerrmessage("Address is not available on this machine.");
      } else if (err.code == "EACCES") {
        serverconsole.locerrmessage("Permission denied. You may not have sufficient privileges to access the requested address.");
      } else if (err.code == "EAFNOSUPPORT") {
        serverconsole.locerrmessage("Address family not supported. The address family (IPv4 or IPv6) of the requested address is not supported.");
      } else if (err.code == "EALREADY") {
        serverconsole.locerrmessage("Operation already in progress. The server is already in the process of establishing a connection on the requested address.");
      } else if (err.code == "ECONNABORTED") {
        serverconsole.locerrmessage("Connection aborted. The connection to the server was terminated abruptly.");
      } else if (err.code == "ECONNREFUSED") {
        serverconsole.locerrmessage("Connection refused. The server refused the connection attempt.");
      } else if (err.code == "ECONNRESET") {
        serverconsole.locerrmessage("Connection reset by peer. The connection to the server was reset by the remote host.");
      } else if (err.code == "EDESTADDRREQ") {
        serverconsole.locerrmessage("Destination address required. The destination address must be specified.");
      } else if (err.code == "ENETDOWN") {
        serverconsole.locerrmessage("Network is down. The network interface used for the connection is not available.");
      } else if (err.code == "ENETUNREACH") {
        serverconsole.locerrmessage("Network is unreachable. The network destination is not reachable from this host.");
      } else if (err.code == "ENOBUFS") {
        serverconsole.locerrmessage("No buffer space available. Insufficient buffer space is available for the server to process the request.");
      } else if (err.code == "ENOTSOCK") {
        serverconsole.locerrmessage("Not a socket. The file descriptor provided is not a valid socket.");
      } else if (err.code == "EPROTO") {
        serverconsole.locerrmessage("Protocol error. An unspecified protocol error occurred.");
      } else if (err.code == "EPROTONOSUPPORT") {
        serverconsole.locerrmessage("Protocol not supported. The requested network protocol is not supported.");
      } else if (err.code == "ETIMEDOUT") {
        serverconsole.locerrmessage("Connection timed out. The server did not respond within the specified timeout period.");
      } else {
        serverconsole.locerrmessage("There was an unknown error with the server.");
      }
      serverconsole.locmessage(attmtsRedir + " attempts left.");
    } else {
      try {
        process.send("\x12ERRLIST" + attmtsRedir + err.code);
      } catch(ex) {
        // Probably main process exited
      }
    }
    if (attmtsRedir > 0) {
      server2.close();
      setTimeout(start, 900);
    } else {
      try {
        if (cluster.isPrimary !== undefined) process.send("\x12ERRCRASH" + err.code);
      } catch(ex) {
        // Probably main process exited
      }
      setTimeout(function () {
        var errno = errors[err.code];
        if(errno) {
          process.exit(errno);
        } else {
          process.exit(1);
        }
      }, 50);
    }
  });

  server2.on("listening", function () {
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
      } catch (err) {
        server = http.createServer();
      }
    }
  }
  if (secure) {
    sniCredentials.forEach(function (sniCredentialsSingle) {
      server.addContext(sniCredentialsSingle.name, {
        cert: sniCredentialsSingle.cert,
        key: sniCredentialsSingle.key
      });
    });
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
          } catch (err) {
            //Socket is probably already destroyed.
          }
        };
      } else {
        sock._parent.destroy = sock._parent.reallyDestroy;
        try {
          if (sock._parent.toDestroy) sock._parent.destroy();
        } catch (err) {
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
            msg.split("\n").forEach(function (nmsg) {
              serverconsole.climessage(nmsg);
            });
            return;
          }
          console.log("SERVER CLI MESSAGE [Request Id: " + reqId + "]: " + msg);
          LOG("SERVER CLI MESSAGE [Request Id: " + reqId + "]: " + msg);
          return;
        },
        reqmessage: function (msg) {
          if (msg.indexOf("\n") != -1) {
            msg.split("\n").forEach(function (nmsg) {
              serverconsole.reqmessage(nmsg);
            });
            return;
          }
          console.log("\x1b[34mSERVER REQUEST MESSAGE [Request Id: " + reqId + "]: " + msg + "\x1b[37m\x1b[0m");
          LOG("SERVER REQUEST MESSAGE [Request Id: " + reqId + "]: " + msg);
          return;
        },
        resmessage: function (msg) {
          if (msg.indexOf("\n") != -1) {
            msg.split("\n").forEach(function (nmsg) {
              serverconsole.resmessage(nmsg);
            });
            return;
          }
          console.log("\x1b[32mSERVER RESPONSE MESSAGE [Request Id: " + reqId + "]: " + msg + "\x1b[37m\x1b[0m");
          LOG("SERVER RESPONSE MESSAGE [Request Id: " + reqId + "]: " + msg);
          return;
        },
        errmessage: function (msg) {
          if (msg.indexOf("\n") != -1) {
            msg.split("\n").forEach(function (nmsg) {
              serverconsole.errmessage(nmsg);
            });
            return;
          }
          console.log("\x1b[31mSERVER RESPONSE ERROR MESSAGE [Request Id: " + reqId + "]: " + msg + "\x1b[37m\x1b[0m");
          LOG("SERVER RESPONSE ERROR MESSAGE [Request Id: " + reqId + "]: " + msg);
          return;
        },
        locerrmessage: function (msg) {
          if (msg.indexOf("\n") != -1) {
            msg.split("\n").forEach(function (nmsg) {
              serverconsole.locerrmessage(nmsg);
            });
            return;
          }
          console.log("\x1b[41mSERVER ERROR MESSAGE [Request Id: " + reqId + "]: " + msg + "\x1b[40m\x1b[0m");
          LOG("SERVER ERROR MESSAGE [Request Id: " + reqId + "]: " + msg);
          return;
        },
        locwarnmessage: function (msg) {
          if (msg.indexOf("\n") != -1) {
            msg.split("\n").forEach(function (nmsg) {
              serverconsole.locwarnmessage(nmsg);
            });
            return;
          }
          console.log("\x1b[43mSERVER WARNING MESSAGE [Request Id: " + reqId + "]: " + msg + "\x1b[40m\x1b[0m");
          LOG("SERVER WARNING MESSAGE [Request Id: " + reqId + "]: " + msg);
          return;
        },
        locmessage: function (msg) {
          if (msg.indexOf("\n") != -1) {
            msg.split("\n").forEach(function (nmsg) {
              serverconsole.locmessage(nmsg);
            });
            return;
          }
          console.log("SERVER MESSAGE [Request Id: " + reqId + "]: " + msg);
          LOG("SERVER MESSAGE [Request Id: " + reqId + "]: " + msg);
          return;
        }
      };

      function getCustomHeaders() {
        var ph = JSON.parse(JSON.stringify(customHeaders));
        Object.keys(ph).forEach(function (phk) {
          if (typeof ph[phk] == "string") ph[phk] = ph[phk].replace(/\{path\}/g, req.url);
        });
        return ph;
      }
      
      if (req.headers["x-svr-js-from-main-thread"] == "true" && (!req.socket.remoteAddress || req.socket.remoteAddress == "::1" || req.socket.remoteAddress == "::ffff:127.0.0.1" || req.socket.remoteAddress == "127.0.0.1" || req.socket.remoteAddress == "localhost")) {
        var headers = getCustomHeaders();
        res.writeHead(204, "No Content", headers);
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

      serverconsole.locmessage("Somebody connected to " + (typeof port == "number" ? "port " : "socket ") + port + "...");

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
            Object.keys(ch).forEach(function (chnS) {
              var nhn = chnS;
              for (var j = 0; j < chon.length; j++) {
                if (chon[j].toLowerCase() == chnS.toLowerCase()) {
                  nhn = chon[j];
                  break;
                }
              }
              if (ch[chnS]) cheaders[nhn] = ch[chnS];
            });
          }
          cheaders["Content-Type"] = "text/html; charset=utf-8";
          if (errorCode == 405 && !cheaders["Allow"]) cheaders["Allow"] = "GET, POST, HEAD, OPTIONS";
          fs.readFile(errorFile, function (err, data) {
            try {
              if (err) throw err;
              res.writeHead(errorCode, http.STATUS_CODES[errorCode], cheaders);
              fd += data.toString().replace(/{errorMessage}/g, errorCode.toString() + " " + http.STATUS_CODES[errorCode]).replace(/{errorDesc}/g, serverErrorDescs[errorCode]).replace(/{stack}/g, stack.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\r\n/g, "<br/>").replace(/\n/g, "<br/>").replace(/\r/g, "<br/>").replace(/ {2}/g, "&nbsp;&nbsp;")).replace(/{path}/g, req.url.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")).replace(/{server}/g, "" + (exposeServerVersion ? "SVR.JS/" + version + " (" + getOS() + "; " + (process.isBun ? ("Bun/v" + process.versions.bun + "; like Node.JS/" + process.version) : ("Node.JS/" + process.version)) + ")" : "SVR.JS") + (extName == undefined ? "" : " " + extName) + ((req.headers.host == undefined || isProxy) ? "" : " on " + String(req.headers.host).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"))).replace(/{contact}/g, serverAdmin.replace(/\./g, "[dot]").replace(/@/g, "[at]"));
              responseEnd();
            } catch (err) {
              var additionalError = 500;
              if (err.code == "ENOENT") {
                additionalError = 404;
              } else if (err.code == "ENOTDIR") {
                additionalError = 404; // Assume that file doesn't exist
              } else if (err.code == "EACCES") {
                additionalError = 403;
              } else if (err.code == "EMFILE") {
                additionalError = 503;
              } else if (err.code == "ELOOP") {
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
        } catch (err) {
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
        } catch (err) {
          //Nevermind...
        }
      } else {
        reqip = req.socket.remoteAddress;
        reqport = req.socket.remotePort;
      }
      reqcounter++;
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

        function parseURL(uri) {
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
            } catch (err) {
              return url.parse(uri, true);
            }
          } else {
            return url.parse(uri, true);
          }
        }
        var urlp = parseURL("http://" + hostx);
        try {
          if (urlp.path.indexOf("//") == 0) {
            urlp = parseURL("http:" + url.path);
          }
        } catch (err) {
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
        } catch (err) {
          //Leave URL as it is...
        }
        var rheaders = getCustomHeaders();
        rheaders["Location"] = lloc + requestURL;
        res.writeHead(301, "Redirect to HTTPS", rheaders);
        res.end();
      } catch (err) {
        serverconsole.errmessage("There was an error while processing the request!");
        serverconsole.errmessage("Stack:");
        serverconsole.errmessage(generateErrorStack(err));
        callServerError(500, undefined, generateErrorStack(err));
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
        } catch (err) {
          //Socket is probably already destroyed
        }
      });
    };
    res.writeHead = function (code, name, headers) {
      var head = ("HTTP/1.1 " + code.toString() + " " + name + "\r\n");
      var headers = JSON.parse(JSON.stringify(headers));
      headers["Date"] = (new Date()).toGMTString();
      headers["Connection"] = "close";
      Object.keys(headers).forEach(function (headername) {
        if (headername.toLowerCase() == "set-cookie") {
          headers[headername].forEach(function (headerValueS) {
            if (headername.match(/[^\x09\x20-\x7e\x80-\xff]|.:/) || headerValueS.match(/[^\x09\x20-\x7e\x80-\xff]/)) throw new Error("Invalid header!!! (" + headername + ")");
            head += (headername + ": " + headerValueS);
          });
        } else {
          if (headername.match(/[^\x09\x20-\x7e\x80-\xff]|.:/) || headers[headername].match(/[^\x09\x20-\x7e\x80-\xff]/)) throw new Error("Invalid header!!! (" + headername + ")");
          head += (headername + ": " + headers[headername]);
        }
        head += "\r\n";
      });
      head += ("\r\n");
      res.write(head);
    };

    var reqIdInt = Math.round(Math.random() * 16777216);
    var reqId = "0".repeat(6 - reqIdInt.toString(16).length) + reqIdInt.toString(16);
    var serverconsole = {
      climessage: function (msg) {
        if (msg.indexOf("\n") != -1) {
          msg.split("\n").forEach(function (nmsg) {
            serverconsole.climessage(nmsg);
          });
          return;
        }
        console.log("SERVER CLI MESSAGE [Request Id: " + reqId + "]: " + msg);
        LOG("SERVER CLI MESSAGE [Request Id: " + reqId + "]: " + msg);
        return;
      },
      reqmessage: function (msg) {
        if (msg.indexOf("\n") != -1) {
          msg.split("\n").forEach(function (nmsg) {
            serverconsole.reqmessage(nmsg);
          });
          return;
        }
        console.log("\x1b[34mSERVER REQUEST MESSAGE [Request Id: " + reqId + "]: " + msg + "\x1b[37m\x1b[0m");
        LOG("SERVER REQUEST MESSAGE [Request Id: " + reqId + "]: " + msg);
        return;
      },
      resmessage: function (msg) {
        if (msg.indexOf("\n") != -1) {
          msg.split("\n").forEach(function (nmsg) {
            serverconsole.resmessage(nmsg);
          });
          return;
        }
        console.log("\x1b[32mSERVER RESPONSE MESSAGE [Request Id: " + reqId + "]: " + msg + "\x1b[37m\x1b[0m");
        LOG("SERVER RESPONSE MESSAGE [Request Id: " + reqId + "]: " + msg);
        return;
      },
      errmessage: function (msg) {
        if (msg.indexOf("\n") != -1) {
          msg.split("\n").forEach(function (nmsg) {
            serverconsole.errmessage(nmsg);
          });
          return;
        }
        console.log("\x1b[31mSERVER RESPONSE ERROR MESSAGE [Request Id: " + reqId + "]: " + msg + "\x1b[37m\x1b[0m");
        LOG("SERVER RESPONSE ERROR MESSAGE [Request Id: " + reqId + "]: " + msg);
        return;
      },
      locerrmessage: function (msg) {
        if (msg.indexOf("\n") != -1) {
          msg.split("\n").forEach(function (nmsg) {
            serverconsole.locerrmessage(nmsg);
          });
          return;
        }
        console.log("\x1b[41mSERVER ERROR MESSAGE [Request Id: " + reqId + "]: " + msg + "\x1b[40m\x1b[0m");
        LOG("SERVER ERROR MESSAGE [Request Id: " + reqId + "]: " + msg);
        return;
      },
      locwarnmessage: function (msg) {
        if (msg.indexOf("\n") != -1) {
          msg.split("\n").forEach(function (nmsg) {
            serverconsole.locwarnmessage(nmsg);
          });
          return;
        }
        console.log("\x1b[43mSERVER WARNING MESSAGE [Request Id: " + reqId + "]: " + msg + "\x1b[40m\x1b[0m");
        LOG("SERVER WARNING MESSAGE [Request Id: " + reqId + "]: " + msg);
        return;
      },
      locmessage: function (msg) {
        if (msg.indexOf("\n") != -1) {
          msg.split("\n").forEach(function (nmsg) {
            serverconsole.locmessage(nmsg);
          });
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
          Object.keys(ch).forEach(function (chnS) {
            var nhn = chnS;
            for (var j = 0; j < chon.length; j++) {
              if (chon[j].toLowerCase() == chnS.toLowerCase()) {
                nhn = chon[j];
                break;
              }
            }
            if (ch[chnS]) cheaders[nhn] = ch[chnS];
          });
        }
        cheaders["Content-Type"] = "text/html; charset=utf-8";
        if (errorCode == 405 && !cheaders["Allow"]) cheaders["Allow"] = "GET, POST, HEAD, OPTIONS";
        fs.readFile(errorFile, function (err, data) {
          try {
            if (err) throw err;
            res.writeHead(errorCode, http.STATUS_CODES[errorCode], cheaders);
            fd += data.toString().replace(/{errorMessage}/g, errorCode.toString() + " " + http.STATUS_CODES[errorCode]).replace(/{errorDesc}/g, serverErrorDescs[errorCode]).replace(/{stack}/g, stack.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\r\n/g, "<br/>").replace(/\n/g, "<br/>").replace(/\r/g, "<br/>").replace(/ {2}/g, "&nbsp;&nbsp;")).replace(/{server}/g, "" + (exposeServerVersion ? "SVR.JS/" + version + " (" + getOS() + "; " + (process.isBun ? ("Bun/v" + process.versions.bun + "; like Node.JS/" + process.version) : ("Node.JS/" + process.version)) + ")" : "SVR.JS") + (extName == undefined ? "" : " " + extName)).replace(/{contact}/g, serverAdmin.replace(/\./g, "[dot]").replace(/@/g, "[at]"));
            responseEnd();
          } catch (err) {
            var additionalError = 500;
            if (err.code == "ENOENT") {
              additionalError = 404;
            } else if (err.code == "ENOTDIR") {
              additionalError = 404; // Assume that file doesn't exist
            } else if (err.code == "EACCES") {
              additionalError = 403;
            } else if (err.code == "EMFILE") {
              additionalError = 503;
            } else if (err.code == "ELOOP") {
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
    reqcounter++;
    serverconsole.locmessage("Somebody connected to " + (secure && fromMain ? ((typeof sport == "number" ? "port " : "socket ") + sport) : ((typeof port == "number" ? "port " : "socket ") + port)) + "...");
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

      if (err.code && err.code.indexOf("ERR_HTTP2_") == 0) {
        serverconsole.errmessage("An HTTP/2 error occured: " + err.code);
        callServerError(400);
        return;
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
          serverconsole.errmessage("The request is invalid (it may be a part of larger invalid request).");
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
          serverconsole.errmessage("The request is invalid.");
          callServerError(400); //Also malformed Packet
        }
      }
    } catch (err) {
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
          msg.split("\n").forEach(function (nmsg) {
            serverconsole.climessage(nmsg);
          });
          return;
        }
        console.log("SERVER CLI MESSAGE [Request Id: " + reqId + "]: " + msg);
        LOG("SERVER CLI MESSAGE [Request Id: " + reqId + "]: " + msg);
        return;
      },
      reqmessage: function (msg) {
        if (msg.indexOf("\n") != -1) {
          msg.split("\n").forEach(function (nmsg) {
            serverconsole.reqmessage(nmsg);
          });
          return;
        }
        console.log("\x1b[34mSERVER REQUEST MESSAGE [Request Id: " + reqId + "]: " + msg + "\x1b[37m\x1b[0m");
        LOG("SERVER REQUEST MESSAGE [Request Id: " + reqId + "]: " + msg);
        return;
      },
      resmessage: function (msg) {
        if (msg.indexOf("\n") != -1) {
          msg.split("\n").forEach(function (nmsg) {
            serverconsole.resmessage(nmsg);
          });
          return;
        }
        console.log("\x1b[32mSERVER RESPONSE MESSAGE [Request Id: " + reqId + "]: " + msg + "\x1b[37m\x1b[0m");
        LOG("SERVER RESPONSE MESSAGE [Request Id: " + reqId + "]: " + msg);
        return;
      },
      errmessage: function (msg) {
        if (msg.indexOf("\n") != -1) {
          msg.split("\n").forEach(function (nmsg) {
            serverconsole.errmessage(nmsg);
          });
          return;
        }
        console.log("\x1b[31mSERVER RESPONSE ERROR MESSAGE [Request Id: " + reqId + "]: " + msg + "\x1b[37m\x1b[0m");
        LOG("SERVER RESPONSE ERROR MESSAGE [Request Id: " + reqId + "]: " + msg);
        return;
      },
      locerrmessage: function (msg) {
        if (msg.indexOf("\n") != -1) {
          msg.split("\n").forEach(function (nmsg) {
            serverconsole.locerrmessage(nmsg);
          });
          return;
        }
        console.log("\x1b[41mSERVER ERROR MESSAGE [Request Id: " + reqId + "]: " + msg + "\x1b[40m\x1b[0m");
        LOG("SERVER ERROR MESSAGE [Request Id: " + reqId + "]: " + msg);
        return;
      },
      locwarnmessage: function (msg) {
        if (msg.indexOf("\n") != -1) {
          msg.split("\n").forEach(function (nmsg) {
            serverconsole.locwarnmessage(nmsg);
          });
          return;
        }
        console.log("\x1b[43mSERVER WARNING MESSAGE [Request Id: " + reqId + "]: " + msg + "\x1b[40m\x1b[0m");
        LOG("SERVER WARNING MESSAGE [Request Id: " + reqId + "]: " + msg);
        return;
      },
      locmessage: function (msg) {
        if (msg.indexOf("\n") != -1) {
          msg.split("\n").forEach(function (nmsg) {
            serverconsole.locmessage(nmsg);
          });
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
    reqcounter++;
    serverconsole.locmessage("Somebody connected to " + (secure ? ((typeof sport == "number" ? "port " : "socket ") + sport) : ((typeof port == "number" ? "port " : "socket ") + port)) + "...");
    serverconsole.reqmessage("Client " + ((!reqip || reqip == "") ? "[unknown client]" : (reqip + ((reqport && reqport !== 0) && reqport != "" ? ":" + reqport : ""))) + " wants to proxy " + request.url + " through this server");
    if (request.headers["user-agent"] != undefined) serverconsole.reqmessage("Client uses " + request.headers["user-agent"]);

    function modExecute(mods, ffinals) {
      var proxyMods = [];
      mods.forEach(function (mod) {
        if (mod.proxyCallback !== undefined) proxyMods.push(mod);
      });

      var modFunction = ffinals;
      proxyMods.reverse().forEach(function(proxyMod) {
        modFunction = proxyMod.proxyCallback(req, socket, head, configJSON, serverconsole, modFunction);
      });
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
          msg.split("\n").forEach(function (nmsg) {
            serverconsole.climessage(nmsg);
          });
          return;
        }
        console.log("SERVER CLI MESSAGE [Request Id: " + reqId + "]: " + msg);
        LOG("SERVER CLI MESSAGE [Request Id: " + reqId + "]: " + msg);
        return;
      },
      reqmessage: function (msg) {
        if (msg.indexOf("\n") != -1) {
          msg.split("\n").forEach(function (nmsg) {
            serverconsole.reqmessage(nmsg);
          });
          return;
        }
        console.log("\x1b[34mSERVER REQUEST MESSAGE [Request Id: " + reqId + "]: " + msg + "\x1b[37m\x1b[0m");
        LOG("SERVER REQUEST MESSAGE [Request Id: " + reqId + "]: " + msg);
        return;
      },
      resmessage: function (msg) {
        if (msg.indexOf("\n") != -1) {
          msg.split("\n").forEach(function (nmsg) {
            serverconsole.resmessage(nmsg);
          });
          return;
        }
        console.log("\x1b[32mSERVER RESPONSE MESSAGE [Request Id: " + reqId + "]: " + msg + "\x1b[37m\x1b[0m");
        LOG("SERVER RESPONSE MESSAGE [Request Id: " + reqId + "]: " + msg);
        return;
      },
      errmessage: function (msg) {
        if (msg.indexOf("\n") != -1) {
          msg.split("\n").forEach(function (nmsg) {
            serverconsole.errmessage(nmsg);
          });
          return;
        }
        console.log("\x1b[31mSERVER RESPONSE ERROR MESSAGE [Request Id: " + reqId + "]: " + msg + "\x1b[37m\x1b[0m");
        LOG("SERVER RESPONSE ERROR MESSAGE [Request Id: " + reqId + "]: " + msg);
        return;
      },
      locerrmessage: function (msg) {
        if (msg.indexOf("\n") != -1) {
          msg.split("\n").forEach(function (nmsg) {
            serverconsole.locerrmessage(nmsg);
          });
          return;
        }
        console.log("\x1b[41mSERVER ERROR MESSAGE [Request Id: " + reqId + "]: " + msg + "\x1b[40m\x1b[0m");
        LOG("SERVER ERROR MESSAGE [Request Id: " + reqId + "]: " + msg);
        return;
      },
      locwarnmessage: function (msg) {
        if (msg.indexOf("\n") != -1) {
          msg.split("\n").forEach(function (nmsg) {
            serverconsole.locwarnmessage(nmsg);
          });
          return;
        }
        console.log("\x1b[43mSERVER WARNING MESSAGE [Request Id: " + reqId + "]: " + msg + "\x1b[40m\x1b[0m");
        LOG("SERVER WARNING MESSAGE [Request Id: " + reqId + "]: " + msg);
        return;
      },
      locmessage: function (msg) {
        if (msg.indexOf("\n") != -1) {
          msg.split("\n").forEach(function (nmsg) {
            serverconsole.locmessage(nmsg);
          });
          return;
        }
        console.log("SERVER MESSAGE [Request Id: " + reqId + "]: " + msg);
        LOG("SERVER MESSAGE [Request Id: " + reqId + "]: " + msg);
        return;
      }
    };

    function getCustomHeaders() {
      var ph = JSON.parse(JSON.stringify(customHeaders));
      Object.keys(ph).forEach(function (phk) {
        if (typeof ph[phk] == "string") ph[phk] = ph[phk].replace(/\{path\}/g, request.url);
      });
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
        var headers = [":path", ":method"];
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
      } catch (err) {
        var cheaders = getCustomHeaders();
        cheaders["Content-Type"] = "text/html; charset=utf-8";
        cheaders[":status"] = "500";
        response.stream.respond(cheaders);
        response.stream.write("<html><head><title>500 Internal Server Error</title><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" /></head><body><h1>500 Internal Server Error</h1><p>The server had an unexpected error. Below, error stack is shown: </p><code>" + (stackHidden ? "[error stack hidden]" : generateErrorStack(err)).replace(/\r\n/g, "<br/>").replace(/\n/g, "<br/>").replace(/\r/g, "<br/>").replace(/ {2}/g, "&nbsp;&nbsp;") + "</code><p>Please contact with developer/administrator of the website.</p><p><i>" + (exposeServerVersion ? "SVR.JS/" + version + " (" + getOS() + "; " + (process.isBun ? ("Bun/v" + process.versions.bun + "; like Node.JS/" + process.version) : ("Node.JS/" + process.version)) + ")" : "SVR.JS") + (request.headers[":authority"] == undefined ? "" : " on " + request.headers[":authority"]) + "</i></p></body></html>");
        response.stream.end();
        return;
      }
    }

    if (request.headers["x-svr-js-from-main-thread"] == "true" && (!request.socket.remoteAddress || request.socket.remoteAddress == "::1" || request.socket.remoteAddress == "::ffff:127.0.0.1" || request.socket.remoteAddress == "127.0.0.1" || request.socket.remoteAddress == "localhost")) {
      var headers = getCustomHeaders();
      response.writeHead(204, "No Content", headers);
      response.end();
      return;
    }
    
    request.url = fixNodeMojibakeURL(request.url);

    var headWritten = false;
    var lastStatusCode = null;
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
        if(typeof b != "string" && http.STATUS_CODES[a]) {
          if(!c) c = b;
          b = http.STATUS_CODES[a];
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
      } catch (err) {
        var cheaders = getCustomHeaders();
        cheaders["Content-Type"] = "text/html; charset=utf-8";
        res.writeHead(500, "Internal Server Error", cheaders);
        res.write("<html><head><title>500 Internal Server Error</title><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" /></head><body><h1>500 Internal Server Error</h1><p>The server had an unexpected error. Below, error stack is shown: </p><code>" + (stackHidden ? "[error stack hidden]" : generateErrorStack(err)).replace(/\r\n/g, "<br/>").replace(/\n/g, "<br/>").replace(/\r/g, "<br/>").replace(/ {2}/g, "&nbsp;&nbsp;") + "</code><p>Please contact with developer/administrator of the website.</p><p><i>" + (exposeServerVersion ? "SVR.JS/" + version + " (" + getOS() + "; " + (process.isBun ? ("Bun/v" + process.versions.bun + "; like Node.JS/" + process.version) : ("Node.JS/" + process.version)) + ")" : "SVR.JS") + (req.headers.host == undefined ? "" : " on " + String(req.headers.host).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")) + "</i></p></body></html>");
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
      serverconsole.locmessage("Somebody connected to " + (secure && fromMain ? ((typeof sport == "number" ? "port " : "socket ") + sport) : ((typeof port == "number" ? "port " : "socket ") + port)) + "...");

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
        } catch (err) {
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
        } catch (err) {
          //Address setting failed
        }
      } else {
        reqip = request.socket.remoteAddress;
        reqport = request.socket.remotePort;
      }

      reqcounter++;

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
            Object.keys(ch).forEach(function (chnS) {
              var nhn = chnS;
              for (var j = 0; j < chon.length; j++) {
                if (chon[j].toLowerCase() == chnS.toLowerCase()) {
                  nhn = chon[j];
                  break;
                }
              }
              if (ch[chnS]) cheaders[nhn] = ch[chnS];
            });
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
            } catch (err) {
              var additionalError = 500;
              // Handle additional error cases
              if (err.code == "ENOENT") {
                additionalError = 404;
              } else if (err.code == "ENOTDIR") {
                additionalError = 404; // Assume that file doesn't exist
              } else if (err.code == "EACCES") {
                additionalError = 403;
              } else if (err.code == "EMFILE") {
                additionalError = 503;
              } else if (err.code == "ELOOP") {
                additionalError = 508;
              }

              response.writeHead(errorCode, http.STATUS_CODES[errorCode], cheaders);
              response.write(("<html><head><title>{errorMessage}</title><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" /></head><body><h1>{errorMessage}</h1><p>{errorDesc}</p>" + ((additionalError == 404) ? "" : "<p>Additionally, a {additionalError} error occurred while loading an error page.</p>") + "<p><i>{server}</i></p></body></html>").replace(/{errorMessage}/g, errorCode.toString() + " " + http.STATUS_CODES[errorCode]).replace(/{errorDesc}/g, serverErrorDescs[errorCode]).replace(/{stack}/g, stack.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\r\n/g, "<br/>").replace(/\n/g, "<br/>").replace(/\r/g, "<br/>").replace(/ {2}/g, "&nbsp;&nbsp;")).replace(/{path}/g, request.url.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")).replace(/{server}/g, "" + (exposeServerVersion ? "SVR.JS/" + version + " (" + getOS() + "; " + (process.isBun ? ("Bun/v" + process.versions.bun + "; like Node.JS/" + process.version) : ("Node.JS/" + process.version)) + ")" : "SVR.JS") + (extName == undefined ? "" : " " + extName) + ((req.headers.host == undefined || isProxy) ? "" : " on " + String(req.headers.host).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"))).replace(/{contact}/g, serverAdmin.replace(/\./g, "[dot]").replace(/@/g, "[at]")).replace(/{additionalError}/g, additionalError.toString())); // Replace placeholders in error response
              response.end();
            }
          });
        }
      }


      // Function to perform HTTP redirection to a specified destination URL
      function redirect(destination, isTemporary, customHeaders) {
        // If customHeaders are not provided, get the default custom headers
        if (customHeaders === undefined) customHeaders = getCustomHeaders();

        // Set the "Location" header to the destination URL
        customHeaders["Location"] = destination;

        // Determine the status code for redirection based on the isTemporary flag
        var statusCode = isTemporary ? 302 : 301;

        // Write the response header with the appropriate status code and message
        res.writeHead(statusCode, http.STATUS_CODES[statusCode], customHeaders);

        // Log the redirection message
        serverconsole.resmessage("Client redirected to " + destination);

        // End the response
        res.end();

        // Return from the function
        return;
      }

      // Function to parse incoming POST data from the request
      function parsePostData(options, callback) {
        // If the request method is not POST, return a 405 Method Not Allowed error
        if (req.method != "POST") {
          // Get the default custom headers and add "Allow" header with value "POST"
          var customHeaders = getCustomHeaders();
          customHeaders["Allow"] = "POST";

          // Call the server error function with 405 status code and custom headers
          callServerError(405, undefined, undefined, customHeaders);
          return;
        }

        // Set formidableOptions to options, if provided; otherwise, set it to an empty object
        var formidableOptions = options ? options : {};

        // If no callback is provided, set the callback to options and reset formidableOptions
        if (!callback) {
          callback = options;
          formidableOptions = {};
        }

        // If the formidable module had an error, call the server error function with 500 status code and error stack
        if (formidable._errored) callServerError(500, undefined, generateErrorStack(formidable._errored));

        // Create a new formidable form
        var form = formidable(formidableOptions);

        // Parse the request and process the fields and files
        form.parse(req, function (err, fields, files) {
          // If there was an error, call the server error function with status code determined by error
          if (err) {
            if(err.httpCode) callServerError(err.httpCode);
            else callServerError(400);
            return;
          }
          // Otherwise, call the provided callback function with the parsed fields and files
          callback(fields, files);
        });
      }


      // Function to parse a URL string into a URL object
      function parseURL(uri) {
        // Check if the URL API is available (Node.js version >= 10)
        if (typeof URL !== "undefined" && url.Url) {
          try {
            // Create a new URL object using the provided URI and base URL
            var uobject = new URL(uri, "http" + (req.socket.encrypted ? "s" : "") + "://" + (req.headers.host ? req.headers.host : (domain ? domain : "unknown.invalid")));

            // Create a new URL object (similar to deprecated url.Url)
            var nuobject = new url.Url();

            // Set properties of the new URL object from the provided URL
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

            // Adjust the pathname and href properties if the URI doesn't start with "/"
            if (uri.indexOf("/") != 0) {
              if (nuobject.pathname) {
                nuobject.pathname = nuobject.pathname.substr(1);
                nuobject.href = nuobject.pathname + (nuobject.search ? nuobject.search : "");
              }
            }

            // Set the path property as a combination of pathname and search
            if (nuobject.pathname) {
              nuobject.path = nuobject.pathname + (nuobject.search ? nuobject.search : "");
            }

            // Initialize the query object and copy URL search parameters to it
            nuobject.query = {};
            uobject.searchParams.forEach(function (value, key) {
              nuobject.query[key] = value;
            });

            // Return the created URL object
            return nuobject;
          } catch (err) {
            // If there was an error using the URL API, fall back to deprecated url.parse
            return url.parse(uri, true);
          }
        } else {
          // If the URL API is not available, fall back to deprecated url.parse
          return url.parse(uri, true);
        }
      }


      var uobject = parseURL(req.url);
      var search = uobject.search;
      var href = uobject.pathname;
      var ext = path.extname(href).toLowerCase();
      ext = ext.substr(1, ext.length);
      var decodedHref = "";
      try {
        decodedHref = decodeURIComponent(href);
      } catch (err) {
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
            } catch (err) {
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
            } catch (err) {
              //Nevermind...
            }
          } else {
            reqip = req.socket.remoteAddress;
            reqport = req.socket.remotePort;
          }

          // Function to check the level of a path relative to the web root
          function checkPathLevel(path) {
            // Split the path into an array of components based on "/"
            var pathComponents = path.split("/");

            // Initialize counters for level up (..) and level down (.)
            var levelUpCount = 0;
            var levelDownCount = 0;

            // Loop through the path components
            for (var i = 0; i < pathComponents.length; i += 1) {
              // If the component is "..", decrement the levelUpCount
              if (".." === pathComponents[i]) {
                levelUpCount -= 1;
              }
              // If the component is not "." or an empty string, increment the levelDownCount
              else if ("." !== pathComponents[i] && "" !== pathComponents[i]) {
                levelDownCount += 1;
              }
            }

            // Calculate the overall level by subtracting levelUpCount from levelDownCount
            var overallLevel = levelDownCount - levelUpCount;

            // Return the overall level
            return overallLevel;
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
            } catch (err) {
              callServerError(500, undefined, generateErrorStack(err));
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
          var readFrom = "./" + pth;
          fs.stat(readFrom, function (err, stats) {
            if (err) {
              if (err.code == "ENOENT") {
                if (__dirname != process.cwd() && pth.match(/^\.dirimages\/(?:(?!\.png$).)+\.png$/)) {
                  stats = {
                    isDirectory: function isDirectory() {
                      return false;
                    },
                    isFile: function isFile() {
                      return true;
                    }
                  };
                  readFrom = __dirname + "/" + pth;
                } else {
                  callServerError(404);
                  serverconsole.errmessage("Resource not found.");
                  return;
                }
              } else if (err.code == "ENOTDIR") {
                callServerError(404); // Assume that file doesn't exist.
                serverconsole.errmessage("Resource not found.");
                return;
              } else if (err.code == "EACCES") {
                callServerError(403);
                serverconsole.errmessage("Access denied.");
                return;
              } else if (err.code == "EMFILE") {
                callServerError(503);
                return;
              } else if (err.code == "ELOOP") {
                callServerError(508); // The symbolic link loop is detected during file system operations.
                serverconsole.errmessage("Symbolic link loop detected.");
                return;
              } else {
                callServerError(500, undefined, generateErrorStack(err));
                return;
              }
            }

            //Check if index file exists
            if (req.url == "/" || stats.isDirectory()) {
              fs.stat(readFrom + "/.notindex".replace(/\/+/g, "/"), function (e) {
                if (e) {
                  fs.stat((readFrom + "/index.html").replace(/\/+/g, "/"), function (e, s) {
                    if (e || !s.isFile()) {
                      fs.stat((readFrom + "/index.htm").replace(/\/+/g, "/"), function (e, s) {
                        if (e || !s.isFile()) {
                          fs.stat((readFrom + "/index.xhtml").replace(/\/+/g, "/"), function (e, s) {
                            if (e || !s.isFile()) {
                              properServe();
                            } else {
                              stats = s;
                              pth = (pth + "/index.xhtml").replace(/\/+/g, "/");
                              ext = "xhtml";
                              readFrom = "./" + pth;
                              properServe();
                            }
                          });
                        } else {
                          stats = s;
                          pth = (pth + "/index.htm").replace(/\/+/g, "/");
                          ext = "htm";
                          readFrom = "./" + pth;
                          properServe();
                        }
                      });
                    } else {
                      stats = s;
                      pth = (pth + "/index.html").replace(/\/+/g, "/");
                      ext = "html";
                      readFrom = "./" + pth;
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
                // Check if directory listing is enabled in the configuration
                if (configJSON.enableDirectoryListing || configJSON.enableDirectoryListing === undefined) {
                  var customHeaders = getCustomHeaders();
                  customHeaders["Content-Type"] = "text/html; charset=utf-8";
                  res.writeHead(200, http.STATUS_CODES[200], customHeaders);

                  // Read custom header and footer content (if available)
                  var customDirListingHeader = fs.existsSync("." + decodeURIComponent(href) + "/.dirhead".replace(/\/+/g, "/"))
                    ? fs.readFileSync("." + decodeURIComponent(href) + "/.dirhead".replace(/\/+/g, "/")).toString()
                    : (fs.existsSync("." + decodeURIComponent(href) + "/HEAD.html".replace(/\/+/g, "/")) && (os.platform != "win32" || href != "/"))
                      ? fs.readFileSync("." + decodeURIComponent(href) + "/HEAD.html".replace(/\/+/g, "/")).toString()
                      : "";
                  var customDirListingFooter = fs.existsSync("." + decodeURIComponent(href) + "/.dirfoot".replace(/\/+/g, "/"))
                    ? fs.readFileSync("." + decodeURIComponent(href) + "/.dirfoot".replace(/\/+/g, "/")).toString()
                    : (fs.existsSync("." + decodeURIComponent(href) + "/FOOT.html".replace(/\/+/g, "/")) && (os.platform != "win32" || href != "/"))
                      ? fs.readFileSync("." + decodeURIComponent(href) + "/FOOT.html".replace(/\/+/g, "/")).toString()
                      : "";

                  // Check if custom header has HTML tag
                  var headerHasHTMLTag = customDirListingHeader.replace(/<!--(?:(?:(?!--\>).)*|)(?:-->|$)/gs, "").match(/<html(?![a-zA-Z0-9])(?:"(?:\\(?:.|$)|[^\\"])*(?:"|$)|'(?:\\(?:.|$)|[^\\'])*(?:'|$)|[^'">])*(?:>|$)/si);

                  // Generate HTML head and footer based on configuration and custom content
                  var htmlHead = (!configJSON.enableDirectoryListingWithDefaultHead || head == ""
                    ? (!headerHasHTMLTag
                      ? "<!DOCTYPE html><html><head><title>Directory: " + decodeURIComponent(origHref).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</title><meta charset=\"UTF-8\" /><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" /></head><body>"
                      : customDirListingHeader.replace(/<head>/i, "<head><title>Directory: " + decodeURIComponent(origHref).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</title>"))
                    : head.replace(/<head>/i, "<head><title>Directory: " + decodeURIComponent(origHref).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</title>")) +
      (!headerHasHTMLTag ? customDirListingHeader : "") +
      "<h1>Directory: " + decodeURIComponent(origHref).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</h1><table id=\"directoryListing\"> <tr> <th></th> <th>Filename</th> <th>Size</th> <th>Date</th> </tr>" + (checkPathLevel(decodeURIComponent(origHref)) < 1 ? "" : "<tr><td style=\"width: 24px;\"><img src=\"/.dirimages/return.png\" width=\"24px\" height=\"24px\" alt=\"[RET]\" /></td><td style=\"word-wrap: break-word; word-break: break-word; overflow-wrap: break-word;\"><a href=\"" + (origHref).replace(/\/+/g, "/").replace(/\/[^\/]*\/?$/, "/") + "\">Return</a></td><td></td><td></td></tr>");

                  var htmlFoot = "</table><p><i>" + (exposeServerVersion ? "SVR.JS/" + version + " (" + getOS() + "; " + (process.isBun ? ("Bun/v" + process.versions.bun + "; like Node.JS/" + process.version) : ("Node.JS/" + process.version)) + ")" : "SVR.JS") + (req.headers.host == undefined ? "" : " on " + String(req.headers.host).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")) + "</i></p>" + customDirListingFooter + (!configJSON.enableDirectoryListingWithDefaultHead || foot == "" ? "</body></html>" : foot);

                  if (fs.existsSync("." + decodeURIComponent(href) + "/.maindesc".replace(/\/+/g, "/"))) {
                    htmlFoot = "</table><hr/>" + fs.readFileSync("." + decodeURIComponent(href) + "/.maindesc".replace(/\/+/g, "/")) + htmlFoot;
                  }

                  fs.readdir("." + decodeURIComponent(href), function (err, list) {
                    try {
                      if (err) throw err;
                      list = list.sort();

                      // Function to get stats for all files in the directory
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

                      // Wrapper function to get stats for all files
                      function getStatsForAllFiles(fileList, prefix, callback) {
                        if (!prefix) prefix = "";
                        getStatsForAllFilesI(fileList, callback, prefix, [], 0);
                      }

                      // Get stats for all files in the directory and generate the listing
                      getStatsForAllFiles(list, "." + decodeURIComponent(href), function (filelist) {
                        // Function to check file extension
                        function checkEXT(filename, ext) {
                          return filename.match(new RegExp("\\." + ext.replace(/^\./,"").replace(/([.+*?^$()\[\]{}|\\])/,"\\$1") + "$","i"));
                        }

                        var directoryListingRows = [];
                        for (var i = 0; i < filelist.length; i++) {
                          if (filelist[i].name[0] !== ".") {
                            var estats = filelist[i].stats;
                            var ename = filelist[i].name;
                            if (filelist[i].errored) {
                              if (estats) {
                                directoryListingRows.push(
                                  "<tr><td style=\"width: 24px;\"><img src=\"/.dirimages/bad.png\" alt=\"[BAD]\" width=\"24px\" height=\"24px\" /></td><td style=\"word-wrap: break-word; word-break: break-word; overflow-wrap: break-word;\"><a href=\"" +
              (href + "/" + encodeURI(ename)).replace(/\/+/g, "/") +
              "\"><nocode>" +
              ename.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") +
              "</nocode></a></td><td>-</td><td>" +
              estats.mtime.toDateString() +
              "</td></tr>\r\n"
                                );
                              } else {
                                directoryListingRows.push(
                                  "<tr><td style=\"width: 24px;\"><img src=\"/.dirimages/bad.png\" alt=\"[BAD]\" width=\"24px\" height=\"24px\" /></td><td style=\"word-wrap: break-word; word-break: break-word; overflow-wrap: break-word;\"><a href=\"" +
              (href + "/" + encodeURI(ename)).replace(/\/+/g, "/") +
              "\"><nocode>" +
              ename.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") +
              "</nocode></a></td><td>-</td><td>-</td></tr>\r\n"
                                );
                              }
                            } else {
                              var entry = "<tr><td style=\"width: 24px;\"><img src=\"[img]\" alt=\"[alt]\" width=\"24px\" height=\"24px\" /></td><td style=\"word-wrap: break-word; word-break: break-word; overflow-wrap: break-word;\"><a href=\"" +
          (origHref + "/" + encodeURIComponent(ename)).replace(/\/+/g, "/") +
          (estats.isDirectory() ? "/" : "") +
          "\">" +
          ename.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") +
          "</a></td><td>" +
          (estats.isDirectory() ? "-" : sizify(estats.size.toString())) +
          "</td><td>" +
          estats.mtime.toDateString() +
          "</td></tr>\r\n";

                              // Determine the file type and set the appropriate image and alt text
                              if (estats.isDirectory()) {
                                entry = entry.replace("[img]", "/.dirimages/directory.png").replace("[alt]", "[DIR]");
                              } else if (!estats.isFile()) {
                                entry = "<tr><td style=\"width: 24px;\"><img src=\"[img]\" alt=\"[alt]\" width=\"24px\" height=\"24px\" /></td><td style=\"word-wrap: break-word; word-break: break-word; overflow-wrap: break-word;\"><a href=\"" +
            (origHref + "/" + encodeURIComponent(ename)).replace(/\/+/g, "/") +
            "\">" +
            ename.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") +
            "</a></td><td>-</td><td>" +
            estats.mtime.toDateString() +
            "</td></tr>\r\n";

                                // Determine the special file types (block device, character device, etc.)
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
                              directoryListingRows.push(entry);
                            }
                          }
                        }

                        // Push the information about empty directory
                        if (directoryListingRows.length == 0) {
                          directoryListingRows.push("<tr><td></td><td>No files found</td><td></td><td></td></tr>");
                        }

                        // Send the directory listing response
                        res.end(htmlHead + directoryListingRows.join("") + htmlFoot);
                        serverconsole.resmessage("Client successfully received content.");
                      });

                    } catch (err) {
                      if (err.code == "ENOENT") {
                        callServerError(404);
                        serverconsole.errmessage("Resource not found.");
                      } else if (err.code == "ENOTDIR") {
                        callServerError(404); // Assume that file doesn't exist.
                        serverconsole.errmessage("Resource not found.");
                      } else if (err.code == "EACCES") {
                        callServerError(403);
                        serverconsole.errmessage("Access denied.");
                      } else if (err.code == "EMFILE") {
                        callServerError(503);
                      } else if (err.code == "ELOOP") {
                        callServerError(508); // The symbolic link loop is detected during file system operations.
                        serverconsole.errmessage("Symbolic link loop detected.");
                      } else {
                        callServerError(500, undefined, generateErrorStack(err));
                      }
                    }
                  });
                } else {
                  // Directory listing is disabled, call 403 Forbidden error
                  callServerError(403);
                  serverconsole.errmessage("Directory listing is disabled.");
                }


              } else {
                var acceptEncoding = req.headers["accept-encoding"];
                if (!acceptEncoding) acceptEncoding = "";

                // Check if the requested file exists and handle errors
                fs.stat(readFrom, function (err, stats) {
                  if (err) {
                    if (err.code == "ENOENT") {
                      callServerError(404);
                      serverconsole.errmessage("Resource not found.");
                    } else if (err.code == "ENOTDIR") {
                      callServerError(404); // Assume that file doesn't exist.
                      serverconsole.errmessage("Resource not found.");
                    } else if (err.code == "EACCES") {
                      callServerError(403);
                      serverconsole.errmessage("Access denied.");
                    } else if (err.code == "EMFILE") {
                      callServerError(503);
                    } else if (err.code == "ELOOP") {
                      callServerError(508); // The symbolic link loop is detected during file system operations.
                      serverconsole.errmessage("Symbolic link loop detected.");
                    } else {
                      callServerError(500, undefined, generateErrorStack(err));
                    }
                    return;
                  }

                  // Check if the requested resource is a file
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

                  //ETag code
                  var fileETag = undefined;
                  if (configJSON.enableETag == undefined || configJSON.enableETag) {
                    fileETag = generateETag(href, stats);
                    // Check if the client's request matches the ETag value (If-None-Match)
                    var clientETag = req.headers["if-none-match"];
                    if (clientETag === fileETag) {
                      var headers = getCustomHeaders();
                      headers.ETag = clientETag;
                      res.writeHead(304, "Not Modified", headers);
                      res.end();
                      return;
                    }

                    // Check if the client's request doesn't match the ETag value (If-Match)
                    var ifMatchETag = req.headers["if-match"];
                    if (ifMatchETag && ifMatchETag !== "*" && ifMatchETag !== fileETag) {
                      var headers = getCustomHeaders();
                      headers.ETag = clientETag;
                      callServerError(412,undefined,undefined,headers);
                      return;
                    }
                  }

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
                        if(fileETag) rhd["ETag"] = fileETag;

                        if (req.method != "HEAD") {
                          var readStream = fs.createReadStream(readFrom, {
                            start: begin,
                            end: end
                          });
                          readStream.on("error", function (err) {
                            if (err.code == "ENOENT") {
                              callServerError(404);
                              serverconsole.errmessage("Resource not found.");
                            } else if (err.code == "ENOTDIR") {
                              callServerError(404); // Assume that file doesn't exist.
                              serverconsole.errmessage("Resource not found.");
                            } else if (err.code == "EACCES") {
                              callServerError(403);
                              serverconsole.errmessage("Access denied.");
                            } else if (err.code == "EMFILE") {
                              callServerError(503);
                            } else if (err.code == "ELOOP") {
                              callServerError(508); // The symbolic link loop is detected during file system operations.
                              serverconsole.errmessage("Symbolic link loop detected.");
                            } else {
                              callServerError(500, undefined, generateErrorStack(err));
                            }
                          }).on("open", function () {
                            try {
                              res.writeHead(206, http.STATUS_CODES[206], rhd);
                              readStream.pipe(res);
                              serverconsole.resmessage("Client successfully received content.");
                            } catch (err) {
                              callServerError(500, undefined, generateErrorStack(err));
                            }
                          });
                        } else {
                          res.writeHead(206, http.STATUS_CODES[206], rhd);
                          res.end();
                        }
                      }
                    } catch (err) {
                      callServerError(500, undefined, generateErrorStack(err));
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
                      if(fileETag) hdhds["ETag"] = fileETag;

                      if (req.method != "HEAD") {
                        var readStream = fs.createReadStream(readFrom);
                        readStream.on("error", function (err) {
                          if (err.code == "ENOENT") {
                            callServerError(404);
                            serverconsole.errmessage("Resource not found.");
                          } else if (err.code == "ENOTDIR") {
                            callServerError(404); // Assume that file doesn't exist.
                            serverconsole.errmessage("Resource not found.");
                          } else if (err.code == "EACCES") {
                            callServerError(403);
                            serverconsole.errmessage("Access denied.");
                          } else if (err.code == "EMFILE") {
                            callServerError(503);
                          } else if (err.code == "ELOOP") {
                            callServerError(508); // The symbolic link loop is detected during file system operations.
                            serverconsole.errmessage("Symbolic link loop detected.");
                          } else {
                            callServerError(500, undefined, generateErrorStack(err));
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
                          } catch (err) {
                            callServerError(500, undefined, generateErrorStack(err));
                          }
                        });
                      } else {
                        res.writeHead(200, http.STATUS_CODES[200], hdhds);
                        res.end();
                        serverconsole.resmessage("Client successfully received content.");
                      }
                    } catch (err) {
                      callServerError(500, undefined, generateErrorStack(err));
                    }
                  }
                });
              }
            }
          });
        };
      }

      try {
        //scan blacklist
        if (blacklist.check(reqip) && href != "/favicon.ico") {
          var bheaders = getCustomHeaders();
          bheaders["Content-Type"] = "text/html; charset=utf8";
          response.writeHead(403, "Client blocked", bheaders);
          response.write("<!DOCTYPE html><html><head><title>Access denied - SVR.JS</title><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><br/><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" /></head><body><div style=\"height: auto; width: 70%; border-style: solid; border-width: 5; border-color: red; text-align: center; margin: 0 auto;\"><h1>ACCESS DENIED</h1><p style=\"font-size:20px\">Request from " + reqip + " is denied. The client is now in the blacklist.</p><p style=\"font-style: italic; font-weight: normal;\">SVR.JS/" + version + " (" + getOS() + "; " + (process.isBun ? ("Bun/v" + process.versions.bun + "; like Node.JS/" + process.version) : ("Node.JS/" + process.version)) + ")" + (req.headers.host == undefined ? "" : " on " + String(req.headers.host).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")) + "</p></div></body></html>");
          serverconsole.errmessage("Client blocked");
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

        //Check if URL is "dirty"
        if (href != sanitizedHref && !isProxy) {
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
          if(rewriteDirtyURLs) {
            req.url = sanitizedURL;
            uobject = parseURL(req.url);
            search = uobject.search;
            href = uobject.pathname;
            ext = path.extname(href).toLowerCase();
            ext = ext.substr(1, ext.length);
            try {
              decodedHref = decodeURIComponent(href);
            } catch (err) {
              //Return 400 error
              callServerError(400);
              serverconsole.errmessage("Bad request!");
              return;
            }
          } else {
            redirect(sanitizedURL, false);
            return;
          }
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
            uobject = parseURL(req.url);
            search = uobject.search;
            href = uobject.pathname;
            ext = path.extname(href).toLowerCase();
            ext = ext.substr(1, ext.length);

            try {
              decodedHref = decodeURIComponent(href);
            } catch (err) {
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
              rewrittenAgainURL.hostname = null;
              rewrittenAgainURL.host = null;
              rewrittenAgainURL.port = null;
              rewrittenAgainURL.protocol = null;
              rewrittenAgainURL.slashes = null;
              rewrittenAgainURL = url.format(rewrittenAgainURL);
              serverconsole.resmessage("URL sanitized: " + req.url + " => " + rewrittenAgainURL);
              req.url = rewrittenAgainURL;
              uobject = parseURL(req.url);
              search = uobject.search;
              href = uobject.pathname;
              ext = path.extname(href).toLowerCase();
              ext = ext.substr(1, ext.length);
              try {
                decodedHref = decodeURIComponent(href);
              } catch (err) {
                //Return 400 error
                callServerError(400);
                serverconsole.errmessage("Bad request!");
                return;
              }
            }
          }
        }

        //Set response headers
        if (!isProxy) {
          var hkh = getCustomHeaders();
          var hk = Object.keys(hkh);
          for (var i = 0; i < hk.length; i++) {
            try {
              response.setHeader(hk[i], hkh[hk[i]]);
            } catch (err) {
              //Headers will not be set.
            }
          }
        }

        //Check if path is forbidden
        if ((isForbiddenPath(decodedHref, "config") || isForbiddenPath(decodedHref, "certificates")) && !isProxy) {
          callServerError(403);
          serverconsole.errmessage("Access to configuration file/certificates is denied.");
          return;
        } else if (isIndexOfForbiddenPath(decodedHref, "log") && !isProxy && (configJSON.enableLogging || configJSON.enableLogging == undefined) && !(configJSON.enableRemoteLogBrowsing || configJSON.enableRemoteLogBrowsing == undefined)) {
          callServerError(403);
          serverconsole.errmessage("Access to log files is denied.");
          return;
        } else if (isForbiddenPath(decodedHref, "svrjs") && !isProxy && !exposeServerVersion && process.cwd() == __dirname) {
          callServerError(403);
          serverconsole.errmessage("Access to SVR.JS script is denied.");
          return;
        } else if ((isForbiddenPath(decodedHref, "svrjs") || isForbiddenPath(decodedHref, "serverSideScripts") || isIndexOfForbiddenPath(decodedHref, "serverSideScriptDirectories")) && !isProxy && (configJSON.disableServerSideScriptExpose && configJSON.disableServerSideScriptExpose != undefined)) {
          callServerError(403);
          serverconsole.errmessage("Access to sources is denied.");
          return;
        } else {
          var nonscodeIndex = -1;
          var authIndex = -1;
          var regexI = [];
          if (!isProxy && nonStandardCodes != undefined) {
            for (var i = 0; i < nonStandardCodes.length; i++) {
              var isMatch = false;
              if (nonStandardCodes[i].regex) {
                var createdRegex = createRegex(nonStandardCodes[i].regex, true);
                isMatch = req.url.match(createdRegex) || href.match(createdRegex);
                regexI.push(createdRegex);
              } else {
                isMatch = nonStandardCodes[i].url == href || (os.platform() == "win32" && nonStandardCodes[i].url.toLowerCase() == href.toLowerCase());
              }
              if (isMatch) {
                if (nonStandardCodes[i].scode == 401) {
                  if (authIndex == -1) {
                    authIndex = i;
                  }
                } else {
                  if (nonscodeIndex == -1) {
                    if ((nonStandardCodes[i].scode == 403 || nonStandardCodes[i].scode == 451) && nonStandardCodes[i].users !== undefined) {
                      var toBreakLoop = false;
                      if (nonStandardCodes[i].users.check(reqip)) {
                        nonscodeIndex = i;
                        toBreakLoop = true;
                      }
                      if (toBreakLoop) break;
                    } else {
                      nonscodeIndex = i;
                    }
                  }
                }
              }
            }
          }

          // Handle non-standard codes
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

          // Handle HTTP authentication
          if (authIndex > -1) {
            var authcode = nonStandardCodes[authIndex];
            
            function checkIfPasswordMatches(list, password, callback, _i) {
                if(!_i) _i = 0;
                var cb = function (hash) {
                  var matches = (hash == list[_i].pass);
                  if(matches) {
                    callback(true);
                  } else if(_i >= list.length-1) {
                    callback(false);
                  } else {
                    checkIfPasswordMatches(list, password, callback, _i+1);
                  }
                }
                var hashedPassword = sha256(password + list[_i].salt);
                if(list[_i].scrypt) {
                  if(!crypto.scrypt) {
                    callServerError(500, undefined, new Error("SVR.JS doesn't support scrypt-hashed passwords on Node.JS versions without scrypt hash support."));
                    return;
                  } else {
                    var cacheEntry = scryptCache.find(function(entry) {
                      return (entry.password == hashedPassword && entry.salt == list[_i].salt)
                    });
                    if(cacheEntry) {
                      cb(cacheEntry.hash);
                    } else {
                      crypto.scrypt(password, list[_i].salt, 64, function(err, derivedKey) {
                        if(err) {
                          callServerError(500, undefined, err);
                        } else {
                          var key = derivedKey.toString("hex");
                          scryptCache.push({hash: key, password: hashedPassword, salt: list[_i].salt, addDate: new Date()});
                          cb(key);
                        }
                      });
                    }
                  }
                } else if(list[_i].pbkdf2) {
                  if(crypto.__disabled__ !== undefined) {
                    callServerError(500, undefined, new Error("SVR.JS doesn't support PBKDF2-hashed passwords on Node.JS versions without crypto support."));
                    return;
                  } else {
                    var cacheEntry = pbkdf2Cache.find(function(entry) {
                      return (entry.password == hashedPassword && entry.salt == list[_i].salt)
                    });
                    if(cacheEntry) {
                      cb(cacheEntry.hash);
                    } else {
                      crypto.pbkdf2(password, list[_i].salt, 36250, 64, "sha512", function(err, derivedKey) {
                        if(err) {
                          callServerError(500, undefined, err);
                        } else {
                          var key = derivedKey.toString("hex");
                          pbkdf2Cache.push({hash: key, password: hashedPassword, salt: list[_i].salt, addDate: new Date()});
                          cb(key);
                        }
                      });
                    }
                  }
                } else {
                  cb(hashedPassword);
                }
            }
            
            function authorizedCallback(bruteProtection) {
              var ha = getCustomHeaders();
              ha["WWW-Authenticate"] = "Basic realm=\"" + (authcode.realm ? authcode.realm.replace(/(\\|")/g, "\\$1") : "SVR.JS HTTP Basic Authorization") + "\", charset=\"UTF-8\"";
              var credentials = req.headers["authorization"];
              if (!credentials) {
                callServerError(401, undefined, undefined, ha);
                serverconsole.errmessage("Content needs authorization.");
                return;
              }
              var credentialsMatch = credentials.match(/^Basic (.+)$/);
              if (!credentialsMatch) {
                callServerError(401, undefined, undefined, ha);
                serverconsole.errmessage("Malformed credentials.");
                return;
              }
              var decodedCredentials = Buffer.from(credentialsMatch[1], "base64").toString("utf8");
              var decodedCredentialsMatch = decodedCredentials.match(/^([^:]*):(.*)$/);
              if (!decodedCredentialsMatch) {
                callServerError(401, undefined, undefined, ha);
                serverconsole.errmessage("Malformed credentials.");
                return;
              }
              var username = decodedCredentialsMatch[1];
              var password = decodedCredentialsMatch[2];
              var usernameMatch = users.filter(function (entry) {
                return entry.name == username;
              });
              if(usernameMatch.length == 0) {
                  usernameMatch.push({name: username, pass: "FAKEPASS", salt: "FAKESALT"});  //Fake credentials
              }
              checkIfPasswordMatches(usernameMatch, password, function(authorized) {
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
              });
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
      } catch (err) {
        //CRASH HANDLER
        if (err.message == "Intentionally crashed") throw err; //If intentionally crashed, then crash SVR.JS
        callServerError(500, undefined, generateErrorStack(err)); //Else just return 500 error
      }
    }

  }
  //Listen port to server
  server.on("error", function (err) {
    attmts--;
    if (cluster.isPrimary === undefined && attmts >= 0) {
      if (err.code == "EADDRINUSE") {
        serverconsole.locerrmessage("Address is already in use by another process.");
      } else if (err.code == "EADDRNOTAVAIL") {
        serverconsole.locerrmessage("Address is not available on this machine.");
      } else if (err.code == "EACCES") {
        serverconsole.locerrmessage("Permission denied. You may not have sufficient privileges to access the requested address.");
      } else if (err.code == "EAFNOSUPPORT") {
        serverconsole.locerrmessage("Address family not supported. The address family (IPv4 or IPv6) of the requested address is not supported.");
      } else if (err.code == "EALREADY") {
        serverconsole.locerrmessage("Operation already in progress. The server is already in the process of establishing a connection on the requested address.");
      } else if (err.code == "ECONNABORTED") {
        serverconsole.locerrmessage("Connection aborted. The connection to the server was terminated abruptly.");
      } else if (err.code == "ECONNREFUSED") {
        serverconsole.locerrmessage("Connection refused. The server refused the connection attempt.");
      } else if (err.code == "ECONNRESET") {
        serverconsole.locerrmessage("Connection reset by peer. The connection to the server was reset by the remote host.");
      } else if (err.code == "EDESTADDRREQ") {
        serverconsole.locerrmessage("Destination address required. The destination address must be specified.");
      } else if (err.code == "ENETDOWN") {
        serverconsole.locerrmessage("Network is down. The network interface used for the connection is not available.");
      } else if (err.code == "ENETUNREACH") {
        serverconsole.locerrmessage("Network is unreachable. The network destination is not reachable from this host.");
      } else if (err.code == "ENOBUFS") {
        serverconsole.locerrmessage("No buffer space available. Insufficient buffer space is available for the server to process the request.");
      } else if (err.code == "ENOTSOCK") {
        serverconsole.locerrmessage("Not a socket. The file descriptor provided is not a valid socket.");
      } else if (err.code == "EPROTO") {
        serverconsole.locerrmessage("Protocol error. An unspecified protocol error occurred.");
      } else if (err.code == "EPROTONOSUPPORT") {
        serverconsole.locerrmessage("Protocol not supported. The requested network protocol is not supported.");
      } else if (err.code == "ETIMEDOUT") {
        serverconsole.locerrmessage("Connection timed out. The server did not respond within the specified timeout period.");
      } else {
        serverconsole.locerrmessage("There was an unknown error with the server.");
      }
      serverconsole.locmessage(attmts + " attempts left.");
    } else {
      try {
        process.send("\x12ERRLIST" + attmts + err.code);
      } catch(ex) {
        // Probably main process exited
      }
    }
    if (attmts > 0) {
      server2.close();
      setTimeout(start, 900);
    } else {
      try {
        if (cluster.isPrimary !== undefined) process.send("\x12ERRCRASH" + err.code);
      } catch(ex) {
        // Probably main process exited
      }
      setTimeout(function () {
        var errno = errors[err.code];
        if(errno) {
          process.exit(errno);
        } else {
          process.exit(1);
        }
      }, 50);
    }
  });

  server.on("listening", function () {
    listeningMessage();
  });
}

var closedMaster = true;

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

var isWorkerHungUpBuff = true;

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
  } else if (msg == "\x12KILLOK") {
    if(typeof isWorkerHungUpBuff != "undefined") isWorkerHungUpBuff = false;
  } else if (msg == "\x12KILLTERMMSG") {
    serverconsole.locmessage("Terminating unused worker process...");
  } else if (msg == "\x12SAVEGOOD") {
    serverconsole.locmessage("Configuration saved.");
  } else if (msg.indexOf("\x12SAVEERR") == 0) {
    serverconsole.locwarnmessage("There was a problem, while saving configuration file. Reason: " + msg.substr(8));
  } else if (msg == "\x12END") {
    cluster.workers[Object.keys(cluster.workers)[0]].on("message", function (msg) {
      if (msg.length >= 8 && msg.indexOf("\x12ERRLIST") == 0) {
        var tries = parseInt(msg.substr(8, 1));
        var errCode = msg.substr(9);
        if (errCode == "EADDRINUSE") {
          serverconsole.locerrmessage("Address is already in use by another process.");
        } else if (errCode == "EADDRNOTAVAIL") {
          serverconsole.locerrmessage("Address is not available on this machine.");
        } else if (errCode == "EACCES") {
          serverconsole.locerrmessage("Permission denied. You may not have sufficient privileges to access the requested address.");
        } else if (errCode == "EAFNOSUPPORT") {
          serverconsole.locerrmessage("Address family not supported. The address family (IPv4 or IPv6) of the requested address is not supported.");
        } else if (errCode == "EALREADY") {
          serverconsole.locerrmessage("Operation already in progress. The server is already in the process of establishing a connection on the requested address.");
        } else if (errCode == "ECONNABORTED") {
          serverconsole.locerrmessage("Connection aborted. The connection to the server was terminated abruptly.");
        } else if (errCode == "ECONNREFUSED") {
          serverconsole.locerrmessage("Connection refused. The server refused the connection attempt.");
        } else if (errCode == "ECONNRESET") {
          serverconsole.locerrmessage("Connection reset by peer. The connection to the server was reset by the remote host.");
        } else if (errCode == "EDESTADDRREQ") {
          serverconsole.locerrmessage("Destination address required. The destination address must be specified.");
        } else if (errCode == "ENETDOWN") {
          serverconsole.locerrmessage("Network is down. The network interface used for the connection is not available.");
        } else if (errCode == "ENETUNREACH") {
          serverconsole.locerrmessage("Network is unreachable. The network destination is not reachable from this host.");
        } else if (errCode == "ENOBUFS") {
          serverconsole.locerrmessage("No buffer space available. Insufficient buffer space is available for the server to process the request.");
        } else if (errCode == "ENOTSOCK") {
          serverconsole.locerrmessage("Not a socket. The file descriptor provided is not a valid socket.");
        } else if (errCode == "EPROTO") {
          serverconsole.locerrmessage("Protocol error. An unspecified protocol error occurred.");
        } else if (errCode == "EPROTONOSUPPORT") {
          serverconsole.locerrmessage("Protocol not supported. The requested network protocol is not supported.");
        } else if (errCode == "ETIMEDOUT") {
          serverconsole.locerrmessage("Connection timed out. The server did not respond within the specified timeout period.");
        } else {
          serverconsole.locerrmessage("There was an unknown error with the server.");
        }
        serverconsole.locmessage(tries + " attempts left.");
      }
      if (msg.length >= 9 && msg.indexOf("\x12ERRCRASH") == 0) {
        var errno = errors[msg.substr(9)];
        if(errno) {
          process.exit(errno);
        } else {
          process.exit(1);
        }
      }
    });
  } else {
    serverconsole.climessage(msg);
  }
}

var messageTransmitted = false;

function listeningMessage() {
  if(typeof closedMaster !== "undefined") closedMaster = false;
  if (!cluster.isPrimary && cluster.isPrimary !== undefined) {
    process.send("\x12LISTEN");
    return;
  }
  if (messageTransmitted) return;
  messageTransmitted = true;
  serverconsole.locmessage("Started server at: ");
  if (secure) {
    if (typeof sport === "number") {
      serverconsole.locmessage("* https://localhost" + (sport == 443 ? "" : (":" + sport)));
    } else {
      serverconsole.locmessage("* " + sport); //Unix socket or Windows named pipe
    }
  }
  if (!(secure && disableNonEncryptedServer)) {
    if (typeof port === "number") {
      serverconsole.locmessage("* http://localhost" + (port == 80 ? "" : (":" + port)));
    } else {
      serverconsole.locmessage("* " + port); //Unix socket or Windows named pipe
    }
  }
  if (host != "" && host != "[offline]") {
    if (secure && typeof sport === "number") serverconsole.locmessage("* https://" + (host.indexOf(":") > -1 ? "[" + host + "]" : host) + (sport == 443 ? "" : (":" + sport)));
    if (!(secure && disableNonEncryptedServer) && typeof port === "number") serverconsole.locmessage("* http://" + (host.indexOf(":") > -1 ? "[" + host + "]" : host) + (port == 80 ? "" : (":" + port)));
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
    serverconsole.locmessage("For CLI help, you can type \"help\"");
  });
}

function start(init) {
  init = Boolean(init);
  if (cluster.isPrimary || cluster.isPrimary === undefined) {
    if (init) {
      for (i = 0; i < logo.length; i++) console.log(logo[i]); //Print logo
      console.log();
      console.log("Welcome to DorianTech SVR.JS server.");
      //Print warnings
      if (version.indexOf("Nightly-") === 0) serverconsole.locwarnmessage("This version is only for test purposes and may be unstable.");
      if (http2.__disabled__ !== undefined) serverconsole.locwarnmessage("HTTP/2 isn't supported by your Node.JS version! You may not be able to use HTTP/2 with SVR.JS");
      if (configJSON.enableHTTP2 && !secure) serverconsole.locwarnmessage("HTTP/2 without HTTPS may not work in web browsers. Web browsers only support HTTP/2 with HTTPS!");
      if (process.isBun) {
        serverconsole.locwarnmessage("Bun support is experimental. Some features of SVR.JS, SVR.JS mods and SVR.JS server-side JavaScript may not work as expected.");
        if(users.some(function(entry) {return entry.pbkdf2;})) serverconsole.locwarnmessage("PBKDF2 password hashing function in Bun blocks the event loop, which may result in denial of service.");
        if(users.some(function(entry) {return entry.scrypt;})) serverconsole.locwarnmessage("scrypt password hashing function in Bun blocks the event loop, which may result in denial of service.");
      }
      if (cluster.isPrimary === undefined) serverconsole.locwarnmessage("You're running SVR.JS on single thread. Reliability may suffer, as the server is stopped after crash.");
      if (crypto.__disabled__ !== undefined) serverconsole.locwarnmessage("Your Node.JS version doesn't have crypto support! The 'crypto' module is essential for providing cryptographic functionality in Node.JS. Without crypto support, certain security features may be unavailable, and some functionality may not work as expected. It's recommended to use a Node.JS version that includes crypto support to ensure the security and proper functioning of your server.");
      if (crypto.__disabled__ === undefined && !crypto.scrypt) serverconsole.locwarnmessage("Your JavaScript runtime doesn't have native scrypt support. HTTP authentication involving scrypt hashes will not work.");
      if (process.getuid && process.getuid() == 0) serverconsole.locwarnmessage("You're running SVR.JS as root. It's recommended to run SVR.JS as an non-root user. Running SVR.JS as root may increase the risks of OS command execution vulnerabilities.");
      if (secure && process.versions && process.versions.openssl && process.versions.openssl.substr(0, 2) == "1.") {
        if (new Date() > new Date("11 September 2023")) {
          serverconsole.locwarnmessage("OpenSSL 1.x is no longer recieving security updates after 11th September 2023. Your HTTPS communication might be vulnerable. It is recommended to update to a newer version of Node.JS that includes OpenSSL 3.0 or higher to ensure the security of your server and data.");
        } else {
          serverconsole.locwarnmessage("OpenSSL 1.x will no longer recieve security updates after 11th September 2023. Your HTTPS communication might be vulnerable in future. It is recommended to update to a newer version of Node.JS that includes OpenSSL 3.0 or higher to ensure the security of your server and data.");
        }
      }
      if (secure && configJSON.enableOCSPStapling && ocsp._errored) serverconsole.locwarnmessage("Can't load OCSP module. OCSP stapling will be disabled. OCSP stapling is a security feature that improves the performance and security of HTTPS connections by caching the certificate status response. If you require this feature, consider updating your Node.JS version or checking for any issues with the 'ocsp' module.");
      if (disableMods) serverconsole.locwarnmessage("SVR.JS is running without mods and server-side JavaScript enabled. Web applications may not work as expected");
      console.log();
      //Print info
      serverconsole.locmessage("Server version: " + version);
      if (process.isBun) serverconsole.locmessage("Bun version: v" + process.versions.bun);
      else serverconsole.locmessage("Node.JS version: " + process.version);
      var CPUs = os.cpus();
      if (CPUs.length > 0) serverconsole.locmessage("CPU: " + (CPUs.length > 1 ? CPUs.length + "x " : "") + CPUs[0].model);
      //Throw errors
      if (vnum < 64) {
        throw new Error("SVR.JS requires Node.JS 10.0.0 and newer, but your Node.JS version isn't supported by SVR.JS.");
      }
      if (configJSON.enableHTTP2 && !secure && (typeof port != "number")) {
        throw new Error("HTTP/2 without HTTPS, along with Unix sockets/Windows named pipes aren't supported by SVR.JS.");   
      }
    }
    //Information about starting the server
    if (!(secure && disableNonEncryptedServer)) serverconsole.locmessage("Starting HTTP server at " + (typeof port == "number" ? "localhost:" : "") + port.toString() + "...");
    if (secure) serverconsole.locmessage("Starting HTTPS server at " + (typeof sport == "number" ? "localhost:" : "") + sport.toString() + "...");
  }


  if (!cluster.isPrimary) {
    if (secure) {
      server.listen(sport);
      if (!disableNonEncryptedServer) server2.listen(port);
    } else {
      server.listen(port);
    }
  }

  //SVR.JS commmands
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
      } catch (err) {
        if (cluster.isPrimary === undefined) serverconsole.climessage("Cannot close server! Reason: " + err.message);
        else process.send("Cannot close server! Reason: " + err.message);
      }
    },
    open: function () {
      try {
        if (secure) {
          server.listen(sport);
          if (!disableNonEncryptedServer) server2.listen(port);
        } else {
          server.listen(port); // Reopen Server
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
      clearInterval(pbkdf2CacheIntervalId);
      if((!cluster.isPrimary && cluster.isPrimary !== undefined) && server.listening) {
        try {
          server.close(function() {
            if(server2.listening) {
              try {
                server2.close(function() {
                  if(!process.removeFakeIPC) {
                    if (typeof retcode == "number") {
                      process.exit(retcode);
                    } else {
                      process.exit(0);
                    }
                  }
                });
              } catch(err) {
                if(!process.removeFakeIPC) {
                  if (typeof retcode == "number") {
                    process.exit(retcode);
                  } else {
                    process.exit(0);
                  }
                }
              }
            } else {
              if(!process.removeFakeIPC) {
                if (typeof retcode == "number") {
                  process.exit(retcode);
                } else {
                  process.exit(0);
                }
              }
            }
          });
        } catch(err) {
          if (typeof retcode == "number") {
            process.exit(retcode);
          } else {
            process.exit(0);
          }
        }
        if(process.removeFakeIPC) process.removeFakeIPC();
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
        } catch (err) {
          throw new Error(err);
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
          } catch (err) {
            if (cluster.workers[allClusters[i]]) {
              cluster.workers[allClusters[i]].removeAllListeners("message");
              cluster.workers[allClusters[i]].on("message", bruteForceListenerWrapper(cluster.workers[allClusters[i]]));
              cluster.workers[allClusters[i]].on("message", listenConnListener);
            }
            serverconsole.locwarnmessage("There was a problem, while saving configuration file. Reason: " + err.message);
          }
        }
      }, 300000);
    }
    if (!cluster.isPrimary) {
      pbkdf2CacheIntervalId = setInterval(function () {
        pbkdf2Cache = pbkdf2Cache.filter(function(entry) {
          return entry.addDate > (new Date() - 3600000);
        });
        scryptCache = scryptCache.filter(function(entry) {
          return entry.addDate > (new Date() - 3600000);
        });
      }, 10000);
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
            } catch (err) {
              process.send("\x12SAVEERR" + err.message);
            }
            process.send("\x12END");
          } else if (line == "\x14KILLPING") {
            if(!reallyExiting) {
              process.send("\x12KILLOK");
              process.send("\x12END");
            }
            // Refuse to send, when it's really exiting. Main process will treat the worker as hung up anyway...
          } else if (line == "\x14KILLREQ") {
            if(reqcounter - reqcounterKillReq < 2) {
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
                } catch (err) {
                  stopError = true;
                }
              }
              if (stopError) serverconsole.climessage("Some SVR.JS workers might not be stopped.");
              SVRJSInitialized = false;
              closedMaster = true;
              var cpus = os.cpus().length;
              if (cpus > 16) cpus = 16;
              try {
                var useAvailableCores = Math.round((os.freemem()) / 50000000) - 1; //1 core deleted for safety...
                if (cpus > useAvailableCores) cpus = useAvailableCores;
              } catch (err) {
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
            allClusters.forEach(function (clusterID) {
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
      //Cluster forking code
      if (cluster.isPrimary !== undefined && init) {
        var cpus = os.cpus().length;
        if (cpus > 16) cpus = 16;
        try {
          var useAvailableCores = Math.round((os.freemem()) / 50000000) - 1; //1 core deleted for safety...
          if (cpus > useAvailableCores) cpus = useAvailableCores;
        } catch (err) {
          //Nevermind... Don't want SVR.JS to fail starting, because os.freemem function is not working.
        }
        if (cpus < 1) cpus = 1; //If SVR.JS is run on Haiku (os.cpus in Haiku returns empty array) or if useAvailableCores = 0
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
          if (msg.length >= 8 && msg.indexOf("\x12ERRLIST") == 0) {
            var tries = parseInt(msg.substr(8, 1));
            var errCode = msg.substr(9);
            if (errCode == "EADDRINUSE") {
              serverconsole.locerrmessage("Address is already in use by another process.");
            } else if (errCode == "EADDRNOTAVAIL") {
              serverconsole.locerrmessage("Address is not available on this machine.");
            } else if (errCode == "EACCES") {
              serverconsole.locerrmessage("Permission denied. You may not have sufficient privileges to access the requested address.");
            } else if (errCode == "EAFNOSUPPORT") {
              serverconsole.locerrmessage("Address family not supported. The address family (IPv4 or IPv6) of the requested address is not supported.");
            } else if (errCode == "EALREADY") {
              serverconsole.locerrmessage("Operation already in progress. The server is already in the process of establishing a connection on the requested address.");
            } else if (errCode == "ECONNABORTED") {
              serverconsole.locerrmessage("Connection aborted. The connection to the server was terminated abruptly.");
            } else if (errCode == "ECONNREFUSED") {
              serverconsole.locerrmessage("Connection refused. The server refused the connection attempt.");
            } else if (errCode == "ECONNRESET") {
              serverconsole.locerrmessage("Connection reset by peer. The connection to the server was reset by the remote host.");
            } else if (errCode == "EDESTADDRREQ") {
              serverconsole.locerrmessage("Destination address required. The destination address must be specified.");
            } else if (errCode == "ENETDOWN") {
              serverconsole.locerrmessage("Network is down. The network interface used for the connection is not available.");
            } else if (errCode == "ENETUNREACH") {
              serverconsole.locerrmessage("Network is unreachable. The network destination is not reachable from this host.");
            } else if (errCode == "ENOBUFS") {
              serverconsole.locerrmessage("No buffer space available. Insufficient buffer space is available for the server to process the request.");
            } else if (errCode == "ENOTSOCK") {
              serverconsole.locerrmessage("Not a socket. The file descriptor provided is not a valid socket.");
            } else if (errCode == "EPROTO") {
              serverconsole.locerrmessage("Protocol error. An unspecified protocol error occurred.");
            } else if (errCode == "EPROTONOSUPPORT") {
              serverconsole.locerrmessage("Protocol not supported. The requested network protocol is not supported.");
            } else if (errCode == "ETIMEDOUT") {
              serverconsole.locerrmessage("Connection timed out. The server did not respond within the specified timeout period.");
            } else {
              serverconsole.locerrmessage("There was an unknown error with the server.");
            }
            serverconsole.locmessage(tries + " attempts left.");
          }
          if (msg.length >= 9 && msg.indexOf("\x12ERRCRASH") == 0) {
            var errno = errors[msg.substr(9)];
            if(errno) {
              process.exit(errno);
            } else {
              process.exit(1);
            }
          }
        });

        // Hangup check and restart
        setInterval(function () {
          if (!closedMaster && !exiting) {
            var chksocket = {};
            if (secure && disableNonEncryptedServer) {
              chksocket = https.get({
                port: (typeof sport == "number") ? sport : undefined,
                socketPath: (typeof sport == "number") ? undefined : sport,
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
            } else if ((configJSON.enableHTTP2 == undefined ? false : configJSON.enableHTTP2) && !secure) {
              //It doesn't support through Unix sockets or Windows named pipes
              var connection = http2.connect("http://localhost:" + port.toString());
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
                port: (typeof port == "number") ? port : undefined,
                socketPath: (typeof port == "number") ? undefined : port,
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
        if(!disableUnusedWorkerTermination && cluster.isPrimary !== undefined) {
          setTimeout(function () {
            setInterval(function () {
              if (!closedMaster && !exiting) {
                var allClusters = Object.keys(cluster.workers);
                var minClusters = 0;
                minClusters = Math.ceil(cpus * 0.625);
                if(minClusters < 2) minClusters = 2;
                var goodWorkers = [];
                function checkWorker(callback, _id) {
                  if(typeof _id === "undefined") _id = 0;
                  if(_id >= allClusters.length) {
                    callback();
                    return;
                  }
                  try {
                    if (cluster.workers[allClusters[_id]]) {
                      isWorkerHungUpBuff = true;
                      cluster.workers[allClusters[_id]].on("message", msgListener);
                      cluster.workers[allClusters[_id]].send("\x14KILLPING");
                      setTimeout(function() {
                        if (isWorkerHungUpBuff) {
                          checkWorker(callback, _id+1);
                        } else {
                          goodWorkers.push(allClusters[_id]);
                          checkWorker(callback, _id+1);
                        }
                      }, 250);
                    } else {
                      checkWorker(callback, _id+1);
                    }
                  } catch (err) {
                    if (cluster.workers[allClusters[_id]]) {
                      cluster.workers[allClusters[_id]].removeAllListeners("message");
                      cluster.workers[allClusters[_id]].on("message", bruteForceListenerWrapper(cluster.workers[allClusters[_id]]));
                      cluster.workers[allClusters[_id]].on("message", listenConnListener);
                    }
                    checkWorker(callback, _id+1);
                  }   
                }
                checkWorker(function() {
                  if (goodWorkers.length > minClusters) {
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
                      serverconsole.locwarnmessage("There was a problem, while terminating unused worker process. Reason: " + err.message);
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
      if (configJSONobj.enableETag === undefined) configJSONobj.enableETag = true;
      if (configJSONobj.disableUnusedWorkerTermination === undefined) configJSONobj.disableUnusedWorkerTermination = false;
      if (configJSONobj.rewriteDirtyURLs === undefined) configJSONobj.rewriteDirtyURLs = false;
      
      var configString = JSON.stringify(configJSONobj, null, 2);
      fs.writeFileSync(__dirname + "/config.json", configString);
      break;
    } catch (err) {
      if (i >= 2) throw err;
      var now = Date.now();
      while (Date.now() - now < 2);
    }
  }
}

//Process event listeners
if (cluster.isPrimary || cluster.isPrimary === undefined) {
  process.on("uncaughtException", function (err) {
    //CRASH HANDLER
    serverconsole.locerrmessage("SVR.JS master process just crashed!!!");
    serverconsole.locerrmessage("Stack:");
    serverconsole.locerrmessage(generateErrorStack(err));
    process.exit(err.errno);
  });
  process.on("unhandledRejection", function (err) {
    //CRASH HANDLER
    serverconsole.locerrmessage("SVR.JS master process just crashed!!!");
    serverconsole.locerrmessage("Stack:");
    serverconsole.locerrmessage(err.stack ? generateErrorStack(err) : String(err));
    process.exit(err.errno);
  });
  process.on("exit", function (code) {
    try {
      saveConfig();
    } catch (err) {
      serverconsole.locwarnmessage("There was a problem, while saving configuration file. Reason: " + err.message);
    }
    try {
      deleteFolderRecursive(__dirname + "/temp");
    } catch (err) {
      //Error!
    }
    try {
      fs.mkdirSync(__dirname + "/temp");
    } catch (err) {
      //Error!
    }
    if (process.isBun) {
      try {
        fs.writeFileSync(__dirname + "/temp/serverSideScript.js", "//Placeholder server-side JavaScript to workaround Bun bug.\r\n");
      } catch (err) {
        //Error!
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
    reallyExiting = true;
    if (cluster.isPrimary !== undefined) {
      exiting = true;
      var allClusters = Object.keys(cluster.workers);
      for (var i = 0; i < allClusters.length; i++) {
        try {
          if (cluster.workers[allClusters[i]]) {
            cluster.workers[allClusters[i]].send("stop");
          }
        } catch (err) {
          //Worker will crash with EPIPE anyway.
        }
      }
    }
    serverconsole.locmessage("Server terminated using SIGINT");
    process.exit();
  });
} else {
  process.on("uncaughtException", function (err) {
    //CRASH HANDLER
    serverconsole.locerrmessage("SVR.JS worker just crashed!!!");
    serverconsole.locerrmessage("Stack:");
    serverconsole.locerrmessage(generateErrorStack(err));
    process.exit(err.errno);
  });
  process.on("unhandledRejection", function (err) {
    //CRASH HANDLER
    serverconsole.locerrmessage("SVR.JS worker just crashed!!!");
    serverconsole.locerrmessage("Stack:");
    serverconsole.locerrmessage(err.stack ? generateErrorStack(err) : String(err));
    process.exit(err.errno);
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
} catch (err) {
  serverconsole.locerrmessage("There was a problem starting SVR.JS!!!");
  serverconsole.locerrmessage("Stack:");
  serverconsole.locerrmessage(generateErrorStack(err));
  process.exit(err.errno);
}

//////////////////////////////////
////         THE END!         ////
////   WARNING: THE CODE HAS  ////
////       5000+ LINES!       ////
//////////////////////////////////
