'use strict';

const path = require('path');
const expect = require('chai').expect;
const panini = require('..');

describe('render()', () => {
  let file;

  before(done => {
    panini('test/fixtures/basic', {quiet: true}, true)
      .once('data', data => {
        file = data;
        done();
      })
      .on('error', done);
  });

  it('changes the extension of the file to .html', () => {
    expect(path.extname(file.path)).to.equal('.html');
  });
});
