'use strict';

const PaniniEngine = require('../lib/engine');

/**
 * Panini engine to render Handlebars templates.
 * @todo Load helpers from a `helpers/` folder and merge with data context.
 */
class EjsEngine extends PaniniEngine {
  constructor(options) {
    super(options);

    this.ejs = require('ejs');
  }

  /**
   * Render a Handlebars page and layout.
   * @param {String} pageBody - Handlebars template string.
   * @param {Object} pageData - Handlebars context.
   * @param {Object} [file] - Vinyl source file.
   * @returns {String} Rendered page.
   */
  render(pageBody, pageData, file) {
    try {
      return this.ejs.render(pageBody, pageData, {
        filename: file.path,
        root: this.options.input
      });
    } catch (err) {
      return this.error(err, file.path);
    }
  }
}

EjsEngine.features = [];

EjsEngine.requires = 'ejs';

module.exports = EjsEngine;
