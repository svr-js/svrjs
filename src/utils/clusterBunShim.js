const net = require("net");
const os = require("os");
const path = require("path");

let cluster = {};

if (!process.singleThreaded) {
  try {
    // Import cluster module
    cluster = require("cluster");
    // eslint-disable-next-line no-unused-vars
  } catch (err) {
    // Clustering is not supported!
  }

  // Cluster & IPC shim for Bun

  cluster.bunShim = () => {
    cluster.isMaster = !process.env.NODE_UNIQUE_ID;
    cluster.isPrimary = cluster.isMaster;
    cluster.isWorker = !cluster.isMaster;
    cluster.__shimmed__ = true;

    if (cluster.isWorker) {
      // Shim the cluster.worker object for worker processes
      cluster.worker = {
        id: parseInt(process.env.NODE_UNIQUE_ID),
        process: process,
        isDead: () => {
          return false;
        },
        send: (message, ...params) => {
          process.send(message, ...params);
        },
      };

      if (!process.send) {
        // Shim the process.send function for worker processes

        // Create a fake IPC server to receive messages
        let fakeIPCServer = net.createServer((socket) => {
          let receivedData = "";

          socket.on("data", (data) => {
            receivedData += data.toString();
          });

          socket.on("end", () => {
            process.emit("message", receivedData);
          });
        });
        fakeIPCServer.listen(
          os.platform() === "win32"
            ? path.join(
                "\\\\?\\pipe",
                process.dirname,
                "temp/.W" + process.pid + ".ipc",
              )
            : process.dirname + "/temp/.W" + process.pid + ".ipc",
        );

        process.send = (message) => {
          // Create a fake IPC connection to send messages
          let fakeIPCConnection = net.createConnection(
            os.platform() === "win32"
              ? path.join(
                  "\\\\?\\pipe",
                  process.dirname,
                  "temp/.P" + process.pid + ".ipc",
                )
              : process.dirname + "/temp/.P" + process.pid + ".ipc",
            () => {
              fakeIPCConnection.end(message);
            },
          );
        };

        process.removeFakeIPC = () => {
          // Close IPC server
          process.send = () => {};
          fakeIPCServer.close();
        };
      }
    }

    // Custom implementation for cluster.fork()
    cluster._workersCounter = 1;
    cluster.workers = {};
    cluster.fork = (env) => {
      const child_process = require("child_process");
      let newEnvironment = Object.assign({}, env ? env : process.env);
      newEnvironment.NODE_UNIQUE_ID = cluster._workersCounter;
      let newArguments = Object.assign([], process.argv);
      let command = newArguments.shift();
      let newWorker = child_process.spawn(command, newArguments, {
        env: newEnvironment,
        stdio: ["inherit", "inherit", "inherit", "ipc"],
      });

      newWorker.process = newWorker;
      newWorker.isDead = () => {
        return newWorker.exitCode !== null || newWorker.killed;
      };
      newWorker.id = newEnvironment.NODE_UNIQUE_ID;

      function checkSendImplementation(worker) {
        let sendImplemented = true;

        if (
          !(
            process.versions &&
            process.versions.bun &&
            process.versions.bun[0] != "0"
          )
        ) {
          if (!worker.send) {
            sendImplemented = false;
          }

          let oldLog = console.log;
          console.log = (...params) => {
            if (
              params[0] ==
              "ChildProcess.prototype.send() - Sorry! Not implemented yet"
            ) {
              throw new Error("NOT IMPLEMENTED");
            } else {
              oldLog(...params);
            }
          };

          try {
            worker.send(undefined);
          } catch (err) {
            if (err.message === "NOT IMPLEMENTED") {
              sendImplemented = false;
            }
            console.log(err);
          }

          console.log = oldLog;
        }

        return sendImplemented;
      }

      if (!checkSendImplementation(newWorker)) {
        // Create a fake IPC server for worker process to receive messages
        let fakeWorkerIPCServer = net.createServer((socket) => {
          let receivedData = "";

          socket.on("data", (data) => {
            receivedData += data.toString();
          });

          socket.on("end", () => {
            newWorker.emit("message", receivedData);
          });
        });
        fakeWorkerIPCServer.listen(
          os.platform() === "win32"
            ? path.join(
                "\\\\?\\pipe",
                process.dirname,
                "temp/.P" + newWorker.process.pid + ".ipc",
              )
            : process.dirname + "/temp/.P" + newWorker.process.pid + ".ipc",
        );

        // Cleanup when worker process exits
        newWorker.on("exit", () => {
          fakeWorkerIPCServer.close();
          delete cluster.workers[newWorker.id];
        });

        newWorker.send = function (
          message,
          fakeParam2,
          fakeParam3,
          fakeParam4,
          tries,
        ) {
          if (!tries) tries = 0;

          try {
            // Create a fake IPC connection to send messages to worker process
            let fakeWorkerIPCConnection = net.createConnection(
              os.platform() === "win32"
                ? path.join(
                    "\\\\?\\pipe",
                    process.dirname,
                    "temp/.W" + newWorker.process.pid + ".ipc",
                  )
                : process.dirname + "/temp/.W" + newWorker.process.pid + ".ipc",
              () => {
                fakeWorkerIPCConnection.end(message);
              },
            );
          } catch (err) {
            if (tries > 50) throw err;
            newWorker.send(
              message,
              fakeParam2,
              fakeParam3,
              fakeParam4,
              tries + 1,
            );
          }
        };
      } else {
        newWorker.on("exit", () => {
          delete cluster.workers[newWorker.id];
        });
      }

      cluster.workers[newWorker.id] = newWorker;
      cluster._workersCounter++;
      return newWorker;
    };
  };

  if (
    process.isBun &&
    (cluster.isMaster === undefined ||
      (cluster.isMaster && process.env.NODE_UNIQUE_ID))
  ) {
    cluster.bunShim();
  }

  // Shim cluster.isPrimary field
  if (cluster.isPrimary === undefined && cluster.isMaster !== undefined)
    cluster.isPrimary = cluster.isMaster;
}

module.exports = cluster;
