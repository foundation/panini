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
    var filePath = [process.cwd(), dir[i], pattern];
    if(path.isAbsolute(dir[i])) {
      filePath.shift();
    }

    files = files.concat(glob.sync(path.join.apply(null, filePath)));
  }

  return files;
}
