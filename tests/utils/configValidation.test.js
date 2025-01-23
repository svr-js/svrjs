const {
  validateConfig,
  addConfigValidators
} = require("../../src/utils/configValidation");

describe("Configuration validation utility functions", () => {
  describe("validateConfig", () => {
    test("should pass validation for a valid global config", () => {
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
            isNotDirectory: true,
            replacements: [{ regex: "/replace/", replacement: "/replacement/" }]
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

    test("should throw an error for an invalid global config", () => {
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
            isNotDirectory: true,
            replacements: [{ regex: "/replace/", replacement: "/replacement/" }]
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
        'Invalid value for the "users" configuration property in the global configuration'
      );
    });

    test("should pass validation for a valid virtual host config", () => {
      const config = {
        configVHost: [
          {
            domain: "vhost1.example.com",
            ip: "192.168.1.10",
            wwwroot: "/var/www/vhost1"
          },
          {
            domain: "vhost2.example.com",
            ip: "10.0.0.2",
            wwwroot: "/var/www/vhost2"
          }
        ]
      };

      expect(() => validateConfig(config)).not.toThrow();
    });

    test("should throw an error if virtual host config is not an array", () => {
      const config = {
        configVHost: {
          domain: "vhost1.example.com",
          ip: "192.168.1.10"
        }
      };

      expect(() => validateConfig(config)).toThrow(
        "Invalid virtual host configuration"
      );
    });

    test("should throw an error if a virtual host entry is not an object", () => {
      const config = {
        configVHost: ["invalidEntry"]
      };

      expect(() => validateConfig(config)).toThrow(
        "Invalid virtual host configuration"
      );
    });

    test("should throw an error if a virtual host is missing domain and IP", () => {
      const config = {
        configVHost: [
          {
            wwwroot: "/var/www/missing"
          }
        ]
      };

      expect(() => validateConfig(config)).toThrow(
        "Virtual hosts must have either a domain name or an IP address"
      );
    });

    test("should throw an error for invalid configuration property in virtual host", () => {
      const config = {
        configVHost: [
          {
            domain: "vhost1.example.com",
            ip: "192.168.1.10",
            wwwroot: null
          }
        ]
      };

      expect(() => validateConfig(config)).toThrow(
        'Invalid value for the "wwwroot" configuration property in the "vhost1.example.com" on 192.168.1.10 virtual host'
      );
    });

    test("should throw an error for invalid IP in virtual host", () => {
      const config = {
        configVHost: [
          {
            domain: "vhost1.example.com",
            ip: "invalidIP",
            port: 8081
          }
        ]
      };

      expect(() => validateConfig(config)).toThrow(
        'Invalid value for the "ip" configuration property in the "vhost1.example.com" on invalidIP virtual host'
      );
    });

    test("should throw an error for global-only property in virtual host config", () => {
      const config = {
        configVHost: [
          {
            domain: "vhost1.example.com",
            ip: "192.168.1.10",
            wwwroot: "/var/www/vhost1",
            port: 8080 // Global-only property
          }
        ]
      };

      expect(() => validateConfig(config)).toThrow(
        'The "port" configuration property in the "vhost1.example.com" on 192.168.1.10 virtual host is supported only in the global configuration'
      );
    });

    test("should throw an error for another global-only property in virtual host config", () => {
      const config = {
        configVHost: [
          {
            domain: "vhost1.example.com",
            ip: "192.168.1.10",
            wwwroot: "/var/www/vhost1",
            secure: true // Global-only property
          }
        ]
      };

      expect(() => validateConfig(config)).toThrow(
        'The "secure" configuration property in the "vhost1.example.com" on 192.168.1.10 virtual host is supported only in the global configuration'
      );
    });

    test("should throw an error for multiple global-only properties in virtual host config", () => {
      const config = {
        configVHost: [
          {
            domain: "vhost1.example.com",
            ip: "192.168.1.10",
            wwwroot: "/var/www/vhost1",
            port: 8080, // Global-only property
            secure: true // Global-only property
          }
        ]
      };

      expect(() => validateConfig(config)).toThrow(
        'The "port" configuration property in the "vhost1.example.com" on 192.168.1.10 virtual host is supported only in the global configuration'
      );
    });

    test("should pass validation for a valid virtual host config without global-only properties", () => {
      const config = {
        configVHost: [
          {
            domain: "vhost1.example.com",
            ip: "192.168.1.10",
            wwwroot: "/var/www/vhost1"
          }
        ]
      };

      expect(() => validateConfig(config)).not.toThrow();
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
