const url = require("url");
const { LRUCache } = require("lru-cache");
const parsedURLCache = new LRUCache({ max: 500 });

// SVR.JS URL parser function (compatible with legacy Node.js URL parsing function)
function parseURL(uri, prepend) {
  // Replace newline characters with its respective URL encodings
  uri = uri.replace(/\r/g, "%0D").replace(/\n/g, "%0A");

  // If URL begins with a slash, prepend a string if available
  if (prepend && uri[0] == "/") uri = prepend.replace(/\/+$/, "") + uri;

  // If the parsed URL is in the cache, return the cached object
  if (parsedURLCache.has(uri)) return parsedURLCache.get(uri);

  // Determine if URL has slashes
  let hasSlashes = uri.indexOf("/") != -1;

  // Parse the URL using regular expression
  let parsedURI = uri.match(
    /^(?:([^:]+:)(\/\/)?)?(?:([^@/?#*]+)@)?([^:/?#*]+|\[[^*\]/]\])?(?::([0-9]+))?(\*|\/[^?#]*)?(\?[^#]*)?(#[\S\s]*)?/
  );
  // Match 1: protocol
  // Match 2: slashes after protocol
  // Match 3: authentication credentials
  // Match 4: host name
  // Match 5: port
  // Match 6: path name
  // Match 7: query string
  // Match 8: hash

  // If regular expression didn't match the entire URL, throw an error
  if (parsedURI[0].length != uri.length) throw new Error("Invalid URL: " + uri);

  // If match 1 is not empty, set the slash variable based on state of match 2
  if (parsedURI[1]) hasSlashes = parsedURI[2] == "//";

  // If match 6 is empty and URL has slashes, set it to a slash.
  if (hasSlashes && !parsedURI[6]) parsedURI[6] = "/";

  // If match 4 contains Unicode characters, convert it to Punycode. If the result is an empty string, throw an error
  if (parsedURI[4] && !parsedURI[4].match(/^[a-zA-Z0-9.-]+$/)) {
    parsedURI[4] = url.domainToASCII(parsedURI[4]);
    if (!parsedURI[4]) throw new Error("Invalid URL: " + uri);
  }

  // Create a new URL object
  let uobject = new url.Url();

  // Populate a URL object
  if (hasSlashes) uobject.slashes = true;
  if (parsedURI[1]) uobject.protocol = parsedURI[1];
  if (parsedURI[3]) uobject.auth = parsedURI[3];
  if (parsedURI[4]) {
    uobject.host = parsedURI[4] + (parsedURI[5] ? ":" + parsedURI[5] : "");
    if (parsedURI[4][0] == "[")
      uobject.hostname = parsedURI[4].substring(1, parsedURI[4].length - 1);
    else uobject.hostname = parsedURI[4];
  }
  if (parsedURI[5]) uobject.port = parsedURI[5];
  if (parsedURI[6]) uobject.pathname = parsedURI[6];
  if (parsedURI[7]) {
    uobject.search = parsedURI[7];
    // Parse query strings
    let qobject = Object.create(null);
    const parsedQuery = parsedURI[7]
      .substring(1)
      .match(/([^&=]*)(?:=([^&]*))?/g);
    parsedQuery.forEach((qp) => {
      if (qp.length > 0) {
        let parsedQP = qp.match(/([^&=]*)(?:=([^&]*))?/);
        if (parsedQP) {
          qobject[parsedQP[1]] = parsedQP[2] ? parsedQP[2] : "";
        }
      }
    });
    uobject.query = qobject;
  } else {
    uobject.query = Object.create(null);
  }
  if (uobject.query) Object.freeze(uobject.query);
  if (parsedURI[8]) uobject.hash = parsedURI[8];
  if (uobject.pathname)
    uobject.path = uobject.pathname + (uobject.search ? uobject.search : "");
  uobject.href =
    (uobject.protocol ? uobject.protocol + (uobject.slashes ? "//" : "") : "") +
    (uobject.auth ? uobject.auth + "@" : "") +
    (uobject.hostname ? uobject.hostname : "") +
    (uobject.port ? ":" + uobject.port : "") +
    (uobject.path ? uobject.path : "") +
    (uobject.hash ? uobject.hash : "");

  Object.freeze(uobject);

  // Add the parsed URL object to the cache
  parsedURLCache.set(uri, uobject);

  return uobject;
}

module.exports = parseURL;
