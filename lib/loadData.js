var fs = require('fs');
var load = require('load-whatever').sync;
var path = require('path');
var utils = require('./utils');

/**
 * Looks for files with .json or .yml extensions within the given directory, and adds them as Handlebars variables matching the name of the file.
 * @param {string} dir - Folder to check for data files.
 */
module.exports = function(dir) {
  var dataFiles = utils.loadFiles(dir, '**/*.{js,json,yml,yaml,cson}');

  for (var i in dataFiles) {
    var ext = path.extname(dataFiles[i]);
    var name = path.basename(dataFiles[i], ext);

    try {
      this.data[name] = load(dataFiles[i]);
    }
    catch (e) {
      console.log('Data file ' + dataFiles[i] + ' could not be loaded.');
    }
  }
}
