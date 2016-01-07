import { src, dest } from 'vinyl-fs';
import panini from '../index';
import assert from 'assert';
import equal from 'assert-dir-equal';

const FIXTURES = 'test/fixtures/';

describe('Panini', function() {
  it('builds a page with a default layout', function(done) {
    src(FIXTURES + 'basic/pages/*')
      .pipe(panini({
        root: FIXTURES + 'basic/pages/',
        layouts: FIXTURES + 'basic/layouts'
      }))
      .pipe(dest(FIXTURES + 'basic/build'))
      .on('data', data => {
        console.log(data);
      })
      .on('end', () => {
        equal(FIXTURES + 'basic/expected', FIXTURES + 'basic/build');
        done();
      });
  });
});
