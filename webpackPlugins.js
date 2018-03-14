const fs = require('fs');
const {exec} = require('child_process');
const rp = require('request-promise');
const secrets = require('./secrets.json');

exports.DeleteSourceMapsPlugin = class {
  constructor(options) {
    this.options = options;
  }

  apply(compiler) {
    compiler.plugin('done', () => {
      console.log('\nDeleting source maps from the zip file.');
      exec(`zip -q -d ${this.options.path}${this.options.filename} "**.js.map"`, (err, stdout, stderr) => {
        if (err || stderr || stdout) {
          console.log(stdout);
          console.log(err);
          console.log(stderr);
        }
      });
    });
  }
};

exports.SentryPlugin = class {
  constructor(options) {
    this.options = options;
    this.baseUri = `https://sentry.io/api/0/projects/${options.organization}/${options.project}/releases/`;
  }

  apply(compiler) {
    compiler.plugin('done', async () => {
      await this.createRelease();
      await this.uploadFiles();
    });
  }

  createRelease() {
    console.log('\nCreating release');
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
    };
    return rp(requestOptions);
  }

  uploadFiles() {
    const {options} = this;
    let requestOptions = {
      method: 'POST',
      uri: this.baseUri + `${options.release}/files/`,
      headers: {
        Authorization: `Bearer ${options.apiToken}`,
      },
      json: true,
    };
    let fileRequests = [];
    options.files.map(file => {
      let value = fs.createReadStream(options.filesPath + file);

      let filename = `${options.filesUri}${file}`;
      console.log('Sending files to sentry: ', file);

      let formData = {
        file: value,
        name: filename,
      };
      fileRequests.push(rp({...requestOptions, formData: formData}));
      return Promise.all(fileRequests);
    });
  }
};
exports.gitTagRelease = class {
  constructor(options) {
    this.options = options;
  }

  apply(compiler) {
    compiler.plugin('done', async () => {
      console.log('\nTagging git deploy.');
      let cmd = `git add ${this.options.manifestPath} && git commit -m "Version bump [${this.options.version}]" && git tag -a ${this.options.version} -m "${this.options.message}" && git push --follow-tags`;
      exec(cmd, (err, stdout, stderr) => {
        if (err || stderr || stdout) {
          console.log(stdout);
          console.log(err);
          console.log(stderr);
        }
      });
    });
  }
};

exports.uploadToWebstore = class {
  constructor(options) {
    this.options = options;
  }

  apply(compiler) {
    compiler.plugin('done', async () => {
      console.log('\nUploading to google store.');
      let {CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN} = secrets.CHROME_WEBSTORE;

      // Get access token
      let {access_token: accessToken} = await rp.post('https://accounts.google.com/o/oauth2/token', {
        form: {
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          refresh_token: REFRESH_TOKEN,
          grant_type: 'refresh_token',
        },
        json: true,
      });

      // Upload
      let headers = {
        'Authorization': `Bearer ${accessToken}`,
        'x-goog-api-version': '2',
      };

      await rp({
        url: `https://www.googleapis.com/upload/chromewebstore/v1.1/items/nohmjponpgbnhjokbmagdbnjpnmdaigb`,
        method: 'PUT',
        headers: headers,
        body: fs.createReadStream(this.options.zipPath),
      });

      // Publish
      await rp({
        url: `https://www.googleapis.com/chromewebstore/v1.1/items/nohmjponpgbnhjokbmagdbnjpnmdaigb/publish`,
        method: 'POST',
        headers: headers,
        body: '',
      });
    });
  }
};

exports.ReloadExtensionsPage = class {
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
};
