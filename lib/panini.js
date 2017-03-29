'use strict';

const path = require('path');
const EventEmitter = require('events').EventEmitter;
const assign = require('lodash.assign');
const vfs = require('vinyl-fs');
const globWatcher = require('glob-watcher');
const ora = require('ora');
const HandlebarsEngine = require('../engines/handlebars');
const render = require('./render');

module.exports = class Panini extends EventEmitter {
  /**
   * Initializes an instance of Panini.
   * @class
   * @param {object} options - Configuration options to use.
   */
  constructor(options) {
    super();

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
  refresh() {
    this.ready = false;

    return this.engine.setup().then(() => {
      this.ready = true;
      this.emit('ready');
    });
  }

  /**
   * Create a stream of pages to be rendered.
   * @returns {stream.Transform} Transform stream.
   */
  getSourceStream() {
    return vfs.src(path.join(
      this.options.input,
      this.options.pages,
      '**/*.*'
    ));
  }

  /**
   * Returns a Promise that resolves if, or when, Panini is done setting up its internal cache.
   * @returns {Promise}
   */
  onReady() {
    return new Promise(resolve => {
      if (this.ready) {
        // Resolve right away if Panini is not mid-refresh
        resolve();
      } else {
        // Otherwise, wait for the refresh to be done
        this.once('ready', resolve);
      }
    });
  }

  /**
   * Watch for changes to layouts, partials, helpers, and data, and reload Panini's internal cache when files are added, removed, or changed.
   */
  setupWatchers() {
    const features = this.engine.constructor.features.concat(['data']);
    const paths = features.map(i =>
      path.join(this.options.input, this.options[i], '**/*.*')
    );

    globWatcher(paths, () => {
      return this.refresh();
    });
  }

  setupSpinner() {
    this.spinner = ora('Setting the table...').start();

    this.on('parsing', () => {
      this.spinner.text = 'Parsing pages...';
    });

    this.on('building', () => {
      this.spinner.text = 'Building pages...';
    });

    this.on('built', () => {
      const plural = this.pages.length < 1 || this.pages.length > 1;
      this.spinner.succeed(this.pages.length + ' page' + (plural ? 's' : '') + ' built.');
    });

    this.on('error', () => {
      this.spinner.fail('There was an error parsing a page.');
    });
  }

  render() {
    return render.apply(this, arguments);
  }
};
