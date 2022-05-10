const { Terminal, applications } = require("./terminal");

const init = async (el) => {
  const term = new Terminal(el);
  await Promise.all(
    Object.values(applications).map(async (app) => {
      // const addon = await app();
      const created = await app.addon.create();
      term.loadAddon(created);
    })
  );
  return term;
};

module.exports = {
  applications,
  Instance: Terminal,
  init,
};
