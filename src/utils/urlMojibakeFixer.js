// Node.js mojibake URL fixing function
function fixNodeMojibakeURL(string) {
  return Buffer.from(string, "latin1")
    .reduce((result, value) => {
      if (value > 127) {
        result +=
          "%" + (value < 16 ? "0" : "") + value.toString(16).toUpperCase();
      } else {
        result += String.fromCharCode(value);
      }
      return result;
    }, "")
    .replace(/%[0-9a-f]{2}/gi, (match) => match.toUpperCase());
}

module.exports = fixNodeMojibakeURL;
