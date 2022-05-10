const fs = require("fs");
const path = require("path");

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
    module: {
      rules: [
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
        // load xterm styles
        {
          test: /\.css$/i,
          use: ["style-loader", "css-loader"],
        },
      ],
    },
  };
};
