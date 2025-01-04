// Polyfill globalThis
require("globalthis/shim")();

// Polyfill AbortController
if (typeof AbortController === "undefined") {
  Object.assign(globalThis, require("node-abort-controller"));
}
