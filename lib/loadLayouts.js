var fs   = require('fs');
var glob = require('glob');
var path = require('path');

module.exports = function(dir) {
  var layouts = glob.sync(path.join(dir, '**/*.{html,hbs,handlebars}'));

  for (var i in layouts) {
    var ext = path.extname(layouts[i]);
    var name = path.basename(layouts[i], ext);
    var file = fs.readFileSync(layouts[i]);
    this.layouts[name] = this.Handlebars.compile(file.toString());
  }
}
