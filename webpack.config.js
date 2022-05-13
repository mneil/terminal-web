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
          { from: require.resolve(`wasm-git/lg2.wasm`), to: "wasm-git/lg2.wasm" },
        ],
      }),
    ],
    module: {
      // do not parse pyodide/pyodide.js or git-wasm/lg2.js
      noParse: /pyodide\/pyodide\.js|wasm-git\/lg2\.js/,
      rules: [
        /**
         * BEGIN PYTHON
         */
        // Remove pyodide globals. They are not necessary when using pyodide in webpack
        {
          test: /pyodide\/pyodide\.js$/,
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
          test: /wasm-git\/lg2\.js$/,
          use: [
            {
              loader: "string-replace-loader",
              options: {
                search: /[\w-\.\/]*\.wasm/g,
                replace: "wasm-git/lg2.wasm",
              },
            },
            {
              loader: "string-replace-loader",
              options: {
                search: 'var Module=typeof Module!="undefined"?Module:{}',
                replace:
                  "const Module = {print(txt) {Module.stdout && Module.stdout(txt);},printErr(txt) {Module.stderr && Module.stderr(txt);}}",
              },
            },
            {
              loader: "exports-loader",
              options: {
                type: "commonjs",
                exports: { name: "Module", alias: "lg" },
              },
            },
          ],
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
