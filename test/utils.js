'use strict';

const path = require('path');
const expect = require('chai').expect;
const File = require('vinyl');
const transformFile = require('../lib/transform-file');
const getTransforms = require('../lib/get-transforms');

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

describe('get-transforms()', () => {
  const baseDir = path.join(process.cwd(), 'pages');
  const filePath = path.join(baseDir, 'index.hbs');
  const transform = ['gulp-markdown'];

  it('finds a transform matching an extension', () => {
    const config = {
      '.hbs': transform
    };

    expect(getTransforms(filePath, config, baseDir)).to.eql(transform);
  });
});
