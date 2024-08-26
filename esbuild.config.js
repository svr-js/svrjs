const esbuild = require("esbuild");
const esbuildCopyPlugin = require("esbuild-plugin-copy");
const fs = require("fs");
const ejs = require("ejs");
const archiver = require("archiver");
const dependencies = JSON.parse(fs.readFileSync(__dirname + "/package.json")).dependencies || {};
const requiredDependencyList = Object.keys(dependencies);
let dependencyList = Object.keys(dependencies);
const svrjsInfo = JSON.parse(fs.readFileSync(__dirname + "/svrjs.json"));
const {name, version, documentationURL} = svrjsInfo;

// Function to find and add all dependencies into the dependencyList array.
function findAllDependencies(curList) {
  // If no curList parameter is specified, use dependencyList.
  if (!curList) curList = dependencyList;
  curList.forEach((dependency) => {
    const newDeplist = Object.keys(JSON.parse(fs.readFileSync(__dirname + "/node_modules/" + dependency.replace(/\/\.\./g,"") + "/package.json").toString()).dependencies || {});
    let noDupNewDepList = [];
    newDeplist.forEach((dep) => {
      // Ignore duplicates
      if (dependencyList.indexOf(dep) == -1) {
        noDupNewDepList.push(dep);
        dependencyList.push(dep);
      }
    });
    // Call findAllDependencies for the dependency list.
    findAllDependencies(noDupNewDepList);
  });
}

// Get list of all dependencies
findAllDependencies();
dependencyList = dependencyList.sort();

// Create and populate an object, where whenever the dependencies are required are listed.
let dependenciesAreRequired = {};
dependencyList.forEach((dependency) => {
  dependenciesAreRequired[dependency] = false;
});
requiredDependencyList.forEach((dependency) => {
  dependenciesAreRequired[dependency] = true;
});

// Create the template functions using EJS
const layoutTemplate = ejs.compile(fs.readFileSync(__dirname + "/templates/layout.ejs").toString());
const testsTemplate = ejs.compile(fs.readFileSync(__dirname + "/templates/tests.ejs").toString());
const indexTemplate = ejs.compile(fs.readFileSync(__dirname + "/templates/index.ejs").toString());
const licensesTemplate = ejs.compile(fs.readFileSync(__dirname + "/templates/licenses.ejs").toString());
const licenseElementTemplate = ejs.compile(fs.readFileSync(__dirname + "/templates/licenseElement.ejs").toString());

let licenseElements = "";

// Generate the licenses list in HTML
dependencyList.forEach((dependency) => {
  const packageJSON = JSON.parse(fs.readFileSync(__dirname + "/node_modules/" + dependency.replace(/\/\.\./g,"") + "/package.json").toString());
  licenseElements += licenseElementTemplate({
    moduleName: packageJSON.name,
    name: name,
    license: packageJSON.license,
    description: packageJSON.description || "No description",
    author: packageJSON.author ? packageJSON.author.name : packageJSON.author,
    required: dependenciesAreRequired[dependency]
  });
});

// Generate pages
const licensesPage = layoutTemplate({
  title: name + " " + version + " Licenses",
  content: licensesTemplate({
    name: name,
    version: version,
    licenses: licenseElements
  })
});

const testsPage = layoutTemplate({
  title: name + " " + version + " Tests",
  content: testsTemplate({
    name: name,
    version: version
  })
});

const indexPage = layoutTemplate({
  title: name + " " + version,
  content: indexTemplate({
    name: name,
    version: version,
    documentationURL: documentationURL
  })
});

// Remove the generated assets directory if exists, and create a new one.
if (fs.existsSync(__dirname + "/generatedAssets")) {
  if (fs.rmSync) fs.rmSync(__dirname + "/generatedAssets", {recursive: true});
  else fs.rmdirSync(__dirname + "/generatedAssets", {recursive: true});
}
fs.mkdirSync(__dirname + "/generatedAssets");

// Remove the dist directory if exists, and create a new one.
if (fs.existsSync(__dirname + "/dist")) {
  if (fs.rmSync) fs.rmSync(__dirname + "/dist", {recursive: true});
  else fs.rmdirSync(__dirname + "/dist", {recursive: true});
}
fs.mkdirSync(__dirname + "/dist");
fs.mkdirSync(__dirname + "/dist/log");
fs.mkdirSync(__dirname + "/dist/mods");
fs.mkdirSync(__dirname + "/dist/temp");

// Remove the out directory if exists, and create a new one.
if (fs.existsSync(__dirname + "/out")) {
  if (fs.rmSync) fs.rmSync(__dirname + "/out", {recursive: true});
  else fs.rmdirSync(__dirname + "/out", {recursive: true});
}
fs.mkdirSync(__dirname + "/out");

// Create a licenses directory
fs.mkdirSync(__dirname + "/generatedAssets/licenses");

// Write to HTML files
fs.writeFileSync(__dirname + "/generatedAssets/index.html", indexPage);
fs.writeFileSync(__dirname + "/generatedAssets/tests.html", testsPage);
fs.writeFileSync(__dirname + "/generatedAssets/licenses/index.html", licensesPage);

// Bundle the source and copy the assets using esbuild and esbuild-plugin-copy
esbuild.build({
  entryPoints: ["src/index.js"],
  bundle: true,
  outfile: "dist/svr.js",
  platform: "node",
  target: "es2017",
  plugins: [
    esbuildCopyPlugin.copy({
      resolveFrom: __dirname,
      assets: {
        from: ["./assets/**/*"],
        to: ["./dist"],
      },
      globbyOptions: {
        dot: true
      }
    }),
    esbuildCopyPlugin.copy({
      resolveFrom: __dirname,
      assets: {
        from: ["./generatedAssets/**/*"],
        to: ["./dist"],
      }
    })
  ],
}).then(() => {
  const utilFilesAndDirectories = fs.existsSync(__dirname + "/utils") ? fs.readdirSync(__dirname + "/utils") : [];
  const utilFiles = [];
  utilFilesAndDirectories.forEach((entry) => {
    if (fs.statSync(__dirname + "/utils/" + entry).isFile()) utilFiles.push(entry);
  })

  // Transpile utilities using esbuild
  esbuild.build({
    entryPoints: [utilFiles.map((filename) => "utils/" + filename)],
    bundle: false,
    outdir: "dist",
    platform: "node",
    target: "es2017",
  }).then(() => {
    const archiveName = "svr.js." + version.toLowerCase().replace(/[^0-9a-z]+/g,".") + ".zip";
    const output = fs.createWriteStream(__dirname + "/out/" + archiveName);
    const archive = archiver("zip", {
      zlib: { level: 9 } // Sets the compression level.
    });
    archive.pipe(output);
    archive.directory("dist/", false);
    archive.finalize();
  }).catch((err) => {
    throw err;
  })
}).catch((err) => {
  throw err;
});
