const MinifyPlugin = require('babel-minify-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const ZipPlugin = require('zip-webpack-plugin')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')
const webpack = require('webpack')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const SentryPlugin = require('webpack-sentry-plugin')
const chalk = require('chalk');

module.exports = env => {
  const releaseStamp = new Date().toISOString().substr(0, 16)
  let options = {
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
      new CleanWebpackPlugin(['build', 'build.crx']),
      new webpack.ProvidePlugin({
        $: 'jquery',
        jQuery: 'jquery',
      }),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify('production'),
        'process.env.RELEASE_STAMP': JSON.stringify(releaseStamp),
      }),
      new CopyWebpackPlugin([
        'src/manifest.json',
        'src/html/popup.html',
        {from: 'src/assets', to: 'assets/', ignore: ['*.js']},
      ]),
      new UglifyJSPlugin({
        uglifyOptions: {compress: {drop_console: true}},
        sourceMap: true,
      }),
      new MinifyPlugin(true),
    ],
    stats: {
      colors: true,
    },
    node: {
      console: true,
      fs: 'empty',
      module: 'empty',
    },
    devtool: 'source-map',
  }
  if (env.DEPLOY) {
    console.log(chalk.black.bgRed('############### DEPLOYING ###############'))
    console.log(`Release stamp: ${releaseStamp}`)
    options.plugins = options.plugins.concat([
      new ZipPlugin({path: '../releases/', filename: `${releaseStamp}.zip`}),
      new SentryPlugin({
        organization: 'or-duan',
        project: 'extension-js',
        apiKey: '',
        release: releaseStamp,
      }),
    ])
  }
  return options
}
