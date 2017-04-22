#!/usr/bin/env node

'use strict';

const meow = require('meow');
const Panini = require('..');

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

const panini = new Panini(cli.input[0], cli.input[1]);
panini.build();

if (cli.flags.watch) {
  panini.watch();
}
