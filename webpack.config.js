const MinifyPlugin = require("babel-minify-webpack-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');
const glob = require("glob");

module.exports = {
  entry: {
    context: glob.sync('./src/js/context/**.js'),
    background: './src/js/background.js'
  },
  output: {
    filename: '[name].js',
    path: __dirname + '/build'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015']
        }
      }
    ]
  },
  plugins: [
    new CopyWebpackPlugin([
      'src/manifest.json',
      'src/styles.css',
      {from: 'src/icons', to: 'icons/'},
    ]),
    new MinifyPlugin(true)
  ],
  stats: {
    colors: true
  },
  devtool: 'none' // https://github.com/webpack/webpack/issues/5931 - webpack bug, might be fix in the future
};
