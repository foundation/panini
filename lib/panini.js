var assign = require('lodash.assign');
var EventEmitter = require('events').EventEmitter;
var handlebars = require('handlebars');
var loadData = require('./loadData');
var loadHelpers = require('./loadHelpers');
var loadLayouts = require('./loadLayouts');
var loadPartials = require('./loadPartials');
var inherits = require('util').inherits;
var vfs = require('vinyl-fs');
var path = require('path');

/**
 * Initializes an instance of Panini.
 * @constructor
 * @param {object} options - Configuration options to use.
 */
function Panini(options) {
  this.options = assign({
    pages: 'pages',
    layouts: 'layouts',
    partials: 'partials',
    helpers: 'helpers',
    data: 'data',
    pageLayouts: {},
    builtins: true,
  }, options);
  this.Handlebars = handlebars.create();
  this.layouts = {};
  this.data = {};
  this.ready = false;

  if (!this.options.input) {
    throw new Error('Must specify an input directory.');
  }

  if (this.options.builtins) {
    this.loadBuiltinHelpers();
  }
}

Panini.prototype.refresh = function() {
  var _this = this;
  this.ready = false;

  Promise.all([
    loadLayouts(path.join(this.options.input, this.options.layouts), _this.Handlebars).then(function(layouts) {
      _this.layouts = layouts;
    }),
    loadPartials(path.join(this.options.input, this.options.partials), _this.Handlebars),
    loadHelpers(path.join(this.options.input, this.options.helpers), _this.Handlebars),
    loadData(path.join(this.options.input, this.options.data)).then(function(data) {
      _this.data = data;
    })
  ]).then(function() {
    _this.ready = true;
    _this.emit('ready');
  });
};

Panini.prototype.loadBuiltinHelpers = function() {
  this.Handlebars.registerHelper('ifequal', require('../helpers/ifEqual'));
  this.Handlebars.registerHelper('markdown', require('../helpers/markdown'));
  this.Handlebars.registerHelper('repeat', require('../helpers/repeat'));
  this.Handlebars.registerHelper('code', require('../helpers/code'));
};

Panini.prototype.getSourceStream = function() {
  return vfs.src(path.join(
    this.options.input,
    this.options.pages,
    '**/*.*'
  ));
};

Panini.prototype.onReady = function() {
  var _this = this;

  return new Promise(function(resolve) {
    if (_this.ready) {
      resolve();
    }
    else {
      _this.once('ready', resolve);
    }
  });
};

Panini.prototype.render = require('./render');

inherits(Panini, EventEmitter);

module.exports = Panini;
