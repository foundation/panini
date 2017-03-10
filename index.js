var panini;
var assign = require('lodash.assign');
var EventEmitter = require('events').EventEmitter;
var getConfig = require('flexiconfig');
var handlebars = require('handlebars');
var help = require('./lib/helpMessage');
var loadData = require('./lib/loadData');
var loadHelpers = require('./lib/loadHelpers');
var loadLayouts = require('./lib/loadLayouts');
var loadPartials = require('./lib/loadPartials');
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
  this.Handlebars.registerHelper('ifequal', require('./helpers/ifEqual'));
  this.Handlebars.registerHelper('markdown', require('./helpers/markdown'));
  this.Handlebars.registerHelper('repeat', require('./helpers/repeat'));
  this.Handlebars.registerHelper('code', require('./helpers/code'));
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

Panini.prototype.render = require('./lib/render');

inherits(Panini, EventEmitter);

/**
 * Gulp stream function that renders HTML pages. The first time the function is invoked in the stream, a new instance of Panini is created with the given options.
 * @param {string} src - Base folder for project.
 * @param {object} options - Configuration options to pass to the new Panini instance.
 * @param {boolean} singleton - Return a new Panini instance instead of the cached one.
 * @returns {Object} Transform stream with rendered files.
 */
module.exports = function(src, opts, singleton) {
  if (!panini || singleton) {
    var options;

    try {
      var options = getConfig(['package.json#panini', opts]);
    }
    catch (e) {
      options = {};
    }

    options.input = src;
    var inst = new Panini(options);
    inst.refresh();

    if (!singleton) {
      panini = inst;
      module.exports.refresh = inst.refresh.bind(inst);
    }
  }

  // Compile pages with the above helpers
  return inst.getSourceStream().pipe(inst.render());
}

module.exports.Panini = Panini;
module.exports.refresh = function() {}
module.exports.help = function() {
  help();
}
