'use strict';

const path = require('path');
const expect = require('chai').expect;
const processRoot = require('../lib/process-root');
const loadEngine = require('../lib/load-engine');

describe('processRoot()', () => {
  it('returns an empty string if both paths are on the same level', () => {
    const pagePath = path.join(process.cwd(), 'src/pages/index.html');
    expect(processRoot(pagePath, 'src/pages')).to.equal('');
  });

  it('returns a path prefix if paths are on different levels', () => {
    const pagePath = path.join(process.cwd(), 'src/pages/about/index.html');
    expect(processRoot(pagePath, 'src/pages')).to.equal('../');
  });
});

describe('loadEngine()', () => {
  it('loads a built-in engine', () => {
    expect(loadEngine('handlebars')).to.be.a('function');
  });

  it('throws an error if a string is not provided', () => {
    expect(() => loadEngine(null)).to.throw(TypeError);
  });

  it('throws an error if engine does not exist', () => {
    expect(() => loadEngine('nope')).to.throw(Error);
  });
});
