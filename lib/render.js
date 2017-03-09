var assign = require('lodash.assign');
var fm = require('front-matter');
var path = require('path');
var through = require('through2');
var processRoot = require('./processRoot');
var ifPage = require('../helpers/ifPage');
var unlessPage = require('../helpers/unlessPage');

/**
 * Create a transform stream to render a set of pages to HTML.
 *
 * Rendering is a two-step process. First, every page is parsed and stored in a temporary array. Then, once every page has been parsed, they're all converted to HTML in parallel.
 *
 * @returns {function} Stream transform function.
 */
module.exports = function() {
  var _this = this;
  this.pages = [];

  return through.obj(parse.bind(this), function(cb) {
    build.call(_this, this, cb);
  });
}

/**
 * Get the body and data of a page and store it for later rendering to HTML. This is a stream transform function.
 * @param {object} file - Vinyl file being parsed.
 * @param {string} enc - Vinyl file encoding.
 * @param {function} cb - Callback that passes the rendered page through the stream.
 */
function parse(file, enc, cb) {
  // Get the HTML for the current page and layout
  var page = fm(file.contents.toString());

  // Determine which layout to use
  var basePath = path.relative(
    path.join(this.options.input, this.options.pages),
    path.dirname(file.path)
  );
  var layout =
    page.attributes.layout
    || this.options.pageLayouts[basePath]
    || 'default';

  // Build Handlebars context
  var pageData = assign(
    {},
    // Global data
    this.data,
    // Data from Gulp stream plugins
    file.data || {},
    // Page-specific data
    page.attributes,
    // Constants
    {
      // Basename of file
      page: path.basename(file.path, '.html'),
      // Layout used by this page
      layout: layout,
      // Path prefix to root directory
      root: processRoot(file.path, path.join(this.options.input, this.options.pages))
    }
  );

  this.pages.push([file, page.body, pageData]);

  cb();
}

/**
 * Build all pages that have been parsed and write them to disk. This is a stream flush function.
 * @param {object} stream - Object stream.
 * @param {function} cb - Callback to run when all files have been written to disk.
 */
function build(stream, cb) {
  var tasks = this.pages.map(function(page) {
    // Pull file info out of temporary storage
    var file = page[0];
    var pageBody = page[1];
    var pageData = page[2];

    // Validate that the layout the page is referencing exists
    var layoutTemplate = this.layouts[pageData.layout];
    try {
      var pageTemplate = this.Handlebars.compile(pageBody + '\n');

      if (!layoutTemplate) {
        if (pageData.layout === 'default') {
          throw new Error('Panini error: you must have a layout named "default".');
        }
        else {
          throw new Error('Panini error: no layout named "'+pageData.layout+'" exists.');
        }
      }

      // Add special ad-hoc partials for #ifpage and #unlesspage
      this.Handlebars.registerHelper('ifpage', ifPage(pageData.page));
      this.Handlebars.registerHelper('unlesspage', unlessPage(pageData.page));

      // Finally, add the page as a partial called "body", and render the layout template
      this.Handlebars.registerPartial('body', pageTemplate);
      file.contents = new Buffer(layoutTemplate(pageData));
    }
    catch (e) {
      if (layoutTemplate) {
        // If the page had a rendering error, print the error and insert it into the layout
        this.Handlebars.registerPartial('body', 'Panini: template could not be parsed <br> \n <pre>{{error}}</pre>');
        file.contents = new Buffer(layoutTemplate({ error: e }));
      }
      else {
        // If the layout had a rendering error, print the error in place of the layout
        file.contents = new Buffer('<!DOCTYPE html><html><head><title>Panini error</title></head><body><pre>'+e+'</pre></body></html>');
      }
    }
    finally {
      stream.push(file);
    }
  }, this);

  Promise.all(tasks)
    .then(function() {
      cb();
    })
    .catch(cb);
}
