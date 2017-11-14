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
  let copyWebpackPlugin = new CopyWebpackPlugin([
    'src/manifest.json',
    'src/css/popup-styles.css',
    'src/css/styles.css',
    'src/html/popup.html',
    {from: 'src/media', to: 'media/'},
    {from: 'src/icons', to: 'icons/'},
  ]);

  if (env.PROJECT_ENV === 'production') {
    plugins = [
      new CleanWebpackPlugin(['build', 'build.crx']),
      new webpack.ProvidePlugin({
        $: "jquery",
        jQuery: "jquery"
      }),
      copyWebpackPlugin,
      new MinifyPlugin(true),
      new UglifyJSPlugin({uglifyOptions: {compress: {drop_console: true}}}),
      new ZipPlugin({path: '../releases/', filename: `${new Date().toISOString().substr(0, 16)}.zip`}),
    ];
  } else {
    plugins = [
      new ReloadExtensionsPage(),
      copyWebpackPlugin,
      new webpack.ProvidePlugin({
        $: "jquery",
        jQuery: "jquery"
      }),
    ];
  }
  return {
    entry: {
      app: ['./src/js/context/jquery-color.js', './src/js/storage-manager.js', './src/js/context/context.js'],
      popup: ['./src/js/popup.js'],
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
            presets: ['es2017', 'stage-2']
          }
        }
      ]
    },
    plugins: plugins,
    stats: {
      colors: true
    },
    watchOptions: {
      poll: 300,
      ignored: /node_modules/
    },
    devtool: env.PROJECT_ENV === 'production' ? 'none' : 'source-map'
  }
};
