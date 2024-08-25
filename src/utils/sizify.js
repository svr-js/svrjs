function sizify(bytes, addI) {
  if (bytes == 0) return "0";
  if (bytes < 0) bytes = -bytes;
  const prefixes = ["", "K", "M", "G", "T", "P", "E", "Z", "Y", "R", "Q"];
  let prefixIndex = Math.floor(Math.log2 ? Math.log2(bytes) / 10 : (Math.log(bytes) / (Math.log(2) * 10)));
  if (prefixIndex >= prefixes.length - 1) prefixIndex = prefixes.length - 1;
  let prefixIndexTranslated = Math.pow(2, 10 * prefixIndex);
  let decimalPoints = 2 - Math.floor(Math.log10 ? Math.log10(bytes / prefixIndexTranslated) : (Math.log(bytes / prefixIndexTranslated) / Math.log(10)));
  if (decimalPoints < 0) decimalPoints = 0;
  return (Math.ceil((bytes / prefixIndexTranslated) * Math.pow(10, decimalPoints)) / Math.pow(10, decimalPoints)) + prefixes[prefixIndex] + ((prefixIndex > 0 && addI) ? "i" : "");
}

module.exports = sizify;