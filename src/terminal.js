require("xterm/css/xterm.css");
const xterm = require("xterm");

class Terminal {
  #maxHistory = 1000;
  #newline = "$ ";
  #term;
  line = "";
  history = [];
  constructor(el) {
    this.#term = new xterm.Terminal({
      cursorBlink: "block",
    });
    this.#term.open(el);
    this.#term.write("Get \x1B[1;3;31mrekt\x1B[0m $ ");

    this.#term.onKey((evt) => {
      if (evt.domEvent.code === "Enter") {
        return this.enter();
      }
      if (evt.domEvent.code === "Backspace") {
        return this.backspace();
      }
      this.line += evt.key;
      this.#term.write(evt.key);
    });
  }

  enter() {
    // store non-empty lines in this.history
    this.line.trim() && this.history.push(this.line);
    // FIFO queue hitory items after max this.history
    this.history.length > this.#maxHistory && this.history.splice(-this.#maxHistory, this.#maxHistory);
    // reset the current line
    this.line = "";
    this.#term.writeln("");
    this.#term.write(this.#newline);
  }

  backspace() {
    if (this.line) {
      this.line = this.line.slice(0, this.line.length - 1);
      this.#term.write("\b \b");
    }
  }
}

module.exports = {
  Terminal,
};
