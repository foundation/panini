'use strict';

/**
 * Load a Panini engine.
 * @param {String} engine - Engine to load.
 * @returns {Object} Engine class instance.
 */
module.exports = engine => {
  if (typeof engine !== 'string') {
    throw new TypeError('Panini\'s "engine" option must be a string.');
  }

  try {
    return require(`../engines/${engine}`);
  } catch (err) {
    throw new Error(`Could not load Panini engine "${engine}."`);
  }
};
