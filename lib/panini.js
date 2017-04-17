'use strict';

const path = require('path');
const EventEmitter = require('events').EventEmitter;
const assign = require('lodash.assign');
const vfs = require('vinyl-fs');
const globWatcher = require('glob-watcher');
const ora = require('ora');
const templateHelpers = require('template-helpers');
const handlebarsHelpers = require('handlebars-helpers');
const pathPrefix = require('path-prefix');
const tryRequire = require('try-require');
const render = require('./render');
const repeat = require('./repeat');

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

    if (!this.options.input) {
      throw new Error('Panini: must specify an input directory.');
    }

    const Engine = tryRequire(path.join(__dirname, `../engines/${this.options.engine}`));

    if (!Engine) {
      throw new Error(`Panini: could not load engine "${this.options.engine}".`);
    }

    this.engine = new Engine(this.options);

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

    this.on('built', (pageCount, errorCount) => {
      const plural = pageCount < 1 || pageCount > 1;
      const method = errorCount ? 'warn' : 'succeed';
      const errorText = errorCount ?
        `, but ${errorCount} had errors.` :
        '.';
      this.spinner[method](`${pageCount} page${plural ? 's' : ''} built${errorText}`);
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
   * @param {Object} file - Vinyl file containing the page.
   * @param {Object} [attributes] - Page Front Matter.
   * @returns {Object} Page template data.
   */
  getPageData(file, attributes) {
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
        page: path.basename(file.path, path.extname(file.path)),
        // Layout used by this page
        layout,
        // Path prefix to root directory
        root: pathPrefix(file.path, path.join(this.options.input, this.options.pages))
      },
      // Helpers
      this.getHelpers()
    );
  }

  getHelpers() {
    if (!this.options.builtins) {
      return {};
    }

    if (this.options.engine === 'handlebars') {
      return {
        helpers: assign({repeat}, handlebarsHelpers())
      };
    }

    return {
      helpers: templateHelpers()
    };
  }

  render() {
    return render.call(this);
  }
};
