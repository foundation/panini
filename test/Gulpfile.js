var gulp = require('gulp');
var panini = require('../index');

gulp.task('default', function() {
  gulp.src('pages/**/*.html')
    .pipe(panini({
      layouts: 'layouts/',
      partials: 'partials/**/*.html',
      data: 'data/**/*.{json,yml}',
      helpers: 'helpers/**/*.js'
    }))
    .pipe(gulp.dest('_build'));
});

gulp.task('hbs', function() {
  gulp.src('pages/**/*.hbs')
    .pipe(panini({
      layouts: 'layouts/*.hbs',
      partials: 'partials/**/*.hbs',
      data: 'data/**/*.{json,yml}',
      helpers: 'helpers/**/*.js',
      templateExt : '.hbs'
    }))
    .pipe(gulp.dest('_build'));
});