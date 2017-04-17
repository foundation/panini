'use strict';

const expect = require('chai').expect;
const loadEngine = require('../lib/load-engine');

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
