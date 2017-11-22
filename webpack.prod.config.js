const MinifyPlugin = require('babel-minify-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const ZipPlugin = require('zip-webpack-plugin')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')
const webpack = require('webpack')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const chalk = require('chalk')
const readlineSync = require('readline-sync')
const fs = require('fs')
const {exec} = require('child_process')
const rp = require('request-promise')
const secrets = require('./secrets.json')

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
        files: ['app.js', 'app.js.map', 'popup.js', 'popup.js.map', 'background.js', 'background.js.map'],  // TODO Probably can automate that
        filesPath: 'build/',
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

class DeleteSourceMapsPlugin {
  constructor(options) {
    this.options = options
  }

  apply(compiler) {
    compiler.plugin('done', () => {
      console.log('\nDeleting source maps from the zip file.')
      exec(`zip -q -d ${this.options.path}${this.options.filename} "**.js.map"`, (err, stdout, stderr) => {
        if (err || stderr || stdout) {
          console.log(stdout)
          console.log(err)
          console.log(stderr)
        }
      })
    })
  }
}

class SentryPlugin {
  constructor(options) {
    this.options = options
    this.baseUri = `https://sentry.io/api/0/projects/${options.organization}/${options.project}/releases/`
  }

  apply(compiler) {
    compiler.plugin('done', async () => {
      await this.createRelease()
      await this.uploadFiles()
    })
  }

  createRelease() {
    console.log('\nCreating release')
    let requestOptions = {
      method: 'POST',
      uri: this.baseUri,
      headers: {
        'Authorization': `Bearer ${this.options.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: {
        version: this.options.release,
      },
      json: true,
    }
    return rp(requestOptions)
  }

  uploadFiles() {
    const {options} = this
    let requestOptions = {
      method: 'POST',
      uri: this.baseUri + `${options.release}/files/`,
      headers: {
        Authorization: `Bearer ${options.apiToken}`,
      },
      json: true,
    }
    let fileRequests = []
    options.files.map(file => {
      let value = fs.createReadStream(options.filesPath + file)

      let filename = `${options.filesUri}${file}`
      console.log('Sending files to sentry: ', file)

      let formData = {
        file: value,
        name: filename,
      }
      fileRequests.push(rp({...requestOptions, formData: formData}))
      return Promise.all(fileRequests)
    })
  }
}
