const parseURL = require("../utils/urlParserLegacy.js");
let formidable = undefined;
try {
  formidable = require("formidable");
} catch (err) {
  formidable = {
    _errored: err,
  };
}

const legacyParsedURLSymbol = Symbol("legacyParsedURL");

module.exports = (legacyMod) => {
  const legacyModHandler = new legacyMod();

  let middleware = (req, res, logFacilities, config, next) => {
    if (!req[legacyParsedURLSymbol])
      req[legacyParsedURLSymbol] = parseURL(req.url);

    let ext = req[legacyParsedURLSymbol].pathname.match(/[^\/]\.([^.]+)$/);
    if (!ext) ext = "";

    // Function to parse incoming POST data from the request
    const parsePostData = (options, callback) => {
      // If the request method is not POST, return a 405 Method Not Allowed error
      if (req.method != "POST") {
        // Get the default custom headers and add "Allow" header with value "POST"
        var customHeaders = getCustomHeaders();
        customHeaders["Allow"] = "POST";

        // Call the server error function with 405 status code and custom headers
        callServerError(405, customHeaders);
        return;
      }

      // Set formidableOptions to options, if provided; otherwise, set it to an empty object
      var formidableOptions = options ? options : {};

      // If no callback is provided, set the callback to options and reset formidableOptions
      if (!callback) {
        callback = options;
        formidableOptions = {};
      }

      // If the formidable module had an error, call the server error function with 500 status code and error stack
      if (formidable._errored) callServerError(500, formidable._errored);

      // Create a new formidable form
      var form = formidable(formidableOptions);

      // Parse the request and process the fields and files
      form.parse(req, function (err, fields, files) {
        // If there was an error, call the server error function with status code determined by error
        if (err) {
          if (err.httpCode) callServerError(err.httpCode);
          else callServerError(400);
          return;
        }
        // Otherwise, call the provided callback function with the parsed fields and files
        callback(fields, files);
      });
    };

    legacyModHandler.callback(
      req, // req
      res, // res
      logFacilities, // serverconsole
      res.responseEnd, // responseEnd
      req[legacyParsedURLSymbol].pathname, // href
      ext, // ext
      req[legacyParsedURLSymbol], // uobject
      req[legacyParsedURLSymbol].search, // search
      "index.html", // defaultpage
      config.users, // users
      config.page404, // page404
      res.head, // head
      res.foot, // foot
      "", // fd
      next, // elseCallback
      config, // configJSON
      res.error, // callServerError
      config.getCustomHeaders, // getCustomHeaders
      req.originalParsedURL.pathname, // origHref
      res.redirect, // redirect
      parsePostData, // parsePostData
      req.authUser, // authUser
    )();
  };

  if (legacyModHandler.proxyCallback) {
    middleware.proxy = (req, socket, head, logFacilities, config, next) => {
      legacyModHandler.proxyCallback(
        req, // req
        socket, // socket
        head, // head
        config, // configJSON
        logFacilities, // serverconsole
        next, // elseCallback
      )();
    };
  }

  return middleware;
};
