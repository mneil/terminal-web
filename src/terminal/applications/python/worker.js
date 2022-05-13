const { loadPyodide } = require("pyodide");

let pyodide;

self.onmessage = ({ data: { cmd, args } }) => {
  if (cmd === "initialize") {
    return initialize.then(() => {
      self.postMessage({
        initialize: true,
      });
    });
  }
  if (cmd === "python") {
    pyodide.runPython("1 + 2");
  }
};

const initialize = new Promise(async (resolve, reject) => {
  const config = { fillStdLib: true, indexURL: `${window.location.origin}/pyodide` };
  pyodide = await loadPyodide(config);
  resolve();

  // lg.onRuntimeInitialized = () => {
  //   const FS = lg.FS;
  //   const MEMFS = FS.filesystems.MEMFS;

  //   FS.mkdir("/app");
  //   FS.mount(MEMFS, {}, "/app");
  //   FS.chdir("/app");

  //   FS.writeFile("/home/web_user/.gitconfig", "[user]\n" + "name = Test User\n" + "email = test@example.com");

  //   lg.stdout = (printed) => {
  //     self.postMessage({
  //       stdout: printed,
  //     });
  //   };
  //   lg.stderr = (printed) => {
  //     self.postMessage({
  //       stdout: stderr,
  //     });
  //   };

  //   resolve();
  // };
});
