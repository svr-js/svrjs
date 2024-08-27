const os = require("os");

function createRegex(regex, isPath) {
  // The new regular expression supports single unescaped "/" within [], but not two unescaped "/".
  // We needed to do it, because it's very hard to create the regex that matches two unescaped "/" within "[]" without ReDoS.
  const regexStrMatch = regex.match(
    /^\/((?:\\.|\/+(?:(?:\\.|[^\]\\/])*\])|[^/\\])*)\/([a-zA-Z0-9]*)$/,
  );
  if (!regexStrMatch) throw new Error("Invalid regular expression: " + regex);
  const searchString = regexStrMatch[1];
  let modifiers = regexStrMatch[2];
  if (isPath && !modifiers.match(/i/i) && os.platform() == "win32")
    modifiers += "i";
  return new RegExp(searchString, modifiers);
}

module.exports = createRegex;
