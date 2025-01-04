# SVR.JS Core

SVR.JS Core is a library for static file serving, built from SVR.JS source code.

Example code (with Node.JS "http" module):
```javascript
var http = require("http");
var fs = require("fs");
var url = require("url");
var svrjsCore = require("svrjs-core").init(); // Initialize SVR.JS Core
var server = http.createServer(function (req,res) {
  if(url.parse(req.url).pathname == "/useragent") {
	  res.writeHead(200, "OK", {"content-type": "text-plain"}); // Output as plain text
	  res.end("Your user agent: " + req.headers["user-agent"]); // Send user agent
  } else {
      svrjsCore(req,res); // Serve static content
  }
}).listen(8888);
```

Example code (with Express):
```javascript
var express = require("express");
var svrjsCore = require("svrjs-core");

var app = express();
app.use(svrjsCore());

app.listen(3000);
```

## Note about older Node.JS versions

In Node.JS versions older than v14.17.0, `AbortController` is not implemented in Node.JS, so the `lru-cache` library may emit a warning about `AbortController`. If you aim for compatibility with these versions of Node.JS, install the `node-abort-controller` npm package and add this code before loading SVR.JS Core:

```javascript
// Polyfill AbortController
if (typeof AbortController === "undefined") {
  Object.assign(globalThis, require("node-abort-controller"));
}
```

In Node.JS versions older than v12.0.0, `globalThis` is not implemented in Node.JS, so loading SVR.JS Core may fail due to undefined `globalThis`. If you aim for compatibility with these versions of Node.JS, install the `globalthis` npm package and add this code before loading SVR.JS Core and polyfilling `AbortController`:

```javascript
// Polyfill globalThis
require("globalthis/shim")();
```

## Methods

### *svrjsCore([config])*

Parameters:

- *config* - the SVR.JS Core configuration (optional, *Object*)

Returns: the request handler for use in Node.JS HTTP server or Express, with three parameters (*req*, *res*, and optional *next*)

The *config* object is almost the same format as SVR.JS configuration. You can read about SVR.JS configuration properties in [the SVR.JS documentation](https://svrjs.org/docs/config/configuration).

However, only these SVR.JS configuration properties apply to SVR.JS Core:
- *page404*
- *enableCompression*
- *customHeaders*
- *enableDirectoryListing*
- *enableDirectoryListingWithDefaultHead*
- *serverAdministratorEmail*
- *stackHidden*
- *exposeServerVersion*
- *dontCompress*
- *enableIPSpoofing*
- *enableETag*
- *rewriteDirtyURLs*
- *errorPages*
- *disableTrailingSlashRedirects*
- *allowDoubleSlashes*
- *enableIncludingHeadAndFootInHTML*
- *wwwroot*

### *svrjsCore.init([config])*

An alias to the *svrjsCore()* function
