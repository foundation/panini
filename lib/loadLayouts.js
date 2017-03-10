var fs = require('fs');
var path = require('path');
var utils = require('./utils');
var pify = require('pify');
var readFile = pify(require('fs').readFile);
var fromPairs = require('lodash.frompairs');

/**
 * Looks for files with .html, .hbs, or .handlebars extensions within the given directory, and adds them as layout files to be used by pages.
 * @param {string} dir - Folder to check for layouts.
 */
module.exports = function(dir, Handlebars) {
  var layoutPaths = utils.loadFiles(dir, '**/*.{html,hbs,handlebars}');

  return Promise.all(layoutPaths.map(function(layoutPath) {
    return readFile(layoutPath).then(function(contents) {
      var ext = path.extname(layoutPath);
      var name = path.basename(layoutPath, ext);

      return [
        name,
        Handlebars.compile(contents.toString())
      ];
    });
  })).then(function(res) {
    return fromPairs(res);
  });
}
