function matchHostname(hostname, reqHostname) {
  if (typeof hostname == "undefined" || hostname == "*") {
    return true;
  } else if (reqHostname && hostname.indexOf("*.") == 0 && hostname != "*.") {
    const hostnamesRoot = hostname.substring(2);
    if (
      reqHostname == hostnamesRoot ||
      (reqHostname.length > hostnamesRoot.length &&
        reqHostname.indexOf("." + hostnamesRoot) ==
          reqHostname.length - hostnamesRoot.length - 1)
    ) {
      return true;
    }
  } else if (reqHostname && reqHostname == hostname) {
    return true;
  }
  return false;
}

module.exports = matchHostname;
