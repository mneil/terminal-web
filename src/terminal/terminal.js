require("xterm/css/xterm.css");
const xterm = require("xterm");
const EventEmitter2 = require("eventemitter2");

/**
 * Terminal class creates an instance of xtermjs. Handles keyboard input, history, etc...
 *
 * Emits more complete events than the addon interfaces gives you access to for building integrations.
 * Emits:
 *  - command: When user enters a command. Get the full current line the user entered
 *
 * Listens:
 *  - command.response: Send data to write to the terminal
 */
class Terminal extends EventEmitter2 {
  #maxHistory = 1000;
  #hitoryPos = 0;
  #tempHistory = "";
  #newline = "\x1B[1;36m$ \x1B[0m";
  #term;
  #addons = [];
  line = "";
  history = [];

  get xterm() {
    return this.#term;
  }

  set newline(value) {
    this.#newline = value;
  }

  constructor(el) {
    super();
    this.#term = new xterm.Terminal({
      cursorBlink: "block",
    });
    this.#term.open(el);
    this.#term.write(this.#newline);
    this.on("command.response", this.writeResponse);

    this.#term.onKey((evt) => {
      console.log(evt);
      if (evt.domEvent.code === "Enter") {
        return this.enter();
      }
      if (evt.domEvent.code === "Backspace") {
        return this.backspace();
      }
      if (evt.domEvent.code === "ArrowUp") {
        return this.toHistory(-1);
      }
      if (evt.domEvent.code === "ArrowDown") {
        return this.toHistory(1);
      }
      if (evt.domEvent.code === "KeyL" && evt.domEvent.ctrlKey) {
        return this.#term.clear();
      }
      this.line += evt.key;
      this.#term.write(evt.key);
    });
  }

  enter() {
    // reset history scrolling
    this.#hitoryPos = 0;
    this.#tempHistory = "";
    // emit the command
    const [app, ...args] = this.line.split(" ");
    const addon = this.#addons.filter((addon) => addon.application === app);
    if (addon.length) {
      this.emit(app, { args, line: this.line }); // helper specific emit
    } else {
      this.commandNotFound();
    }
    this.emit("command", { app, args, line: this.line }); // global emit for other objects
    // store non-empty lines in this.history
    this.line.trim() && this.history.push(this.line);
    // FIFO queue hitory items after max this.history
    this.history.length > this.#maxHistory && this.history.splice(-this.#maxHistory, this.#maxHistory);
    // reset the current line
    this.line = "";
    this.#term.writeln("");
    this.#term.write(this.#newline);
  }
  /**
   * toHistory takes an integer -1 or 1 to advance or rewind
   * the history. This method clears the current lines and
   * retrieves commands from history.
   *
   * @param {*} direction
   */
  toHistory(direction) {
    if (!this.#tempHistory) {
      this.#tempHistory = this.line;
    }
    this.clearLine();
    this.#hitoryPos += direction;
    if (this.#hitoryPos < -this.history.length) {
      // at the beginning
      this.#hitoryPos = -this.history.length;
    }
    if (this.#hitoryPos > -1) {
      // at the end - restore user's temporary work
      this.#hitoryPos = -1;
      this.line = this.#tempHistory;
      return this.#term.write(this.line);
    }
    this.line = this.history[this.history.length + this.#hitoryPos];
    this.#term.write(this.line);
  }

  commandNotFound() {
    this.#term.writeln("");
    this.#term.write(`${this.line}: command not found`);
  }
  /**
   * Clears the current line
   */
  clearLine() {
    this.#term.write("\x1b[2K\r");
    this.#term.write(this.#newline);
  }

  backspace() {
    if (this.line) {
      this.line = this.line.slice(0, this.line.length - 1);
      this.#term.write("\b \b");
    }
  }

  writeResponse(data) {
    this.#term.writeln("");
    this.#term.write(data);
  }

  dispose() {
    this.#addons.forEach((addon) => addon.dispose());
    this.#term.dispose();
  }

  /**
   * Add an addon to xterm. Except instead of the term
   * we activate with an instance of this terminal
   *
   * Addons must have a specific shape
   *
   * @param {} addon
   * @see https://xtermjs.org/docs/guides/using-addons/
   */
  loadAddon(addon) {
    this.#addons.push(addon);
    addon.activate(this);
    // this.#term.loadAddon(addon);
  }
}

module.exports = {
  Terminal,
};
