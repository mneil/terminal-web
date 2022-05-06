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
      filename: "git-web.js",
      library: {
        name: "git-web",
        type: "umd",
      },
      globalObject: `(typeof self !== 'undefined' ? self : this)`,
    },
    externals: {
      ...(argv.mode === "production"
        ? {
            "git-web": "git",
          }
        : {}),
    },
    performance: {
      hints: false,
    },
    resolve: {
      alias: {
        // "git-web": path.resolve(__dirname, "utils/browser-cdk.js"),
        // "aws-sdk": path.resolve(__dirname, "utils/browser-aws.js"),
        // fs: "memfs",
        // esbuild: "esbuild-wasm",
      },
      fallback: {
        // process: require.resolve("process/browser"),
        // assert: require.resolve("assert/"),
        // util: require.resolve("util/"),
        // path: require.resolve("path-browserify"),
        // stream: require.resolve("stream-browserify"),
        // os: require.resolve("os-browserify/browser"),
        // crypto: require.resolve("crypto-browserify"),
        // zlib: require.resolve("browserify-zlib"),
      },
    },
    devServer: {
      static: [
        { directory: path.join(__dirname, "public") },
        // { directory: path.join(__dirname, "node_modules/aws-sdk/dist") },
        // { directory: path.join(__dirname, "node_modules/git-web/dist") },
      ],
      compress: true,
      port: 9000,
    },

    module: {
      rules: [
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
      ],
    },
  };
};
