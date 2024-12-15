const os = require("os");
const cluster = require("../utils/clusterShim.js");
const serverErrorDescs = require("../res/serverErrorDescriptions.js");
let serverconsole = {};
let attempts = 5;
let attemptsRedir = 5;

function serverErrorHandler(err, isRedirect, server, start) {
  if (isRedirect) attemptsRedir--;
  else attempts--;
  if (cluster.isPrimary === undefined && (isRedirect ? attemptsRedir : attempts)) {
    serverconsole.locerrmessage(
      serverErrorDescs[err.code]
        ? serverErrorDescs[err.code]
        : serverErrorDescs["UNKNOWN"]
    );
    serverconsole.locmessage(
      `${isRedirect ? attemptsRedir : attempts} attempts left.`
    );
  } else {
    try {
      process.send(
        "\x12ERRLIST" + (isRedirect ? attemptsRedir : attempts) + err.code
      );
      // eslint-disable-next-line no-unused-vars
    } catch (err) {
      // Probably main process exited
    }
  }
  if ((isRedirect ? attemptsRedir : attempts) > 0) {
    server.close();
    setTimeout(start, 900);
  } else {
    try {
      if (cluster.isPrimary !== undefined)
        process.send("\x12ERRCRASH" + err.code);
      // eslint-disable-next-line no-unused-vars
    } catch (err) {
      // Probably main process exited
    }
    setTimeout(() => {
      const errno = os.constants.errno[err.code];
      process.exit(errno !== undefined ? errno : 1);
    }, 50);
  }
}

serverErrorHandler.resetAttempts = (isRedirect) => {
  if (isRedirect) attemptsRedir = 5;
  else attempts = 5;
};

process.messageEventListeners.push((worker, serverconsole) => {
  return (message) => {
    if (worker.id == Object.keys(cluster.workers)[0]) {
      if (message.indexOf("\x12ERRLIST") == 0) {
        const tries = parseInt(message.substring(8, 9));
        const errCode = message.substring(9);
        serverconsole.locerrmessage(
          serverErrorDescs[errCode]
            ? serverErrorDescs[errCode]
            : serverErrorDescs["UNKNOWN"]
        );
        serverconsole.locmessage(`${tries} attempts left.`);
      }
      if (message.length >= 9 && message.indexOf("\x12ERRCRASH") == 0) {
        const errno = os.constants.errno[message.substring(9)];
        process.exit(errno !== undefined ? errno : 1);
      }
    }
  };
});

module.exports = (serverconsoleO) => {
  serverconsole = serverconsoleO;
  return serverErrorHandler;
};
