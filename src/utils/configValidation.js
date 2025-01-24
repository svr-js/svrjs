const createRegex = require("./createRegex.js");
const net = require("net");

function validateRegex(regex) {
  try {
    createRegex(regex, false);
    return true;
  } catch (e) {
    console.error(e.message);
    return false;
  }
}

function validateIP(ip) {
  return net.isIP(ip) !== 0;
}

function validatePort(port) {
  if (typeof port === "number") {
    return port >= 0 && port <= 65535;
  }
  return false;
}

const validators = {
  timestamp: (value) => typeof value === "number",
  users: (value) => {
    if (!Array.isArray(value)) return false;
    return value.every(
      (user) =>
        typeof user.name === "string" &&
        typeof user.pass === "string" &&
        typeof user.salt === "string" &&
        (user.pbkdf2 === undefined || typeof user.pbkdf2 === "boolean") &&
        (user.scrypt === undefined || typeof user.scrypt === "boolean")
    );
  },
  port: (value) => validatePort(value) || typeof value == "string",
  pubport: (value) => validatePort(value),
  sport: (value) => validatePort(value) || typeof value == "string",
  spubport: (value) => validatePort(value),
  secure: (value) => typeof value === "boolean",
  cert: (value) => typeof value === "string",
  key: (value) => typeof value === "string",
  sni: (value) => {
    if (typeof value !== "object" || value === null) return false;
    return Object.keys(value).every(
      (domain) =>
        typeof value[domain].cert === "string" &&
        typeof value[domain].key === "string"
    );
  },
  enableOCSPStapling: (value) => typeof value === "boolean",
  useClientCertificate: (value) => typeof value === "boolean",
  rejectUnauthorizedClientCertificates: (value) => typeof value === "boolean",
  cipherSuite: (value) => typeof value === "string",
  ecdhCurve: (value) => typeof value === "string",
  signatureAlgorithms: (value) => typeof value === "string",
  tlsMinVersion: (value) =>
    ["TLSv1.3", "TLSv1.2", "TLSv1.1", "TLSv1"].indexOf(value) != -1,
  tlsMaxVersion: (value) =>
    ["TLSv1.3", "TLSv1.2", "TLSv1.1", "TLSv1"].indexOf(value) != -1,
  domain: (value) => typeof value === "string",
  wwwredirect: (value) => typeof value === "boolean",
  page404: (value) => typeof value === "string",
  errorPages: (value) => {
    if (!Array.isArray(value)) return false;
    return value.every(
      (page) =>
        typeof page.scode === "number" &&
        typeof page.path === "string" &&
        (page.host === undefined || typeof page.host === "string") &&
        (page.ip === undefined || validateIP(page.ip))
    );
  },
  serverAdministratorEmail: (value) => typeof value === "string",
  enableLogging: (value) => typeof value === "boolean",
  enableCompression: (value) => typeof value === "boolean",
  enableHTTP2: (value) => typeof value === "boolean",
  enableDirectoryListing: (value) => typeof value === "boolean",
  enableDirectoryListingWithDefaultHead: (value) => typeof value === "boolean",
  nonStandardCodes: (value) => {
    if (!Array.isArray(value)) return false;
    return value.every(
      (code) =>
        typeof code.scode === "number" &&
        !(code.url === undefined && code.regex === undefined) &&
        (code.url === undefined || typeof code.url === "string") &&
        (code.regex === undefined || validateRegex(code.regex)) &&
        (code.location === undefined || typeof code.location === "string") &&
        (code.realm === undefined || typeof code.realm === "string") &&
        (code.disableBruteProtection === undefined ||
          typeof code.disableBruteProtection === "boolean") &&
        (code.host === undefined || typeof code.host === "string") &&
        (code.ip === undefined || typeof code.ip === "string") &&
        (code.userList === undefined || Array.isArray(code.userList)) &&
        (code.users === undefined ||
          (Array.isArray(code.users) &&
            code.users.every((item) => validateIP(item))))
    );
  },
  dontCompress: (value) =>
    Array.isArray(value) && value.every((item) => typeof item === "string"),
  enableIPSpoofing: (value) => typeof value === "boolean",
  enableETag: (value) => typeof value === "boolean",
  customHeaders: (value) => {
    if (typeof value !== "object" || value === null) return false;
    return Object.keys(value).every((key) => typeof key === "string");
  },
  http2Settings: (value) => {
    if (typeof value !== "object" || value === null) return false;
    return Object.keys(value).every(
      (key) =>
        [
          "headerTableSize",
          "enablePush",
          "initialWindowSize",
          "maxFrameSize",
          "maxConcurrentStreams",
          "maxHeaderListSize",
          "maxHeaderSize",
          "enableConnectProtocol",
          "customSettings"
        ].indexOf(key) != -1 &&
        (typeof value[key] === "number" ||
          typeof value[key] === "boolean" ||
          (key === "customSettings" &&
            typeof value[key] === "object" &&
            value[key] !== null))
    );
  },
  enableIncludingHeadAndFootInHTML: (value) => typeof value === "boolean",
  blacklist: (value) =>
    Array.isArray(value) && value.every((item) => validateIP(item)),
  exposeServerVersion: (value) => typeof value === "boolean",
  rewriteDirtyURLs: (value) => typeof value === "boolean",
  exposeModsInErrorPages: (value) => typeof value === "boolean",
  enableDirectoryListingVHost: (value) => {
    if (!Array.isArray(value)) return false;
    return value.every(
      (vhost) =>
        !(vhost.ip === undefined && vhost.host === undefined) &&
        (vhost.host === undefined || typeof vhost.host === "string") &&
        (vhost.ip === undefined || validateIP(vhost.ip)) &&
        typeof vhost.enabled === "boolean"
    );
  },
  customHeadersVHost: (value) => {
    if (!Array.isArray(value)) return false;
    return value.every(
      (vhost) =>
        !(vhost.ip === undefined && vhost.host === undefined) &&
        (vhost.host === undefined || typeof vhost.host === "string") &&
        (vhost.ip === undefined || validateIP(vhost.ip)) &&
        !(typeof vhost.headers !== "object" || vhost.headers === null) &&
        Object.keys(vhost.headers).every((key) => typeof key === "string")
    );
  },
  wwwrootPostfixesVHost: (value) => {
    if (!Array.isArray(value)) return false;
    return value.every(
      (vhost) =>
        (vhost.host === undefined || typeof vhost.host === "string") &&
        (vhost.ip === undefined || validateIP(vhost.ip)) &&
        typeof vhost.postfix === "string" &&
        (vhost.skipRegex === undefined || validateRegex(vhost.skipRegex))
    );
  },
  wwwrootPostfixPrefixesVHost: (value) =>
    Array.isArray(value) && value.every((item) => typeof item === "string"),
  allowPostfixDoubleSlashes: (value) => typeof value === "boolean",
  rewriteMap: (value) => {
    if (!Array.isArray(value)) return false;
    return value.every(
      (rule) =>
        validateRegex(rule.definingRegex) &&
        (rule.host === undefined || typeof rule.host === "string") &&
        (rule.ip === undefined || validateIP(rule.ip)) &&
        (rule.append === undefined || typeof rule.append === "string") &&
        (rule.isNotDirectory === undefined ||
          typeof rule.isNotDirectory === "boolean") &&
        (rule.isNotFile === undefined || typeof rule.isNotFile === "boolean") &&
        (rule.allowDoubleSlashes === undefined ||
          typeof rule.allowDoubleSlashes === "boolean") &&
        Array.isArray(rule.replacements) &&
        rule.replacements.every(
          (replacement) =>
            validateRegex(replacement.regex) &&
            typeof replacement.replacement === "string"
        )
    );
  },
  disableNonEncryptedServer: (value) => typeof value === "boolean",
  disableToHTTPSRedirect: (value) => typeof value === "boolean",
  allowStatus: (value) => typeof value === "boolean",
  wwwroot: (value) => typeof value === "string",
  disableUnusedWorkerTermination: (value) => typeof value === "boolean",
  useWebRootServerSideScript: (value) => typeof value === "boolean",
  disableTrailingSlashRedirects: (value) => typeof value === "boolean",
  environmentVariables: (value) => {
    if (typeof value !== "object" || value === null) return false;
    return Object.keys(value).every((key) => typeof key === "string");
  },
  allowDoubleSlashes: (value) => typeof value === "boolean",
  optOutOfStatisticsServer: (value) => typeof value === "boolean",
  disableConfigurationSaving: (value) => typeof value === "boolean",
  wwwrootVHost: (value) => {
    if (!Array.isArray(value)) return false;
    return value.every(
      (vhost) =>
        (vhost.host === undefined || typeof vhost.host === "string") &&
        (vhost.ip === undefined || validateIP(vhost.ip)) &&
        typeof vhost.wwwroot === "string"
    );
  },
  configVHost: () => false, // The "configVHost" property shouldn't be present in the host configuration
  ip: (value) => validateIP(value)
};

