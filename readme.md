# Shipyard

A super tiny (<1KB) static site generator for use with Gulp.

## Usage

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

## Options

You need to pass a configuration object to `shipyard` with these two options:

### `layout`

Sets the file that will serve as your default layout. Should be a string.

### `partials`

Sets the glob of files that will be available as partials. Should be a string.

## Front Matter

You can add data to pages as YAML blocks. These values will be available as Handlebars variables in both the layout and page templates.
