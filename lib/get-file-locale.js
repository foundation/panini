'use strict';

const path = require('path');

/**
 * Figure out if a page is specific to one locale based on its path. Pages that are locale-specific will not be rendered in every locale, just the one they're inside.
 * Let's say we have two locales, `en` and `jp`. A file under `src/pages/index.hbs` will be rendered in both locales. However, a file under `src/pages/en/index.hbs` will only be rendered once, for English. Likewise, a file under `src/pages/jp/index.hbs` will also only be rendered once, for Japanese.
 * For a file to be locale-specific, the first part of its path *after* the pages folder must be a locale in use. So, using the above examples, anything inside a top-level folder `en` or `jp` will be locale-specific. This also applies to any pages in subdirectories of these locale folders.
 *
 * @param {String} base - Base page path. This is the CWD + `options.input` + `options.pages`.
 * @param {String} filePath - Full path to source file being examined.
 * @param {String} locales - Locales in use. This is provided by the engine in use.
 * @returns {(String|Boolean)} Locale found, or `false` if page is generic.
 */
module.exports = (base, filePath, locales) => {
  const pagePath = path.relative(base, filePath);

  for (const i in locales) {
    if (pagePath.indexOf(`${locales[i]}/`) === 0) {
      return locales[i];
    }
  }

  return false;
};
