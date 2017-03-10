var path = require('path');
var loadLayouts = require('./loadLayouts');
var loadData = require('./loadData');

/**
 * Initializes a Panini instance by setting up layouts and built-in helpers. If partials, helpers, or data were configured, those are set up as well. If layout, partial, helper, or data files ever change, this method can be called again to update the Handlebars instance.
 */
module.exports = function() {
  var _this = this;
  this.ready = false;

  Promise.all([
    loadLayouts(path.join(this.options.input, this.options.layouts), _this.Handlebars).then(function(layouts) {
      _this.layouts = layouts;
    }),
    this.loadPartials(path.join(this.options.input, this.options.partials)),
    this.loadHelpers(path.join(this.options.input, this.options.helpers)),
    loadData(path.join(this.options.input, this.options.data)).then(function(data) {
      _this.data = data;
    })
  ]).then(function() {
    _this.ready = true;
    _this.emit('ready');
  });
}
