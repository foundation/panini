'use strict';

const path = require('path');
const fs = require('fs');
const pify = require('pify');
const load = require('load-whatever');
const Handlebars = require('handlebars');
const extractStack = require('extract-stack');
const glob = pify(require('glob'));

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
      readFile(p).then(contents => cb(p, contents.toString()))
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

    return this.constructor.mapPaths(this.options.input, this.options.data, extensions, filePath => {
      return load(filePath).then(contents => {
        const name = path.basename(filePath, path.extname(filePath));
        this.data[name] = contents;
      });
    });
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