const globalOnlyProperties = {
  timestamp: true,
  users: true,
  port: true,
  pubport: true,
  sport: true,
  spubport: true,
  secure: true,
  cert: true,
  key: true,
  sni: true,
  enableOCSPStapling: true,
  useClientCertificate: true,
  rejectUnauthorizedClientCertificates: true,
  cipherSuite: true,
  ecdhCurve: true,
  signatureAlgorithms: true,
  tlsMinVersion: true,
  tlsMaxVersion: true,
  domain: false,
  wwwredirect: false,
  page404: false,
  errorPages: false,
  serverAdministratorEmail: false,
  enableLogging: true,
  enableCompression: false,
  enableHTTP2: true,
  enableDirectoryListing: false,
  enableDirectoryListingWithDefaultHead: false,
  nonStandardCodes: false,
  dontCompress: false,
  enableIPSpoofing: false,
  enableETag: false,
  customHeaders: false,
  http2Settings: true,
  enableIncludingHeadAndFootInHTML: false,
  blacklist: true,
  exposeServerVersion: false,
  rewriteDirtyURLs: false,
  exposeModsInErrorPages: false,
  enableDirectoryListingVHost: false,
  customHeadersVHost: false,
  wwwrootPostfixesVHost: false,
  wwwrootPostfixPrefixesVHost: false,
  allowPostfixDoubleSlashes: false,
  rewriteMap: false,
  disableNonEncryptedServer: true,
  disableToHTTPSRedirect: false,
  allowStatus: false,
  wwwroot: false,
  disableUnusedWorkerTermination: true,
  useWebRootServerSideScript: true,
  disableTrailingSlashRedirects: false,
  environmentVariables: false,
  allowDoubleSlashes: false,
  optOutOfStatisticsServer: true,
  disableConfigurationSaving: false,
  wwwrootVHost: false,
  configVHost: true,
  ip: false
};

