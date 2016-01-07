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
});
