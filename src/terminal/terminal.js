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
  /**
   * Number of commands to store in history
   */
  #maxHistory = 1000;
  /**
   * Current position of the history when user is pressing Up/Down
   */
  #hitoryPos = 0;
  /**
   * Actual history of commands. Lines are added to the history when Enter is pressed
   */
  #history = [];
  /**
   * Contents of the current line when user starts going through the history.
   * For example, I start to type `$ foo` then press Up. When user presses
   * down we can give them `$ foo` again even though `$ foo` is not yet in history.
   */
  #tempHistory = "";
  /**
   * Start of every new line when user presses Enter
   */
  #newline = "\x1B[1;36m$ \x1B[0m";
  /**
   * Reference to the underlying xterm object
   */
  #term;
  /**
   * Registered addons
   */
  #addons = [];
  /**
   * Contents of the current line
   */
  line = "";

  get xterm() {
    return this.#term;
  }

  get history() {
    return this.#history;
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
      this.write({ key: evt.key });
    });

    this.#setupPasting(el);
  }

  #setupPasting(el) {
    // prevent context menu
    el.addEventListener(
      "contextmenu",
      (ev) => {
        ev.preventDefault();
        return false;
      },
      false
    );
    el.addEventListener(
      "mouseup",
      (ev) => {
        ev.preventDefault();
        if (ev.button == 2) {
          // right click
          navigator.clipboard
            .readText()
            .then((text) => {
              console.log(text.split(""));
              text.split("").forEach((key) => this.write({ key }));
            })
            .catch((err) => {
              console.error("Failed to read clipboard contents: ", err);
            });
          return false;
        }
        if (ev.button == 0) {
          // left click
          navigator.clipboard.writeText(this.#term.getSelection());
          this.#term.clearSelection();
          return;
        }
        return false;
      },
      false
    );
  }

  /**
   * Write to the terminal. This helper method is basically the xterm write
   * but handles specific keycodes for history, backspace, enter, etc...
   *
   * @param {object} evt
   * @param {string} evt.key
   * @returns
   */
  write(evt) {
    if (evt.key === "\r" || evt.key === "\n") {
      return this.enter();
    }
    if (evt.key === "x7F") {
      return this.backspace();
    }
    if (evt.key === "\x1B[A") {
      return this.toHistory(-1);
    }
    if (evt.key === "\x1B[B") {
      return this.toHistory(1);
    }
    if (evt.key === "\f") {
      this.#term.clear();
      return this.clearLine();
    }
    this.line += evt.key;
    this.#term.write(evt.key);
  }
  /**
   * Enter, newline, what to do when users press enter
   */
  enter() {
    // reset history scrolling
    this.#hitoryPos = 0;
    // clear temporary history
    this.#tempHistory = "";
    // emit the command
    if (this.line.trim()) {
      const [app, ...args] = this.line.split(" ");
      const addon = this.#addons.filter((addon) => addon.application === app);
      if (addon.length) {
        this.emit(app, { args, line: this.line }); // helper specific emit
      } else {
        this.commandNotFound(app);
      }
      this.emit("command", { app, args, line: this.line }); // global emit for other objects
    }
    // store non-empty lines in this.#history
    this.line.trim() && this.#history.push(this.line);
    // FIFO queue hitory items after max this.#history
    this.#history.length > this.#maxHistory && this.#history.splice(-this.#maxHistory, this.#maxHistory);
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
    if (this.#hitoryPos < -this.#history.length) {
      // at the beginning
      this.#hitoryPos = -this.#history.length;
    }
    if (this.#hitoryPos > -1) {
      // at the end - restore user's temporary work
      this.#hitoryPos = -1;
      this.line = this.#tempHistory;
      return this.#term.write(this.line);
    }
    this.line = this.#history[this.#history.length + this.#hitoryPos];
    this.#term.write(this.line);
  }
  /**
   * Handle command not found. Command not found is ran when
   * user presses enter and no addons match the first argument
   * on the current line. If you are listening to the global
   * command events to add your own commands outside of addons then
   * you can also receive the command.noFound event and call clearLine
   * to remove the error message for best UX.
   */
  commandNotFound(app) {
    this.#term.writeln("");
    const msg = `${app}: command not found`;
    this.#term.write(msg);
    this.emit("command.notFound", msg);
  }
  /**
   * Clears the current line
   */
  clearLine() {
    this.#term.write("\x1b[2K\r");
    this.#term.write(this.#newline);
  }
  /**
   * Clear previous character on the current line
   */
  backspace() {
    if (this.line) {
      this.line = this.line.slice(0, this.line.length - 1);
      this.#term.write("\b \b");
    }
  }
  /**
   * Write data to the terminal outside of history. This command is
   * useful for pasting multi-line returns from running commands.
   * @param {*} data
   */
  writeResponse(data) {
    this.#term.writeln("");
    this.#term.write(data);
  }
  /**
   * Destroy this instance of the terminal and all registered addons
   */
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
  }
}

module.exports = {
  Terminal,
};
