const worker = new Worker(new URL("./worker.js", import.meta.url));

class GitAddon {
  #disposables = [];
  application = "git";
  #terminal;

  static async create() {
    await new Promise((resolve) => {
      console.log("creating git addon");
      worker.postMessage({ cmd: "initialize" });
      worker.onmessage = ({ data: { initialize } }) => {
        console.log(initialize);
        resolve();
      };
    });
    return new GitAddon();
  }
  /**
   * Required for addon. Creates a new instance of this addon
   * @param {*} terminal
   */
  activate(terminal) {
    this.#terminal = terminal;
    this.#terminal.on(this.application, (evt) => {
      worker.postMessage({ cmd: "git", args: evt.args });
    });
    worker.onmessage = ({ data: { stdout, stderr } }) => {
      this.#terminal.emit("command.response", stdout || stderr);
    };
    //this.#disposables.push(terminal.onData((d) => console.log(d)));
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

module.exports = GitAddon;
