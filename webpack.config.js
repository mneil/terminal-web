const fs = require("fs");
const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

const pyodideVersion = "0.20.0";
// Allow us to change the pyodide package name for publishing temporary packages
// ourselves without waiting for an official deployment. In most cases do
// not change this or worry about it.
const pyodidePackage = "pyodide";

module.exports = (env, argv) => {
  return {
    node: { global: true },
    mode: "development",
    entry: "./src/index.js",
    ...(argv.mode === "production"
      ? {
          optimization: {
            minimize: false,
          },
        }
      : { devtool: "inline-source-map" }),
    output: {
      path: path.join(__dirname, "dist"),
      filename: "terminal-web.js",
      library: {
        name: "terminal",
        type: "umd",
      },
      globalObject: `(typeof self !== 'undefined' ? self : this)`,
    },
    performance: {
      hints: false,
    },
    devServer: {
      static: [{ directory: path.join(__dirname, "public") }],
      compress: true,
      port: 9000,
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          { from: require.resolve(`${pyodidePackage}/distutils.tar`), to: "pyodide/distutils.tar" },
          { from: require.resolve(`${pyodidePackage}/packages.json`), to: "pyodide/packages.json" },
          { from: require.resolve(`${pyodidePackage}/pyodide_py.tar`), to: "pyodide/pyodide_py.tar" },
          {
            from: require.resolve(`${pyodidePackage}/pyodide.asm.js`),
            to: "pyodide/pyodide.asm.js",
            transform: {
              transformer: (input) => {
                return input
                  .toString()
                  .replace("new URL(indexURL", `new URL('https://cdn.jsdelivr.net/pyodide/v${pyodideVersion}/full/'`);
              },
            },
          },
          { from: require.resolve(`${pyodidePackage}/pyodide.asm.data`), to: "pyodide/pyodide.asm.data" },
          { from: require.resolve(`${pyodidePackage}/pyodide.asm.wasm`), to: "pyodide/pyodide.asm.wasm" },
        ],
      }),
    ],
    module: {
      // do not parse pyodide
      noParse: /pyodide\/.+\.js$/,
      rules: [
        /**
         * BEGIN PYTHON
         */
        // Remove pyodide globals. They are not necessary when using pyodide in webpack
        {
          test: /pyodide\/.+\.js$/,
          loader: "string-replace-loader",
          options: {
            multiple: [
              {
                search: "globalThis.loadPyodide=loadPyodide",
                replace: "({})",
              },
            ],
          },
        },
        /**
         * END PYTHON
         * BEGIN GIT
         */
        // Replace the string "lg2.wasm" in file lg2.js with a different "wasm-git/lg2.wasm"
        // This allows us to move the lg2.wasm file into a sub directory of dist to ensure
        // multiple wasm files don't collide.
        {
          test: /lg2\.js$/,
          loader: "string-replace-loader",
          options: {
            search: /[\w-\.\/]*\.wasm/g,
            replace: "wasm-git/lg2.wasm",
          },
          type: "asset/source",
        },
        // Replace the require call to "wasm-git/lg2" with our own internal module
        {
          test: /src\/terminal\/applications\/git\/worker\.js$/,
          loader: "string-replace-loader",
          options: {
            multiple: [
              {
                search: 'require("wasm-git/lg2")',
                replace: fs.readFileSync(path.resolve(__dirname, "webpack", "modules", "git.js"), "utf-8"),
              },
            ],
          },
        },
        // wasm files should not be processed but just be emitted and we want
        // to have their public URL. Move the wasm file to "wasm-git/lg2.wasm"
        {
          test: /lg2\.wasm$/,
          type: "asset/resource",
          generator: {
            filename: "wasm-git/lg2.wasm",
          },
        },
        /**
         * END GIT
         * BEGIN GENERAL
         */
        // load xterm styles
        {
          test: /\.css$/i,
          use: ["style-loader", "css-loader"],
        },
      ],
    },
  };
};

module.exports.pyodidePackage = pyodidePackage;
