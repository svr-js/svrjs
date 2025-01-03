const fs = require("fs");

let enableLoggingIntoFile = process.serverConfig.enableLogging;
let logFile = undefined;
let logSync = false;
let cluster = require("./clusterShim.js");
let reallyExiting = false;
const timestamp = process.serverConfig.timestamp;

// Logging function
function LOG(s) {
  try {
    if (enableLoggingIntoFile) {
      if (logSync) {
        fs.appendFileSync(
          process.dirname +
            "/log/" +
            (cluster.isPrimary
              ? "master"
              : cluster.isPrimary === undefined
                ? "singlethread"
                : "worker") +
            "-" +
            timestamp +
            ".log",
          "[" + new Date().toISOString() + "] " + s + "\r\n"
        );
      } else {
        if (!logFile) {
          logFile = fs.createWriteStream(
            process.dirname +
              "/log/" +
              (cluster.isPrimary
                ? "master"
                : cluster.isPrimary === undefined
                  ? "singlethread"
                  : "worker") +
              "-" +
              timestamp +
              ".log",
            {
              flags: "a",
              autoClose: false
            }
          );
          logFile.on("error", (err) => {
            if (
              !s.match(
                /^SERVER WARNING MESSAGE(?: \[Request ID: [0-9a-f]{6}\])?: There was a problem while saving logs! Logs will not be kept in log file\. Reason: /
              ) &&
              !reallyExiting
            )
              serverconsole.locwarnmessage(
                "There was a problem while saving logs! Logs will not be kept in log file. Reason: " +
                  err.message
              );
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
    if (
      !s.match(
        /^SERVER WARNING MESSAGE(?: \[Request ID: [0-9a-f]{6}\])?: There was a problem while saving logs! Logs will not be kept in log file\. Reason: /
      ) &&
      !reallyExiting
    )
      serverconsole.locwarnmessage(
        "There was a problem while saving logs! Logs will not be kept in log file. Reason: " +
          err.message
      );
  }
}

// Server console function
const serverconsole = {
  climessage: (msg, reqId) => {
    if (msg.indexOf("\n") != -1) {
      msg.split("\n").forEach((nmsg) => {
        serverconsole.climessage(nmsg, reqId);
      });
      return;
    }
    console.log(
      "\x1b[1mSERVER CLI MESSAGE\x1b[22m" +
        (reqId ? " [Request ID: " + reqId + "]" : "") +
        ": " +
        msg
    );
    LOG(
      "SERVER CLI MESSAGE" +
        (reqId ? " [Request ID: " + reqId + "]" : "") +
        ": " +
        msg
    );
    return;
  },
  reqmessage: (msg, reqId) => {
    if (msg.indexOf("\n") != -1) {
      msg.split("\n").forEach((nmsg) => {
        serverconsole.reqmessage(nmsg, reqId);
      });
      return;
    }
    console.log(
      "\x1b[34m\x1b[1mSERVER REQUEST MESSAGE\x1b[22m" +
        (reqId ? " [Request ID: " + reqId + "]" : "") +
        ": " +
        msg +
        "\x1b[37m\x1b[0m"
    );
    LOG(
      "SERVER REQUEST MESSAGE" +
        (reqId ? " [Request ID: " + reqId + "]" : "") +
        ": " +
        msg
    );
    return;
  },
  resmessage: (msg, reqId) => {
    if (msg.indexOf("\n") != -1) {
      msg.split("\n").forEach((nmsg) => {
        serverconsole.resmessage(nmsg, reqId);
      });
      return;
    }
    console.log(
      "\x1b[32m\x1b[1mSERVER RESPONSE MESSAGE\x1b[22m" +
        (reqId ? " [Request ID: " + reqId + "]" : "") +
        ": " +
        msg +
        "\x1b[37m\x1b[0m"
    );
    LOG(
      "SERVER RESPONSE MESSAGE" +
        (reqId ? " [Request ID: " + reqId + "]" : "") +
        ": " +
        msg
    );
    return;
  },
  errmessage: (msg, reqId) => {
    if (msg.indexOf("\n") != -1) {
      msg.split("\n").forEach((nmsg) => {
        serverconsole.errmessage(nmsg, reqId);
      });
      return;
    }
    console.log(
      "\x1b[31m\x1b[1mSERVER RESPONSE ERROR MESSAGE\x1b[22m" +
        (reqId ? " [Request ID: " + reqId + "]" : "") +
        ": " +
        msg +
        "\x1b[37m\x1b[0m"
    );
    LOG(
      "SERVER RESPONSE ERROR MESSAGE" +
        (reqId ? " [Request ID: " + reqId + "]" : "") +
        ": " +
        msg
    );
    return;
  },
  locerrmessage: (msg, reqId) => {
    if (msg.indexOf("\n") != -1) {
      msg.split("\n").forEach((nmsg) => {
        serverconsole.locerrmessage(nmsg, reqId);
      });
      return;
    }
    console.log(
      "\x1b[41m\x1b[1mSERVER ERROR MESSAGE\x1b[22m" +
        (reqId ? " [Request ID: " + reqId + "]" : "") +
        ": " +
        msg +
        "\x1b[40m\x1b[0m"
    );
    LOG(
      "SERVER ERROR MESSAGE" +
        (reqId ? " [Request ID: " + reqId + "]" : "") +
        ": " +
        msg
    );
    return;
  },
  locwarnmessage: (msg, reqId) => {
    if (msg.indexOf("\n") != -1) {
      msg.split("\n").forEach((nmsg) => {
        serverconsole.locwarnmessage(nmsg, reqId);
      });
      return;
    }
    console.log(
      "\x1b[43m\x1b[1mSERVER WARNING MESSAGE\x1b[22m" +
        (reqId ? " [Request ID: " + reqId + "]" : "") +
        ": " +
        msg +
        "\x1b[40m\x1b[0m"
    );
    LOG(
      "SERVER WARNING MESSAGE" +
        (reqId ? " [Request ID: " + reqId + "]" : "") +
        ": " +
        msg
    );
    return;
  },
  locmessage: (msg, reqId) => {
    if (msg.indexOf("\n") != -1) {
      msg.split("\n").forEach((nmsg) => {
        serverconsole.locmessage(nmsg, reqId);
      });
      return;
    }
    console.log(
      "\x1b[1mSERVER MESSAGE\x1b[22m" +
        (reqId ? " [Request ID: " + reqId + "]" : "") +
        ": " +
        msg
    );
    LOG(
      "SERVER MESSAGE" +
        (reqId ? " [Request ID: " + reqId + "]" : "") +
        ": " +
        msg
    );
    return;
  },
  setProcessExiting: (state) => {
    reallyExiting = state;
  }
};

// Wrap around process.exit, so that log contents can be flushed.
process.unsafeExit = process.exit;
process.exit = (code) => {
  if (logFile && logFile.writable && !logFile.pending) {
    try {
      logFile.close(() => {
        logFile = undefined;
        logSync = true;
        process.unsafeExit(code);
      });
      if (process.isBun) {
        setInterval(() => {
          if (!logFile.writable) {
            logFile = undefined;
            logSync = true;
            process.unsafeExit(code);
          }
        }, 50); // Interval
      }
      setTimeout(() => {
        logFile = undefined;
        logSync = true;
        process.unsafeExit(code);
      }, 10000); // timeout
      // eslint-disable-next-line no-unused-vars
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

module.exports = serverconsole;
