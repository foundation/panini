'use strict';

const path = require('path');
const pathInsert = require('path-insert');
const folders = require('./folders');
const getFileLocale = require('./get-file-locale');
const makeFile = require('./make-file');

/**
 * Duplicate the file for a single page so there's one for each locale. The base path of the file is modified to insert the locale as a folder. So, `index.html` becomes `en/index.html`, `es/index.html`, `jp/index.html`, and so on.
 * @param {Object} file - Vinyl file.
 * @returns {Object[]} Locale-specific versions of file.
 */
module.exports = function (file) {
  const base = path.join(process.cwd(), this.options.input, folders.pages);
  const locale = getFileLocale(base, file.path, this.engine.locales);

  // If a page is inside a locale folder, it won't be translated into the other languages
  if (locale) {
    return [makeFile(locale)];
  }

  // Pages not inside locale folders are translated once for each locale
  return this.engine.locales.map(locale => {
    const isRoot = locale === this.options.defaultLocale;
    const newPath = isRoot ?
      file.path :
      pathInsert.start(file.path, base, locale);
    return makeFile(locale, newPath);
  });
};
