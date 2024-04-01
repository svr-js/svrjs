//SVR.JS SimpleServe

var http = require("http");
var fs = require("fs");
var mime = require("mime-types");
var path = require("path");
var config = {};
if(fs.existsSync(__dirname + "/config.json")) {
  config = JSON.parse(fs.readFileSync(__dirname + "/config.json"));
}
var port = config.port === undefined ? 80 : config.port;
var exposeServerVersion = config.exposeServerVersion === undefined ? true : config.exposeServerVersion;
if(config.wwwroot) {
  process.chdir(config.wwwroot);
}
var version = "Nightly-20240401";
var server = http.createServer(function (req, res) {
  var urlObject = new URL(req.url, "http://localhost");
  var filename = "";
  try {
    filename = "." + decodeURIComponent(urlObject.pathname);
  } catch(ex) {
    //Malformed URI means bad request.
    res.writeHead(400, "Bad Request", {
      "Content-Type": "text/plain",
      "Server": "SVR.JS-SimpleServe" + (exposeServerVersion ? (" " + version) : "")
    });
    res.end("400 Bad Request");
    return;
  }
  filename = filename.replace(/\\/g,"/").replace(/\/\.\.?(?=\/|$)/g,"/").replace(/\/+/g,"/"); //Poor mans URL sanitizer
  if(filename == "./") filename = "./index.html";
  var ext = path.extname(filename).substr(1); //path.extname gives "." character, so we're using substr(1) method.
  if(!config.wwwroot && (filename.toLowerCase() == "./config.json" || filename.toLowerCase() == "./" + path.basename(__filename).toLowerCase() || filename.toLowerCase().match(/^\.\/node_modules(?:$|\/)/))) {
    //Prevent leakage of some files
    res.writeHead(403, "Forbidden", {
      "Content-Type": "text/plain",
      "Server": "SVR.JS-SimpleServe" + (exposeServerVersion ? (" " + version) : "")
    });
    res.end("403 Forbidden");
  }
  fs.readFile(filename, function(err, data) {
    if(err) {
      if(err.code == "ENOENT") {
        //ENOENT means "File doesn't exist"
        res.writeHead(404, "Not Found", {
          "Content-Type": "text/plain",
          "Server": "SVR.JS-SimpleServe" + (exposeServerVersion ? (" " + version) : "")
        });
        res.end("404 Not Found");
      } else {
        res.writeHead(500, "Internal Server Error", {
          "Content-Type": "text/plain",
          "Server": "SVR.JS-SimpleServe" + (exposeServerVersion ? (" " + version) : "")
        });
        res.end("500 Internal Server Error! Reason: " + err.message);
      }
    } else {
      res.writeHead(200, "OK", {
        "Content-Type": mime.lookup(ext) || undefined,
        "Server": "SVR.JS-SimpleServe" + (exposeServerVersion ? (" " + version) : "")
      });
      res.end(data);
    }
  });
});
server.listen(port, function() {
  console.log("Started SVR.JS SimpleServe " + version + " server at port " + port + ".");
});
