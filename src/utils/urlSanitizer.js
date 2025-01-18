const { LRUCache } = require("lru-cache");
const sanitizedURLCache = new LRUCache({ max: 1000 });

// SVR.JS path sanitizer function
function sanitizeURL(resource, allowDoubleSlashes) {
  if (resource === "*" || resource === "") return resource;

  // Cache key
  const cacheKey = `${allowDoubleSlashes ? true : false}:${resource}`;

  // Check if URL is in cache and return cached value if it is
  if (sanitizedURLCache.has(cacheKey)) return sanitizedURLCache.get(cacheKey);

  // Remove null characters
  resource = resource.replace(/%00|\0/g, "");

  // Check if URL is malformed (e.g. %c0%af or %u002f or simply %as)
  if (resource.match(/%(?:c[01]|f[ef]|(?![0-9a-f]{2}).{2}|.{0,1}$)/i))
    throw new URIError("URI malformed");

  // Decode URL-encoded characters while preserving certain characters
  resource = resource.replace(/%([0-9a-f]{2})/gi, (match, hex) => {
    const decodedChar = String.fromCharCode(parseInt(hex, 16));
    return /[!$&-;=@-\]_a-z~]/.test(decodedChar) ? decodedChar : match;
  });

  // Encode certain characters
  resource = resource.replace(/[<>^`{|}]/g, (character) => {
    const charCode = character.charCodeAt(0);
    return (
      "%" + (charCode < 16 ? "0" : "") + charCode.toString(16).toUpperCase()
    );
  });

  // Ensure the resource starts with a slash
  if (resource[0] !== "/") resource = "/" + resource;

  // Convert backslashes to slashes and handle duplicate slashes
  resource = resource
    .replace(/\\/g, "/")
    .replace(allowDoubleSlashes ? /\/{3,}/g : /\/+/g, "/");

  // Handle relative navigation (e.g., "/./", "/../", "../", "./") and remove trailing dots in paths
  resource = resource
    .replace(/\/\.(?:\.{2,})?(?=\/|$)/g, "")
    .replace(/([^./])\.+(?=\/|$)/g, "$1");

  // Remove remaining "../"
  while (resource.match(/\/(?!\.\.\/)[^/]+\/\.\.(?=\/|$)/)) {
    resource = resource.replace(/\/(?!\.\.\/)[^/]+\/\.\.(?=\/|$)/g, "");
  }
  resource = resource.replace(/\/\.\.(?=\/|$)/g, "");

  // If the result has length of 0, set the result to "/"
  if (resource.length == 0) resource = "/";

  // Set the result in the cache
  sanitizedURLCache.set(cacheKey, resource);

  return resource;
}

module.exports = sanitizeURL;
