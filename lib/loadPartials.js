var fs   = require('fs');
var glob = require('glob');
var path = require('path');

module.exports = function(dir) {
  var partials = glob.sync(path.join(dir, '**/*.{html,hbs,handlebars}'));

  for (var i in partials) {
    var file = fs.readFileSync(partials[i]);
    var name = path.basename(partials[i], '.html');
    this.Handlebars.registerPartial(name, file.toString() + '\n');
  }
}
