'use strict';

const fm = require('front-matter');
const through = require('through2');
const assign = require('lodash.assign');
const replaceExt = require('replace-ext');

/**
 * Create a transform stream to render a set of pages to HTML.
 *
 * Rendering is a two-step process. First, every page is parsed and stored in a temporary array. Then, once every page has been parsed, they're all converted to HTML in parallel.
 *
 * @returns {function} Stream transform function.
 */
module.exports = function () {
  const inst = this;
  const pages = [];

  return through.obj((file, enc, cb) => {
    inst.onReady().then(() => {
      inst.emit('parsing');
      const page = parse.call(inst, file);
      pages.push(page);
      cb();
    });
  }, function (cb) {
    inst.emit('building');
    build.call(inst, pages, this, cb);
  });
};

/**
 * Get the body and data of a page and store it for later rendering to HTML. This is a stream transform function.
 * @param {object} file - Vinyl file being parsed.
 */
function parse(file) {
  // Get the HTML for the current page and layout
  const page = fm(file.contents.toString());

  // Assemble data for template
  const pageData = this.getPageData(file, page.attributes);

  // Return page so it can be added to the stack
  return [file, page.body, pageData];
}

/**
 * Build all pages that have been parsed and write them to disk. This is a stream flush function.
 * @param {object[]} pages - Pages to build.
 * @param {object} stream - Object stream.
 * @param {function} cb - Callback to run when all files have been written to disk.
 */
function build(pages, stream, cb) {
  const tasks = pages.map(page => {
    // Pull file info out of temporary storage
    const file = page[0];
    const pageBody = page[1];
    const pageData = assign({}, page[2], {pages}); // Insert complete list of pages into each data context

    return Promise.resolve(this.engine.render(pageBody, pageData, file))
      .then(contents => {
        const newFile = file.clone();
        newFile.path = replaceExt(file.path, '.html');
        newFile.contents = Buffer.from(contents);
        stream.push(newFile);
      });
  });

  Promise.all(tasks)
    .then(() => {
      this.emit('built');
      cb();
    })
    .catch(cb);
}
