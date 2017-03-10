var fs = require('fs');
var path  = require('path');
var utils = require('./utils');
var pify = require('pify');
var readFile = pify(fs.readFile);

/**
 * Looks for files with .html, .hbs, or .handlebars extensions within the given directory, and adds them as Handlebars partials matching the name of the file.
 * @param {string} dir - Folder to check for partials.
 */
module.exports = function(dir, Handlebars) {
  var partialPaths = utils.loadFiles(dir, '**/*.{html,hbs,handlebars}');

  return Promise.all(partialPaths.map(function(partialPath) {
    return readFile(partialPath).then(function(contents) {
      var ext = path.extname(partialPath);
      var name = path.basename(partialPath, ext);

      Handlebars.registerPartial(name, contents.toString() + '\n');
    });
  }));
}
