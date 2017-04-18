'use strict';

const fs = require('fs');
const chokidar = require('chokidar');

/**
 * Create a file watcher that runs `update()` and `remove()` functions when files matching the a glob pattern are added, changed, or removed.
 * @param {Object} rule - File watching rules.
 * @param {(String|String[])} rule.pattern - Glob pattern to watch.
 * @param {Boolean} [rule.read=true] - Pass the contents of the changed file to the `update()` function.
 * @param {Function} [rule.update] - Function to run when a file is added or changed.
 * @param {Function} [rule.remove] - Function to run when a file is deleted.
 * @param thisArg - `this` to apply to `update()` and `remove()` functions.
 */
module.exports = (rule, thisArg) => {
  const run = (method, filePath) => {
    let contents;
    if (rule.read !== false && method === 'update') {
      contents = fs.readFileSync(filePath).toString();
    }

    if (method in rule) {
      rule[method].call(thisArg, filePath, contents);
    }
  };

  return chokidar.watch(rule.pattern)
    .on('add', filePath => run('update', filePath))
    .on('change', filePath => run('update', filePath))
    .on('unlink', filePath => run('remove', filePath));
};
