var gulp = require('gulp');
var panini = require('../index');

gulp.task('default', function() {
  gulp.src('pages/**/*.html')
    .pipe(panini({
      root: 'pages/',
      layouts: 'layouts/',
      partials: 'partials/',
      data: 'data/',
      helpers: 'helpers/'
    }))
    .pipe(gulp.dest('_build'));
});
