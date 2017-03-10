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
var globWatcher = require('glob-watcher');
var ora = require('ora');

/**
 * Initializes an instance of Panini.
 * @class
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
    quiet: false
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

  if (!this.options.quiet) {
    this.setupSpinner();
  }

  this.setupWatchers();
}

/**
 * Reset Panini's internal cache of layouts, partials, helpers, and data.
 */
Panini.prototype.refresh = function() {
  var _this = this;
  this.ready = false;

  return Promise.all([
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

/**
 * Load Panini's built-in Handlebars helpers.
 */
Panini.prototype.loadBuiltinHelpers = function() {
  this.Handlebars.registerHelper('ifequal', require('../helpers/ifEqual'));
  this.Handlebars.registerHelper('markdown', require('../helpers/markdown'));
  this.Handlebars.registerHelper('repeat', require('../helpers/repeat'));
  this.Handlebars.registerHelper('code', require('../helpers/code'));
};

/**
 * Create a stream of pages to be rendered.
 * @returns {stream.Transform} Transform stream.
 */
Panini.prototype.getSourceStream = function() {
  return vfs.src(path.join(
    this.options.input,
    this.options.pages,
    '**/*.*'
  ));
};

/**
 * Returns a Promise that resolves if, or when, Panini is done setting up its internal cache.
 * @returns {Promise}
 */
Panini.prototype.onReady = function() {
  var _this = this;

  return new Promise(function(resolve) {
    // Resolve right away if Panini is not mid-refresh
    if (_this.ready) {
      resolve();
    }
    // Otherwise, wait for the refresh to be done
    else {
      _this.once('ready', resolve);
    }
  });
};

/**
 * Watch for changes to layouts, partials, helpers, and data, and reload Panini's internal cache when files are added, removed, or changed.
 */
Panini.prototype.setupWatchers = function() {
  var _this = this;

  var paths = ['layouts', 'partials', 'helpers', 'data'].map(function(i) {
    return path.join(_this.options.input, _this.options[i], '**/*.*');
  });

  globWatcher(paths, function() {
    return _this.refresh();
  });
};

Panini.prototype.setupSpinner = function() {
  var _this = this;
  this.spinner = ora('Setting the table...').start();

  this.on('parsing', function() {
    _this.spinner.text = 'Parsing pages...';
  });

  this.on('building', function() {
    _this.spinner.text = 'Building pages...'
  });

  this.on('built', function() {
    _this.spinner.succeed(_this.pages.length + ' page' + (_this.pages.length !== 1 ? 's' : '') + ' built.');
  });

  this.on('error', function(error) {
    _this.spinner.fail('There was an error parsing a page.');
  });
};

Panini.prototype.render = require('./render');

inherits(Panini, EventEmitter);

module.exports = Panini;
