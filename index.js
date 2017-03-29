'use strict';

const getConfig = require('flexiconfig');
const Panini = require('./lib/panini');

let panini;

/**
 * Gulp stream function that renders HTML pages. The first time the function is invoked in the stream, a new instance of Panini is created with the given options.
 * @param {string} src - Base folder for project.
 * @param {object} options - Configuration options to pass to the new Panini instance.
 * @param {boolean} singleton - Return a new Panini instance instead of the cached one.
 * @returns {Object} Transform stream with rendered files.
 */
module.exports = function (src, opts, singleton) {
  let inst;

  if (!panini || singleton) {
    let options;

    try {
      options = getConfig(['package.json#panini', opts]);
    } catch (err) {
      options = {};
    }

    options.input = src;
    inst = new Panini(options);
    inst.refresh();
  }

  if (!singleton) {
    panini = inst;
  }

  // Compile pages with the above helpers
  return inst.getSourceStream().pipe(inst.render());
};

module.exports.Panini = Panini;
