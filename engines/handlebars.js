const path = require('path');
const handlebars = require('handlebars');
const PaniniEngine = require('./base');
const loadData = require('../lib/loadData');
const loadHelpers = require('../lib/loadHelpers');
const loadLayouts = require('../lib/loadLayouts');
const loadPartials = require('../lib/loadPartials');
const ifPage = require('../helpers/ifPage');
const unlessPage = require('../helpers/unlessPage');

/**
 * Panini engine to render Handlebars templates.
 */
class HandlebarsEngine extends PaniniEngine {
  /**
   * Create a new engine instance.
   * @param {object} options - Panini options.
   */
  constructor(options) {
    super(options);
    this.engine = handlebars.create();

    if (this.options.builtins) {
      this.loadBultins();
    }
  }

  /**
   * Load layouts, partials, helpers, and data.
   * @returns {Promise} Promise which resolves when setup is done.
   */
  setup() {
    this.layouts = {};

    return Promise.all([
      super.setup(),
      loadLayouts(path.join(this.options.input, this.options.layouts), this.engine).then(layouts => {
        this.layouts = layouts;
      }),
      loadPartials(path.join(this.options.input, this.options.partials), this.engine),
      loadHelpers(path.join(this.options.input, this.options.helpers), this.engine),
    ]);
  }

  /**
   * Load built-in helper functions.
   */
  loadBultins() {
    this.engine.registerHelper('ifequal', require('../helpers/ifEqual'));
    this.engine.registerHelper('markdown', require('../helpers/markdown'));
    this.engine.registerHelper('repeat', require('../helpers/repeat'));
    this.engine.registerHelper('code', require('../helpers/code'));
  }

  /**
   * Render a Handlebars page and layout.
   * @param {String} pageBody - Handlebars template string.
   * @param {Object} pageData - Handlebars context.
   * @param {Object} file - Vinyl source file.
   * @returns {String} Rendered page.
   */
  render(pageBody, pageData, file) {
    const layoutTemplate = this.layouts[pageData.layout];

    try {
      const pageTemplate = this.engine.compile(pageBody + '\n');

      if (!layoutTemplate) {
        if (pageData.layout === 'default') {
          throw new Error('You must have a layout named "default".');
        }
        else {
          throw new Error(`No layout named "${pageData.layout}" exists.`);
        }
      }

      // Add special ad-hoc partials for #ifpage and #unlesspage
      this.engine.registerHelper('ifpage', ifPage(pageData.page));
      this.engine.registerHelper('unlesspage', unlessPage(pageData.page));

      // Finally, add the page as a partial called "body", and render the layout template
      this.engine.registerPartial('body', pageTemplate);
      return layoutTemplate(pageData);
    }
    catch (e) {
      if (layoutTemplate) {
        // If the page had a rendering error, print the error and insert it into the layout
        this.engine.registerPartial('body', 'Panini: template could not be parsed.<br>\n<pre>{{error}}</pre>');
        return layoutTemplate({ error: e });
      }
      else {
        // If the layout had a rendering error, print the error in place of the layout
        return `<!DOCTYPE html><html><head><title>Panini error</title></head><body><pre>${e}</pre></body></html>`;
      }
    }
  }
}

HandlebarsEngine.features = ['layouts', 'partials', 'helpers'];

module.exports = HandlebarsEngine;
