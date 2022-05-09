const lg = require("wasm-git/lg2");
require("wasm-git/lg2.wasm");

const INITIALIZED = async () => {
  return new Promise((resolve, reject) => {
    lg.onRuntimeInitialized = () => {
      const FS = lg.FS;
      const MEMFS = FS.filesystems.MEMFS;

      FS.mkdir("/app");
      FS.mount(MEMFS, {}, "/app");
      FS.chdir("/app");

      FS.writeFile("/home/web_user/.gitconfig", "[user]\n" + "name = Test User\n" + "email = test@example.com");
      resolve();
    };
  });
};
class GitAddon {
  #disposables = [];
  application = "git";
  #terminal;

  static async create() {
    await INITIALIZED();
    return new GitAddon();
  }
  /**
   * Required for addon. Creates a new instance of this addon
   * @param {*} terminal
   */
  activate(terminal) {
    this.#terminal = terminal;
    this.#terminal.on(this.application, (evt) => {
      lg.callMain(evt.args);
    });
    // todo: Weak sauce. Cannot support multiple terminal instances
    lg.stdout = (printed) => {
      this.#terminal.emit("command.response", printed);
    };
    lg.stderr = (printed) => {
      this.#terminal.emit("command.response", printed);
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
