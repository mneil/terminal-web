const { loadPyodide } = require("pyodide");

// self.onmessage = ({ data: { cmd, args } }) => {
//   if (cmd === "initialize") {
//     return initialize.then(() => {
//       self.postMessage({
//         initialize: true,
//       });
//     });
//   }
//   if (cmd === "python") {
//     pyodide.runPython("1 + 2");
//   }
// };

class PythonAddon {
  #disposables = [];
  application = "python";
  #terminal;
  #pyodide;

  set pyodide(pyodide) {
    this.#pyodide = pyodide;
  }

  constructor(pyodide) {
    this.#pyodide = pyodide;
  }

  static async create() {
    const internalPyodide = new PythonAddon();
    console.log("creating python addon");
    const config = {
      fillStdLib: true,
      indexURL: `${window.location.origin}/pyodide`,
      stderr: internalPyodide.stderr.bind(internalPyodide),
      stdout: internalPyodide.stdout.bind(internalPyodide),
    };
    const pyodide = await loadPyodide(config);
    internalPyodide.pyodide = pyodide;
    return internalPyodide;
  }

  stdout(msg) {
    this.#terminal && this.#terminal.emit("command.response", msg);
  }

  stderr(msg) {
    this.#terminal && this.#terminal.emit("command.response", msg);
  }

  /**
   * Required for addon. Creates a new instance of this addon
   * @param {*} terminal
   */
  activate(terminal) {
    this.#terminal = terminal;
    this.#terminal.on(this.application, (evt) => {
      this.#pyodide.runPythonAsync("print('hello world')").then(() => {
        this.#terminal.emit("command.response", "");
      });
    });
  }
  /**
   * Required for addon. Clean up memory
   */
  dispose() {
    this.#terminal = undefined;
    this.#disposables.forEach((d) => d.dispose());
    this.#disposables.length = 0;
  }
}

module.exports = PythonAddon;
