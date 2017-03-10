var panini;
var Panini = require('./lib/panini');
var getConfig = require('flexiconfig');

/**
 * Gulp stream function that renders HTML pages. The first time the function is invoked in the stream, a new instance of Panini is created with the given options.
 * @param {string} src - Base folder for project.
 * @param {object} options - Configuration options to pass to the new Panini instance.
 * @param {boolean} singleton - Return a new Panini instance instead of the cached one.
 * @returns {Object} Transform stream with rendered files.
 */
module.exports = function(src, opts, singleton) {
  if (!panini || singleton) {
    var options;

    try {
      var options = getConfig(['package.json#panini', opts]);
    }
    catch (e) {
      options = {};
    }

    options.input = src;
    var inst = new Panini(options);
    inst.refresh();

    if (!singleton) {
      panini = inst;
      module.exports.refresh = inst.refresh.bind(inst);
    }
  }

  // Compile pages with the above helpers
  return inst.getSourceStream().pipe(inst.render());
}

module.exports.Panini = Panini;
module.exports.refresh = function() {};
