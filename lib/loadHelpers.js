var fs   = require('fs');
var path = require('path');
var utils = require('./utils');

/**
 * Looks for files with the .js extension within the given directory, and attempts to add them as Handlebars helpers.
 * @param {string} dir - Folder to check for helpers.
 */
module.exports = function(dir, Handlebars) {
  var helperPaths = utils.loadFiles(dir, '**/*.js');

  return Promise.all(helperPaths.map(function(helperPath) {
    var name = path.basename(helperPath, '.js');

    try {
      if (Handlebars.helpers[name]){
        delete require.cache[require.resolve(path.join(helperPath))];
        Handlebars.unregisterHelper(name);
      }

      var helper = require(path.join(helperPath));
      Handlebars.registerHelper(name, helper);
    }
    catch (e) {
      console.warn('Error when loading ' + name + '.js as a Handlebars helper.');
    }
  }));
}