function validateConfig(config) {
  Object.keys(config).forEach((prop) => {
    if (prop == "configVHost") {
      if (!Array.isArray(config.configVHost)) {
        throw new Error("Invalid virtual host configuration");
      } else {
        config.configVHost.forEach((vhost) => {
          if (!(typeof vhost === "object" && vhost !== null)) {
            throw new Error("Invalid virtual host configuration");
          } else if (vhost.ip === undefined && vhost.domain === undefined) {
            throw new Error(
              "Virtual hosts must have either a domain name or an IP address"
            );
          } else {
            Object.keys(vhost).forEach((prop) => {
              if (globalOnlyProperties[prop]) {
                throw new Error(
                  `The "${prop}" configuration property in the ${vhost.domain !== undefined && vhost.ip !== undefined ? `"${vhost.domain}" on ${vhost.ip}` : vhost.domain !== undefined ? `"${vhost.domain}"` : vhost.ip} virtual host is supported only in the global configuration`
                );
              } else if (validators[prop] && !validators[prop](vhost[prop])) {
                throw new Error(
                  `Invalid value for the "${prop}" configuration property in the ${vhost.domain !== undefined && vhost.ip !== undefined ? `"${vhost.domain}" on ${vhost.ip}` : vhost.domain !== undefined ? `"${vhost.domain}"` : vhost.ip} virtual host`
                );
              }
            });
          }
        });
      }
    } else if (validators[prop] && !validators[prop](config[prop])) {
      throw new Error(
        `Invalid value for the "${prop}" configuration property in the global configuration`
      );
    }
  });
}

function addConfigValidators(newValidators, newGlobalOnlyProperties) {
  Object.keys(newValidators).forEach((newValidatorProperty) => {
    if (validators[newValidatorProperty]) {
      throw new Error(
        `New configuration validator for the "${newValidatorProperty}" configuration property conflicts with existing validators.`
      );
    } else {
      validators[newValidatorProperty] = newValidators[newValidatorProperty];
      if (newGlobalOnlyProperties)
        globalOnlyProperties[newValidatorProperty] =
          newGlobalOnlyProperties[newValidatorProperty];
    }
  });
}

module.exports = {
  validateConfig: validateConfig,
  addConfigValidators: addConfigValidators
};
