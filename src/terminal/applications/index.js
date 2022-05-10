// dynamic code splitting
// function git() {
//   return import("./git")
//     .then(({ default: GitAddon }) => {
//       return GitAddon;
//     })
//     .catch((error) => console.log("An error occurred while loading the component", error));
// }

const git = require("./git");

module.exports = {
  git,
};
