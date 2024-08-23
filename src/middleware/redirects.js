module.exports = (req, res, logFacilities, config, next) => {
  // Estimate fromMain from SVR.JS 3.x
  let fromMain = !(config.secure && !req.socket.encrypted);

  // Handle redirects to HTTPS
  if (config.secure && !fromMain && !config.disableNonEncryptedServer && !config.disableToHTTPSRedirect) {
    var hostx = req.headers.host;
    if (hostx === undefined) {
      serverconsole.errmessage("Host header is missing.");
      callServerError(400);
      return;
    }

    if (req.isProxy) {
      callServerError(501);
      serverconsole.errmessage("This server will never be a proxy.");
      return;
    }

    var isPublicServer = !(req.socket.realRemoteAddress ? req.socket.realRemoteAddress : req.socket.remoteAddress).match(/^(?:localhost$|::1$|f[c-d][0-9a-f]{2}:|(?:::ffff:)?(?:(?:127|10)\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}|192\.168\.[0-9]{1,3}\.[0-9]{1,3}|172\.(?:1[6-9]|2[0-9]|3[0-1])\.[0-9]{1,3}\.[0-9]{1,3})$)/i);

    var destinationPort = 0;

    var parsedHostx = hostx.match(/(\[[^\]]*\]|[^:]*)(?::([0-9]+))?/);
    var hostname = parsedHostx[1];
    var hostPort = parsedHostx[2] ? parseInt(parsedHostx[2]) : 80;
    if (isNaN(hostPort)) hostPort = 80;

    if (hostPort == config.port || (config.port == config.pubport && !isPublicServer)) {
      destinationPort = config.sport;
    } else {
      destinationPort = config.spubport;
    }

    redirect("https://" + hostname + (destinationPort == 443 ? "" : (":" + destinationPort)) + req.url);
    return;
  }

  // Handle redirects to addresses with "www." prefix
  if (config.wwwredirect) {
    let hostname = req.headers.host.split(":");
    let hostport = null;
    if (hostname.length > 1 && (hostname[0] != "[" || hostname[hostname.length - 1] != "]")) hostport = hostname.pop();
    hostname = hostname.join(":");
    if (hostname == domain && hostname.indexOf("www.") != 0) {
      res.redirect((req.socket.encrypted ? "https" : "http") + "://www." + hostname + (hostport ? ":" + hostport : "") + req.url.replace(/\/+/g, "/"));
      return;
    }
  }

  next();
}