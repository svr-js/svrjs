const fs = require("fs");

function deleteFolderRecursive(path) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach((file) => {
      const curPath = path + "/" + file;
      if (fs.statSync(curPath).isDirectory()) {
        // recurse
        deleteFolderRecursive(curPath);
      } else {
        // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
}

module.exports = deleteFolderRecursive;
