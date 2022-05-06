console.log("loading");
const esm = require("wasm-git/lg2");

console.log(esm);
esm.ready = (lg) => {
  console.log("loaded", lg);
};
// console.log(lgpath);
// lg.onRuntimeInitialized = () => {
//   console.log("init");
//   const FS = lg.FS;
//   const MEMFS = FS.filesystems.MEMFS;

//   FS.mkdir("/working");
//   FS.mount(MEMFS, {}, "/working");
//   FS.chdir("/working");

//   FS.writeFile("/home/web_user/.gitconfig", "[user]\n" + "name = Test User\n" + "email = test@example.com");

//   // clone a repository from github
//   lg.callMain(["clone", "https://github.com/torch2424/made-with-webassembly.git", "made-with-webassembly"]);
//   FS.readdir("made-with-webassembly");
// };
