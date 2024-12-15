//Server-side JavaScript (Node.js)
//This implementation uses Node.js, which powers SVR.JS.
//This implementation contains elements specific for SVR.JS mods:
//  req - A server request instance
//  res - A server response instance
//  serverconsole - A console output object for SVR.JS
//  responseEnd - Response ending method of SVR.JS
//  href - Request URL without query
//  ext - File extension of requested file
//  uobject - Request URL object
//  search - Request URL queries
//  defaultPage - An index page location (deprecated, always returns 'index.html')
//  users - A list of users (deprecated)
//  page404 - 404 Not Found page location
//  head - A head of server response
//  foot - A foot of server response
//  fd - Currently unused
//  elseCallback - Method summoning SVR.JS internal callbacks
//  callServerError - Method to end with server error
//  getCustomHeaders - Method to get headers defined in config.json file
//  origHref - Original request URL without query (before URL rewriting)
//  redirect - Method to redirect.
//  parsePostData - Method to parse POST data.
//  authUser - Authenticated HTTP user.
//Along with elements added by this implementation:
//  disableEndElseCallbackExecute - Determines execution of elseCallback on end
//  filterHeaders - Removes invalid HTTP/1.0 headers
//  customvar1, customvar2, customvar3, customvar4 - Custom variables
//Built-in libraries:
//  http
//  https
//  readline
//  os
//  url
//  hexstrbase64
//  fs
//  path
//  crypto
//  stream
//If you send response remember and don't use disableEndElseCallbackExecute, use "return;", or else SVR.JS will crash.
//If you use proxy, use filterHeaders to remove HTTP/2.0 headers, which are invalid in HTTP/1.0.
//If you type no code, elseCallback is executed.
//Below we have example script, which serves dynamic content.
disableEndElseCallbackExecute = true; //Avoid crashing on async.
var headers = getCustomHeaders(); //Headers
if(!fs.existsSync(__dirname + "/../temp/requestCounter")) {
  fs.writeFileSync(__dirname + "/../temp/requestCounter","0"); //Reset counter
}
headers["Content-Type"] = 'text/html; charset=utf-8' //HTML output
if(href == "/hello.svr") {
  fs.readFile(__dirname + "/../temp/requestCounter", (err,data) => {
    if(err) throw err;
    var requestCounter = parseInt(data.toString()); //Counter
    fs.writeFile(__dirname + "/../temp/requestCounter",(requestCounter + 1).toString(),() => {
      //Increase value of counter
    });
    res.writeHead(200, "OK", headers); //Write Head
    res.end("<html><head><title>SVR.JS ServerSide Test</title></head><body><h1>Hello World!</h1><p>This is a test from server-side JavaScript. This test is executed " + requestCounter.toString() + " times from taking server up." + (req.headers.origin == undefined ? "" : " This request is done from a proxy.") + "</p><p><i>SVR.JS/" + configJSON.version + ' (' + os.platform()[0].toUpperCase() + os.platform().slice(1) + ')' + (req.headers.host == undefined ? "" : " on " + req.headers.host) + "</p></body></html>"); //Write response
    serverconsole.resmessage("Client successfully received content."); //Log into SVR.JS
    return; //Prevent SVR.JS from crashing
  });
} else if(href == "/proxy.svr") {
  callServerError(403,"SVR.JS-exampleproxy"); //Server error
  serverconsole.errmessage("Client fails to receive content."); //Log into SVR.JS
} else if(href.indexOf("/proxy.svr/") == 0) {
  var hn = href.split("/")[2]; //Hostname
  if(hn != "this" && !(req.socket.realRemoteAddress ? req.socket.realRemoteAddress : req.socket.remoteAddress).match(/^(?:localhost$|::1$|f[c-d][0-9a-f]{2}:|(?:::ffff:)?(?:(?:127|10)\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}|192\.168\.[0-9]{1,3}\.[0-9]{1,3}|172\.(?:1[6-9]|2[0-9]|3[0-1])\.[0-9]{1,3}\.[0-9]{1,3})$)/i) ) {
    //Prevent open proxy
    callServerError(403,"SVR.JS-exampleproxy"); //Server error
    serverconsole.errmessage("Client fails to receive content."); //Log into SVR.JS
    return;
  }
  var hdrs = req.headers;
  hdrs["Host"] = (hn == "this" ? req.headers.host : hn);
  hdrs["Origin"] = (req.headers.host == undefined ? "" : req.headers.host);
  var options = {
    hostname: (hn == "this" ? req.headers.host.split(":")[0] : hn.split(":")[0]),
    port: (hn == "this" ? req.headers.host.split(":")[1] : (hn.split(":")[1] == undefined ? 80 : hn.split(":")[1])),
    path: req.url.replace("/proxy.svr/" + hn,""),
    method: req.method,
    headers: filterHeaders(hdrs)
  };
  var proxy = http.request(options, function (sres) {
    res.writeHead(sres.statusCode, sres.headers)
    sres.pipe(res, {
      end: true
    });
  });
  proxy.on("error",(ex) => {
    callServerError(500,"SVR.JS-exampleproxy",ex.stack); //Server error
    serverconsole.errmessage("Client fails to receive content."); //Log into SVR.JS
  });
  req.pipe(proxy, {
    end: true
  });
} else {
  elseCallback(); //Load SVR.JS internal callbacks
}
