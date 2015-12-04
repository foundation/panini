var extend = require('util')._extend;
var fm = require('front-matter');
var path = require('path');
var through = require('through2');
var processRoot = require('./processRoot');

/**
 * Renders a page with a layout. The page also has access to any loaded partials, helpers, or data.
 * @param {object} file - Vinyl file being parsed.
 * @param {string} enc - Vinyl file encoding.
 * @param {function} cb - Callback that passes the rendered page through the stream.
 */
module.exports = function(file, enc, cb) {
  try {
    // Get the HTML for the current page and layout
    var page = fm(file.contents.toString());
    
    // Get Layout
    var layout = page.attributes.layout || 'default';
    var layoutTemplate = this.layouts[layout];

    if (!layoutTemplate) {
      if (layout === 'default') {
        throw new Error('Panini error: you must have a layout named "default".');
      }
      else {
        throw new Error('Panini error: no layout named "'+layout+'" exists.');
      }
    }
    
    // Now create Handlebars templates out of them
    var pageTemplate = this.Handlebars.compile(page.body + '\n');

    // Next, extend the existing data object to include this page's metadata
    pageData = page.attributes;
    pageData = extend(pageData, {
      page: path.basename(file.path, '.html'),
      layout: layout,
      root: processRoot(file.path, this.options.root)
    });
    pageData = extend(pageData, this.data);

    // Add special ad-hoc partials for #ifpage and #unlesspage
    this.Handlebars.registerHelper('ifpage', require('../helpers/ifPage')(pageData.page));
    this.Handlebars.registerHelper('unlesspage', require('../helpers/unlessPage')(pageData.page));

    // Finally, add the page as a partial called "body", and render the layout template
    this.Handlebars.registerPartial('body', pageTemplate);
    file.contents = new Buffer(layoutTemplate(pageData));
    
  }
  catch (e) {
    if (layoutTemplate) {
      // Layout was parsed properly so we can insert the error message into the body of the layout
      this.Handlebars.registerPartial('body', 'Panini error: template could not be parsed <br> \n <pre>{{error}}</pre>');
      file.contents = new Buffer(layoutTemplate({error:e}));
    }
    else {
      // Not even once - write error directly into the HTML output so the user gets an error
      // Maintain basic html structure to allow Livereloading scripts to be injected properly
      file.contents = new Buffer('<!DOCTYPE html><html><head><title>Panini error</title></head><body><pre>'+e+'</pre></body></html>');
    }
    // Log the error into console
    console.log('Panini error: rendering error ocurred.\n',e);
    
  }
  finally {
    // This sends the modified file back into the stream
    cb(null, file);   
  }
}
