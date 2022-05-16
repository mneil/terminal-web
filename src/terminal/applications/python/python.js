const { loadPyodide } = require("pyodide");

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
    await pyodide.loadPackage(["micropip"]);
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
      if (evt.line.startsWith("python -c")) {
        return this.runPython(evt.args.slice(1));
      }
      this.#terminal.emit("command.response", "command not implemented");
    });
  }

  async runPython(args) {
    const code = args
      .join(" ")
      .slice(1, -1)
      .split(/\\r|\\n/g)
      .join("\n");

    // loading packages is not working. Silent failure
    await this.#pyodide.loadPackagesFromImports(code, console.log, console.log).then(() => {});
    await this.#pyodide.runPythonAsync(code);
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
