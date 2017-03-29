'use strict';

const path = require('path');
const expect = require('chai').expect;
const processRoot = require('../lib/process-root');

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
