const {exec} = require('child_process')

exports.DeleteSourceMapsPlugin = class {
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

exports.SentryPlugin = class {
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


exports.gitTagDeploy = class {
  constructor(options) {
    this.options = options
  }

  apply(compiler) {
    compiler.plugin('done', async () => {
      console.log('\nTagging git deploy.')
      exec(`git tag -a ${this.options.version} -m "${this.options.message}" && git push --tags`, (err, stdout, stderr) => {
        if (err || stderr || stdout) {
          console.log(stdout)
          console.log(err)
          console.log(stderr)
        }
      })
    })
  }
}
