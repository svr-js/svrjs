//SVR.JS LOG VIEWER

var fs = require("fs");
var readline = require("readline");
var process = require("process");

var args = process.argv;
for (var i = (process.argv[0].indexOf("node") > -1 || process.argv[0].indexOf("bun") > -1 ? 2 : 1); i < args.length; i++) {
  if (args[i] == "-h" || args[i] == "--help" || args[i] == "-?" || args[i] == "/h" || args[i] == "/?") {
    console.log("SVR.JS log viewer usage:");
    console.log("node logviewer.js [-h] [--help] [-?] [/h] [/?]");
    console.log("-h -? /h /? --help    -- Displays help");
    process.exit(0);
  } else {
    console.log("Unrecognized argument: " + args[i]);
    console.log("SVR.JS log viewer usage:");
    console.log("node logviewer.js [-h] [--help] [-?] [/h] [/?]");
    console.log("-h -? /h /? --help    -- Displays help");
    process.exit(1);
  }
}

var logo = ["", "", "", "            \x1b[38;5;002m&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&", "          &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&", "         &&&\x1b[38;5;243m(((((((((((((((((((((((((((((((((((((((((((((((((((\x1b[38;5;002m&&&", "         \x1b[38;5;002m&&\x1b[38;5;243m((((((\x1b[38;5;241m###########\x1b[38;5;243m(((((((((((((((((((((((\x1b[38;5;011m***\x1b[38;5;243m(\x1b[38;5;011m***\x1b[38;5;243m(\x1b[38;5;011m***\x1b[38;5;243m((\x1b[38;5;002m&&", "         \x1b[38;5;002m&&&\x1b[38;5;243m(((((((((((((((((((((((((((((((((((((((((((((((((((\x1b[38;5;002m&&&", "         \x1b[38;5;002m&&&\x1b[38;5;243m(((((((((((((((((((((((((((((((((((((((((((((((((((\x1b[38;5;002m&&&", "         \x1b[38;5;002m&&\x1b[38;5;243m((((((\x1b[38;5;241m###########\x1b[38;5;243m(((((((((((((((((((((((\x1b[38;5;011m***\x1b[38;5;243m(\x1b[38;5;015m   \x1b[38;5;243m(\x1b[38;5;011m***\x1b[38;5;243m((\x1b[38;5;002m&&", "         \x1b[38;5;002m&&&\x1b[38;5;243m(((((((((((((((((((((((((((((((((((((((((((((((((((\x1b[38;5;002m&&&", "         \x1b[38;5;002m&&&\x1b[38;5;243m(((((((((((((((((((((((((((((((((((((((((((((((((((\x1b[38;5;002m&&&", "         \x1b[38;5;002m&&\x1b[38;5;243m((((((\x1b[38;5;241m###########\x1b[38;5;243m(((((((((((((((((((((((\x1b[38;5;015m   \x1b[38;5;243m(\x1b[38;5;015m   \x1b[38;5;243m(\x1b[38;5;015m   \x1b[38;5;243m((\x1b[38;5;002m&&", "         \x1b[38;5;002m&&&\x1b[38;5;243m(((((((((((((((((((((((((((((((((((((((((((((((((((\x1b[38;5;002m&&&", "         \x1b[38;5;002m&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&", "         \x1b[38;5;002m&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&", "         \x1b[38;5;002m&&&&&&&&\x1b[38;5;010m#########################################\x1b[38;5;002m&&&&&&&&", "         \x1b[38;5;002m&&&&&\x1b[38;5;010m###############################################\x1b[38;5;002m&&&&&", "         \x1b[38;5;002m&&&\x1b[38;5;010m###################################################\x1b[38;5;002m&&&", "         \x1b[38;5;002m&&\x1b[38;5;010m####\x1b[38;5;016m@@@@@@\x1b[38;5;010m#\x1b[38;5;016m@@@\x1b[38;5;010m###\x1b[38;5;016m@@@\x1b[38;5;010m#\x1b[38;5;016m@@@@@@@\x1b[38;5;010m###########\x1b[38;5;016m@@\x1b[38;5;010m##\x1b[38;5;016m@@@@@@\x1b[38;5;010m####\x1b[38;5;002m&&", "         \x1b[38;5;002m&&\x1b[38;5;010m###\x1b[38;5;016m@@\x1b[38;5;010m#######\x1b[38;5;016m@@\x1b[38;5;010m###\x1b[38;5;016m@@\x1b[38;5;010m##\x1b[38;5;016m@@\x1b[38;5;010m####\x1b[38;5;016m@@\x1b[38;5;010m##########\x1b[38;5;016m@@\x1b[38;5;010m#\x1b[38;5;016m@@\x1b[38;5;010m#########\x1b[38;5;002m&&", "         \x1b[38;5;002m&&\x1b[38;5;010m######\x1b[38;5;040m#\x1b[38;5;016m@@@@\x1b[38;5;010m##\x1b[38;5;016m@@\x1b[38;5;010m#\x1b[38;5;016m@@\x1b[38;5;010m###\x1b[38;5;016m@@@@@@@\x1b[38;5;010m#######\x1b[38;5;016m@@\x1b[38;5;010m##\x1b[38;5;016m@@\x1b[38;5;010m####\x1b[38;5;040m#\x1b[38;5;016m@@@@\x1b[38;5;010m###\x1b[38;5;002m&&", "         \x1b[38;5;002m&&\x1b[38;5;010m###\x1b[38;5;016m@@\x1b[38;5;034m%\x1b[38;5;010m###\x1b[38;5;016m@@\x1b[38;5;010m###\x1b[38;5;016m@@@\x1b[38;5;010m####\x1b[38;5;016m@@\x1b[38;5;010m####\x1b[38;5;016m@@\x1b[38;5;010m##\x1b[38;5;016m@@\x1b[38;5;010m###\x1b[38;5;016m@@@@\x1b[38;5;010m##\x1b[38;5;016m@@\x1b[38;5;034m%\x1b[38;5;010m###\x1b[38;5;016m@@\x1b[38;5;010m###\x1b[38;5;002m&&", "         \x1b[38;5;002m&&\x1b[38;5;010m#####################################################\x1b[38;5;002m&&", "         \x1b[38;5;002m&&&\x1b[38;5;010m###################################################\x1b[38;5;002m&&&", "         \x1b[38;5;002m&&&&&\x1b[38;5;010m###############################################\x1b[38;5;002m&&&&&", "         \x1b[38;5;002m&&&&&&&&\x1b[38;5;010m#########################################\x1b[38;5;002m&&&&&&&&", "         \x1b[38;5;002m&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&", "          &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&", "            &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&", "                                  \x1b[38;5;246m///////", "                                  ///////", "                                 \x1b[38;5;208m((((/))))", "                                \x1b[38;5;208m(((((/)))))", "            \x1b[38;5;246m/\x1b[38;5;247m*\x1b[38;5;246m///\x1b[38;5;247m*\x1b[38;5;246m///\x1b[38;5;247m*\x1b[38;5;246m///\x1b[38;5;247m*\x1b[38;5;246m///\x1b[38;5;247m*\x1b[38;5;246m/\x1b[38;5;247m/\x1b[38;5;208m(((((/)))))\x1b[38;5;246m//\x1b[38;5;247m*\x1b[38;5;246m///\x1b[38;5;247m*\x1b[38;5;246m///\x1b[38;5;247m*\x1b[38;5;246m///\x1b[38;5;247m*\x1b[38;5;246m///\x1b[38;5;247m*\x1b[38;5;246m/", "           //\x1b[38;5;247m*\x1b[38;5;246m///////\x1b[38;5;247m*\x1b[38;5;246m///////\x1b[38;5;247m*\x1b[38;5;246m/\x1b[38;5;247m/\x1b[38;5;208m(((((/)))))\x1b[38;5;246m//\x1b[38;5;247m*\x1b[38;5;246m///////\x1b[38;5;247m*\x1b[38;5;246m///////\x1b[38;5;247m*\x1b[38;5;246m//", "           *\x1b[38;5;246m/\x1b[38;5;247m*\x1b[38;5;246m/\x1b[38;5;247m*\x1b[38;5;246m/\x1b[38;5;247m*\x1b[38;5;246m/\x1b[38;5;247m*\x1b[38;5;246m/\x1b[38;5;247m*\x1b[38;5;246m/\x1b[38;5;247m*\x1b[38;5;246m/\x1b[38;5;247m*\x1b[38;5;246m/\x1b[38;5;247m*\x1b[38;5;246m/\x1b[38;5;247m*\x1b[38;5;246m/\x1b[38;5;247m*\x1b[38;5;208m(((((/)))))\x1b[38;5;247m*\x1b[38;5;246m/\x1b[38;5;247m*\x1b[38;5;246m/\x1b[38;5;247m*\x1b[38;5;246m/\x1b[38;5;247m*\x1b[38;5;246m/\x1b[38;5;247m*\x1b[38;5;246m/\x1b[38;5;247m*\x1b[38;5;246m/\x1b[38;5;247m*\x1b[38;5;246m/\x1b[38;5;247m*\x1b[38;5;246m/\x1b[38;5;247m*\x1b[38;5;246m/\x1b[38;5;247m*\x1b[38;5;246m/\x1b[38;5;247m*", "                                 \x1b[38;5;208m((((/))))", "", "", "", "\x1b[0m"];

