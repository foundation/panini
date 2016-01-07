import { src, dest } from 'vinyl-fs';
import assert from 'assert';
import equal from 'assert-dir-equal';
import { Panini } from '..';

const FIXTURES = 'test/fixtures/';

describe('Panini', function() {
  it('builds a page with a default layout', function(done) {
    var p = new Panini({
      root: FIXTURES + 'basic/pages/',
      layouts: FIXTURES + 'basic/layouts'
    });

    p.refresh();

    src(FIXTURES + 'basic/pages/*')
      .pipe(p.render())
      .pipe(dest(FIXTURES + 'basic/build'))
      .on('finish', () => {
        equal(FIXTURES + 'basic/expected', FIXTURES + 'basic/build');
        done();
      });
  });

  it('builds a page with a custom layout', function(done) {
    var p = new Panini({
      root: FIXTURES + 'layouts/pages/',
      layouts: FIXTURES + 'layouts/layouts/'
    });

    p.refresh();

    src(FIXTURES + 'layouts/pages/*')
      .pipe(p.render())
      .pipe(dest(FIXTURES + 'layouts/build'))
      .on('finish', () => {
        equal(FIXTURES + 'layouts/expected', FIXTURES + 'layouts/build');
        done();
      });
  });

  xit('builds a page with custom partials', function(done) {

  });

  it('builds a page with custom data', function(done) {
    var p = new Panini({
      root: FIXTURES + 'data/pages/',
      layouts: FIXTURES + 'data/layouts/',
      partials: FIXTURES + 'data/partials/'
    });

    p.refresh();

    src(FIXTURES + 'data/pages/*')
      .pipe(p.render())
      .pipe(dest(FIXTURES + 'data/build'))
      .on('finish', () => {
        equal(FIXTURES + 'data/expected', FIXTURES + 'data/build');
        done();
      });
  });

  xit('builds a page with custom helpers', function(done) {

  });

  xit('builds a page with external data', function(done) {

  });
});

describe('Panini variables', function() {
  xit('{{page}} variable that stores the current page', function(done) {

  });

  xit('{{layout}} variable that stores the current layout', function(done) {
    
  });

  xit('{{root}} variable that stores a relative path to the root folder', function(done) {
    
  });
});

describe('Panini helpers', function() {
  xit('#code helper that renders code blocks', function(done) {

  });

  xit('#ifEqual helper that compares two values', function(done) {

  });

  xit('#ifPage helper that checks the current page', function(done) {

  });

  xit('#markdown helper that converts Markdown to HTML', function(done) {

  });

  xit('#repeat helper that prints content multiple times', function(done) {

  });

  xit('#unlessPage helper that checks the current page', function(done) {

  });
});
