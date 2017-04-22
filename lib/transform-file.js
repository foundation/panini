'use strict';

const ReadableStream = require('stream').Readable;
const tryRequire = require('try-require');
const through = require('through2');

/**
 * Create a readable stream that pushes exactly one Vinyl file.
 * @param {Object} file - Vinyl file to use.
 * @returns {stream.Readable} Readable stream.
 */
const makeStream = file => {
  let chunkPushed = false;

  const stream = new ReadableStream({objectMode: true});
  stream._read = function () {
    if (chunkPushed) {
      this.push(null);
    } else {
      chunkPushed = true;
      this.push(file);
    }
  };

  return stream;
};

/**
 * Apply a series of Gulp plugins to a single Vinyl file.
 * @param {Object} file - Vinyl file to transform.
 * @param {(String[]|String)[]} transforms - Stream plugins to apply.
 * @returns {Promise.<String>} Contents of transformed file.
 */
module.exports = (file, transforms) => {
  return new Promise((resolve, reject) => {
    const stream = makeStream(file)
      .on('error', reject);

    // Call `.pipe()` once for each transform
    transforms.forEach(transform => {
      let lib;
      let args = [];

      if (Array.isArray(transform)) {
        // If the transform is an array, then the first item is the plugin name, and subsequent items are arguments to pass to the plugin
        lib = transform[0];
        args = transform.slice(1);
      } else {
        // If the transform is a string, then the plugin is called with no arguments
        lib = transform;
      }

      const func = tryRequire(lib);

      if (func) {
        stream.pipe(func.apply(null, args));
      }
    });

    // Add one more stream plugin at the very end so we can grab the final file and return it
    stream.pipe(through.obj((file, enc, cb) => {
      resolve(file.contents.toString());
      cb();
    }));
  });
};
