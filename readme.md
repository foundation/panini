# Shipyard

A super tiny (<1KB) static site generator for use with Gulp.

```js
var gulp = require('gulp');
var shipyard = require('shipyard');

gulp.task('default', function() {
  gulp.src('pages/**/*.html')
    .pipe(shipyard({
      layout: 'layouts/default.html',
      partials: 'partials/**/*.html'
    }))
    .pipe(gulp.dest('build'));
});
```