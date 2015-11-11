var runSequence = require('run-sequence');
var del = require('del');
var gulp = require('gulp');
var mocha = require('gulp-mocha');
var wait = require('gulp-wait');
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

gulp.task('clean:build', function() {
  del.sync(['./_build']);
});

gulp.task('mocha', function() {
  return gulp.src('./test.js', {read: false})
    .pipe(wait(500)) // wait for the build to finish
    .pipe(mocha())
});


gulp.task('test', function() {
  runSequence('clean:build','default', 'mocha');
});