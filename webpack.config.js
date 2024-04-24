const CopyPlugin = require("copy-webpack-plugin");
const path = require("path");
const nodeExternals = require("webpack-node-externals");

module.exports = {
  target: "node", // Ensures that built-in modules like fs are not bundled
  externals: [nodeExternals()], // Ignores node_modules

  entry: "./index.js", // Entry point
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js", // Output bundle
  },

  module: {
    rules: [
      {
        test: /\.js$/, // Apply babel-loader for JS files
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"], // Preset used for older browsers
          },
        },
      },
    ],
  },

  resolve: {
    extensions: [".js"], // Automatically resolve these extensions
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "views", to: "views" },
        { from: "models", to: "models" },
      ],
    }),
  ],
};
