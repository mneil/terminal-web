const lg = require("wasm-git/lg2");
require("wasm-git/lg2.wasm");

self.onmessage = ({ data: { cmd, args } }) => {
  if (cmd === "initialize") {
    return initialize.then(() => {
      self.postMessage({
        initialize: true,
      });
    });
  }
  if (cmd === "git") {
    lg.callMain(args);
  }
};

const initialize = new Promise((resolve, reject) => {
  lg.onRuntimeInitialized = () => {
    const FS = lg.FS;
    const MEMFS = FS.filesystems.MEMFS;

    FS.mkdir("/app");
    FS.mount(MEMFS, {}, "/app");
    FS.chdir("/app");

    FS.writeFile("/home/web_user/.gitconfig", "[user]\n" + "name = Test User\n" + "email = test@example.com");

    lg.stdout = (printed) => {
      self.postMessage({
        stdout: printed,
      });
    };
    lg.stderr = (printed) => {
      self.postMessage({
        stdout: stderr,
      });
    };

    resolve();
  };
});
