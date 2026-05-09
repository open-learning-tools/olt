// OLT local-dev CryptPad server config.
//
// This file is safe to commit: it intentionally contains no admin keys,
// login salt, or other secrets. Mount it over /cryptpad/config/config.js
// only for local development.

module.exports = {
  httpUnsafeOrigin: 'http://cryptpad.localhost',
  httpSafeOrigin: 'http://cryptpad-sandbox.localhost',

  httpAddress: '0.0.0.0',
  httpPort: 3000,
  websocketPort: 3003,

  adminKeys: [],

  inactiveTime: 90,
  archiveRetentionTime: 15,
  maxUploadSize: 256 * 1024 * 1024,

  filePath: '/cryptpad/datastore/',
  archivePath: '/cryptpad/data/archive',
  pinPath: '/cryptpad/data/pins',
  taskPath: '/cryptpad/data/tasks',
  blockPath: '/cryptpad/block',
  blobPath: '/cryptpad/blob',
  blobStagingPath: '/cryptpad/data/blobstage',
  decreePath: '/cryptpad/data/decrees',
  logPath: false,

  logToStdout: true,
  logLevel: 'info',
  logFeedback: false,
  verbose: false,

  installMethod: 'docker-local-dev',
};
