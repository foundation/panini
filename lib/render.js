'use strict';

const fm = require('front-matter');
const through = require('through2');

/**
 * Create a transform stream to render a set of pages to HTML.
 *
 * Rendering is a two-step process. First, every page is parsed and stored in a temporary array. Then, once every page has been parsed, they're all converted to HTML in parallel.
 *
 * @returns {function} Stream transform function.
 */
module.exports = function () {
  const inst = this;
  this.pages = [];

  return through.obj((file, enc, cb) => {
    inst.onReady().then(() => {
      inst.emit('parsing');
      parse.call(inst, file, cb);
    });
  }, function (cb) {
    inst.emit('building');
    build.call(inst, this, cb);
  });
};

/**
 * Get the body and data of a page and store it for later rendering to HTML. This is a stream transform function.
 * @param {object} file - Vinyl file being parsed.
 * @param {function} cb - Callback that passes the rendered page through the stream.
 */
function parse(file, cb) {
  // Get the HTML for the current page and layout
  const page = fm(file.contents.toString());

  // Assemble data for template
  const pageData = this.getPageData(file, page.attributes);

  // Store page for later rendering
  this.pages.push([file, page.body, pageData]);

  cb();
}

/**
 * Build all pages that have been parsed and write them to disk. This is a stream flush function.
 * @param {object} stream - Object stream.
 * @param {function} cb - Callback to run when all files have been written to disk.
 */
function build(stream, cb) {
  const tasks = this.pages.map(page => {
    // Pull file info out of temporary storage
    const file = page[0];
    const pageBody = page[1];
    const pageData = page[2];

    return Promise.resolve(this.engine.render(pageBody, pageData, file))
      .then(contents => {
        file.contents = Buffer.from(contents);
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
