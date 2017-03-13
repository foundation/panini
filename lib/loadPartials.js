var fs = require('fs');
var path = require('path');
var utils = require('./utils');

/**
 * Looks for files with .html, .hbs, or .handlebars extensions within the given directory, and adds them as Handlebars partials matching the name of the file.
 * @param {string} dir - Folder to check for partials.
 */
module.exports = function (dir) {
    var full_dir_path = (process.cwd() + '/' + dir).replace(/\\/g, '/'),
        partials = utils.loadFiles(dir, '**/*.{html,hbs,handlebars}');

    for (var i in partials) {
        var ext = path.extname(partials[i]),
            file = fs.readFileSync(partials[i]),
            name = partials[i].substring(full_dir_path.length, partials[i].length - ext.length);

        this.Handlebars.registerPartial(name, file.toString() + '\n');
    }
}
