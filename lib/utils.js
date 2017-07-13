'use strict';

var glob = require('glob');
var path = require('path');
var fs = require('fs');

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
    files = files.concat(glob.sync(path.join(process.cwd(), dir[i], pattern)));
  }

  return files;
}

/**
 * Skips over the UTF-8 BOM if it exists in the file
 * @param  {string} path File to load
 * @return {Buffer}      File contents without BOM
 */
exports.readWithoutBOM = function(path) {
  var bomBytes = [0xEF, 0xBB, 0xBF];
  var bomSize = bomBytes.length;
  var fileData = fs.readFileSync(path);
  var dataLength = fileData.length;
  var hasBom = true;

  for (var i = 0; (i < bomSize) && (i < dataLength) && hasBom; ++i) {
    hasBom = fileData[i] === bomBytes[i];
  }

  return hasBom ? fileData.slice(bomSize) : fileData;
}
