'use strict';

const path = require('path');
const fs = require('fs');
const pify = require('pify');
const load = require('load-whatever');
const Handlebars = require('handlebars');
const extractStack = require('extract-stack');
const folderToObject = require('folder-to-object');
const assign = require('lodash.assign');
const tryRequire = require('try-require');
const File = require('vinyl');
const replaceExt = require('replace-ext');
const through = require('through2');
const glob = pify(require('glob'));
const stripBom = require('strip-bom');
const folders = require('./folders');

const readFile = pify(fs.readFile);
let errorTemplate;

/**
 * Base class for a Panini rendering engine.
 * @abstract
 */
class PaniniEngine {
  /**
   * Get all files matching a pattern and run a function that gets each file's path and contents.
   * Use this method in an engine to fetch the contents of files to load layouts, partials, etc.
   * The callback can return a promise if an asynchronous action is needed.
   * @param {String} base - Root path to search in. This is usually `this.options.input`.
   * @param {String} dir - Directory to search in. This is usually a member of `this.options`.
   * @param {String} pattern - Glob pattern to append. This is usually a series of file extensions.
   * @param {Function} cb - Function to run on each file. Gets `path` and `contents` arguments.
   * @returns {Promise} Promise which resolves when all files have been processed.
   */
  static mapFiles(base, dir, pattern, cb) {
    const globPath = path.join(process.cwd(), base, dir, pattern);
    return glob(globPath).then(paths => Promise.all(paths.map(p =>
      readFile(p).then(contents => cb(p, stripBom(contents.toString())))
    )));
  }

  /**
   * Get all files matching a pattern and run a function that gets each file's path.
   * Use this method in an engine to fetch and store all paths matching a set of criteria.
   * The callback can return a promise if an asynchronous action is needed.
   * @param {String} base - Root path to search in. This is usually `this.options.input`.
   * @param {String} dir - Directory to search in. This is usually a member of `this.options`.
   * @param {String} pattern - Glob pattern to append. This is usually a series of file extensions.
   * @param {Function} cb - Function to run on each file. Gets `path` argument.
   * @returns {Promise} Promise which resolves when all files have been processed.
   */
  static mapPaths(base, dir, pattern, cb) {
    const globPath = path.join(process.cwd(), base, dir, pattern);
    return glob(globPath).then(paths => Promise.all(paths.map(p => cb(p))));
  }

  get i18n() {
    return this.locales.length > 0;
  }

  /**
   * Set up common settings for all rendering engines. Because `PaniniEngine` is considered an
   * abstract class, this constructor will never be called directly.
   * @param {Object} options - Panini options.
   */
  constructor(options) {
    if (this.constructor === PaniniEngine) {
      throw new TypeError('Do not call the PaniniEngine class directly. Create a sub-class instead.');
    }

    this.options = options || {};
    this.data = {};
    this.locales = [];
    this.localeData = {};
    this.collections = {};
    this.collectionPages = {};

    if (this.supports('layouts')) {
      this.layouts = {};
    }
  }

  /**
   * Run engine setup used by all template engines.
   * @returns {Promise} Promise which resolves when setup is done.
   */
  setup() {
    const extensions = '**/*.{js,json,yml,yaml,cson}';
    this.data = {};
    this.collections = {};
    this.collectionPages = {};

    return Promise.all([
      // Load data files
      this.constructor.mapPaths(this.options.input, folders.data, extensions, filePath => {
        return load(filePath).then(contents => {
          const name = path.basename(filePath, path.extname(filePath));
          this.data[name] = contents;
        });
      }),
      // Load locale data
      folderToObject(path.join(this.options.input, folders.locales)).then(res => {
        this.locales = Object.keys(res);
        this.localeData = res;
      }),
      // Load collection configuration
      this.constructor.mapPaths(this.options.input, folders.collections, '*/', filePath => {
        const module = tryRequire(filePath);
        if (!module) {
          return;
        }
        const name = path.basename(filePath);
        const templatePath = path.join(filePath, 'template.*');
        return glob(templatePath).then(res => readFile(res[0])).then(res => {
          this.collections[name] = assign({}, module, {template: res});
        });
      }).then(() => this.buildCollections())
    ]);
  }

