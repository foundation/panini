var path = require('path');

/**
 * Initializes a Panini instance by setting up layouts and built-in helpers. If partials, helpers, or data were configured, those are set up as well. If layout, partial, helper, or data files ever change, this method can be called again to update the Handlebars instance.
 */
module.exports = function() {
  this.loadLayouts(this.options.layouts);
  if (this.options.partials) this.loadPartials(this.options.partials);
  if (this.options.helpers) this.loadHelpers(this.options.helpers);
  if (this.options.data) this.loadData(this.options.data);
}
