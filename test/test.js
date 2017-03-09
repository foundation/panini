import { src, dest } from 'vinyl-fs';
import assert from 'assert';
import equal from 'assert-dir-equal';
import panini from '..';

const FIXTURES = 'test/fixtures/';

const p = opts => panini(opts, true);

describe('Panini', () => {
  it('builds a page with a default layout', done => {
    p(FIXTURES + 'basic')
      .pipe(dest(FIXTURES + 'basic/build'))
      .on('finish', () => {
        equal(FIXTURES + 'basic/expected', FIXTURES + 'basic/build');
        done();
      });
  });

  it('builds a page with a custom layout', done => {
    p(FIXTURES + 'layouts')
      .pipe(dest(FIXTURES + 'layouts/build'))
      .on('finish', () => {
        equal(FIXTURES + 'layouts/expected', FIXTURES + 'layouts/build');
        done();
      });
  });

  it('builds a page with preset layouts by folder', done => {
    p({
      input: FIXTURES + 'page-layouts',
      pageLayouts: {
        'alternate': 'alternate'
      }
    })
      .pipe(dest(FIXTURES + 'page-layouts/build'))
      .on('finish', () => {
        equal(FIXTURES + 'page-layouts/expected', FIXTURES + 'page-layouts/build');
        done();
      });
  });

  it('builds a page with custom partials', done => {
    p(FIXTURES + 'partials')
      .pipe(dest(FIXTURES + 'partials/build'))
      .on('finish', () => {
        equal(FIXTURES + 'partials/expected', FIXTURES + 'partials/build');
        done();
      });
  });

  it('builds a page with custom data', done => {
    p(FIXTURES + 'data-page')
      .pipe(dest(FIXTURES + 'data-page/build'))
      .on('finish', () => {
        equal(FIXTURES + 'data-page/expected', FIXTURES + 'data-page/build');
        done();
      });
  });

  it('builds a page with custom helpers', done => {
    p(FIXTURES + 'helpers')
      .pipe(dest(FIXTURES + 'helpers/build'))
      .on('finish', () => {
        equal(FIXTURES + 'helpers/expected', FIXTURES + 'helpers/build');
        done();
      });
  });

  it('builds a page with external JSON data', done => {
    p(FIXTURES + 'data-json')
      .pipe(dest(FIXTURES + 'data-json/build'))
      .on('finish', () => {
        equal(FIXTURES + 'data-json/expected', FIXTURES + 'data-json/build');
        done();
      });
  });

  xit('builds a page with an array of external JSON data', done => {
    p({
      input: FIXTURES + 'data-array',
      data: ['data', 'data-extra']
    })
      .pipe(dest(FIXTURES + 'data-array/build'))
      .on('finish', () => {
        equal(FIXTURES + 'data-array/expected', FIXTURES + 'data-array/build');
        done();
      });
  });

  it('builds a page with external JS data', done => {
    p(FIXTURES + 'data-js')
      .pipe(dest(FIXTURES + 'data-js/build'))
      .on('finish', () => {
        equal(FIXTURES + 'data-js/expected', FIXTURES + 'data-js/build');
        done();
      });
  });

  it('builds a page with external YAML data', done => {
    src(FIXTURES + 'data-yaml')
      .pipe(dest(FIXTURES + 'data-yaml/build'))
      .on('finish', () => {
        equal(FIXTURES + 'data-yaml/expected', FIXTURES + 'data-yaml/build');
        done();
      });
  });
});

describe('Panini variables', () => {
  it('{{page}} variable that stores the current page', done => {
    p(FIXTURES + 'variable-page')
      .pipe(dest(FIXTURES + 'variable-page/build'))
      .on('finish', () => {
        equal(FIXTURES + 'variable-page/expected', FIXTURES + 'variable-page/build');
        done();
      });
  });

  it('{{layout}} variable that stores the current layout', done => {
    p(FIXTURES + 'variable-layout')
      .pipe(dest(FIXTURES + 'variable-layout/build'))
      .on('finish', () => {
        equal(FIXTURES + 'variable-layout/expected', FIXTURES + 'variable-layout/build');
        done();
      });
  });

  it('{{root}} variable that stores a relative path to the root folder', done => {
    src(FIXTURES + 'variable-root')
      .pipe(dest(FIXTURES + 'variable-root/build'))
      .on('finish', () => {
        equal(FIXTURES + 'variable-root/expected', FIXTURES + 'variable-root/build');
        done();
      });
  });
});

describe('Panini helpers', () => {
  it('#code helper that renders code blocks', done => {
    src(FIXTURES + 'helper-code')
      .pipe(dest(FIXTURES + 'helper-code/build'))
      .on('finish', () => {
        equal(FIXTURES + 'helper-code/expected', FIXTURES + 'helper-code/build');
        done();
      });
  });

  it('#ifEqual helper that compares two values', done => {
    src(FIXTURES + 'helper-ifequal')
      .pipe(dest(FIXTURES + 'helper-ifequal/build'))
      .on('finish', () => {
        equal(FIXTURES + 'helper-ifequal/expected', FIXTURES + 'helper-ifequal/build');
        done();
      });
  });

  it('#ifpage helper that checks the current page', done => {
    src(FIXTURES + 'helper-ifpage')
      .pipe(dest(FIXTURES + 'helper-ifpage/build'))
      .on('finish', () => {
        equal(FIXTURES + 'helper-ifpage/expected', FIXTURES + 'helper-ifpage/build');
        done();
      });
  });

  it('#markdown helper that converts Markdown to HTML', done => {
    src(FIXTURES + 'helper-markdown')
      .pipe(dest(FIXTURES + 'helper-markdown/build'))
      .on('finish', () => {
        equal(FIXTURES + 'helper-markdown/expected', FIXTURES + 'helper-markdown/build');
        done();
      });
  });

  it('#repeat helper that prints content multiple times', done => {
    src(FIXTURES + 'helper-repeat')
      .pipe(dest(FIXTURES + 'helper-repeat/build'))
      .on('finish', () => {
        equal(FIXTURES + 'helper-repeat/expected', FIXTURES + 'helper-repeat/build');
        done();
      });
  });

  it('#unlesspage helper that checks the current page', done => {
    src(FIXTURES + 'helper-unlesspage')
      .pipe(dest(FIXTURES + 'helper-unlesspage/build'))
      .on('finish', () => {
        equal(FIXTURES + 'helper-unlesspage/expected', FIXTURES + 'helper-unlesspage/build');
        done();
      });
  });
});
