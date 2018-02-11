'use strict';

const path = require('path');
const through = require('through2');
const vfs = require('vinyl-fs');
const makeLocaleFiles = require('./make-locale-files');
const parsePage = require('./parse-page');
const folders = require('./folders');

/**
 * Create a transform stream to render a set of pages to HTML.
 *
 * Rendering is a two-step process. First, every page is parsed and stored in a temporary array. Then, once every page has been parsed, they're all converted to HTML in parallel.
 *
 * @returns {function} Stream transform function.
 * @this Panini
 */
module.exports = function () {
  const pages = [];

  return new Promise((resolve, reject) => {
    const transform = through.obj((file, enc, cb) => {
      if (this.engine.i18n) {
        // For sites using i18n, the file is duplicated, once for each locale
        Promise.all(makeLocaleFiles.call(this, file).map(f => {
          return parsePage.call(this, f).then(res => {
            pages.push(res);
          });
        }))
          .then(() => cb())
          .catch(err => cb(err));
      } else {
        parsePage.call(this, file).then(res => {
          pages.push(res);
          cb();
        }).catch(err => cb(err));
      }
    }, () => {
      resolve(pages);
    });

    vfs.src(path.join(
      this.options.input,
      folders.pages,
      '**/*.*'
    ))
      .pipe(this.engine.getCollectionStream())
      .pipe(transform)
      .on('error', reject);
  });
};
