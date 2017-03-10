var fs = require('fs');
var load = require('load-whatever');
var path = require('path');
var utils = require('./utils');
var fromPairs = require('lodash.frompairs');

/**
 * Looks for files with .json or .yml extensions within the given directory, and adds them as Handlebars variables matching the name of the file.
 * @param {string} dir - Folder to check for data files.
 */
module.exports = function(dir) {
  var _this = this;
  var dataFiles = utils.loadFiles(dir, '**/*.{js,json,yml,yaml,cson}');

  return Promise.all(dataFiles.map(function(dataFile) {
    return load(dataFile).then(function(data) {
      var ext = path.extname(dataFile);
      var name = path.basename(dataFile, ext);

      return [
        name,
        data
      ];
    }).catch(function() {
      console.log('Data file ' + dataFile + ' could not be loaded.');
    });
  })).then(function(data) {
    return fromPairs(data);
  });
}
