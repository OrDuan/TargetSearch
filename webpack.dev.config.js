const CopyWebpackPlugin = require('copy-webpack-plugin')
const webpack = require('webpack')
const {ReloadExtensionsPage} = require('./webpackPlugins')

// TODO automate the CRX file build:
// https://developer.chrome.com/extensions/external_extensions
// https://developer.chrome.com/extensions/crx
// https://github.com/OctoLinker/browser-extension/blob/master/webpack.config.js
// https://www.simonmweber.com/2016/07/18/launching-a-chrome-extension-part-2-analytics-and-error-reporting.html

// How to run on dev machine:
// 1. Install Chromix-Too CLI, and extension, more info:
// https://github.com/smblott-github/chromix-too#getting-started
// 2. Run the server in the background: `chromix-too-server`
// 3. Open extensions page in chrome and leave it open: chrome://extensions/
// 4. Run `npm run watch`
// 5. In this page, click "Load unpacked extensions..." and pick the `build` directory
//
// Every time you make a change, the extension will be updated


module.exports = env => {

  return {
    entry: {
      app: ['./src/assets/js/context/jquery-color.js', './src/assets/js/context/context.js'],
      popup: ['./src/assets/js/popup.js'],
      background: ['./src/assets/js/background.js'],
    },
    output: {
      filename: '[name].js',
      path: __dirname + '/build',
    },
    module: {
      loaders: [
        {
          test: /\.js$/,
          loader: 'babel-loader',
          query: {
            presets: ['es2017', 'stage-2'],
          },
        },
      ],
    },
    plugins: [
      new CopyWebpackPlugin([
        'src/manifest.json',
        {from: 'src/assets', to: 'assets/', ignore: ['*.js']},
      ]),
      new webpack.DefinePlugin({
        'process.env': {NODE_ENV: JSON.stringify(env.NODE_ENV || 'development')},
      }),
      new webpack.ProvidePlugin({
        $: 'jquery',
        jQuery: 'jquery',
      }),
      new ReloadExtensionsPage(),

    ],
    node: {
      console: true,
      fs: 'empty',
      module: 'empty',
    },
    stats: {
      colors: true,
    },
    watchOptions: {
      poll: 300,
      ignored: /node_modules/,
    },
    devtool: 'source-map',
  }
}
