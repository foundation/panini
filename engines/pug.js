const path = require('path');
const pug = require('pug');
const PaniniEngine = require('./base');

/**
 * Panini engine to render Handlebars templates.
 */
class PugEngine extends PaniniEngine {
  /**
   * Load layouts, partials, helpers, and data.
   * @returns {Promise} Promise which resolves when setup is done.
   */
  setup() {
    const mapPaths = PaniniEngine.mapPaths;
    this.filters = {};

    return Promise.all([
      super.setup(),
      mapPaths(this.options.input, this.options.filters, '**/*.js', filePath => {
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
      const template = pug.compile(pageBody, {
        filename: file.path,
        basedir: this.options.input,
        filters: this.filters
      });
      return template(pageData);
    } catch (err) {
      return `<!DOCTYPE html><html><head><title>Panini error</title></head><body><pre>${err}</pre></body></html>`;
    }
  }
}

PugEngine.features = ['filters'];

module.exports = PugEngine;
