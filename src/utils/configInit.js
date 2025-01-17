const deepClone = require("./deepClone.js");
const ipMatch = require("./ipMatch.js");
const matchHostname = require("./matchHostname.js");

function configInit(config, hostname, ip) {
  if (!config.configVHost) return deepClone(config); // If there is no virtual host configuration, just deep clone the configuration object.

  // The code below only applies to SVR.JS with virtual host configuration
  const newConfig = Object.assign(Object.create(null), config);

  newConfig.configVHost.every((vhost) => {
    if (
      (vhost.domain === undefined || matchHostname(vhost.domain, hostname)) &&
      (vhost.ip === undefined || ipMatch(vhost.ip, ip))
    ) {
      Object.keys(vhost).forEach((key) => {
        if (typeof vhost[key] === "object" && vhost[key] !== null) {
          if (Array.isArray(vhost[key])) {
            newConfig[key] = [...newConfig[key], ...vhost[key]];
          } else {
            newConfig[key] = Object.assign(
              Object.create(null),
              newConfig[key],
              vhost[key]
            );
          }
        } else {
          newConfig[key] = vhost[key];
        }
      });
      return false;
    }
    return true;
  });

  Object.keys(newConfig).forEach((key) => {
    if (typeof newConfig[key] === "object" && newConfig[key] !== null) {
      newConfig[key] = deepClone(newConfig[key]);
    }
  });

  return newConfig;
}

module.exports = configInit;
