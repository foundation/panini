'use strict';

const path = require('path');
const chalk = require('chalk');
const watcher = require('glob-watcher');
const Panini = require('./lib/panini');

/**
 * Wrapper class to set up and run Panini.
 */
module.exports = class {
  /**
   * Initialize Panini.
   * @param {String} input - Input directory.
   * @param {String} output - Output directory.
   * @param {Object} [options] - Panini configuration. Overrides any configuration in `package.json`.
   * @todo Move flexiconfig to core Panini class
   */
  constructor(input, output, options) {
    this.panini = new Panini(input, options);

    if (!this.panini.initialized) {
      throw new Error();
    }

    this.panini.setup();
    this.output = output;
  }

  /**
   * Compile a Panini site.
   * @returns {Promise} Promise which resolves when building is done, or rejects if there's a fatal error.
   */
  build() {
    return this.panini.compile(this.output);
  }

  /**
   * Enable file watching. Adding or changing assets in your project will trigger a re-compile of the entire site.
   * @returns {Object} Self.
   * @todo Add callback support.
   */
  watch() {
    const pageRoot = path.join(process.cwd(), this.panini.options.input, this.panini.options.pages);

    watcher(path.join(pageRoot, '**/*.*'), {ignoreInitial: true}, () => {
      return this.build();
    }).on('change', filePath => {
      if (!this.panini.options.quiet) {
        console.log(`\n${chalk.cyan('❯')} ${path.relative(pageRoot, filePath)} changed.\n`);
      }
    });

    return this;
  }
};

module.exports.Panini = Panini;
