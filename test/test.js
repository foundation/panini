'use strict';

const expect = require('chai').expect;
const assign = require('lodash.assign');
const snapshot = require('snap-shot');
const panini = require('..');

const fixtures = 'test/fixtures';
const testFixture = (src, opts) => new Promise((resolve, reject) => {
  panini(`${fixtures}/${src}`, assign({quiet: true}, opts), true)
    .once('data', data => {
      resolve(data.contents.toString());
    })
    .on('error', reject);
});

describe('Panini', () => {
  it('builds a page with a default layout', () => {
    return testFixture('basic').then(page => snapshot(page));
  });

  it('builds a page with an alternate layout', () => {
    return testFixture('layouts').then(page => snapshot(page));
  });

  it('builds a page with preset layouts by folder', () => {
    const opts = {
      pageLayouts: {
        alternate: 'alternate'
      }
    };
    return testFixture('page-layouts', opts).then(page => snapshot(page));
  });

  it('builds a page with custom partials', () => {
    return testFixture('partials').then(page => snapshot(page));
  });

  it('builds a page with Front Matter properties added as variables', () => {
    return testFixture('front-matter').then(page => snapshot(page));
  });

  it('builds a page with custom helpers', () => {
    return testFixture('helpers').then(page => snapshot(page));
  });

  it('builds a page with external JSON data', () => {
    return testFixture('data').then(page => snapshot(page));
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
