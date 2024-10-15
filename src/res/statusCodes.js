const http = require("http");

const statusCodes = {
  ...http.STATUS_CODES,
  497: "HTTP Request Sent to HTTPS Port",
  598: "Network Read Timeout Error",
  599: "Network Connect Timeout Error"
};

module.exports = statusCodes;
