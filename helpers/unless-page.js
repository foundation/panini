'use strict';

/**
 * Generates a Handlebars block helper called #unlesspage for use in templates. This helper must be re-generated for every page that's rendered, because the return value of the function is dependent on the name of the current page.
 * @param {string} pageName - Name of the page to use in the helper function.
 * @returns {function} A Handlebars helper function.
 */
module.exports = function (pageName) {
  /**
   * Handlebars block helper that renders the content inside of it based on the current page.
   * @param {string...} pages - One or more pages to check.
   * @param (object) options - Handlebars object.
   * @example
   * {{#unlesspage 'index', 'about'}}This must NOT be the index or about page.{{/unlesspage}}
   * @return The content inside the helper if no page matches, or an empty string if a page does match.
   */
  return function () {
    const params = Array.prototype.slice.call(arguments);
    const pages = params.slice(0, -1);
    const options = params[params.length - 1];

    for (const i in pages) {
      if (pages[i] === pageName) {
        return '';
      }
    }

    return options.fn(this);
  };
};
