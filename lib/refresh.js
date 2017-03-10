var path = require('path');

/**
 * Initializes a Panini instance by setting up layouts and built-in helpers. If partials, helpers, or data were configured, those are set up as well. If layout, partial, helper, or data files ever change, this method can be called again to update the Handlebars instance.
 */
module.exports = function() {
  this.ready = false;
  this.loadLayouts(path.join(this.options.input, this.options.layouts));
  this.loadPartials(path.join(this.options.input, this.options.partials || '!*'));
  this.loadHelpers(path.join(this.options.input, this.options.helpers || '!*'));
  this.loadData(path.join(this.options.input, this.options.data || '!*'));
  this.ready = true;
  this.emit('ready');
}
