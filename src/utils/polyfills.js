// Polyfill globalThis
require("globalthis/shim")();

// Polyfill AbortController
if (typeof AbortController === "undefined") {
  Object.assign(globalThis, require("node-abort-controller"));
}

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

// Polyfill Blob
if (typeof Blob === "undefined") {
  globalThis.Blob = require("fetch-blob");
}

// Polyfill AbortController
if (typeof AbortController === "undefined") {
  Object.assign(globalThis, require("node-abort-controller"));
}

// Polyfill atob and btoa
if (typeof atob === "undefined") {
  globalThis.atob = (str) => {
    return Buffer.from(str, "base64").toString("utf-8");
  };
}

if (typeof btoa === "undefined") {
  globalThis.btoa = (str) => {
    return Buffer.from(str, "utf-8").toString("base64");
  };
}
