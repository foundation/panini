var fs   = require('fs');
var glob = require('glob');
var path = require('path');
var yaml = require('js-yaml');

module.exports = function(dir) {
  var dataFiles = glob.sync(path.join(dir, '*.{json,yml}'));

  for (var i in dataFiles) {
    var file = fs.readFileSync(dataFiles[i]);
    var ext = path.extname(dataFiles[i]);
    var name = path.basename(dataFiles[i], ext);
    var data;

    if (ext === '.json') {
      data = require(dataFiles[i])
    }
    else if (ext === '.yml') {
      data = yaml.safeLoad(fs.readFileSync(dataFiles[i]));
    }

    this.data = data;
  }
}
