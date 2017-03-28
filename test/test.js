import { src, dest } from 'vinyl-fs';
import assert from 'assert';
import equal from 'assert-dir-equal';
import assign from 'lodash.assign';
import panini from '..';

const FIXTURES = 'test/fixtures/';

const p = (src, opts) => panini(src, assign({ quiet: true }, opts), true);

describe('Panini', () => {
  it('builds a page with a default layout', done => {
    p(FIXTURES + 'basic')
      .pipe(dest(FIXTURES + 'basic/build'))
      .on('finish', () => {
        equal(FIXTURES + 'basic/expected', FIXTURES + 'basic/build');
        done();
      })
      .on('error', done);
  });

  it('builds a page with a custom layout', done => {
    p(FIXTURES + 'layouts')
      .pipe(dest(FIXTURES + 'layouts/build'))
      .on('finish', () => {
        equal(FIXTURES + 'layouts/expected', FIXTURES + 'layouts/build');
        done();
      })
      .on('error', done);
  });

  it('builds a page with preset layouts by folder', done => {
    p(FIXTURES + 'page-layouts', {
      pageLayouts: {
        'alternate': 'alternate'
      }
    })
      .pipe(dest(FIXTURES + 'page-layouts/build'))
      .on('finish', () => {
        equal(FIXTURES + 'page-layouts/expected', FIXTURES + 'page-layouts/build');
        done();
      })
      .on('error', done);
  });

  it('builds a page with custom partials', done => {
    p(FIXTURES + 'partials')
      .pipe(dest(FIXTURES + 'partials/build'))
      .on('finish', () => {
        equal(FIXTURES + 'partials/expected', FIXTURES + 'partials/build');
        done();
      })
      .on('error', done);
  });

  it('builds a page with custom data', done => {
    p(FIXTURES + 'data-page')
      .pipe(dest(FIXTURES + 'data-page/build'))
      .on('finish', () => {
        equal(FIXTURES + 'data-page/expected', FIXTURES + 'data-page/build');
        done();
      })
      .on('error', done);
  });

  it('builds a page with custom helpers', done => {
    p(FIXTURES + 'helpers')
      .pipe(dest(FIXTURES + 'helpers/build'))
      .on('finish', () => {
        equal(FIXTURES + 'helpers/expected', FIXTURES + 'helpers/build');
        done();
      })
      .on('error', done);
  });

  it('builds a page with external JSON data', done => {
    p(FIXTURES + 'data-json')
      .pipe(dest(FIXTURES + 'data-json/build'))
      .on('finish', () => {
        equal(FIXTURES + 'data-json/expected', FIXTURES + 'data-json/build');
        done();
      })
      .on('error', done);
  });

  xit('builds a page with an array of external JSON data', done => {
    p(FIXTURES + 'data-array', {
      data: ['data', 'data-extra']
    })
      .pipe(dest(FIXTURES + 'data-array/build'))
      .on('finish', () => {
        equal(FIXTURES + 'data-array/expected', FIXTURES + 'data-array/build');
        done();
      })
      .on('error', done);
  });

  it('builds a page with external JS data', done => {
    p(FIXTURES + 'data-js')
      .pipe(dest(FIXTURES + 'data-js/build'))
      .on('finish', () => {
        equal(FIXTURES + 'data-js/expected', FIXTURES + 'data-js/build');
        done();
      })
      .on('error', done);
  });

  it('builds a page with external YAML data', done => {
    p(FIXTURES + 'data-yaml')
      .pipe(dest(FIXTURES + 'data-yaml/build'))
      .on('finish', () => {
        equal(FIXTURES + 'data-yaml/expected', FIXTURES + 'data-yaml/build');
        done();
      })
      .on('error', done);
  });
});

describe('Panini variables', () => {
  it('{{page}} variable that stores the current page', done => {
    p(FIXTURES + 'variable-page')
      .pipe(dest(FIXTURES + 'variable-page/build'))
      .on('finish', () => {
        equal(FIXTURES + 'variable-page/expected', FIXTURES + 'variable-page/build');
        done();
      })
      .on('error', done);
  });

  it('{{layout}} variable that stores the current layout', done => {
    p(FIXTURES + 'variable-layout')
      .pipe(dest(FIXTURES + 'variable-layout/build'))
      .on('finish', () => {
        equal(FIXTURES + 'variable-layout/expected', FIXTURES + 'variable-layout/build');
        done();
      })
      .on('error', done);
  });

  it('{{root}} variable that stores a relative path to the root folder', done => {
    p(FIXTURES + 'variable-root')
      .pipe(dest(FIXTURES + 'variable-root/build'))
      .on('finish', () => {
        equal(FIXTURES + 'variable-root/expected', FIXTURES + 'variable-root/build');
        done();
      })
      .on('error', done);
  });
});

describe('Panini config', () => {
  var originalCwd = process.cwd();

  before(() => {
    process.chdir(FIXTURES + 'config');
  });

  after(() => {
    process.chdir(originalCwd);
  });

  it('loads configuration from package.json', done => {
    p('src')
      .pipe(dest('src/build'))
      .on('finish', () => {
        equal('src/expected', 'src/build');
        done();
      })
      .on('error', done);
  });
});
