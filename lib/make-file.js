'use strict';

/**
 * Clone a Vinyl file, setting locale data and optionally replacing the file path.
 * @param {Object} file - Vinyl file to copy.
 * @param {String} locale - Locale to assign to file.
 * @param {String} [path] - Path to change file to.
 * @returns {Object} Modified Vinyl file.
 */
module.exports = (file, locale, path) => {
  const newFile = file.clone();

  if (path) {
    // Insert the language code at the base of the path
    newFile.path = path;
  }

  // The `paniniLocale` key is used to correctly render translation strings
  if (newFile.data) {
    newFile.data.paniniLocale = locale;
  } else {
    newFile.data = {paniniLocale: locale};
  }

  return newFile;
};
