(() => {
  var Module = {
    print(txt) {
      Module.stdout && Module.stdout(txt);
    },
    printErr(txt) {
      Module.stderr && Module.stderr(txt);
    },
  };
  const mod = require("wasm-git/lg2");
  eval(mod);
  return Module;
})();
