'use strict';

const path = require('path');

/**
 * Find a matching transform for a file, if it exists.
 * @param {String} filePath - File to test.
 * @param {Object} transforms - Transform config. Comes from the `options.transform` property of a Panini instance.
 * @returns {?TransformDefinition} Matched transforms, or `null` if none were found.
 */
module.exports = (filePath, transforms, kind) => {
  kind = kind || 'before';
  const transform = transforms[path.extname(filePath)];

  if (!transform) {
    return null;
  }

  if (kind === 'before') {
    if (Array.isArray(transform)) {
      return transform;
    }

    if (Array.isArray(transform.before)) {
      return transform.before;
    }
  } else if (kind === 'after') {
    if (Array.isArray(transform.after)) {
      return transform.after;
    }
  }

  return null;
};
