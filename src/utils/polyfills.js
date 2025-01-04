// Polyfill globalThis
require("globalthis/shim")();

// Polyfill fetch
const nodeFetch = require("node-fetch");
if (typeof fetch === "undefined") {
  globalThis.fetch = nodeFetch;
  globalThis.Headers = nodeFetch.Headers;
  globalThis.Request = nodeFetch.Request;
  globalThis.Response = nodeFetch.Response;
  globalThis.AbortError = nodeFetch.AbortError;
  globalThis.FetchError = nodeFetch.FetchError;
}

// Polyfill AbortController
if (typeof AbortController === "undefined") {
  Object.assign(globalThis, require("node-abort-controller"));
}
