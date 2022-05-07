const { urlToRequest } = require("loader-utils");
const { validate } = require("schema-utils");

const PLUGIN_NAME = "WasmModuleLoader";

// schema for options object
const schema = {
  type: "object",
  properties: {
    test: {
      type: "string",
    },
  },
};

const rules = [
  // Emscripten JS files define a global. With `exports-loader` we can
  // load these files correctly (provided the global’s name is the same
  // as the file name).
  {
    test: /lg2\.js$/,
    loader: "string-replace-loader",
    options: {
      search: /[\w-\.\/]*\.wasm/g,
      replace() {
        return `wasm-git/lg2.wasm`;
      },
    },
    type: "asset/source",
  },
  {
    test: /src\/index\.js$/,
    loader: "string-replace-loader",
    options: {
      search: 'require("wasm-git/lg2")',
      replace(match, p1, offset, string) {
        const web = `\
        (() => {
          const mod = require("wasm-git/lg2");
          eval(mod);
          return Module;
        })()
        `;
        return web.replace(/\n/g, "");
      },
    },
  },
  // wasm files should not be processed but just be emitted and we want
  // to have their public URL.
  {
    test: /lg2\.wasm$/,
    type: "asset/resource",
    generator: {
      filename: "wasm-git/lg2.wasm",
    },
  },
];

module.exports = function (source) {
  // const defaultOptions = {
  //   outputFile: "assets.md",
  // };
  // const options = { ...defaultOptions, ...this.getOptions() };
  // validate(schema, options, {
  //   name: PLUGIN_NAME,
  //   baseDataPath: "options",
  // });

  // if (this.resourcePath.endsWith(".js")) {
  // } else {
  //   return source;
  // }

  console.log("The request path", urlToRequest(this.resourcePath));

  // loader: "string-replace-loader",
  //   options: {
  //     search: /[\w-\.\/]*\.wasm/g,
  //     replace() {
  //       return `wasm-git/lg2.wasm`;
  //     },
  //   },
  //   type: "asset/source",

  // Apply some transformations to the source...

  return typeof source === "string" ? source : JSON.stringify(source);
};
