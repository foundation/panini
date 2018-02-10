'use strict';

const through = require('through2');
const makeLocaleFiles = require('./make-locale-files');
const parsePage = require('./parse-page');
const buildPage = require('./build-page');

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
          return parsePage.call(inst, f).then(res => {
            pages.push(res);
          });
        }))
          .then(() => cb())
          .catch(err => cb(err));
      } else {
        parsePage.call(inst, file).then(res => {
          pages.push(res);
          cb();
        }).catch(err => cb(err));
      }
    });
  }, function (cb) {
    inst.emit('building');
    buildPage.call(inst, pages, this, cb);
  });
};
