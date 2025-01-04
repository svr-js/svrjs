const crypto = require("crypto");

// SHA256 function
function sha256(s) {
  let hash = crypto.createHash("SHA256");
  hash.update(s);
  return hash.digest("hex");
}

module.exports = sha256;
