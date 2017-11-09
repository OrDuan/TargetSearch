const MinifyPlugin = require("babel-minify-webpack-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ZipPlugin = require('zip-webpack-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const webpack = require('webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin');

// TODO automate the CRX file build:
// https://developer.chrome.com/extensions/external_extensions
// https://developer.chrome.com/extensions/crx
let context = './src/js/context/';
module.exports = {
  entry: {
    app: [context + 'jquery.js', context + 'jquery-color.js', context + 'context.js'],
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
    new CleanWebpackPlugin(['build']),
    new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: "jquery"
    }),
    new CopyWebpackPlugin([
      {from: 'src/manifest-prod.json', to: 'manifest.json'},
      'src/styles.css',
      {from: 'src/icons', to: 'icons/'},
    ]),
    new MinifyPlugin(true),
    new UglifyJSPlugin({uglifyOptions: {compress: {drop_console: true}}}),
    new ZipPlugin({filename: 'build.zip'}),
  ],
  stats: {
    colors: true
  },
  devtool: 'none' // https://github.com/webpack/webpack/issues/5931 - webpack bug, might be fix in the future
};
