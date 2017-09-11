'use strict';

const path = require('path');
const PaniniEngine = require('../lib/engine');
const folders = require('../lib/folders');

/**
 * Panini engine to render Handlebars templates.
 */
class PugEngine extends PaniniEngine {
  constructor(options) {
    super(options);

    this.pug = require('pug');
  }

  /**
   * Load layouts, partials, helpers, and data.
   * @returns {Promise} Promise which resolves when setup is done.
   * @todo Load helpers from a `helpers/` folder and merge with data context.
   */
  setup() {
    const mapPaths = PaniniEngine.mapPaths;
    this.filters = {};

    return Promise.all([
      super.setup(),
      mapPaths(this.options.input, folders.filters, '**/*.js', filePath => {
        const name = path.basename(filePath, '.js');

        try {
          delete require.cache[require.resolve(filePath)];
          const helper = require(filePath);
          this.filters[name] = helper;
        } catch (err) {
          console.warn('Error when loading ' + name + '.js as a Pug helper.');
        }
      })
    ]);
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
      const template = this.pug.compile(pageBody, {
        filename: file.path,
        basedir: this.options.input,
        filters: this.filters
      });
      return template(pageData);
    } catch (err) {
      return this.error(err, file.path);
    }
  }
}

PugEngine.features = ['filters'];

PugEngine.requires = 'pug';

module.exports = PugEngine;
