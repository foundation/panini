'use strict';

const path = require('path');
const matchSpecificPath = require('match-specific-path');
const folders = require('./folders');

module.exports = (file, attributes, options) => {
  if (attributes.layout) {
    return attributes.layout;
  }

  if (options.pageLayouts) {
    const basePath = path.relative(
      path.join(options.input, folders.pages),
      path.dirname(file.path)
    );
    const pageLayouts = Object.keys(options.pageLayouts);
    const match = matchSpecificPath(pageLayouts, basePath);

    if (match) {
      return options.pageLayouts[match];
    }
  }

  return 'default';
};
