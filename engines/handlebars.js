'use strict';

const path = require('path');
const handlebars = require('handlebars');
const ifPage = require('../helpers/if-page');
const unlessPage = require('../helpers/unless-page');
const PaniniEngine = require('../lib/engine');

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
    this.compilerOpts = {
      preventIndent: true
    };

    if (this.options.builtins) {
      this.loadBultins();
    }
  }

  /**
   * Load layouts, partials, helpers, and data.
   * @returns {Promise} Promise which resolves when setup is done.
   */
  setup() {
    const mapFiles = PaniniEngine.mapFiles;
    const mapPaths = PaniniEngine.mapPaths;
    const extensions = '**/*.{html,hbs,handlebars}';
    this.layouts = {};

    return Promise.all([
      super.setup(),
      mapFiles(this.options.input, this.options.layouts, extensions, (filePath, contents) => {
        const name = path.basename(filePath, path.extname(filePath));
        this.layouts[name] = this.engine.compile(contents, this.compilerOpts);
      }),
      mapFiles(this.options.input, this.options.partials, extensions, (filePath, contents) => {
        const name = path.basename(filePath, path.extname(filePath));
        this.engine.registerPartial(name, contents + '\n');
      }),
      mapPaths(this.options.input, this.options.helpers, '**/*.js', filePath => {
        const name = path.basename(filePath, '.js');

        try {
          if (this.engine.helpers[name]) {
            delete require.cache[require.resolve(filePath)];
            this.engine.unregisterHelper(name);
          }

          const helper = require(filePath);
          this.engine.registerHelper(name, helper);
        } catch (err) {
          console.warn('Error when loading ' + name + '.js as a Handlebars helper.');
        }
      })
    ]);
  }

  /**
   * Load built-in helper functions.
   */
  loadBultins() {
    this.engine.registerHelper('ifequal', require('../helpers/if-equal'));
    this.engine.registerHelper('markdown', require('../helpers/markdown'));
    this.engine.registerHelper('repeat', require('../helpers/repeat'));
    this.engine.registerHelper('code', require('../helpers/code'));
  }

  /**
   * Render a Handlebars page and layout.
   * @param {String} pageBody - Handlebars template string.
   * @param {Object} pageData - Handlebars context.
   * @param {Object} [file] - Vinyl source file.
   * @returns {String} Rendered page.
   */
  render(pageBody, pageData) {
    const layoutTemplate = this.layouts[pageData.layout];

    try {
      const pageTemplate = this.engine.compile(pageBody + '\n');

      if (!layoutTemplate) {
        if (pageData.layout === 'default') {
          throw new Error('You must have a layout named "default".');
        } else {
          throw new Error(`No layout named "${pageData.layout}" exists.`);
        }
      }

      // Add special ad-hoc partials for #ifpage and #unlesspage
      this.engine.registerHelper('ifpage', ifPage(pageData.page));
      this.engine.registerHelper('unlesspage', unlessPage(pageData.page));

      // Finally, add the page as a partial called "body", and render the layout template
      this.engine.registerPartial('body', pageTemplate);
      return layoutTemplate(pageData);
    } catch (err) {
      if (layoutTemplate) {
        // If the page had a rendering error, print the error and insert it into the layout
        this.engine.registerPartial('body', 'Panini: template could not be parsed.<br>\n<pre>{{error}}</pre>');
        return layoutTemplate({error: err});
      }

        // If the layout had a rendering error, print the error in place of the layout
      return `<!DOCTYPE html><html><head><title>Panini error</title></head><body><pre>${err}</pre></body></html>`;
    }
  }
}

HandlebarsEngine.features = ['layouts', 'partials', 'helpers'];

module.exports = HandlebarsEngine;
