// Server error descriptions
const serverErrorDescs = {
  EADDRINUSE: "Address is already in use by another process.",
  EADDRNOTAVAIL: "Address is not available on this machine.",
  EACCES:
    "Permission denied. You may not have sufficient privileges to access the requested address.",
  EAFNOSUPPORT:
    "Address family not supported. The address family (IPv4 or IPv6) of the requested address is not supported.",
  EALREADY:
    "Operation already in progress. The server is already in the process of establishing a connection on the requested address.",
  ECONNABORTED:
    "Connection aborted. The connection to the server was terminated abruptly.",
  ECONNREFUSED:
    "Connection refused. The server refused the connection attempt.",
  ECONNRESET:
    "Connection reset by peer. The connection to the server was reset by the remote host.",
  EDESTADDRREQ:
    "Destination address required. The destination address must be specified.",
  EINVAL: "Invalid argument (invalid IP address?).",
  ENETDOWN:
    "Network is down. The network interface used for the connection is not available.",
  ENETUNREACH:
    "Network is unreachable. The network destination is not reachable from this host.",
  ENOBUFS:
    "No buffer space available. Insufficient buffer space is available for the server to process the request.",
  ENOTFOUND: "Domain name doesn't exist (invalid IP address?).",
  ENOTSOCK: "Not a socket. The file descriptor provided is not a valid socket.",
  EPROTO: "Protocol error. An unspecified protocol error occurred.",
  EPROTONOSUPPORT:
    "Protocol not supported. The requested network protocol is not supported.",
  ETIMEDOUT:
    "Connection timed out. The server did not respond within the specified timeout period.",
  UNKNOWN: "There was an unknown error with the server.",
};

module.exports = serverErrorDescs;
