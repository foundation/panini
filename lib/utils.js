var glob = require('glob').sync;
var path = require('path');

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
