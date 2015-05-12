var gulp = require('gulp');
var shipyard = require('../index');

gulp.task('default', function() {
  gulp.src('pages/**/*.html')
    .pipe(shipyard({
      layouts: 'layouts/',
      partials: 'partials/**/*.html'
    }))
    .pipe(gulp.dest('_build'));
});