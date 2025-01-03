<p align="center">
  <a href="https://svrjs.org" target="_blank">
    <img src="assets/logo.png" width="384">
  </a>
</p>
<p align="center">
  <b>SVR.JS</b> - a web server running on Node.JS<br/>
  It's free as in freedom, scalable, secure, and configurable.
</p>
<p align="center">
  <a href="https://svrjs.org/docs" target="_blank"><img alt="Static Badge" src="https://img.shields.io/badge/Documentation-green"></a>
  <a href="https://svrjs.org" target="_blank"><img alt="Website" src="https://img.shields.io/website?url=https%3A%2F%2Fsvrjs.org"></a>
  <a href="https://hub.docker.com/r/svrjs/svrjs" target="_blank"><img alt="Docker Pulls" src="https://img.shields.io/docker/pulls/svrjs/svrjs"></a>
  <a href="https://github.com/svr-js/svrjs" target="_blank"><img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/svr-js/svrjs"></a>
  <a href="https://x.com/SVR_JS" target="_blank"><img alt="X (formerly Twitter) Follow" src="https://img.shields.io/twitter/follow/SVR_JS"></a>
  <a href="https://mastodon.social/@svrjs" target="_blank"><img alt="Mastodon Follow" src="https://img.shields.io/mastodon/follow/111643338718098121"></a>
</p>

* * *

## Features

### Static file handling

*   Static file serving (even above 2GB)
*   Directory listing serving
*   Protection against path traversal
*   Content-Range support (for non-HTML static files; also for HTML files from SVR.JS 3.15.1)
*   Serving from web root different than SVR.JS installation directory

### Security

*   HTTPS support
*   HTTP/2 support
*   Built-in block list
*   Protection against HTTP authentication brute force attacks (from SVR.JS 3.4.8; enabled by default)
*   Ability to hide server version
*   OCSP stapling support (from SVR.JS 3.4.9)

### Configuration and customization

*   Configurability via _config.json_ file
*   Expandability via server-side JavaScript and mods
*   Ability to serve non-standard error pages
*   URL rewriting engine
*   Event driven architecture powered by Node.JS, along with clustering.

### Compression and content delivery

*   Brotli, gzip and Deflate HTTP compression (Brotli supported since SVR.JS 3.4.11)
*   SNI (Server Name Indication) support
*   ETag support (from SVR.JS 3.6.1)
*   Reverse proxy functionality (requires reverse-proxy-mod SVR.JS mod)
*   Forward proxy functionality (requires forward-proxy-mod SVR.JS mod)

### Authentication and access control

*   HTTP basic authentication

### Gateway interfaces

*   CGI (Common Gateway Interface) support (requires RedBrick mod)
*   SCGI (Simple Common Gateway Interface) support (requires OrangeCircle mod)
*   JSGI (JavaScript Gateway Interface) support (requires YellowSquare mod)
*   PHP support (PHP-CGI with RedBrick mod or PHP-FPM with GreenRhombus mod)

### Additional functionality

*   Logging
*   Ability to display IP addresses, from which originally request was made (from reverse proxies; via X-Forwarded-For)

## Building SVR.JS

To build SVR.JS, you need Node.JS 18.0.0 or newer.

Before building SVR.JS, install the npm packages using this command:
```bash
npm install
```
After installing the packages, build SVR.JS with this command:
```bash
npm run build 
```
After running the command, you will get bundled SVR.JS script, around with built-in utilities and assets in the `dist` directory. You will also get a zip archive in `out` directory, that can be installed using SVR.JS installer. Additionally, you will get the SVR.JS Core package contents in the `core` directory, which you can publish by running `npm publish` in the `core` directory.

## Installation (built from source)

To install SVR.JS you just built from the source code, you can install it via SVR.JS installer for GNU/Linux or manually.

If you want to install SVR.JS manually, you can read the [server documentation](https://svrjs.org/docs).

If you want to install via SVR.JS installer for GNU/Linux, run this command:
```bash
curl -fsSL https://downloads.svrjs.org/installer/svr.js.installer.linux.20240509.sh > /tmp/installer.sh && sudo bash /tmp/installer.sh
```

You will be then prompted about the type of installation. Choose option “2” to install SVR.JS from the zip archive, and type in the path to the zip archive (hint: it is in the `out` directory).

After typing the path, you may be prompted to install dependencies via GNU/Linux distribution’s package manager. Proceed with the installation of dependencies.

After installation, SVR.JS should be listening at http://localhost.

## SVR.JS documentation

You can read the [SVR.JS documentation](https://svrjs.org/docs) to get information on how to use SVR.JS.

## npm scripts

- To build SVR.JS along with the zip archive, run `npm run build`.
- To check SVR.JS code for errors with ESLint, run `npm run lint`.
- To fix and beautify SVR.JS code with ESLint and Prettier, run `npm run lint:fix`.
- To run SVR.JS from the "dist" folder, run `npm start`.
- To test SVR.JS itself, run `npm run dev`. This removes existing configuration.
- To perform unit tests with Jest, run `npm test`.

## File structure

The file structure for SVR.JS source code looks like this:
 - .husky - Git hooks
 - assets - files to copy into dist folder and to the archive
 - core - contains SVR.JS Core
 - coreAssets - files to copy into core folder
 - dist - contains SVR.JS, assets, and SVR.JS utilities
 - generatedAssets - assets generated by the build script
 - out - contains SVR.JS zip archive
 - src - contains SVR.JS source code
   - index.js - SVR.JS entry point
   - core.js - SVR.JS Core entry point
   - core.d.ts - SVR.JS Core type definitions (the type definition only on a single file)
   - extraScripts - SVR.JS extra scripts (each script has a single file)
   - handlers - handlers for servers
   - middleware - built-in middleware for servers
   - res - resources
   - utils - utility functions
 - templates - EJS templates for build script to use
 - tests - Jest unit tests
   - middleware - tests for middleware
   - utils - unit tests for utility functions
 - commitlint.config.js - commitlint configuration
 - esbuild.config.js - the build script
 - eslint.config.js - ESLint configuration
 - jest.config.js - Jest configuration
 - lint-staged.config.js - lint-staged configuration
 - prettier.config.js - Prettier configuration
 - svrjs.json - SVR.JS version, name, documentation URL, and statistics server collection endpoint URL
 
## Contribute

See [SVR.JS contribution page](https://svrjs.org/contribute) for details.

## License

This project is licensed under the MIT/X11 License - see the [LICENSE](LICENSE) file for details.