  /**
   * Process all collection types in a project.
   * @returns {Promise} Promise which resolves when all collections have been processed.
   */
  buildCollections() {
    return Promise.all(Object.keys(this.collections).map(name => this.buildCollection(name)));
  }

  /**
   * Build a series of pages using a collection configuration. A collection defines these settings:
   *   - `input`: glob pattern relative to project base to scan for files with.
   *   - `output`: folder relative to output to write pages to.
   *   - `transform(filePath, contents)`: function to process each file from `input` and return a filename and template data for a new page.
   *   - `read`: if the contents of each file should be passed to the `transform` function. Defaults to `true`.
   *
   * Using these settings, this method processes all files in a collection and generates Vinyl files that are eventually mixed in with normal pages during the building process.
   */
  buildCollection(name) {
    const collection = this.collections[name];

    if (!collection) {
      return;
    }

    this.collectionPages[name] = [];
    const basePath = path.join(process.cwd(), this.options.input, folders.pages);
    const baseFile = new File({
      base: basePath,
      path: basePath,
      contents: collection.template
    });

    // Grab every file for a given collection type
    return glob(path.join(this.options.input, collection.input)).then(paths => Promise.all(paths.map(filePath => {
      // Read the contents of the file if ncessary
      let p;
      if (collection.read === false || filePath.match(/\/$/)) {
        p = Promise.resolve();
      } else {
        p = readFile(filePath).then(res => res.toString());
      }

      // Call the transform function and then generate a file with the result
      return p.then(res => collection.transform(filePath, res)).then(res => {
        const file = baseFile.clone();
        const filePath = path.join(file.path, collection.output, res.name);
        file.path = replaceExt(filePath, '.html');
        file.data = res.data;
        this.collectionPages[name].push(file);
      });
    })));
  }

  /**
   * Create a transform stream function which will insert collection pages into a stream, to be rendered by `Panini.compile()`.
   * @param {Promise} ready - Promise returned by `Panini.onReady()`.
   * @returns {Object} Stream transform function.
   */
  getCollectionStream(ready) {
    const _this = this;

    return through.obj(
      // For files being read, this a passthrough. They aren't modified
      (file, enc, cb) => cb(null, file),
      // Once all pages have gone through, we insert collection pages into the stream
      function (cb) { // eslint-disable-line prefer-arrow-callback
        // Don't push collections to the stream until the engine has parsed them
        // Otherwise there won't be any
        ready.then(() => {
          Object.keys(_this.collectionPages).forEach(i => {
            _this.collectionPages[i].forEach(page => this.push(page));
          });
          cb();
        });
      }
    );
  }

  /**
   * Check if a rendering engine supports a specific feature, such as layouts or partials.
   * @param {String} feature - Feature to check for.
   * @returns {Boolean} If feature is supported.
   */
  supports(feature) {
    return (this.constructor.features || []).indexOf(feature) > -1;
  }

  /**
   * Create an HTML page to display a rendering error. This page will be passed to the final file instead of the actual page.
   * @param {Error} error - Error instance.
   * @param {String} filePath - Path to source file with error.
   * @returns {String} HTML error page.
   */
  error(error, filePath) {
    const fileName = path.relative(process.cwd(), filePath);
    if (!errorTemplate) {
      const errorPage = fs.readFileSync(path.join(__dirname, 'error-template.hbs'));
      errorTemplate = Handlebars.compile(errorPage.toString());
    }

    return errorTemplate({
      message: error.message,
      stack: extractStack.lines(error).join('\n'),
      fileName
    });
  }
}

module.exports = PaniniEngine;
