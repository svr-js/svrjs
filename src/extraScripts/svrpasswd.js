//SVR.JS USER TOOL
const readline = require("readline");
const fs = require("fs");
const crypto = require("crypto");

if (!crypto.randomInt) {
  // Polyfill crypto.randomInt (a very simple polyfill)
  crypto.randomInt = (min, max) => {
    return Math.round(Math.random() * (max - min)) + min;
  };
}

let configJSON = {};
if (fs.existsSync(__dirname + "/config.json")) {
  let configJSONf = "";
  try {
    configJSONf = fs.readFileSync(__dirname + "/config.json"); //Read JSON File
    // eslint-disable-next-line no-unused-vars
  } catch (ex) {
    throw new Error("Cannot read JSON file.");
  }
  try {
    configJSON = JSON.parse(configJSONf); //Parse JSON
    // eslint-disable-next-line no-unused-vars
  } catch (ex) {
    throw new Error("JSON Parse error.");
  }
}

let users = [];
if (configJSON.users != undefined) users = configJSON.users;

function saveConfig() {
  let configJSONobj = {};
  if (fs.existsSync(__dirname + "/config.json"))
    configJSONobj = JSON.parse(
      fs.readFileSync(__dirname + "/config.json").toString()
    );
  configJSONobj.users = users;
  const configString = JSON.stringify(configJSONobj, null, 2);
  fs.writeFileSync(__dirname + "/config.json", configString);
}

const args = process.argv;
let user = "";
let action = "change";
let forcechange = false;
if (
  process.argv.length <=
  (process.argv[0].indexOf("node") > -1 || process.argv[0].indexOf("bun") > -1
    ? 2
    : 1)
)
  args.push("-h");
for (
  let i =
    process.argv[0].indexOf("node") > -1 ||
    process.argv[0].indexOf("bun") > -1 ||
    process.argv[0].indexOf("deno") > -1
      ? 2
      : 1;
  i < args.length;
  i++
) {
  if (
    args[i] == "-h" ||
    args[i] == "--help" ||
    args[i] == "-?" ||
    args[i] == "/h" ||
    args[i] == "/?"
  ) {
    console.log("SVR.JS user tool usage:");
    console.log(
      "node svrpasswd.js [-h] [--help] [-?] [/h] [/?] [-x] [-a|--add|-d|--delete] <username>"
    );
    console.log("-h -? /h /? --help    -- Displays help");
    console.log("-a --add              -- Add an user");
    console.log("-d --delete           -- Deletes an user");
    console.log("-x                    -- Changes hash algorithm");
    process.exit(0);
  } else if (args[i] == "-a" || args[i] == "--add") {
    if (action != "change") {
      console.log("Multiple actions specified.");
      console.log(
        "node svrpasswd.js [-h] [--help] [-?] [/h] [/?] [-x] [-a|--add|-d|--delete] <username>"
      );
      console.log("-h -? /h /? --help    -- Displays help");
      console.log("-a --add              -- Add an user");
      console.log("-d --delete           -- Deletes an user");
      console.log("-x                    -- Changes hash algorithm");
      process.exit(1);
    }
    action = "add";
  } else if (args[i] == "-d" || args[i] == "--delete") {
    if (action != "change") {
      console.log("Multiple actions specified.");
      console.log(
        "node svrpasswd.js [-h] [--help] [-?] [/h] [/?] [-x] [-a|--add|-d|--delete] <username>"
      );
      console.log("-h -? /h /? --help    -- Displays help");
      console.log("-a --add              -- Add an user");
      console.log("-d --delete           -- Deletes an user");
      console.log("-x                    -- Changes hash algorithm");
      process.exit(1);
    }
    action = "delete";
  } else if (args[i] == "-x") {
    if (forcechange) {
      console.log("Multiple -x options specified.");
      console.log(
        "node svrpasswd.js [-h] [--help] [-?] [/h] [/?] [-x] [-a|--add|-d|--delete] <username>"
      );
      console.log("-h -? /h /? --help    -- Displays help");
      console.log("-a --add              -- Add an user");
      console.log("-d --delete           -- Deletes an user");
      console.log("-x                    -- Changes hash algorithm");
      process.exit(1);
    }
    forcechange = true;
  } else {
    if (user != "") {
      console.log("Multiple users specified.");
      console.log(
        "node svrpasswd.js [-h] [--help] [-?] [/h] [/?] [-x] [-a|--add|-d|--delete] <username>"
      );
      console.log("-h -? /h /? --help    -- Displays help");
      console.log("-a --add              -- Add an user");
      console.log("-d --delete           -- Deletes an user");
      console.log("-x                    -- Changes hash algorithm");
      process.exit(1);
    }
    user = args[i];
  }
}

if (user == "") {
  console.log("No user specified.");
  console.log(
    "node svrpasswd.js [-h] [--help] [-?] [/h] [/?] [-x] [-a|--add|-d|--delete] <username>"
  );
  console.log("-h -? /h /? --help    -- Displays help");
  console.log("-a --add              -- Add an user");
  console.log("-d --delete           -- Deletes an user");
  console.log("-x                    -- Changes hash algorithm");
  process.exit(1);
}

function getUserIndex(username) {
  let ind = -1;
  for (let i = 0; i < users.length; i++) {
    if (users[i].name == username) {
      ind = i;
      break;
    }
  }
  return ind;
}

