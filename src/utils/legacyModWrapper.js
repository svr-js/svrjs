let formidable = undefined;
try {
  formidable = require("formidable");
} catch (err) {
  formidable = {
    _errored: err
  };
}

module.exports = (legacyMod) => {
  const legacyModHandler = new legacyMod();

  let middleware = (req, res, logFacilities, config, next) => {
    let ext = req.parsedURL.pathname.match(/[^/]\.([^.]+)$/);
    if (!ext) ext = "";
    else ext = ext[1].toLowerCase();

    // Function to parse incoming POST data from the request
    const parsePostData = (options, callback) => {
      // If the request method is not POST, return a 405 Method Not Allowed error
      if (req.method != "POST") {
        // Get the default custom headers and add "Allow" header with value "POST"
        let customHeaders = config.getCustomHeaders();
        customHeaders["Allow"] = "POST";

        // Call the server error function with 405 status code and custom headers
        res.error(405, customHeaders);
        return;
      }

      // Set formidableOptions to options, if provided; otherwise, set it to an empty object
      let formidableOptions = options ? options : {};

      // If no callback is provided, set the callback to options and reset formidableOptions
      if (!callback) {
        callback = options;
        formidableOptions = {};
      }

      // If the formidable module had an error, call the server error function with 500 status code and error stack
      if (formidable._errored) res.error(500, formidable._errored);

      // Create a new formidable form
      const form = formidable(formidableOptions);

      // Parse the request and process the fields and files
      form.parse(req, (err, fields, files) => {
        // If there was an error, call the server error function with status code determined by error
        if (err) {
          if (err.httpCode) res.error(err.httpCode);
          else res.error(400);
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
      req.parsedURL.pathname, // href
      ext, // ext
      req.parsedURL, // uobject
      req.parsedURL.search, // search
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
      req.authUser // authUser
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
        next // elseCallback
      )();
    };
  }

  return middleware;
};
