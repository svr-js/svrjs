const os = require("os");
const cluster = require("../utils/clusterBunShim.js");
const serverErrorDescs = require("../res/serverErrorDescriptions.js");
let serverconsole = {};
let attmts = 5;
let attmtsRedir = 5;

function serverErrorHandler(err, isRedirect, server, start) {
  if (isRedirect) attmtsRedir--;
  else attmts--;
  if (cluster.isPrimary === undefined && (isRedirect ? attmtsRedir : attmts)) {
    serverconsole.locerrmessage(
      serverErrorDescs[err.code]
        ? serverErrorDescs[err.code]
        : serverErrorDescs["UNKNOWN"],
    );
    serverconsole.locmessage(
      (isRedirect ? attmtsRedir : attmts) + " attempts left.",
    );
  } else {
    // TODO: worker message listener
    /*try {
        process.send("\x12ERRLIST" + (isRedirect ? attmtsRedir : attmts) + err.code);
      } catch (err) {
        // Probably main process exited
      }*/
  }
  if ((isRedirect ? attmtsRedir : attmts) > 0) {
    server.close();
    setTimeout(start, 900);
  } else {
    // TODO: worker message listener
    /*try {
        if (cluster.isPrimary !== undefined) process.send("\x12ERRCRASH" + err.code);
      } catch (err) {
        // Probably main process exited
      }*/
    setTimeout(function () {
      var errno = os.constants.errno[err.code];
      process.exit(errno !== undefined ? errno : 1);
    }, 50);
  }
}

serverErrorHandler.resetAttempts = (isRedirect) => {
  if (isRedirect) attmtsRedir = 5;
  else attmts = 5;
};

module.exports = (serverconsoleO) => {
  serverconsole = serverconsoleO;
  return serverErrorHandler;
};
