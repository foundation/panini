'use strict';

const path = require('path');
const fm = require('front-matter');
const through = require('through2');
const assign = require('lodash.assign');
const replaceExt = require('replace-ext');
const pathInsert = require('path-insert');
const transformFile = require('./transform-file');

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
    // Wait until the `setup()` function of the rendering engine is done
    inst.onReady().then(() => {
      inst.emit('parsing');

      if (this.engine.i18n) {
        // For sites using i18n, the file is duplicated, once for each locale
        Promise.all(makeLocaleFiles.call(inst, file).map(f => {
          return parse.call(inst, f).then(res => {
            pages.push(res);
          });
        }))
          .then(() => cb())
          .catch(err => cb(err));
      } else {
        parse.call(inst, file).then(res => {
          pages.push(res);
          cb();
        }).catch(err => cb(err));
      }
    });
  }, function (cb) {
    inst.emit('building');
    build.call(inst, pages, this, cb);
  });
};

/**
 * Duplicate the file for a single page so there's one for each locale. The base path of the file is modified to insert the locale as a folder. So, `index.html` becomes `en/index.html`, `es/index.html`, `jp/index.html`, and so on.
 * @param {Object} file - Vinyl file.
 * @returns {Object[]} Locale-specific versions of file.
 */
function makeLocaleFiles(file) {
  const base = path.join(process.cwd(), this.options.input, this.options.pages);

  return this.engine.locales.map(locale => {
    const newFile = file.clone();

    // Insert the language code at the base of the path
    newFile.path = pathInsert.start(file.path, base, locale);

    // The `paniniLocale` key is used to correctly render translation strings
    if (newFile.data) {
      newFile.data.paniniLocale = locale;
    } else {
      newFile.data = {paniniLocale: locale};
    }
    return newFile;
  });
}

/**
 * Get the body and data of a page and store it for later rendering to HTML. This is a stream transform function.
 * @param {object} file - Vinyl file being parsed.
 */
function parse(file) {
  // Get the HTML for the current page and layout
  const page = fm(file.contents.toString());

  // Assemble data for template
  const pageData = this.getPageData(file, page.attributes);

  // Apply transforms if needed
  const transform = this.options.transform[path.extname(file.path).replace(/^\./, '')];
  if (transform) {
    return transformFile(file, transform).then(pageBody => [file, pageBody, pageData]);
  }

  // Return page so it can be added to the stack
  return Promise.resolve([file, page.body, pageData]);
}

/**
 * Build all pages that have been parsed and write them to disk. This is a stream flush function.
 * @param {object[]} pages - Pages to build.
 * @param {object} stream - Object stream.
 * @param {function} cb - Callback to run when all files have been written to disk.
 */
function build(pages, stream, cb) {
  let errorCount = 0;

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

        if (contents.indexOf('<!-- __PANINI_ERROR__ -->') > -1) {
          errorCount += 1;
        }
      });
  });

  Promise.all(tasks)
    .then(() => {
      this.emit('built', pages.length, errorCount);
      cb();
    })
    .catch(cb);
}
