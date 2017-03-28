const path = require('path');
const pify = require('pify');
const glob = pify(require('glob'));
const readFile = pify(require('fs').readFile);
const load = require('load-whatever');

/**
 * Base class for a Panini rendering engine.
 * @abstract
 */
class PaniniEngine {
  static mapFiles(base, dir, pattern, cb) {
    const globPath = path.join(process.cwd(), base, dir, pattern);
    return glob(globPath).then(paths => Promise.all(paths.map(p =>
      readFile(p).then(contents => cb(p, contents.toString()))
    )));
  }

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
      throw new TypeError('Do not call the PaniniEngine class directly. Create a sub-class instead.')
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

    return this.constructor.mapPaths(this.options.input, this.options.data, extensions, (filePath) => {
      return load(filePath).then(contents => {
        const name = path.basename(filePath, path.extname(filePath));
        this.data[name] = contents;
      })
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
}

module.exports = PaniniEngine;
