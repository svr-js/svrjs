const {
  validateConfig,
  addConfigValidators
} = require("../../src/utils/configValidation");

describe("Configuration validation utility functions", () => {
  describe("validateConfig", () => {
    test("should pass validation for a valid config", () => {
      const config = {
        users: [
          { name: "user1", pass: "pass1", salt: "salt1" },
          { name: "user2", pass: "pass2", salt: "salt2", pbkdf2: true }
        ],
        port: 8080,
        secure: true,
        cert: "certPath",
        key: "keyPath",
        domain: "example.com",
        wwwredirect: false,
        page404: "/404.html",
        errorPages: [
          { scode: 404, path: "/404.html" },
          { scode: 500, path: "/500.html", ip: "127.0.0.1" }
        ],
        serverAdministratorEmail: "admin@example.com",
        enableLogging: true,
        enableCompression: true,
        enableHTTP2: true,
        enableDirectoryListing: true,
        enableDirectoryListingWithDefaultHead: false,
        nonStandardCodes: [
          { scode: 418, url: "/teapot.html" },
          { scode: 451, url: "/unavailable", location: "/legal" }
        ],
        dontCompress: ["image/jpeg", "image/png"],
        enableIPSpoofing: false,
        enableETag: true,
        customHeaders: { "X-Custom-Header": "value" },
        http2Settings: {
          headerTableSize: 4096,
          enablePush: true,
          initialWindowSize: 1048576,
          maxFrameSize: 16384,
          maxConcurrentStreams: 100,
          maxHeaderListSize: 65535,
          maxHeaderSize: 8192,
          enableConnectProtocol: false,
          customSettings: { setting1: "value1" }
        },
        enableIncludingHeadAndFootInHTML: true,
        blacklist: ["192.168.1.1", "10.0.0.1"],
        disableServerSideScriptExpose: true,
        enableRemoteLogBrowsing: false,
        exposeServerVersion: true,
        rewriteDirtyURLs: false,
        exposeModsInErrorPages: true,
        enableDirectoryListingVHost: [
          { host: "vhost1.example.com", enabled: true },
          { host: "vhost2.example.com", ip: "192.168.1.2", enabled: false }
        ],
        customHeadersVHost: [
          {
            host: "vhost1.example.com",
            headers: { "X-VHost-Header": "value" }
          },
          {
            host: "vhost2.example.com",
            ip: "192.168.1.2",
            headers: { "X-VHost-Header": "value" }
          }
        ],
        wwwrootPostfixesVHost: [
          { host: "vhost1.example.com", postfix: "/postfix1" },
          {
            host: "vhost2.example.com",
            ip: "192.168.1.2",
            postfix: "/postfix2",
            skipRegex: "/^\\/skip/"
          }
        ],
        wwwrootPostfixPrefixesVHost: ["prefix1", "prefix2"],
        allowPostfixDoubleSlashes: true,
        rewriteMap: [
          {
            definingRegex: "/^\\/rewrite/",
            append: "/append",
            isNotDirectory: true
          },
          {
            definingRegex: "/^\\/rewrite2/",
            replacements: [{ regex: "/replace/", replacement: "/replacement/" }]
          }
        ],
        disableNonEncryptedServer: false,
        disableToHTTPSRedirect: true,
        allowStatus: true,
        wwwroot: "/wwwroot",
        disableUnusedWorkerTermination: false,
        useWebRootServerSideScript: true,
        disableTrailingSlashRedirects: false,
        environmentVariables: { ENV_VAR: "value" },
        allowDoubleSlashes: true,
        optOutOfStatisticsServer: false,
        disableConfigurationSaving: true
      };

      expect(() => validateConfig(config)).not.toThrow();
    });

    test("should throw an error for an invalid config", () => {
      const config = {
        users: [
          { name: "user1", pass: "pass1" } // Missing 'salt' property
        ],
        port: 8080,
        secure: true,
        cert: "certPath",
        key: "keyPath",
        domain: "example.com",
        wwwredirect: false,
        page404: "/404.html",
        errorPages: [
          { scode: 404, path: "/404.html" },
          { scode: 500, path: "/500.html", ip: "127.0.0.1" }
        ],
        serverAdministratorEmail: "admin@example.com",
        enableLogging: true,
        enableCompression: true,
        enableHTTP2: true,
        enableDirectoryListing: true,
        enableDirectoryListingWithDefaultHead: false,
        nonStandardCodes: [
          { scode: 418, url: "/teapot.html" },
          { scode: 451, regex: "unavailable", location: "legal" }
        ],
        dontCompress: ["image/jpeg", "image/png"],
        enableIPSpoofing: false,
        enableETag: true,
        customHeaders: { "X-Custom-Header": "value" },
        http2Settings: {
          headerTableSize: 4096,
          enablePush: true,
          initialWindowSize: 1048576,
          maxFrameSize: 16384,
          maxConcurrentStreams: 100,
          maxHeaderListSize: 65535,
          maxHeaderSize: 8192,
          enableConnectProtocol: false,
          customSettings: { setting1: "value1" }
        },
        enableIncludingHeadAndFootInHTML: true,
        blacklist: ["192.168.1.1", "10.0.0.1"],
        disableServerSideScriptExpose: true,
        enableRemoteLogBrowsing: false,
        exposeServerVersion: true,
        rewriteDirtyURLs: false,
        exposeModsInErrorPages: true,
        enableDirectoryListingVHost: [
          { host: "vhost1.example.com", enabled: true },
          { host: "vhost2.example.com", ip: "192.168.1.2", enabled: false }
        ],
        customHeadersVHost: [
          {
            host: "vhost1.example.com",
            headers: { "X-VHost-Header": "value" }
          },
          {
            host: "vhost2.example.com",
            ip: "192.168.1.2",
            headers: { "X-VHost-Header": "value" }
          }
        ],
        wwwrootPostfixesVHost: [
          { host: "vhost1.example.com", postfix: "/postfix1" },
          {
            host: "vhost2.example.com",
            ip: "192.168.1.2",
            postfix: "/postfix2",
            skipRegex: "/^\\/skip/"
          }
        ],
        wwwrootPostfixPrefixesVHost: ["prefix1", "prefix2"],
        allowPostfixDoubleSlashes: true,
        rewriteMap: [
          {
            definingRegex: "/^\\/rewrite/",
            append: "/append",
            isNotDirectory: true
          },
          {
            definingRegex: "/^\\/rewrite2/",
            replacements: [{ regex: "/replace/", replacement: "/replacement/" }]
          }
        ],
        disableNonEncryptedServer: false,
        disableToHTTPSRedirect: true,
        allowStatus: true,
        wwwroot: "/wwwroot",
        disableUnusedWorkerTermination: false,
        useWebRootServerSideScript: true,
        disableTrailingSlashRedirects: false,
        environmentVariables: { ENV_VAR: "value" },
        allowDoubleSlashes: true,
        optOutOfStatisticsServer: false,
        disableConfigurationSaving: true
      };

      expect(() => validateConfig(config)).toThrow(
        'Invalid value for the "users" configuration property'
      );
    });
  });

  describe("addConfigValidators", () => {
    test("should add a new validator", () => {
      const newValidators = {
        newProperty: (value) => typeof value === "string"
      };

      addConfigValidators(newValidators);

      const config = {
        newProperty: "validString"
      };

      expect(() => validateConfig(config)).not.toThrow();
    });

    test("should throw an error if a validator already exists", () => {
      const newValidators = {
        port: (value) => typeof value === "string"
      };

      expect(() => addConfigValidators(newValidators)).toThrow(
        'New configuration validator for the "port" configuration property conflicts with existing validators.'
      );
    });
  });
});