for(var i=0;i<logo.length;i++) {
  console.log(logo[i]);
}
console.log("Welcome to SVR.JS log viewer");

if(!fs.existsSync("log")) {
  console.log("No log directory, exiting...");
  process.exit(1);
}

function prompt(options) {
var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'logviewer> '
});
console.log("Options:");
for(var i=0;i<options.length;i++) {
  console.log("[" + i + "] - " + options[i].name);
}
rl.prompt();
rl.on('line', (line) => {
  var op = line.trim();
  if(op == "") {
    rl.prompt();
    return;
  }
  var opn = parseInt(op);
  rl.close();
  if(options[op]) {
    options[op].callback();
  } else {
    console.log("Invalid option.");
    prompt(options);
  }
});
}


function viewLog(log) {
    if(log[log.length-1] == "") log.pop();
    if(log[0] == "") log.shift();
    for(var i=0;i<log.length;i++) {
      if(log[i].indexOf("SERVER REQUEST MESSAGE") != -1) {
        log[i] = log[i].replace("SERVER REQUEST MESSAGE","\x1b[34m\x1b[1mSERVER REQUEST MESSAGE\x1b[22m") + "\x1b[37m\x1b[0m";
      } else if(log[i].indexOf("SERVER RESPONSE MESSAGE") != -1) {
        log[i] = log[i].replace("SERVER RESPONSE MESSAGE","\x1b[32m\x1b[1mSERVER RESPONSE MESSAGE\x1b[22m") + "\x1b[37m\x1b[0m";
      } else if(log[i].indexOf("SERVER RESPONSE ERROR MESSAGE") != -1) {
        log[i] = log[i].replace("SERVER RESPONSE ERROR MESSAGE","\x1b[31m\x1b[1mSERVER RESPONSE ERROR MESSAGE\x1b[22m") + "\x1b[37m\x1b[0m";
      } else if(log[i].indexOf("SERVER ERROR MESSAGE") != -1) {
        log[i] = log[i].replace("SERVER ERROR MESSAGE","\x1b[41m\x1b[1mSERVER ERROR MESSAGE\x1b[22m") + "\x1b[40m\x1b[0m";
      } else if(log[i].indexOf("SERVER WARNING MESSAGE") != -1) {
        log[i] = log[i].replace("SERVER WARNING MESSAGE","\x1b[43m\x1b[1mSERVER WARNING MESSAGE\x1b[22m") + "\x1b[40m\x1b[0m";
      } else if(log[i].indexOf("SERVER MESSAGE") != -1) {
        log[i] = log[i].replace("SERVER MESSAGE","\x1b[43m\x1b[1mSERVER WARNING MESSAGE\x1b[22m");
      }
      console.log(log[i]);
    }
}

