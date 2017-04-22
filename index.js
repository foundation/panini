'use strict';

const path = require('path');
const getConfig = require('flexiconfig');
const chalk = require('chalk');
const watcher = require('glob-watcher');
const assign = require('lodash.assign');
const Panini = require('./lib/panini');

/**
 * Wrapper class to set up and run Panini.
 */
module.exports = class {
  /**
   * Initialize Panini.
   * @param {String} input - Input directory.
   * @param {String} output - Output directory.
   * @param {Object} [opts] - Panini configuration. Overrides any configuration in `package.json`.
   */
  constructor(input, output, opts) {
    let options;
    try {
      options = getConfig([opts, 'package.json#panini']);
    } catch (err) {
      options = {};
    }

    this.panini = new Panini(assign(options, {input}));
    this.panini.refresh();
    this.output = output;
  }

  /**
   * Compile a Panini site.
   * @returns {Promise} Promise which resolves when building is done, or rejects if there's a fatal error.
   */
  build() {
    return new Promise((resolve, reject) => {
      this.panini.compile(this.output)
        .on('finish', resolve)
        .on('error', reject);
    });
  }

  /**
   * Enable file watching. Adding or changing assets in your project will trigger a re-compile of the entire site.
   * @returns {Object} Self.
   */
  watch() {
    const pageRoot = path.join(process.cwd(), this.panini.options.input, this.panini.options.pages);

    watcher(path.join(pageRoot, '**/*.*'), {ignoreInitial: true}, () => {
      return this.build();
    }).on('change', filePath => {
      console.log(`\n${chalk.cyan('❯')} ${path.relative(pageRoot, filePath)} changed.\n`);
    });

    return this;
  }
};

// Cached Panini instance used by Gulp plugin
let panini;

/**
 * Gulp stream function that renders HTML pages. The first time the function is invoked in the stream, a new instance of Panini is created with the given options.
 * @param {string} src - Base folder for project.
 * @param {object} options - Configuration options to pass to the new Panini instance.
 * @param {boolean} singleton - Return a new Panini instance instead of the cached one.
 * @returns {Object} Transform stream with rendered files.
 */
module.exports.gulp = function (src, opts, singleton) {
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
  const stream = inst.compile();
  stream._panini = inst;
  return stream;
};

module.exports.Panini = Panini;
