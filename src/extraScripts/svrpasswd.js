//SVR.JS USER TOOL
const readline = require("readline");
const fs = require("fs");
let crypto = {};
try {
  crypto = require("crypto");
  // eslint-disable-next-line no-unused-vars
} catch (ex) {
  crypto = {};
  crypto.__disabled__ = null;
  crypto.createHash = (type) => {
    if (type != "SHA256") throw new Error("Hash type not supported!");
    return {
      msg: "",
      update: (a) => {
        this.msg = a;
        return this;
      },
      digest: (ty) => {
        const chrsz = 8;
        const hexcase = 0;

        const safeAdd = (x, y) => {
          const lsw = (x & 0xffff) + (y & 0xffff);
          const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
          return (msw << 16) | (lsw & 0xffff);
        };

        const S = (X, n) => {
          return (X >>> n) | (X << (32 - n));
        };

        const R = (X, n) => {
          return X >>> n;
        };

        const Ch = (x, y, z) => {
          return (x & y) ^ (~x & z);
        };

        const Maj = (x, y, z) => {
          return (x & y) ^ (x & z) ^ (y & z);
        };

        const Sigma0256 = (x) => {
          return S(x, 2) ^ S(x, 13) ^ S(x, 22);
        };

        const Sigma1256 = (x) => {
          return S(x, 6) ^ S(x, 11) ^ S(x, 25);
        };

        const Gamma0256 = (x) => {
          return S(x, 7) ^ S(x, 18) ^ R(x, 3);
        };

        const Gamma1256 = (x) => {
          return S(x, 17) ^ S(x, 19) ^ R(x, 10);
        };

        function coreSha256(m, l) {
          const K = new Array(
            0x428a2f98,
            0x71374491,
            0xb5c0fbcf,
            0xe9b5dba5,
            0x3956c25b,
            0x59f111f1,
            0x923f82a4,
            0xab1c5ed5,
            0xd807aa98,
            0x12835b01,
            0x243185be,
            0x550c7dc3,
            0x72be5d74,
            0x80deb1fe,
            0x9bdc06a7,
            0xc19bf174,
            0xe49b69c1,
            0xefbe4786,
            0xfc19dc6,
            0x240ca1cc,
            0x2de92c6f,
            0x4a7484aa,
            0x5cb0a9dc,
            0x76f988da,
            0x983e5152,
            0xa831c66d,
            0xb00327c8,
            0xbf597fc7,
            0xc6e00bf3,
            0xd5a79147,
            0x6ca6351,
            0x14292967,
            0x27b70a85,
            0x2e1b2138,
            0x4d2c6dfc,
            0x53380d13,
            0x650a7354,
            0x766a0abb,
            0x81c2c92e,
            0x92722c85,
            0xa2bfe8a1,
            0xa81a664b,
            0xc24b8b70,
            0xc76c51a3,
            0xd192e819,
            0xd6990624,
            0xf40e3585,
            0x106aa070,
            0x19a4c116,
            0x1e376c08,
            0x2748774c,
            0x34b0bcb5,
            0x391c0cb3,
            0x4ed8aa4a,
            0x5b9cca4f,
            0x682e6ff3,
            0x748f82ee,
            0x78a5636f,
            0x84c87814,
            0x8cc70208,
            0x90befffa,
            0xa4506ceb,
            0xbef9a3f7,
            0xc67178f2
          );
          let HASH = new Array(
            0x6a09e667,
            0xbb67ae85,
            0x3c6ef372,
            0xa54ff53a,
            0x510e527f,
            0x9b05688c,
            0x1f83d9ab,
            0x5be0cd19
          );
          let W = new Array(64);
          let a, b, c, d, e, f, g, h;
          let T1, T2;

          m[l >> 5] |= 0x80 << (24 - (l % 32));
          m[(((l + 64) >> 9) << 4) + 15] = l;

          for (let i = 0; i < m.length; i += 16) {
            a = HASH[0];
            b = HASH[1];
            c = HASH[2];
            d = HASH[3];
            e = HASH[4];
            f = HASH[5];
            g = HASH[6];
            h = HASH[7];

            for (let j = 0; j < 64; j++) {
              if (j < 16) W[j] = m[j + i];
              else
                W[j] = safeAdd(
                  safeAdd(
                    safeAdd(Gamma1256(W[j - 2]), W[j - 7]),
                    Gamma0256(W[j - 15])
                  ),
                  W[j - 16]
                );

              T1 = safeAdd(
                safeAdd(safeAdd(safeAdd(h, Sigma1256(e)), Ch(e, f, g)), K[j]),
                W[j]
              );
              T2 = safeAdd(Sigma0256(a), Maj(a, b, c));

              h = g;
              g = f;
              f = e;
              e = safeAdd(d, T1);
              d = c;
              c = b;
              b = a;
              a = safeAdd(T1, T2);
            }

            HASH[0] = safeAdd(a, HASH[0]);
            HASH[1] = safeAdd(b, HASH[1]);
            HASH[2] = safeAdd(c, HASH[2]);
            HASH[3] = safeAdd(d, HASH[3]);
            HASH[4] = safeAdd(e, HASH[4]);
            HASH[5] = safeAdd(f, HASH[5]);
            HASH[6] = safeAdd(g, HASH[6]);
            HASH[7] = safeAdd(h, HASH[7]);
          }
          return HASH;
        }

        const str2binb = (str) => {
          let bin = Array();
          const mask = (1 << chrsz) - 1;
          for (let i = 0; i < str.length * chrsz; i += chrsz) {
            bin[i >> 5] |=
              (str.charCodeAt(i / chrsz) & mask) << (24 - (i % 32));
          }
          return bin;
        };

        const Utf8Encode = (string) => {
          string = string.replace(/\r\n/g, "\n");
          let utftext = "";

          for (let n = 0; n < string.length; n++) {
            let c = string.charCodeAt(n);

            if (c < 128) {
              utftext += String.fromCharCode(c);
            } else if (c > 127 && c < 2048) {
              utftext += String.fromCharCode((c >> 6) | 192);
              utftext += String.fromCharCode((c & 63) | 128);
            } else {
              utftext += String.fromCharCode((c >> 12) | 224);
              utftext += String.fromCharCode(((c >> 6) & 63) | 128);
              utftext += String.fromCharCode((c & 63) | 128);
            }
          }

          return utftext;
        };

        const binb2hex = (binarray) => {
          const hexTab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
          let str = "";
          for (let i = 0; i < binarray.length * 4; i++) {
            str +=
              hexTab.charAt(
                (binarray[i >> 2] >> ((3 - (i % 4)) * 8 + 4)) & 0xf
              ) +
              hexTab.charAt((binarray[i >> 2] >> ((3 - (i % 4)) * 8)) & 0xf);
          }
          return str;
        };

        let s = Utf8Encode(this.msg);
        let str = binb2hex(coreSha256(str2binb(s), s.length * chrsz));
        if (ty == "hex") return str;
        let hx = [];
        for (var i = 0; i < str.length; i += 2) {
          hx.push(parseInt(str[i] + str[i + 1], 16));
        }
        return Buffer.from(hx);
      }
    };
  };
}

if (!crypto.randomInt) {
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
