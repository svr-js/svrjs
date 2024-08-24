const os = require("os");

function createRegex(regex, isPath) {
  const regexStrMatch = regex.match(/^\/((?:\\.|[^\/\\])*)\/([a-zA-Z0-9]*)$/);
  if (!regexStrMatch) throw new Error("Invalid regular expression: " + regex);
  const searchString = regexStrMatch[1];
  let modifiers = regexStrMatch[2];
  if (isPath && !modifiers.match(/i/i) && os.platform() == "win32")
    modifiers += "i";
  return new RegExp(searchString, modifiers);
}

module.exports = createRegex;
