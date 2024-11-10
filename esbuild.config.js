const esbuild = require("esbuild");
const esbuildCopyPlugin = require("esbuild-plugin-copy");
const fs = require("fs");
const zlib = require("zlib");
const ejs = require("ejs");
const archiver = require("archiver");
const chokidar = require("chokidar");
const svrjsInfo = JSON.parse(fs.readFileSync(__dirname + "/svrjs.json"));
const { version } = svrjsInfo;
const svrjsCoreInfo = JSON.parse(fs.readFileSync(__dirname + "/svrjs.core.json"));
const { externalPackages } = svrjsCoreInfo;
const coreVersion = svrjsCoreInfo.version;
const corePackageJSON = svrjsCoreInfo.packageJSON;
const isDev = process.env.NODE_ENV == "development";

// Create the dist directory if it doesn't exist
if (!fs.existsSync(__dirname + "/dist")) fs.mkdirSync(__dirname + "/dist");
if (!fs.existsSync(__dirname + "/dist/log"))
  fs.mkdirSync(__dirname + "/dist/log");
if (!fs.existsSync(__dirname + "/dist/mods"))
  fs.mkdirSync(__dirname + "/dist/mods");
if (!fs.existsSync(__dirname + "/dist/temp"))
  fs.mkdirSync(__dirname + "/dist/temp");

// Create the out directory if it doesn't exist and if not building for development
if (!isDev && !fs.existsSync(__dirname + "/out")) fs.mkdirSync(__dirname + "/out");

// Create the core directory if it doesn't exist and if not building for development
if (!isDev && !fs.existsSync(__dirname + "/core")) fs.mkdirSync(__dirname + "/core");

function generateAssets() {
  // Variables from "svrjs.json" file
  const svrjsInfo = JSON.parse(fs.readFileSync(__dirname + "/svrjs.json"));
  const { name, version, documentationURL, changes } = svrjsInfo;

  // Dependency-related variables
  const dependencies =
    JSON.parse(fs.readFileSync(__dirname + "/package.json")).dependencies || {};
  const requiredDependencyList = Object.keys(dependencies);
  let dependencyList = Object.keys(dependencies);

  // Function to find and add all dependencies into the dependencyList array.
  const findAllDependencies = (curList) => {
    // If no curList parameter is specified, use dependencyList.
    if (!curList) curList = dependencyList;
    curList.forEach((dependency) => {
      const newDeplist = Object.keys(
        JSON.parse(
          fs
            .readFileSync(
              __dirname +
                "/node_modules/" +
                dependency.replace(/\/\.\./g, "") +
                "/package.json"
            )
            .toString()
        ).dependencies || {}
      );
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
  };

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
  const layoutTemplate = ejs.compile(
    fs.readFileSync(__dirname + "/templates/layout.ejs").toString()
  );
  const testsTemplate = ejs.compile(
    fs.readFileSync(__dirname + "/templates/tests.ejs").toString()
  );
  const indexTemplate = ejs.compile(
    fs.readFileSync(__dirname + "/templates/index.ejs").toString()
  );
  const licensesTemplate = ejs.compile(
    fs.readFileSync(__dirname + "/templates/licenses.ejs").toString()
  );
  const licenseElementTemplate = ejs.compile(
    fs.readFileSync(__dirname + "/templates/licenseElement.ejs").toString()
  );

  let licenseElements = "";

  // Generate the licenses list in HTML
  dependencyList.forEach((dependency) => {
    const packageJSON = JSON.parse(
      fs
        .readFileSync(
          __dirname +
            "/node_modules/" +
            dependency.replace(/\/\.\./g, "") +
            "/package.json"
        )
        .toString()
    );
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
      documentationURL: documentationURL,
      changes: changes
    })
  });

  // Create the generated assets directory if it doesn't exist
  if (!fs.existsSync(__dirname + "/generatedAssets"))
    fs.mkdirSync(__dirname + "/generatedAssets");

  // Create a licenses directory
  if (!fs.existsSync(__dirname + "/generatedAssets/licenses"))
    fs.mkdirSync(__dirname + "/generatedAssets/licenses");

  // Write to HTML files
  fs.writeFileSync(__dirname + "/generatedAssets/index.html", indexPage);
  fs.writeFileSync(__dirname + "/generatedAssets/tests.html", testsPage);
  fs.writeFileSync(
    __dirname + "/generatedAssets/licenses/index.html",
    licensesPage
  );
}

if (!isDev) {
  // Generate assets
  generateAssets();
} else {
  // Generate assets with watching
  const watcher = chokidar.watch([
    __dirname + "/templates",
    __dirname + "/package.json",
    __dirname + "/svrjs.json"
  ]);
  watcher.on("change", () => {
    try {
      generateAssets();
    } catch (err) {
      console.error("There is a problem when regenerating assets!");
      console.error("Stack:");
      console.error(err.stack);
    }
  }).on("ready", () => {
    try {
      generateAssets();
    } catch (err) {
      console.error("There is a problem when regenerating assets!");
      console.error("Stack:");
      console.error(err.stack);
    }
  });
}

