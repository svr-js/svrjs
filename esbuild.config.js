const esbuild = require("esbuild");
const esbuildCopyPlugin = require("esbuild-plugin-copy");
const fs = require("fs");
const zlib = require("zlib");
const archiver = require("archiver");
const svrjsInfo = JSON.parse(fs.readFileSync(__dirname + "/svrjs.json"));
const { version } = svrjsInfo;
const svrjsCoreInfo = JSON.parse(
  fs.readFileSync(__dirname + "/svrjs.core.json")
);
const { externalPackages } = svrjsCoreInfo;
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
if (!fs.existsSync(__dirname + "/dist/wwwroot"))
    fs.mkdirSync(__dirname + "/dist/wwwroot");
if (!fs.existsSync(__dirname + "/dist/.dirimages"))
    fs.mkdirSync(__dirname + "/dist/.dirimages");

// Create the out directory if it doesn't exist and if not building for development
if (!isDev && !fs.existsSync(__dirname + "/out"))
  fs.mkdirSync(__dirname + "/out");

// Create the core directory if it doesn't exist and if not building for development
if (!isDev && !fs.existsSync(__dirname + "/core"))
  fs.mkdirSync(__dirname + "/core");

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
            from: ["./assets/svrjs/**/*"],
            to: ["./dist"]
          },
          globbyOptions: {
            dot: true
          }
        }),
        esbuildCopyPlugin.copy({
          resolveFrom: __dirname,
          assets: {
            from: ["./assets/dirimages/*.png"],
            to: ["./dist/.dirimages"]
          }
        }),
        esbuildCopyPlugin.copy({
          resolveFrom: __dirname,
          assets: {
            from: ["./page/dist/**/*"],
            to: ["./dist/wwwroot"]
          },
          globbyOptions: {
            dot: true
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
          const dependencies =
            JSON.parse(fs.readFileSync(__dirname + "/package.json"))
              .dependencies || {};
          const coreDependencyNames = Object.keys(dependencies).filter(
            (dependency) => externalPackages.indexOf(dependency) != -1
          );
          const packageJSON = Object.assign({}, corePackageJSON);

          // Add package.json properties
          packageJSON.version = version;
          packageJSON.main = "./svr.core.js";
          packageJSON.types = "./svr.core.d.ts";
          packageJSON.dependencies = coreDependencyNames.reduce(
            (previousDependencies, dependency) => {
              previousDependencies[dependency] = dependencies[dependency];
              return previousDependencies;
            },
            {}
          );

          // Write package.json
          fs.writeFileSync(
            __dirname + "/core/package.json",
            JSON.stringify(packageJSON, null, 2)
          );

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
                    from: ["./assets/core/**/*"],
                    to: ["./core"]
                  },
                  globbyOptions: {
                    dot: true
                  }
                }),
                esbuildCopyPlugin.copy({
                  resolveFrom: __dirname,
                  assets: {
                    from: ["./src/core.d.ts"],
                    to: ["./core/svr.core.d.ts"]
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
                ignore: ["svr.compressed"],
                dot: true
              });

              // Create a stream for the "svr.compressed" file, to maintain compatibility with the older SVR.JS update script for GNU/Linux
              const compressedSVRJSFileStream = fs
                .createReadStream(__dirname + "/dist/svr.js")
                .pipe(
                  zlib.createGzip({
                    level: 9
                  })
                );
              archive.append(compressedSVRJSFileStream, {
                name: "svr.compressed"
              });
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
            from: ["./assets/svrjs/**/*"],
            to: ["./dist"]
          },
          globbyOptions: {
            dot: true
          },
          watch: true
        }),
        esbuildCopyPlugin.copy({
          resolveFrom: __dirname,
          assets: {
            from: ["./assets/dirimages/*.png"],
            to: ["./dist/.dirimages"]
          },
          watch: true
        }),
        esbuildCopyPlugin.copy({
          resolveFrom: __dirname,
          assets: {
            from: ["./page/dist/**/*"],
            to: ["./dist/wwwroot"]
          },
          globbyOptions: {
            dot: true
          },
          watch: true
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
