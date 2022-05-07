const { Terminal, applications } = require("./terminal");

const init = async () => {
  const term = new Terminal(document.getElementById("terminal"));
  Promise.all(Object.values(applications).map(async (app) => term.loadAddon(await app.create())));
};

init().then(() => {
  console.log("ready");
});
