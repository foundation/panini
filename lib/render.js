var extend = require('deepmerge');
var fm = require('front-matter');
var path = require('path');
var through = require('through2');
var processRoot = require('./utils').processRoot;
var transformFile = require('./utils').transformFile;
var minimatch = require('minimatch');

module.exports = function() {
  return through.obj(render.bind(this));
}

/**
 * Renders a page with a layout. The page also has access to any loaded partials, helpers, or data.
 * @param {object} file - Vinyl file being parsed.
 * @param {string} enc - Vinyl file encoding.
 * @param {function} cb - Callback that passes the rendered page through the stream.
 */
function render(file, enc, cb) {
  var pageData, _this = this;

  // Get the HTML for the current page and layout
  var page = fm(file.contents.toString());

  // Determine which layout to use
  var basePath = path.relative(this.options.root, path.dirname(file.path));
  var layout =
    page.attributes.layout ||
    this.options.pageLayouts[basePath] ||
    'default';
  var layoutTemplate = this.layouts[layout];

  // Throw errors if a layout doesn't exist
  if (!layoutTemplate) {
    if (layout === 'default') {
      throw new Error('Panini error: you must have a layout named "default".');
    }
    else {
      throw new Error('Panini error: no layout named "'+layout+'" exists.');
    }
  }

  // Build page data with globals
  pageData = extend({}, this.data);

  // Add any data from stream plugins
  pageData = (file.data) ? extend(pageData, file.data) : pageData;

  // Add this page's front matter
  pageData = extend(pageData, page.attributes);

  // Finish by adding constants
  pageData = extend(pageData, {
    page: path.basename(file.path, '.html'),
    layout: layout,
    root: processRoot(file.path, this.options.root)
  });

  // Add special ad-hoc partials for #ifpage and #unlesspage
  this.Handlebars.registerHelper('ifpage',
    require('../helpers/ifPage')(pageData.page));
  this.Handlebars.registerHelper('unlesspage',
    require('../helpers/unlessPage')(pageData.page));

  // Check for an applicable transform
  var transformed = false;
  for (var glob in this.options.transform) {
    if (minimatch(file.path, glob)) {
      transformed = true;
      file.contents = new Buffer(page.body);

      transformFile(file, this.options.transform[glob], function(f) {
        page.body = f.contents.toString();
        compilePage.call(_this);
      });

      break;
    }
  }

  if (!transformed) {
    compilePage.call(this);
  }

  function compilePage() {
    // Catch errors that can happen when compiling the templates
    try {
      var pageTemplate = this.Handlebars.compile(page.body + '\n');

      // Add the page as a partial called "body", and render the layout template with that partial in tow
      this.Handlebars.registerPartial('body', pageTemplate);
      file.contents = new Buffer(layoutTemplate(pageData));

      // This sends the modified file back into the stream
      cb(null, file);
    }
    catch (e) {
      // Layout was parsed properly, so we can insert the error message into the body of the layout
      if (layoutTemplate) {
        this.Handlebars.registerPartial('body', 'Panini: template could not be parsed <br> \n <pre>{{error}}</pre>');
        file.contents = new Buffer(layoutTemplate({ error: e }));
      }
      // If there's no layout to insert an error into, make the entire page the error
      else {
        file.contents = new Buffer('<!doctype html><html><head><title>Panini error</title></head><body><pre>'+e+'</pre></body></html>');
      }

      // Log the error to the console
      console.log('Panini: rendering error ocurred.\n', e);

      // This sends the modified file back into the stream
      cb(null, file);
    }
  }
}
