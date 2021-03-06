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
      static: [
        { directory: path.join(__dirname, "public") },
        // { directory: path.join(__dirname, "node_modules/aws-sdk/dist") },
        // { directory: path.join(__dirname, "node_modules/terminal-web/dist") },
      ],
      compress: true,
      port: 9000,
    },
    module: {
      rules: [
        // {
        //   test: /wasm-git.*$/,
        //   use: [
        //     {
        //       loader: path.resolve("./webpack/loaders/wasm-loader.js"),
        //       options: {
        //         /* ... */
        //       },
        //     },
        //   ],
        // },
        // Emscripten JS files define a global. With `exports-loader` we can
        // load these files correctly (provided the global’s name is the same
        // as the file name).
        {
          test: /lg2\.js$/,
          loader: "string-replace-loader",
          options: {
            search: /[\w-\.\/]*\.wasm/g,
            replace: "wasm-git/lg2.wasm",
          },
          type: "asset/source",
        },
        {
          test: /src\/terminal\/applications\/git\.js$/,
          loader: "string-replace-loader",
          options: {
            multiple: [
              {
                search: 'require("wasm-git/lg2")',
                replace() {
                  const web = `\
              (() => {
                var Module = {
                  print(txt) {Module.stdout && Module.stdout(txt)},
                  printErr(txt) {Module.stderr && Module.stderr(txt)},
                };
                const mod = require("wasm-git/lg2");
                eval(mod);
                return Module;
              })()
              `;
                  return web.replace(/\n/g, "");
                },
              },
            ],
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

        // xterm styles
        {
          test: /\.css$/i,
          use: ["style-loader", "css-loader"],
        },
      ],
    },
  };
};
