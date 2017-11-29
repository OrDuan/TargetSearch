const MinifyPlugin = require('babel-minify-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const ZipPlugin = require('zip-webpack-plugin')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')
const webpack = require('webpack')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const chalk = require('chalk')
const readlineSync = require('readline-sync')
const fs = require('fs')
const secrets = require('./secrets.json')
const {SentryPlugin, DeleteSourceMapsPlugin, gitTagRelease, uploadToWebstore} = require('./webpackPlugins')

process.on('unhandledRejection', r => console.error(r))

function handleVersions(oldVersion) {
  let newVersion = readlineSync.question(`Current version is: ${chalk.green(oldVersion)}.\nWhat's the new version? `)
  let splitVersion = oldVersion.split('.')

  if (newVersion === '.') {
    let minor = parseInt(splitVersion[2])
    newVersion = [splitVersion[0], splitVersion[1], ++minor].join('.')
  } else if (splitVersion.length - 1 !== 2 || newVersion === oldVersion) {
    throw new Error('Malformed version format, should be X.X.X and different from last version.')
  }
  return newVersion
}

module.exports = env => {
  let manifest = JSON.parse(fs.readFileSync('./src/manifest.json', 'utf8'))

  let baseDir = __dirname
  let options = {
    entry: {
      app: ['./src/assets/js/context/jquery-color.js', './src/assets/js/context/context.js'],
      popup: ['./src/assets/js/popup.js'],
      background: ['./src/assets/js/background.js'],
    },
    output: {
      filename: '[name].js',
      path: baseDir + '/build',
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
        'console.log': function () {},  // Not sure why the uglify isn't working
      }),
      new CopyWebpackPlugin([
        'src/manifest.json',
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
    console.log(chalk.black.bgRed('############### DEPLOYING ###############\n'))

    let newVersion = handleVersions(manifest.version)
    manifest.version = newVersion
    fs.writeFileSync('./src/manifest.json', JSON.stringify(manifest, null, 2))
    console.log(`The new version is: ${chalk.green(newVersion)}`)

    options.plugins = options.plugins.concat([
      new ZipPlugin({path: '../releases/', filename: `${manifest.version}.zip`}),
      new DeleteSourceMapsPlugin({path: 'releases/', filename: `${manifest.version}.zip`}),
      new SentryPlugin({
        organization: 'or-duan',
        project: 'extension-js',
        apiToken: secrets.SENTRY_API_TOKEN,
        release: manifest.version,
        filesUri: 'chrome-extension:\/\/hjljfmcceigmoljnjakochbgmcedcgnk\/',
        files: ['app.js.map', 'popup.js.map', 'background.js.map'],  // TODO Probably can automate that
        filesPath: 'build/',
      }),
      new gitTagRelease({
        version: manifest.version,
        message: `Release ${manifest.version}`,
        manifestPath: baseDir + '/src/manifest.json'
      }),
      new uploadToWebstore({
        version: manifest.version,
        zipPath: `${baseDir}/releases/${manifest.version}.zip`,
      }),
    ])

  }

  // Temp work around to https://github.com/webpack/webpack/issues/1577
  options.plugins = options.plugins.concat([
    new webpack.DefinePlugin({
      'process.env.RELEASE_STAMP': JSON.stringify(manifest.version),
    }),
  ])
  return options
}
