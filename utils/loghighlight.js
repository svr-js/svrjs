//SVR.JS LOG HIGHLIGHTER

const readline = require("readline");

const args = process.argv;
for (
  let i =
    process.argv[0].indexOf("node") > -1 || process.argv[0].indexOf("bun") > -1
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
    console.log("SVR.JS log highlighter usage:");
    console.log(
      "<some process> | node loghighlight.js [-h] [--help] [-?] [/h] [/?]",
    );
    console.log("-h -? /h /? --help    -- Displays help");
    process.exit(0);
  } else {
    console.log("Unrecognized argument: " + args[i]);
    console.log("SVR.JS log highlighter usage:");
    console.log(
      "<some process> | node loghighlight.js [-h] [--help] [-?] [/h] [/?]",
    );
    console.log("-h -? /h /? --help    -- Displays help");
    process.exit(1);
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
  prompt: "",
});
rl.prompt();
rl.on("line", (line) => {
  viewLog([line]);
});

function viewLog(log) {
  if (log[log.length - 1] == "") log.pop();
  if (log[0] == "") log.shift();
  for (var i = 0; i < log.length; i++) {
    if (log[i].indexOf("SERVER REQUEST MESSAGE") != -1) {
      log[i] =
        log[i].replace(
          "SERVER REQUEST MESSAGE",
          "\x1b[34m\x1b[1mSERVER REQUEST MESSAGE\x1b[22m",
        ) + "\x1b[37m\x1b[0m";
    } else if (log[i].indexOf("SERVER RESPONSE MESSAGE") != -1) {
      log[i] =
        log[i].replace(
          "SERVER RESPONSE MESSAGE",
          "\x1b[32m\x1b[1mSERVER RESPONSE MESSAGE\x1b[22m",
        ) + "\x1b[37m\x1b[0m";
    } else if (log[i].indexOf("SERVER RESPONSE ERROR MESSAGE") != -1) {
      log[i] =
        log[i].replace(
          "SERVER RESPONSE ERROR MESSAGE",
          "\x1b[31m\x1b[1mSERVER RESPONSE ERROR MESSAGE\x1b[22m",
        ) + "\x1b[37m\x1b[0m";
    } else if (log[i].indexOf("SERVER ERROR MESSAGE") != -1) {
      log[i] =
        log[i].replace(
          "SERVER ERROR MESSAGE",
          "\x1b[41m\x1b[1mSERVER ERROR MESSAGE\x1b[22m",
        ) + "\x1b[40m\x1b[0m";
    } else if (log[i].indexOf("SERVER WARNING MESSAGE") != -1) {
      log[i] =
        log[i].replace(
          "SERVER WARNING MESSAGE",
          "\x1b[43m\x1b[1mSERVER WARNING MESSAGE\x1b[22m",
        ) + "\x1b[40m\x1b[0m";
    } else if (log[i].indexOf("SERVER MESSAGE") != -1) {
      log[i] = log[i].replace(
        "SERVER MESSAGE",
        "\x1b[1mSERVER MESSAGE\x1b[22m",
      );
    }
    console.log(log[i]);
  }
}
