function sizify(bytes, addI) {
  if (bytes == 0) return "0";
  if (bytes < 0) bytes = -bytes;

  const prefixes = ["", "K", "M", "G", "T", "P", "E", "Z", "Y", "R", "Q"];
  const prefixIndex = Math.min(
    Math.floor(Math.log2(bytes) / 10),
    prefixes.length - 1
  );
  const prefixIndexTranslated = Math.pow(2, 10 * prefixIndex);
  const decimalPoints = Math.max(
    2 - Math.floor(Math.log10(bytes / prefixIndexTranslated)),
    0
  );

  const size =
    Math.ceil((bytes / prefixIndexTranslated) * Math.pow(10, decimalPoints)) /
    Math.pow(10, decimalPoints);
  const prefix = prefixes[prefixIndex];
  const suffix = prefixIndex > 0 && addI ? "i" : "";

  return size + prefix + suffix;
}

module.exports = sizify;
