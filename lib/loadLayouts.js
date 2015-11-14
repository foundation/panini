var fs   = require('fs');
var glob = require('glob');
var path = require('path');

module.exports = function(dir) {
  var layouts = glob.sync(path.join(dir, '**/*.html'));

  for (var i in layouts) {
    var name = path.basename(layouts[i], '.html');
    var file = fs.readFileSync(layouts[i]);
    this.layouts[name] = this.Handlebars.compile(file.toString());
  }
}
