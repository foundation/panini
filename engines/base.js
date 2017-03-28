const path = require('path');
const loadData = require('../lib/loadData');

/**
 * Base class for a Panini rendering engine.
 * @abstract
 */
class PaniniEngine {
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
    return loadData(path.join(this.options.input, this.options.data)).then(data => {
      this.data = data;
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
