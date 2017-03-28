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

  return through.obj(function() {
    var args = arguments;
    _this.onReady().then(function() {
      _this.emit('parsing');
      parse.apply(_this, args);
    });
  }, function(cb) {
    _this.emit('building');
    build.apply(_this, [this, cb]);
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
    this.engine.data,
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
  var tasks = this.pages.map(page => {
    // Pull file info out of temporary storage
    var file = page[0];
    var pageBody = page[1];
    var pageData = page[2];

    Promise.resolve(this.engine.render(pageBody, pageData, file))
      .then(contents => {
        file.contents = new Buffer(contents);
        stream.push(file);
      });
  });

  Promise.all(tasks)
    .then(() => {
      this.emit('built');
      cb();
    })
    .catch(cb);
}
