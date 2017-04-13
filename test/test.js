'use strict';

const {expect} = require('chai');
const dest = require('vinyl-fs').dest;
const equal = require('assert-dir-equal');
const assign = require('lodash.assign');
const panini = require('..');

const FIXTURES = 'test/fixtures/';
const p = (src, opts) => panini(src, assign({quiet: true}, opts), true);

describe('Panini', () => {
  it('builds a page with a default layout', done => {
    p(FIXTURES + 'basic')
      .pipe(dest(FIXTURES + 'basic/build'))
      .on('finish', () => {
        equal(FIXTURES + 'basic/expected', FIXTURES + 'basic/build');
        done();
      })
      .on('error', done);
  });

  it('builds a page with an alternate layout', done => {
    p(FIXTURES + 'layouts')
      .pipe(dest(FIXTURES + 'layouts/build'))
      .on('finish', () => {
        equal(FIXTURES + 'layouts/expected', FIXTURES + 'layouts/build');
        done();
      })
      .on('error', done);
  });

  it('builds a page with preset layouts by folder', done => {
    p(FIXTURES + 'page-layouts', {
      pageLayouts: {
        alternate: 'alternate'
      }
    })
      .pipe(dest(FIXTURES + 'page-layouts/build'))
      .on('finish', () => {
        equal(FIXTURES + 'page-layouts/expected', FIXTURES + 'page-layouts/build');
        done();
      })
      .on('error', done);
  });

  it('builds a page with custom partials', done => {
    p(FIXTURES + 'partials')
      .pipe(dest(FIXTURES + 'partials/build'))
      .on('finish', () => {
        equal(FIXTURES + 'partials/expected', FIXTURES + 'partials/build');
        done();
      })
      .on('error', done);
  });

  it('builds a page with Front Matter properties added as variables', done => {
    p(FIXTURES + 'front-matter')
      .pipe(dest(FIXTURES + 'front-matter/build'))
      .on('finish', () => {
        equal(FIXTURES + 'front-matter/expected', FIXTURES + 'front-matter/build');
        done();
      })
      .on('error', done);
  });

  it('builds a page with custom helpers', done => {
    p(FIXTURES + 'helpers')
      .pipe(dest(FIXTURES + 'helpers/build'))
      .on('finish', () => {
        equal(FIXTURES + 'helpers/expected', FIXTURES + 'helpers/build');
        done();
      })
      .on('error', done);
  });

  it('builds a page with external JSON data', done => {
    p(FIXTURES + 'data')
      .pipe(dest(FIXTURES + 'data/build'))
      .on('finish', () => {
        equal(FIXTURES + 'data/expected', FIXTURES + 'data/build');
        done();
      })
      .on('error', done);
  });
});

describe('Panini config', () => {
  const originalCwd = process.cwd();
  const config = require('./fixtures/config/package.json');

  before(() => {
    process.chdir(FIXTURES + 'config');
  });

  after(() => {
    process.chdir(originalCwd);
  });

  it('loads configuration from package.json', () => {
    const stream = p('src');
    expect(stream._panini.options.pages).to.equal(config.panini.pages);
  });
});
