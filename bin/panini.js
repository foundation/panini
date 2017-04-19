#!/usr/bin/env node

'use strict';

const path = require('path');
const meow = require('meow');
const vfs = require('vinyl-fs');
const chalk = require('chalk');
const watcher = require('glob-watcher');
const Panini = require('..').Panini;

const cli = meow(`
  Usage
    $ panini <input> <output>

  Options
    -w, --watch  Watch for file changes

  Examples
    panini ./src ./dest
`, {
  alias: {
    w: 'watch'
  }
});

if (cli.input.length < 2) {
  cli.showHelp(1);
}

const panini = new Panini({input: cli.input[0]});
const pageRoot = path.join(process.cwd(), panini.options.input, panini.options.pages);
const compile = () => panini.compile().pipe(vfs.dest(cli.input[1]));

panini.refresh();
compile();

if (cli.flags.watch) {
  watcher(path.join(pageRoot, '**/*.*'), {ignoreInitial: true}, () => {
    return compile();
  }).on('change', filePath => {
    console.log(`\n${chalk.cyan('❯')} ${path.relative(pageRoot, filePath)} changed.\n`);
  });
}
