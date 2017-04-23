'use strict';

const ejs = require('ejs');
const PaniniEngine = require('../lib/engine');

/**
 * Panini engine to render Handlebars templates.
 */
class EjsEngine extends PaniniEngine {
  /**
   * Render a Handlebars page and layout.
   * @param {String} pageBody - Handlebars template string.
   * @param {Object} pageData - Handlebars context.
   * @param {Object} [file] - Vinyl source file.
   * @returns {String} Rendered page.
   */
  render(pageBody, pageData, file) {
    try {
      return ejs.render(pageBody, pageData, {
        filename: file.path,
        root: this.options.input
      });
    } catch (err) {
      return this.error(err, file.path);
    }
  }
}

EjsEngine.features = [];

module.exports = EjsEngine;
