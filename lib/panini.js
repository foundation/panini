'use strict';

const path = require('path');
const EventEmitter = require('events').EventEmitter;
const assign = require('lodash.assign');
const vfs = require('vinyl-fs');
const globWatcher = require('glob-watcher');
const ora = require('ora');
const loadEngine = require('./load-engine');
const render = require('./render');
const processRoot = require('./process-root');

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
      filters: 'filters',
      pageLayouts: {},
      engine: 'handlebars',
      builtins: true,
      quiet: false
    }, options);
    this.layouts = {};
    this.data = {};
    this.ready = false;

    const Engine = loadEngine(this.options.engine);
    this.engine = new Engine(this.options);

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
    this.emit('refreshing');

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
    this.spinner = ora('Setting the table...');

    this.on('refreshing', () => {
      this.spinner.start();
    });

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

  /**
   * Assemble the template data for a page. Page data is prioritized in the following order, from
   * lowest to highest:
   *   - Loaded data files
   *   - Vinyl file attributes
   *   - Page Front Matter
   *   - Page constants:
   *     - `page`: basename of the page
   *     - `layout`: dervied layout of the page
   *     - `root`: path prefix to root directory from this page
   *
   * @param {Object} attributes - Page Front Matter.
   * @param {Object} file - Vinyl file containing the page.
   * @returns {Object} Page template data.
   */
  getPageData(attributes, file) {
    // Determine which layout to use
    let layout;
    if (this.engine.supports('layouts')) {
      const basePath = path.relative(
        path.join(this.options.input, this.options.pages),
        path.dirname(file.path)
      );
      layout =
        attributes.layout ||
        this.options.pageLayouts[basePath] ||
        'default';
    }

    return assign(
      {},
      // Global data
      this.engine.data,
      // Data from Gulp stream plugins
      file.data || {},
      // Page-specific data
      attributes,
      // Constants
      {
        // Basename of file
        page: path.basename(file.path, '.html'),
        // Layout used by this page
        layout,
        // Path prefix to root directory
        root: processRoot(file.path, path.join(this.options.input, this.options.pages))
      }
    );
  }

  render() {
    return render.apply(this, arguments);
  }
};
