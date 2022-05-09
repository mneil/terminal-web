const { Terminal, applications } = require("./terminal");

const init = async (el) => {
  const term = new Terminal(el);
  await Promise.all(Object.values(applications).map(async (app) => term.loadAddon(await app.create())));
  return term;
};

module.exports = {
  applications,
  Instance: Terminal,
  init,
};
