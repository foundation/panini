var assign = require('lodash.assign');
var EventEmitter = require('events').EventEmitter;
var handlebars = require('handlebars');
var HandlebarsEngine = require('../engines/handlebars');
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
  this.engine = new HandlebarsEngine(this.options);
  this.layouts = {};
  this.data = {};
  this.ready = false;

  if (!this.options.input) {
    throw new Error('Must specify an input directory.');
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
  this.ready = false;

  return this.engine.setup().then(() => {
    this.ready = true;
    this.emit('ready');
  });
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
  const features = this.engine.constructor.features.concat(['data']);
  const paths = features.map(i =>
    path.join(this.options.input, this.options[i], '**/*.*')
  );

  globWatcher(paths, () => {
    return this.refresh();
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
