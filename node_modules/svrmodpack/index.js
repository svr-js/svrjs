var fs = require("fs");
var zlib = require("zlib");


const path = require('path');

function mkDirByPathSync(targetDir, { isRelativeToScript = false } = {}) {
  const sep = path.sep;
  const initDir = path.isAbsolute(targetDir) ? sep : '';
  const baseDir = isRelativeToScript ? __dirname : '.';

  return targetDir.split(sep).reduce((parentDir, childDir) => {
    const curDir = path.resolve(baseDir, parentDir, childDir);
    try {
      fs.mkdirSync(curDir);
    } catch (err) {
      if (err.code === 'EEXIST') { // curDir already exists!
        return curDir;
      }

      // To avoid `EISDIR` error on Mac and `EACCES`-->`ENOENT` and `EPERM` on Windows.
      if (err.code === 'ENOENT') { // Throw the original parentDir error on curDir `ENOENT` failure.
        throw new Error(`EACCES: permission denied, mkdir '${parentDir}'`);
      }

      const caughtErr = ['EACCES', 'EPERM', 'EISDIR'].indexOf(err.code) > -1;
      if (!caughtErr || caughtErr && curDir === path.resolve(targetDir)) {
        throw err; // Throw if it's just the last created dir.
      }
    }

    return curDir;
  }, initDir);
}

function pack(ins, out, modinfof) {
    if (typeof modinfof === 'undefined') {
        modinfof = 'mod.info';
    }
    var modinfo = JSON.parse(fs.readFileSync(modinfof));
    var file = "SVR\0";
    var modinfo2 = "";
    modinfo2 += modinfo.name;
    modinfo2 += "\0";
    modinfo2 += modinfo.version;
    modinfo2 += "\0";
    file += modinfo2
    for (var i = 0; i < ins.length; i++) {
        var script = fs.readFileSync(ins[i]);
        file += ins[i];
        file += "\0";
        file += script.toString();
        file += "\0";
    }
    fs.writeFileSync(out, zlib.gzipSync(file));
}

function unpack(inputf, outf, modinfof) {
    if (typeof outf === 'undefined') {
        outf = '';
    }
    if (typeof modinfof === 'undefined') {
        modinfof = 'mod.info';
    }
    try {
        mkDirByPathSync(outf);
    } catch (ex) {}
    var script = "";
    var modinfo = {};
    var file = zlib.gunzipSync(fs.readFileSync(inputf)).toString();
    var tokens = file.split("\0");
    var files = [];
    if (tokens[0] != "SVR") throw new Error("wrong signature");
    modinfo.name = tokens[1];
    modinfo.version = tokens[2];
    for (var i = 3; i < tokens.length - 1; i += 2) {
        files.push({
            name: tokens[i],
            content: tokens[i + 1]
        });
    }
    fs.writeFileSync((outf + "/" + modinfof).replace(/\/\//g, "/"), JSON.stringify(modinfo, null, 2));
    for (var i = 0; i < files.length; i++) {
        fs.writeFileSync((outf + "/" + files[i].name).replace(/\/\//g, "/"), files[i].content);
    }
}

module.exports = {pack: pack, unpack: unpack}