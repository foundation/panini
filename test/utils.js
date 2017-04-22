'use strict';

const path = require('path');
const expect = require('chai').expect;
const File = require('vinyl');
const transformFile = require('../lib/transform-file');

describe('transformFile()', () => {
  it('transforms a set of files', () => {
    const file = new File({
      path: path.join(process.cwd(), 'index.md'),
      contents: Buffer.from('# Hello.')
    });
    const transforms = ['gulp-markdown'];

    return transformFile(file, transforms).then(res => {
      expect(res).to.contain('<h1');
    });
  });

  it('applies arguments to a plugin function', () => {
    const file = new File({
      path: path.join(process.cwd(), 'index.md'),
      contents: Buffer.from('<p>Hello.</p>')
    });
    const transforms = [['gulp-markdown', {sanitize: true}]];

    return transformFile(file, transforms).then(res => {
      expect(res).to.contain('&lt;');
    });
  });
});