function viewMasterLogs() {
  var logList = fs.readdirSync("log");
  var masterLogs = [];
  for(var i=0;i<logList.length;i++) {
      if(logList[i].match(/^master-[0-9]+\.log$/)) {
          masterLogs.push(logList[i]);
      }
  }
  if(masterLogs.length == 0) {
      console.log("No master log.");
      return;
  }
  var latestLogFileName = masterLogs.sort().reverse()[0];
  viewLog(fs.readFileSync("log/" + latestLogFileName).toString().split("\n"));
  prompt(mainOptions);
}

function viewWorkerLogs() {
  var logList = fs.readdirSync("log");
  var masterLogs = [];
  for(var i=0;i<logList.length;i++) {
      if(logList[i].match(/^worker-[0-9]+\.log$/)) {
          masterLogs.push(logList[i]);
      }
  }
  if(masterLogs.length == 0) {
      console.log("No worker logs.");
      return;
  }
  var latestLogFileNames = masterLogs.sort().reverse().slice(0,5).reverse();
  var log = [];
  for(var i=0;i<latestLogFileNames.length;i++) {
      var rlog = fs.readFileSync("log/" + latestLogFileNames[i]).toString().split("\n");
      if(rlog[rlog.length-1] == "") rlog.pop();
      if(rlog[0] == "") rlog.shift();
      for(var j=0;j<rlog.length;j++) {
          log.push(rlog[j]);
      }
  }
  log = log.sort();
  viewLog(log);
  prompt(mainOptions);
}

function viewFilteredWorkerLogs(filter) {
  var logList = fs.readdirSync("log");
  var masterLogs = [];
  for(var i=0;i<logList.length;i++) {
      if(logList[i].match(/^worker-[0-9]+\.log$/)) {
          masterLogs.push(logList[i]);
      }
  }
  if(masterLogs.length == 0) {
      console.log("No worker logs.");
      return;
  }
  var latestLogFileNames = masterLogs.sort().reverse().slice(0,20).reverse();
  var log = [];
  for(var i=0;i<latestLogFileNames.length;i++) {
      var rlog = fs.readFileSync("log/" + latestLogFileNames[i]).toString().split("\n");
      if(rlog[rlog.length-1] == "") rlog.pop();
      if(rlog[0] == "") rlog.shift();
      for(var j=0;j<rlog.length;j++) {
          if(rlog[j].indexOf(filter) != -1) log.push(rlog[j]);
      }
  }
  log = log.sort();
  viewLog(log);
  prompt(mainOptions);
}

function viewFilteredWorkerLogsPrompt() {
var rl2 = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'filter> '
});
console.log("Input filter:");
rl2.prompt();
rl2.on('line', (line) => {
    rl2.close();
    viewFilteredWorkerLogs(line);
});
}

var mainOptions = [
  {name: "View latest master log", callback: viewMasterLogs},
  {name: "View 5 latest worker logs", callback: viewWorkerLogs},
  {name: "View filtered worker logs (latest 20 logs)", callback: viewFilteredWorkerLogsPrompt},
  {name: "Exit log viewer", callback: function(){console.log("Bye!");process.exit(0);}}
]

prompt(mainOptions);