if (!isDev) {
  // Bundle the source and copy the assets using esbuild and esbuild-plugin-copy
  esbuild
    .build({
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
            to: ["./dist"]
          },
          globbyOptions: {
            dot: true
          }
        }),
        esbuildCopyPlugin.copy({
          resolveFrom: __dirname,
          assets: {
            from: ["./generatedAssets/**/*"],
            to: ["./dist"]
          }
        })
      ]
    })
    .then(() => {
      const utilFilesAndDirectories = fs.existsSync(
        __dirname + "/src/extraScripts"
      )
        ? fs.readdirSync(__dirname + "/src/extraScripts")
        : [];
      const utilFiles = [];
      utilFilesAndDirectories.forEach((entry) => {
        if (fs.statSync(__dirname + "/src/extraScripts/" + entry).isFile())
          utilFiles.push(entry);
      });

      // Transpile utilities using esbuild
      esbuild
        .build({
          entryPoints: utilFiles.map(
            (filename) => "src/extraScripts/" + filename
          ),
          bundle: true,
          outdir: "dist",
          platform: "node",
          target: "es2017"
        })
        .then(() => {
          const dependencies = JSON.parse(fs.readFileSync(__dirname + "/package.json")).dependencies || {};
          const coreDependencyNames = Object.keys(dependencies).filter((dependency) => externalPackages.indexOf(dependency) != -1);
          const packageJSON = Object.assign({}, corePackageJSON);

          // Add package.json properties
          packageJSON.version = coreVersion;
          packageJSON.main = "./svr.core.js";
          packageJSON.dependencies = coreDependencyNames.reduce((previousDependencies, dependency) => {
            previousDependencies[dependency] = dependencies[dependency];
            return previousDependencies;
          }, {});

          // Write package.json
          fs.writeFileSync(__dirname + "/core/package.json", JSON.stringify(packageJSON, null, 2));

          // Build SVR.JS Core
          esbuild
    .build({
      entryPoints: ["src/core.js"],
      bundle: true,
      outfile: "core/svr.core.js",
      platform: "node",
      target: "es2017",
      external: coreDependencyNames,
      plugins: [
        esbuildCopyPlugin.copy({
          resolveFrom: __dirname,
          assets: {
            from: ["./coreAssets/**/*"],
            to: ["./core"]
          },
          globbyOptions: {
            dot: true
          }
        })
      ]
    })
    .then(() => {
          const archiveName =
            "svr.js." +
            version.toLowerCase().replace(/[^0-9a-z]+/g, ".") +
            ".zip";
          const output = fs.createWriteStream(
            __dirname + "/out/" + archiveName
          );
          const archive = archiver("zip", {
            zlib: { level: 9 }
          });
          archive.pipe(output);

          // Add everything in the "dist" directory except for "svr.js" and "svr.compressed"
          archive.glob("**/*", {
            cwd: __dirname + "/dist",
            ignore: ["svr.js", "svr.compressed"],
            dot: true
          });

          // Create a stream for the "svr.compressed" file
          const compressedSVRJSFileStream = fs
            .createReadStream(__dirname + "/dist/svr.js")
            .pipe(
              zlib.createGzip({
                level: 9
              })
            );
          archive.append(compressedSVRJSFileStream, { name: "svr.compressed" });
          archive.append(
            'const zlib = require("zlib");\nconst fs = require("fs");\nconsole.log("Deleting SVR.JS stub...");\nfs.unlinkSync("svr.js");\nconsole.log("Decompressing SVR.JS...");\nconst script = zlib.gunzipSync(fs.readFileSync("svr.compressed"));\nfs.unlinkSync("svr.compressed");\nfs.writeFileSync("svr.js",script);\nconsole.log("Restart SVR.JS to get server interface.");',
            { name: "svr.js" }
          );
          archive.finalize();
        })
        .catch((err) => {
          throw err;
        });
      })
      .catch((err) => {
        throw err;
      });
    })
    .catch((err) => {
      throw err;
    });
} else {
  // Bundle the source and copy the assets using esbuild and esbuild-plugin-copy with watching
  esbuild
    .context({
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
            to: ["./dist"]
          },
          globbyOptions: {
            dot: true
          },
          watch: {}
        }),
        esbuildCopyPlugin.copy({
          resolveFrom: __dirname,
          assets: {
            from: ["./generatedAssets/**/*"],
            to: ["./dist"]
          },
          watch: {}
        })
      ]
    })
    .then((ctx) => {
      ctx
        .watch()
        .then(() => {
          const utilFilesAndDirectories = fs.existsSync(
            __dirname + "/src/extraScripts"
          )
            ? fs.readdirSync(__dirname + "/src/extraScripts")
            : [];
          const utilFiles = [];
          utilFilesAndDirectories.forEach((entry) => {
            if (fs.statSync(__dirname + "/src/extraScripts/" + entry).isFile())
              utilFiles.push(entry);
          });

          // Transpile utilities using esbuild
          esbuild
            .context({
              entryPoints: utilFiles.map(
                (filename) => "src/extraScripts/" + filename
              ),
              bundle: true,
              outdir: "dist",
              platform: "node",
              target: "es2017"
            })
            .then((ctx) => {
              ctx
                .watch()
                .then(() => {
                  console.log("Watching for changes in SVR.JS source code...");
                })
                .catch((err) => {
                  throw err;
                });
            })
            .catch((err) => {
              throw err;
            });
        })
        .catch((err) => {
          throw err;
        });
    })
    .catch((err) => {
      throw err;
    });
}
