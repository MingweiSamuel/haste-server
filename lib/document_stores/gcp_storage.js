var winston = require('winston');

// By default, the client will authenticate using the service account file
// specified by the GOOGLE_APPLICATION_CREDENTIALS environment variable and use
// the project specified by the GOOGLE_CLOUD_PROJECT environment variable. See
// https://github.com/GoogleCloudPlatform/google-cloud-node/blob/master/docs/authentication.md
// These environment variables are set automatically on Google App Engine
const { Storage } = require('@google-cloud/storage');


class GCPStorageStore {
  // Create a new store with options
  constructor(options) {
    this.basePath = options.path || 'data';
    this.bashPath = this.basePath.replace(/^\.\//, '');
    this.expire = options.expire;

    this.storage = new Storage();
    this.bucket = this.storage.bucket(process.env.GCLOUD_STORAGE_BUCKET || options.bucket);
  }

  // Save file in a key
  set(key, data, callback, skipExpire) {
    if (this.expire && !skipExpire) {
      winston.warn('gcp_storage store cannot set expirations on keys');
    }

    // Create a new blob in the bucket and upload the file data.
    const blob = this.bucket.file(`${this.basePath}/${key}`);
    const blobStream = blob.createWriteStream({
      resumable: false
    });

    blobStream.on('error', (err) => {
      console.log(err);
      winston.error('gcp_storage store failed to upload', err.message);
      callback(false);
    });

    blobStream.on('finish', () => {
      // // The public URL can be used to directly access the file via HTTP.
      // const publicUrl = format(`https://storage.googleapis.com/${bucket.name}/${blob.name}`);
      callback(true);
    });

    blobStream.end(data, 'utf8');
  }

  // Get a file from a key
  get(key, callback, skipExpire) {
    if (this.expire && !skipExpire) {
      winston.warn('gcp_storage store cannot set expirations on keys');
    }
    let file = this.bucket.file(`${this.basePath}/${key}`);
    file.download((err, contents) => callback(err ? false : contents.toString('utf8')));
  }
}

module.exports = GCPStorageStore;
