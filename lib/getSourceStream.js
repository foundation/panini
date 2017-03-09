var path = require('path');
var vfs = require('vinyl-fs');

module.exports = function() {
  return vfs.src(path.join(
    this.options.input,
    this.options.pages,
    '**/*.*'
  ));
}
