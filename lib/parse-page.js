'use strict';

const fm = require('front-matter');
const stripBom = require('strip-bom');
const getTransforms = require('./get-transforms');
const transformFile = require('./transform-file');

/**
 * Get the body and data of a page and store it for later rendering to HTML. This is a stream transform function.
 * @param {object} file - Vinyl file being parsed.
 */
module.exports = function (file) {
  let page;
  let error;

  // Get the HTML for the current page and layout
  try {
    page = fm(file.contents.toString());
  } catch (err) {
    if (err.name === 'YAMLException') {
      error = {
        type: 'yaml',
        error: err
      };
    }

    page = {
      attributes: {},
      body: ''
    };
  }

  // Assemble data for template
  const pageData = this.getPageData(file, page.attributes, error);

  // Apply transforms if needed
  const transform = getTransforms(file.path, this.options.transform);
  if (transform) {
    return transformFile(file, transform).then(pageBody => [file, stripBom(pageBody), pageData]);
  }

  // Return page so it can be added to the stack
  return Promise.resolve([file, stripBom(page.body), pageData]);
};
