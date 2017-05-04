'use strict';

const path = require('path');

/**
 * Find a matching transform for a file, if it exists.
 * @param {String} filePath - File to test.
 * @param {Object} transforms - Transform config. Comes from the `options.transform` property of a Panini instance.
 * @returns {?TransformDefinition} Matched transforms, or `null` if none were found.
 */
module.exports = (filePath, transforms) => {
  const transform = transforms[path.extname(filePath)];

  return transform || null;
};
