var path = require('path');

module.exports = function(page, root) {
  var pagePath = path.dirname(page);
  var rootPath = path.join(process.cwd(), root);

  var relativePath = path.relative(pagePath, rootPath);

  if (relativePath.length > 0) {
    relativePath += '/';
  }

  return relativePath;
}
