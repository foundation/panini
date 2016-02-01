var glob = require('glob').sync;
var path = require('path');
var Readable = require('stream').Readable;
var through = require('through2');

/**
 * Load a set of files
 * @param  {string|array} dir
 * @param  {string}       pattern
 * @return {array}
 */
exports.loadFiles = function(dir, pattern) {
  var files = [];

  dir = !Array.isArray(dir) ? [dir] : dir;

  for (var i in dir) {
    files = files.concat(glob(path.join(process.cwd(), dir[i], pattern)));
  }

  return files;
}

/**
 * Creates a string that can be prepended to a file path that needs to resolve to the root.
 * @param {string} page - Path to the page.
 * @param {string} root - Path to the page root.
 * @returns {string} An empty string if the page is at the root, or a series of `../` characters if the page is in a subdirectory relative to the root.
 */
exports.processRoot = function(page, root) {
  var pagePath = path.dirname(page);
  var rootPath = path.join(process.cwd(), root);

  var relativePath = path.relative(pagePath, rootPath);

  if (relativePath.length > 0) {
    relativePath += '/';
  }

  // On Windows, Node uses a "\" for the separator
  // However, web browsers use "/" no matter the platform
  return relativePath.replace('\\', '/');
}

/**
 * Creates a readable stream out of a single input file, then passes that stream to a develop-supplied function, which can manipulate the file further through stream plugins.
 * @param {object} file - Vinyl file to transform.
 * @param {function} func - Transform function to call.
 * @param {function} cb - Callback containing the transformed file to run when transforming is done.
 */
exports.transformFile = function(file, func, cb) {
  // Create a readable stream and push our file to it
  var stream = new Readable({ objectMode: true });
  stream.push(file);
  stream.push(null);

  // Call the developer-supplied transform function with "this" as the stream
  func.call(stream).once('data', function(f) {
    cb(f);
  });
}
