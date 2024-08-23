// Node.JS mojibake URL fixing function
function fixNodeMojibakeURL(string) {
  var encoded = "";

  //Encode URLs
  Buffer.from(string, "latin1").forEach(function (value) {
    if (value > 127) {
      encoded +=
        "%" + (value < 16 ? "0" : "") + value.toString(16).toUpperCase();
    } else {
      encoded += String.fromCodePoint(value);
    }
  });

  //Upper case the URL encodings
  return encoded.replace(/%[0-9a-f-A-F]{2}/g, function (match) {
    return match.toUpperCase();
  });
}

module.exports = fixNodeMojibakeURL;
