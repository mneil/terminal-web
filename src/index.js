const { Terminal } = require("./terminal");
const lg = require("wasm-git/lg2");
require("wasm-git/lg2.wasm");

lg.onRuntimeInitialized = () => {
  console.log("init");

  const term = new Terminal(document.getElementById("terminal"));
  term.on("command", (evt) => {
    if (evt.app === "git") {
      console.log("calling git with", evt.args);
      lg.callMain(evt.args);
    }
  });
  const FS = lg.FS;
  const MEMFS = FS.filesystems.MEMFS;

  FS.mkdir("/app");
  FS.mount(MEMFS, {}, "/app");
  FS.chdir("/app");

  FS.writeFile("/home/web_user/.gitconfig", "[user]\n" + "name = Test User\n" + "email = test@example.com");

  // clone a repository from github
  //lg.callMain(["clone", "https://github.com/torch2424/made-with-webassembly.git", "made-with-webassembly"]);
  //console.log(FS.readdir("made-with-webassembly"));
  //FS.chdir("made-with-webassembly");
};
