const MinifyPlugin = require("babel-minify-webpack-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ZipPlugin = require('zip-webpack-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const webpack = require('webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const {exec} = require('child_process');

// TODO automate the CRX file build:
// https://developer.chrome.com/extensions/external_extensions
// https://developer.chrome.com/extensions/crx
// https://github.com/OctoLinker/browser-extension/blob/master/webpack.config.js
let context = './src/js/context/';


// How to run on dev machine:
// 1. Install Chromix-Too CLI, and extension, more info:
// https://github.com/smblott-github/chromix-too#getting-started
// 2. Run the server in the background: `chromix-too-server`
// 3. Open extensions page in chrome and leave it open: chrome://extensions/
// 4. Run `npm run watch`
// 5. In this page, click "Load unpacked extensions..." and pick the `build` directory
//
// Every time you make a change, the extension will be updated


class ReloadExtensionsPage {
  apply(compiler) {
    compiler.plugin('done', function () {
      exec('chromix-too reload chrome://extensions/', (err, stdout, stderr) => {
        if (err || stderr) {
          console.log(err);
          console.log(stderr);
        }
      });
    });
  }
}

module.exports = env => {
  let plugins = [];
  if (env.PROJECT_ENV === 'production') {
    plugins = [
      new CleanWebpackPlugin(['build', 'build.crx']),
      new webpack.ProvidePlugin({
        $: "jquery",
        jQuery: "jquery"
      }),
      new CopyWebpackPlugin([
        {from: 'src/manifest.json', to: 'manifest.json'},
        'src/styles.css',
        {from: 'src/icons', to: 'icons/'},
      ]),
      new MinifyPlugin(true),
      new UglifyJSPlugin({uglifyOptions: {compress: {drop_console: true}}}),
      new ZipPlugin({filename: 'build.zip'}),
    ];
  } else {
    plugins = [
      new ReloadExtensionsPage(),
      new CopyWebpackPlugin([
        'src/manifest.json',
        'src/styles.css',
        {from: 'src/icons', to: 'icons/'},
      ]),
      new webpack.ProvidePlugin({
        $: "jquery",
        jQuery: "jquery"
      }),
    ];
  }
  return {
    entry: {
      app: [context + 'jquery-color.js', context + 'context.js'],
      background: './src/js/background.js'
    },
    output: {
      filename: '[name].js',
      path: __dirname + '/build'
      // path: __dirname + env.PROJECT_ENV === 'production' ? '/build' : '/dev'
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
    plugins: plugins,
    stats: {
      colors: true
    },
    watchOptions: {
      poll: 100,
      ignored: /node_modules/
    },
    devtool: env.PROJECT_ENV === 'production' ? 'none' : 'source-map'
  }
};
