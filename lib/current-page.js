/**
 * Create a helper function to check if the current page is one of several values.
 * @param {String} pageName - Path of page the helper is being applied to.
 * @returns {CurrentPageFunction} `currentPage()` helper.
 */
module.exports = pageName => {
  /**
   * Check if the current page is one of several names.
   * @callback CurrentPageFunction
   * @param {...String} paths - Matching paths.
   * @returns {Boolean} `true` if current page is within `paths`, or `false` otherwise.
   */
  return function () {
    const pages = Array.from(arguments);
    return pages.indexOf(pageName) > -1;
  };
};
