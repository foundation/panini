var path = require('path');

module.exports = function() {
  this.loadLayouts(this.options.layouts);
  this.loadBuiltinHelpers();

  if (this.options.partials) {
    this.loadPartials(path.join(process.cwd(), this.options.partials));
  }

  if (this.options.helpers) {
    this.loadHelpers(path.join(process.cwd(), this.options.helpers));
  }

  if (this.options.data) {
    this.loadData(path.join(process.cwd(), this.options.data));
  }
}
