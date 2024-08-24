const os = require("os");
const sha256 = require("../utils/sha256.js");
const createRegex = require("../utils/createRegex.js");
const ipMatch = require("../utils/ipMatch.js");
const matchHostname = require("../utils/matchHostname.js");
const cluster = require("../utils/clusterBunShim.js");

// Brute force protection-related
let bruteForceDb = {};

// PBKDF2/scrypt cache
let pbkdf2Cache = [];
let scryptCache = [];
let passwordHashCacheIntervalId = -1;

if (!cluster.isPrimary) {
  passwordHashCacheIntervalId = setInterval(function () {
    pbkdf2Cache = pbkdf2Cache.filter(function (entry) {
      return entry.addDate > new Date() - 3600000;
    });
    scryptCache = scryptCache.filter(function (entry) {
      return entry.addDate > new Date() - 3600000;
    });
  }, 1800000);
}

module.exports = (req, res, logFacilities, config, next) => {
  let nonscodeIndex = -1;
  let authIndex = -1;
  let regexI = [];
  let hrefWithoutDuplicateSlashes = "";
  const reqip = req.socket.realRemoteAddress
    ? req.socket.realRemoteAddress
    : req.socket.remoteAddress;

  // Scan for non-standard codes
  if (!req.isProxy && config.nonStandardCodes != undefined) {
    for (let i = 0; i < config.nonStandardCodes.length; i++) {
      if (
        matchHostname(config.nonStandardCodes[i].host, req.headers.host) &&
        ipMatch(
          config.nonStandardCodes[i].ip,
          req.socket ? req.socket.localAddress : undefined,
        )
      ) {
        let isMatch = false;
        hrefWithoutDuplicateSlashes = req.parsedURL.pathname.replace(
          /\/+/g,
          "/",
        );
        if (config.nonStandardCodes[i].regex) {
          // Regex match
          var createdRegex = createRegex(
            config.nonStandardCodes[i].regex,
            true,
          );
          isMatch =
            req.url.match(createdRegex) ||
            hrefWithoutDuplicateSlashes.match(createdRegex);
          regexI[i] = createdRegex;
        } else {
          // Non-regex match
          isMatch =
            config.nonStandardCodes[i].url == hrefWithoutDuplicateSlashes ||
            (os.platform() == "win32" &&
              config.nonStandardCodes[i].url.toLowerCase() ==
                hrefWithoutDuplicateSlashes.toLowerCase());
        }
        if (isMatch) {
          if (config.nonStandardCodes[i].scode == 401) {
            // HTTP authentication
            if (authIndex == -1) {
              authIndex = i;
            }
          } else {
            if (nonscodeIndex == -1) {
              if (
                (config.nonStandardCodes[i].scode == 403 ||
                  config.nonStandardCodes[i].scode == 451) &&
                config.nonStandardCodes[i].users !== undefined
              ) {
                if (config.nonStandardCodes[i].users.check(reqip))
                  nonscodeIndex = i;
              } else {
                nonscodeIndex = i;
              }
            }
          }
        }
      }
    }
  }

  // Handle non-standard codes
  if (nonscodeIndex > -1) {
    let nonscode = config.nonStandardCodes[nonscodeIndex];
    if (
      nonscode.scode == 301 ||
      nonscode.scode == 302 ||
      nonscode.scode == 307 ||
      nonscode.scode == 308
    ) {
      let location = "";
      if (regexI[nonscodeIndex]) {
        location = req.url.replace(regexI[nonscodeIndex], nonscode.location);
        if (location == req.url) {
          // Fallback replacement
          location = hrefWithoutDuplicateSlashes.replace(
            regexI[nonscodeIndex],
            nonscode.location,
          );
        }
      } else if (
        req.url.split("?")[1] == undefined ||
        req.url.split("?")[1] == null ||
        req.url.split("?")[1] == "" ||
        req.url.split("?")[1] == " "
      ) {
        location = nonscode.location;
      } else {
        location = nonscode.location + "?" + req.url.split("?")[1];
      }
      res.redirect(
        location,
        nonscode.scode == 302 || nonscode.scode == 307,
        nonscode.scode == 307 || nonscode.scode == 308,
      );
      return;
    } else {
      res.error(nonscode.scode);
      if (nonscode.scode == 403) {
        logFacilities.errmessage("Content blocked.");
      } else if (nonscode.scode == 410) {
        logFacilities.errmessage("Content is gone.");
      } else if (nonscode.scode == 418) {
        logFacilities.errmessage("SVR.JS is always a teapot ;)");
      } else {
        logFacilities.errmessage("Client fails receiving content.");
      }
      return;
    }
  }

  // Handle HTTP authentication
  if (authIndex > -1) {
    let authcode = config.nonStandardCodes[authIndex];

    // Function to check if passwords match
    const checkIfPasswordMatches = (list, password, callback, _i) => {
      if (!_i) _i = 0;
      const cb = function (hash) {
        if (hash == list[_i].pass) {
          callback(true);
        } else if (_i >= list.length - 1) {
          callback(false);
        } else {
          checkIfPasswordMatches(list, password, callback, _i + 1);
        }
      };
      let hashedPassword = sha256(password + list[_i].salt);
      let cacheEntry = null;
      if (list[_i].scrypt) {
        if (!crypto.scrypt) {
          res.error(
            500,
            new Error(
              "SVR.JS doesn't support scrypt-hashed passwords on Node.JS versions without scrypt hash support.",
            ),
          );
          return;
        } else {
          cacheEntry = scryptCache.find(function (entry) {
            return (
              entry.password == hashedPassword && entry.salt == list[_i].salt
            );
          });
          if (cacheEntry) {
            cb(cacheEntry.hash);
          } else {
            crypto.scrypt(
              password,
              list[_i].salt,
              64,
              function (err, derivedKey) {
                if (err) {
                  res.error(500, err);
                } else {
                  const key = derivedKey.toString("hex");
                  scryptCache.push({
                    hash: key,
                    password: hashedPassword,
                    salt: list[_i].salt,
                    addDate: new Date(),
                  });
                  cb(key);
                }
              },
            );
          }
        }
      } else if (list[_i].pbkdf2) {
        if (crypto.__disabled__ !== undefined) {
          res.error(
            500,
            new Error(
              "SVR.JS doesn't support PBKDF2-hashed passwords on Node.JS versions without crypto support.",
            ),
          );
          return;
        } else {
          cacheEntry = pbkdf2Cache.find(function (entry) {
            return (
              entry.password == hashedPassword && entry.salt == list[_i].salt
            );
          });
          if (cacheEntry) {
            cb(cacheEntry.hash);
          } else {
            crypto.pbkdf2(
              password,
              list[_i].salt,
              36250,
              64,
              "sha512",
              function (err, derivedKey) {
                if (err) {
                  res.error(500, err);
                } else {
                  const key = derivedKey.toString("hex");
                  pbkdf2Cache.push({
                    hash: key,
                    password: hashedPassword,
                    salt: list[_i].salt,
                    addDate: new Date(),
                  });
                  cb(key);
                }
              },
            );
          }
        }
      } else {
        cb(hashedPassword);
      }
    };

    const authorizedCallback = (bruteProtection) => {
      try {
        const ha = config.getCustomHeaders();
        ha["WWW-Authenticate"] =
          'Basic realm="' +
          (authcode.realm
            ? authcode.realm.replace(/(\\|")/g, "\\$1")
            : "SVR.JS HTTP Basic Authorization") +
          '", charset="UTF-8"';
        const credentials = req.headers["authorization"];
        if (!credentials) {
          res.error(401, ha);
          logFacilities.errmessage("Content needs authorization.");
          return;
        }
        const credentialsMatch = credentials.match(/^Basic (.+)$/);
        if (!credentialsMatch) {
          res.error(401, ha);
          logFacilities.errmessage("Malformed credentials.");
          return;
        }
        const decodedCredentials = Buffer.from(
          credentialsMatch[1],
          "base64",
        ).toString("utf8");
        const decodedCredentialsMatch =
          decodedCredentials.match(/^([^:]*):(.*)$/);
        if (!decodedCredentialsMatch) {
          res.error(401, ha);
          logFacilities.errmessage("Malformed credentials.");
          return;
        }
        const username = decodedCredentialsMatch[1];
        const password = decodedCredentialsMatch[2];
        let usernameMatch = [];
        let sha256Count = 0;
        let pbkdf2Count = 0;
        let scryptCount = 0;
        if (!authcode.userList || authcode.userList.indexOf(username) > -1) {
          usernameMatch = config.users.filter(function (entry) {
            if (entry.scrypt) {
              scryptCount++;
            } else if (entry.pbkdf2) {
              pbkdf2Count++;
            } else {
              sha256Count++;
            }
            return entry.name == username;
          });
        }
        if (usernameMatch.length == 0) {
          // Pushing false user match to prevent time-based user enumeration
          let fakeCredentials = {
            name: username,
            pass: "SVRJSAWebServerRunningOnNodeJS",
            salt: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0",
          };
          if (!process.isBun) {
            if (scryptCount > sha256Count && scryptCount > pbkdf2Count) {
              fakeCredentials.scrypt = true;
            } else if (pbkdf2Count > sha256Count) {
              fakeCredentials.pbkdf2 = true;
            }
          }
          usernameMatch.push(fakeCredentials);
        }
        checkIfPasswordMatches(usernameMatch, password, function (authorized) {
          try {
            if (!authorized) {
              if (bruteProtection) {
                if (process.send) {
                  process.send("\x12AUTHW" + reqip);
                } else {
                  if (!bruteForceDb[reqip])
                    bruteForceDb[reqip] = {
                      invalidAttempts: 0,
                    };
                  bruteForceDb[reqip].invalidAttempts++;
                  if (bruteForceDb[reqip].invalidAttempts >= 10) {
                    bruteForceDb[reqip].lastAttemptDate = new Date();
                  }
                }
              }
              res.error(401, ha);
              logFacilities.errmessage(
                'User "' +
                  String(username).replace(/[\r\n]/g, "") +
                  '" failed to log in.',
              );
            } else {
              if (bruteProtection) {
                if (process.send) {
                  process.send("\x12AUTHR" + reqip);
                } else {
                  if (bruteForceDb[reqip])
                    bruteForceDb[reqip] = {
                      invalidAttempts: 0,
                    };
                }
              }
              logFacilities.reqmessage(
                'Client is logged in as "' +
                  String(username).replace(/[\r\n]/g, "") +
                  '".',
              );
              req.authUser = username;
              next();
            }
          } catch (err) {
            res.error(500, err);
            return;
          }
        });
      } catch (err) {
        res.error(500, err);
        return;
      }
    };
    if (authcode.disableBruteProtection) {
      // Don't brute-force protect it, just do HTTP authentication
      authorizedCallback(false);
    } else if (!process.send) {
      // Query data from JS object database
      if (
        !bruteForceDb[reqip] ||
        !bruteForceDb[reqip].lastAttemptDate ||
        new Date() - 300000 >= bruteForceDb[reqip].lastAttemptDate
      ) {
        if (bruteForceDb[reqip] && bruteForceDb[reqip].invalidAttempts >= 10)
          bruteForceDb[reqip] = {
            invalidAttempts: 5,
          };
        authorizedCallback(true);
      } else {
        res.error(429);
        logFacilities.errmessage("Brute force limit reached!");
      }
    } else {
      var listenerEmitted = false;

      // Listen for brute-force protection response
      const authMessageListener = (message) => {
        if (listenerEmitted) return;
        if (message == "\x14AUTHA" + reqip || message == "\x14AUTHD" + reqip) {
          process.removeListener("message", authMessageListener);
          listenerEmitted = true;
        }
        if (message == "\x14AUTHD" + reqip) {
          res.error(429);
          logFacilities.errmessage("Brute force limit reached!");
        } else if (message == "\x14AUTHA" + reqip) {
          authorizedCallback(true);
        }
      };
      process.on("message", authMessageListener);
      process.send("\x12AUTHQ" + reqip);
    }
  } else {
    next();
  }
};

// IPC listener for brute force protection
module.exports.mainMessageListenerWrapper = (worker) => {
  return function bruteForceListener(message) {
    let ip = "";
    if (message.substring(0, 6) == "\x12AUTHQ") {
      ip = message.substring(6);
      if (
        !bruteForceDb[ip] ||
        !bruteForceDb[ip].lastAttemptDate ||
        new Date() - 300000 >= bruteForceDb[ip].lastAttemptDate
      ) {
        if (bruteForceDb[ip] && bruteForceDb[ip].invalidAttempts >= 10)
          bruteForceDb[ip] = {
            invalidAttempts: 5,
          };
        worker.send("\x14AUTHA" + ip);
      } else {
        worker.send("\x14AUTHD" + ip);
      }
    } else if (message.substring(0, 6) == "\x12AUTHR") {
      ip = message.substring(6);
      if (bruteForceDb[ip])
        bruteForceDb[ip] = {
          invalidAttempts: 0,
        };
    } else if (message.substring(0, 6) == "\x12AUTHW") {
      ip = message.substring(6);
      if (!bruteForceDb[ip])
        bruteForceDb[ip] = {
          invalidAttempts: 0,
        };
      bruteForceDb[ip].invalidAttempts++;
      if (bruteForceDb[ip].invalidAttempts >= 10) {
        bruteForceDb[ip].lastAttemptDate = new Date();
      }
    }
  };
};

module.exports.commands = {
  stop: (args, passCommand) => {
    clearInterval(passwordHashCacheIntervalId);
    passCommand(args);
  },
};