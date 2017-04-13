'use strict';

const expect = require('chai').expect;
const dest = require('vinyl-fs').dest;
const assertDirEqual = require('assert-dir-equal');
const assign = require('lodash.assign');
const panini = require('..');

const fixtures = 'test/fixtures';
const testFixture = (src, opts) => new Promise((resolve, reject) => {
  panini(`${fixtures}/${src}`, assign({quiet: true}, opts), true)
    .pipe(dest(`${fixtures}/${src}/build`))
    .on('finish', () => {
      assertDirEqual(`${fixtures}/${src}/build`, `${fixtures}/${src}/expected`);
      resolve();
    })
    .on('error', reject);
});

describe('Panini', () => {
  it('builds a page with a default layout', () => {
    return testFixture('basic');
  });

  it('builds a page with an alternate layout', () => {
    return testFixture('layouts');
  });

  it('builds a page with preset layouts by folder', () => {
    return testFixture('page-layouts', {
      pageLayouts: {
        alternate: 'alternate'
      }
    });
  });

  it('builds a page with custom partials', () => {
    return testFixture('partials');
  });

  it('builds a page with Front Matter properties added as variables', () => {
    return testFixture('front-matter');
  });

  it('builds a page with custom helpers', () => {
    return testFixture('helpers');
  });

  it('builds a page with external JSON data', () => {
    return testFixture('data');
  });
});

describe('Panini config', () => {
  const originalCwd = process.cwd();
  const config = require('./fixtures/config/package.json');

  before(() => {
    process.chdir(`${fixtures}/config`);
  });

  after(() => {
    process.chdir(originalCwd);
  });

  it('loads configuration from package.json', () => {
    const stream = panini('src', {quiet: true}, true);
    expect(stream._panini.options.pages).to.equal(config.panini.pages);
  });
});
