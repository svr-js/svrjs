const mimeDb = require("mime-db");
let optimizedMimeDb = {};

// Initialize the optimized MIME type database, similarly to what "mime-types" library does
Object.keys(mimeDb).forEach((mimeType) => {
  const sourcePreference = ["nginx", "apache", undefined, "iana"];
  if (
    mimeType != "application/octet-stream" &&
    mimeDb[mimeType].extensions &&
    mimeDb[mimeType].extensions.length > 0
  ) {
    mimeDb[mimeType].extensions.forEach((extension) => {
      if (optimizedMimeDb[extension]) {
        const from = sourcePreference.indexOf(
          optimizedMimeDb[extension].source
        );
        const to = sourcePreference.indexOf(mimeDb[mimeType].source);
        if (
          from != -1 &&
          to != -1 &&
          (from > to ||
            (from === to && mimeType.substring(0, 12) == "application/"))
        )
          return;
      }
      optimizedMimeDb[extension] = {
        type: mimeType,
        charset: mimeDb[mimeType].charset,
        source: mimeDb[mimeType].source,
        compressible: mimeDb[mimeType].compressible
      };
    });
  }
});

// Function to get the MIME type from the extension
function getMimeType(extension) {
  if (!extension || typeof extension !== "string") return false;
  const extensionMatch = extension.match(/\.([^.]+)$/);
  const normalizedExtension = extensionMatch ? extensionMatch[1] : extension;
  if (optimizedMimeDb[normalizedExtension])
    return (
      optimizedMimeDb[normalizedExtension].type +
      (optimizedMimeDb[normalizedExtension].charset
        ? "; charset=" +
          optimizedMimeDb[normalizedExtension].charset.toLowerCase()
        : "")
    );
  return false;
}

// Function to check if the file is compressible from the extension
function checkIfCompressible(extension) {
  if (!extension || typeof extension !== "string") return true;
  const extensionMatch = extension.match(/\.([^.]+)$/);
  const normalizedExtension = extensionMatch ? extensionMatch[1] : extension;
  if (optimizedMimeDb[normalizedExtension])
    return optimizedMimeDb[normalizedExtension].compressible === undefined
      ? true
      : optimizedMimeDb[normalizedExtension].compressible;
  return true;
}

module.exports = {
  getMimeType: getMimeType,
  checkIfCompressible: checkIfCompressible
};
