'use strict';

const stream = require('stream');
const buildPage = require('./build-page');

module.exports = class PageStream extends stream.Readable {
  constructor(engine, transformConfig) {
    super({
      objectMode: true
    });
    this.engine = engine;
    this.transformConfig = transformConfig;
  }

  build(pages) {
    return buildPage(pages, this.engine, this.transformConfig, page => this.push(page));
  }

  _read() {}
};
