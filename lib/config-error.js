'use strict';

const chalk = require('chalk');
const isEmptyObject = require('is-empty-object');

module.exports = (err, options) => {
  console.log(chalk.red.bold('There\'s an issue with how Panini is configured'));
  console.log(chalk.red(`  ${err}\n`));

  if (!isEmptyObject(options)) {
    console.log('This is what your Panini configuration looks like:');
    Object.keys(options).forEach(key => {
      console.log(`  ${chalk.blue(key)}: ${chalk.cyan(options[key])}`);
    });
    console.log('');
  }

  console.log('Double-check your configuration and try again.');
};
