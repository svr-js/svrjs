const os = require("os");

function getOS() {
  var osType = os.type();
  var platform = os.platform();
  if (platform == "android") {
    return "Android";
  } else if (osType == "Windows_NT" || osType == "WindowsNT") {
    var arch = os.arch();
    if (arch == "ia32") {
      return "Win32";
    } else if (arch == "x64") {
      return "Win64";
    } else {
      return "Win" + arch.toUpperCase();
    }
  } else if (osType.indexOf("CYGWIN") == 0) {
    return "Cygwin";
  } else if (osType.indexOf("MINGW") == 0) {
    return "MinGW";
  } else if (osType.indexOf("MSYS") == 0) {
    return "MSYS";
  } else if (osType.indexOf("UWIN") == 0) {
    return "UWIN";
  } else if (osType == "GNU") {
    return "GNU Hurd";
  } else {
    return osType;
  }
}
module.exports = getOS;
