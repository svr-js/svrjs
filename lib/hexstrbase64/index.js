let hexstrbase64 = require("./hexstrbase64/main.js");
function decodeBase(b) {
	return hexstrbase64.native.atob(b);
}
function encodeStr(s) {
	return hexstrbase64.native.btoa(s);
}
var m = Object.create(hexstrbase64);
m.decodeBase = decodeBase;
m.encodeBase = encodeStr;
module.exports = m;