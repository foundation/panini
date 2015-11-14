var marked = require('marked');

module.exports = function(options) {
  return marked(options.fn(this));
}
