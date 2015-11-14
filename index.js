var through = require('through2');
var panini;

function Panini(options) {
  this.options = options;
  this.Handlebars = require('handlebars');
  this.layouts = {};
  this.data = {};

  if (!options.layouts) {
    throw new Error('Panini error: you must specify a directory for layouts.');
  }

  if (!options.root) {
    throw new Error('Panini error: you must specify the root folder that pages live in.')
  }
}

Panini.prototype.init = require('./lib/init');
Panini.prototype.loadLayouts = require('./lib/loadLayouts');
Panini.prototype.loadPartials = require('./lib/loadPartials');
Panini.prototype.loadHelpers = require('./lib/loadHelpers');
Panini.prototype.loadBuiltinHelpers = require('./lib/loadBuiltinHelpers');
Panini.prototype.loadData = require('./lib/loadData');
Panini.prototype.render = require('./lib/render');

module.exports = function(settings) {
  if (!panini) {
    panini = new Panini(settings);
    panini.init();
  }

  // Compile pages with the above helpers
  return through.obj(panini.render.bind(panini));
}

module.exports.Panini = Panini;
