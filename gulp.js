'use strict';

const Panini = require('./lib/panini');

/**
 * Create a cached instance of Panini. The first time this function is called, it will create an instance of Panini and return the stream transform function. On subsequent calls, the cached instance's stream transform function will be returned.
 * @returns {PaniniStreamFunction} Panini transform stream function.
 */
const create = () => {
  let panini;

  /**
   * Compile a Panini project located at `src`.
   * @param {String} input - Input folder.
   * @param {Object} [options] - Panini options. These will override any settings in `package.json`.
   * @returns {Object} Stream compile function.
   */
  return (input, options) => {
    if (!panini) {
      panini = new Panini(input, Object.assign({}, options));
      panini.setup();
    }

    const stream = panini.compileStream();
    // This lil guy is mostly used for testing, so we can inspect the underlying Panini instance
    stream._panini = panini;
    return stream;
  };
};

// This is the main way Panini is used with Gulp
module.exports = create();

// If you need multiple instances of Panini in one Gulpfile, this function can be used instead
module.exports.create = create;
