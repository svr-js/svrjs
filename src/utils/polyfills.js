// Polyfill globalThis
require("globalthis/shim")();

// Polyfill fetch
const nodeFetch = require("node-fetch");

if (typeof fetch === "undefined") {
  Object.assign(globalThis, nodeFetch);
  globalThis.fetch = nodeFetch;
}

// Polyfill AbortController
if (typeof AbortController === "undefined") {
  Object.assign(globalThis, require("node-abort-controller"));
}
