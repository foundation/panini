'use strict';

const path = require('path');
const handlebars = require('handlebars');
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
        const name = path.relative(
          path.join(process.cwd(), this.options.input, this.options.partials),
          filePath
        ).replace(/\..*$/, '');
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
        } else {
          throw new Error(`No layout named "${pageData.layout}" exists.`);
        }
      }

      // Finally, add the page as a partial called "body", and render the layout template
      this.engine.registerPartial('body', pageTemplate);
      return layoutTemplate(pageData);
    } catch (err) {
      return this.error(err, file.path);
    }
  }
}

HandlebarsEngine.features = ['layouts', 'partials', 'helpers'];

module.exports = HandlebarsEngine;
