describe("Terminal", () => {
  describe("History", () => {
    it("should have history", async () => {
      const factory = async (terminal = globalThis.terminal) => {
        const term = await terminal.init(document.getElementById("terminal"));
        term.xterm.focus();
        "hello world!\r".split("").forEach((key) => term.write({ key }));
        "foo bar\r".split("").forEach((key) => term.write({ key }));
        term.dispose();
        return term.history;
      };
      const result = await chai.assert.isFulfilled(page.evaluate(factory));
      chai.assert.sameMembers(result, ["hello world!", "foo bar"]);
    });
    it("should traverse to first element in history", async () => {
      const factory = async (terminal = globalThis.terminal) => {
        const term = await terminal.init(document.getElementById("terminal"));
        term.xterm.focus();
        "hello world!\r".split("").forEach((key) => term.write({ key }));
        term.write({ key: "" });
        "foo bar\r".split("").forEach((key) => term.write({ key }));

        // go up a bunch more than we have in history
        term.write({ key: "\x1B[A" });
        term.write({ key: "\x1B[A" });
        term.write({ key: "\x1B[A" });

        return new Promise((resolve) => {
          term.on("command", resolve);
          term.write({ key: "\r" });
          term.dispose();
        });
      };
      const result = await chai.assert.isFulfilled(page.evaluate(factory));
      chai.assert.deepEqual(result, { app: "hello", args: ["world!"], line: "hello world!" });
    });
    it("should traverse to last element in history", async () => {
      const factory = async (terminal = globalThis.terminal) => {
        const term = await terminal.init(document.getElementById("terminal"));
        term.xterm.focus();
        "hello world!\r".split("").forEach((key) => term.write({ key }));
        term.write({ key: "" });
        "foo bar\r".split("").forEach((key) => term.write({ key }));

        // go up a bunch more than we have in history
        term.write({ key: "\x1B[A" });
        term.write({ key: "\x1B[A" });
        term.write({ key: "\x1B[B" });

        return new Promise((resolve) => {
          term.on("command", resolve);
          term.write({ key: "\r" });
          term.dispose();
        });
      };
      const result = await chai.assert.isFulfilled(page.evaluate(factory));
      chai.assert.deepEqual(result, { app: "foo", args: ["bar"], line: "foo bar" });
    });
  });
});