function sha256(msg) {
  let hash = crypto.createHash("SHA256");
  hash.update(msg);
  return hash.digest("hex");
}

function generateSalt() {
  let token = "";
  const strlist =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let i = 0; i < 63; i++) {
    token += strlist[crypto.randomInt(0, strlist.length)];
  }
  return token;
}

function password(callback) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "Password: "
  });
  rl.prompt();
  process.stdout.writeold = process.stdout.write;
  process.stdout.write = (s) => {
    process.stdout.writeold(s.replace(/[^\r\n]/g, ""));
  };
  rl.once("line", (line) => {
    process.stdout.write = process.stdout.writeold;
    var rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: "Confirm password: "
    });
    rl.prompt();
    process.stdout.writeold = process.stdout.write;
    process.stdout.write = (s) => {
      process.stdout.writeold(s.replace(/[^\r\n]/g, ""));
    };
    rl.on("line", (line2) => {
      process.stdout.write = process.stdout.writeold;
      rl.close();
      if (line != line2) callback(false);
      else callback(line);
    });
  });
}

function promptAlgorithms(callback, bypass, pbkdf2, scrypt) {
  if (bypass) {
    if (scrypt) {
      callback("scrypt");
    } else if (pbkdf2) {
      callback("pbkdf2");
    } else {
      callback("sha256");
    }
    return;
  }
  let algorithms = {
    sha256:
      "Salted SHA256 (1 iteration) - fastest and uses least memory, but less secure",
    pbkdf2:
      "PBKDF2 (PBKDF2-HMAC-SHA512, 36250 iterations) - more secure and uses less memory, but slower",
    scrypt:
      "scrypt (N=2^14, r=8, p=1) - faster and more secure, but uses more memory"
  };
  if (
    !crypto.pbkdf2 ||
    (process.isBun &&
      !(
        process.versions.bun &&
        !process.versions.bun.match(
          /^(?:0\.|1\.0\.|1\.1\.[0-9](?![0-9])|1\.1\.1[0-2](?![0-9]))/
        )
      ))
  )
    delete algorithms.pbkdf2;
  const algorithmNames = Object.keys(algorithms);
  if (algorithmNames.length < 2) callback(algorithmNames[0]);
  console.log("Select password hashing algorithm. Available algorithms:");
  for (var i = 0; i < algorithmNames.length; i++) {
    console.log(algorithmNames[i] + " - " + algorithms[algorithmNames[i]]);
  }
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "Algorithm: "
  });
  rl.prompt();
  rl.on("line", (line) => {
    rl.close();
    line = line.trim();
    if (!algorithms[line]) callback(false);
    else callback(line);
  });
}

const userindex = getUserIndex(user);
if (action == "add" && userindex != -1) {
  console.log("User already exists.");
  process.exit(1);
} else if (action != "add" && userindex == -1) {
  console.log("User doesn't exist.");
  process.exit(1);
}
if (action == "delete") {
  users.splice(userindex, 1);
  saveConfig();
  console.log("User deleted successfully");
} else if (action == "add") {
  promptAlgorithms((algorithm) => {
    if (!algorithm) {
      console.log("Invalid algorithm!");
      process.exit(1);
    } else {
      password((password) => {
        if (!password) {
          console.log("Passwords don't match!");
          process.exit(1);
        } else {
          const salt = generateSalt();
          let hash = "";
          if (algorithm == "scrypt") {
            hash = crypto.scryptSync(password, salt, 64).toString("hex");
          } else if (algorithm == "pbkdf2") {
            hash = crypto
              .pbkdf2Sync(password, salt, 36250, 64, "sha512")
              .toString("hex");
          } else {
            hash = sha256(password + salt);
          }
          users.push({
            name: user,
            pass: hash,
            salt: salt,
            pbkdf2: algorithm == "pbkdf2" ? true : undefined,
            scrypt: algorithm == "scrypt" ? true : undefined,
            __svrpasswd_l2: true
          });
          saveConfig();
          console.log("User added successfully");
        }
      });
    }
  });
} else {
  promptAlgorithms(
    (algorithm) => {
      if (!algorithm) {
        console.log("Invalid algorithm!");
        process.exit(1);
      } else {
        password((password) => {
          if (!password) {
            console.log("Passwords don't match!");
            process.exit(1);
          } else {
            var salt = generateSalt();
            var hash = "";
            if (algorithm == "scrypt") {
              hash = crypto.scryptSync(password, salt, 64).toString("hex");
            } else if (algorithm == "pbkdf2") {
              hash = crypto
                .pbkdf2Sync(password, salt, 36250, 64, "sha512")
                .toString("hex");
            } else {
              hash = sha256(password + salt);
            }
            users[userindex] = {
              name: user,
              pass: hash,
              salt: salt,
              pbkdf2: algorithm == "pbkdf2" ? true : undefined,
              scrypt: algorithm == "scrypt" ? true : undefined,
              __svrpasswd_l2: true
            };
            saveConfig();
            console.log("Password changed successfully");
          }
        });
      }
    },
    users[userindex].__svrpasswd_l2 && !forcechange,
    users[userindex].pbkdf2,
    users[userindex].scrypt
  );
}
