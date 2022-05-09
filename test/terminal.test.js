describe("Terminal", () => {
  it("should support async constructs with a 'compose' method", async () => {
    const factory = async (terminal = globalThis.terminal) => {
      const term = await terminal.init(document.getElementById("terminal"));
      term.xterm.focus();
      "hello world!".split("").forEach((key) => term.write({ key }));
      term.write({ key: "\r" });
      return term.history;
    };
    const result = await chai.assert.isFulfilled(page.evaluate(factory));
    chai.assert.sameMembers(result, ["hello world!"]);
  });
});
