var gulp = require('gulp');
var panini = require('../index');

describe('Panini', function() {
  it('creates a series of flat HTML files from a set of pages and layouts', function(done) {
    gulp.src('test/fixtures/pages/**/*.html')
      .pipe(panini({
        root: 'test/fixtures/pages/',
        layouts: 'test/fixtures/layouts/',
        partials: 'test/fixtures/partials/',
        data: 'test/fixtures/data/',
        helpers: 'test/fixtures/helpers/'
      }))
      .pipe(gulp.dest('test/_build'))
      .on('end', done); 
  });
});
