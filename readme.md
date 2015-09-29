# Panini

A super tiny flat file generator for use with Gulp. It compiles a series of HTML *pages* using a common *layout*. These pages can also include *partials*, or external *data* as JSON or YAML.

Shipyard isn't meant to be full-fledged static site generator&mdash;rather, it solves the very specific problem of assembling flat files from common elements, using a templating language.

## Usage

```js
var gulp = require('gulp');
var panini = require('panini');

gulp.task('default', function() {
  gulp.src('pages/**/*.html')
    .pipe(panini({
      layouts: 'layouts/',
      partials: 'partials/**/*.html'
    }))
    .pipe(gulp.dest('build'));
});
```

## Options

### `layouts`

A string containing the path to a directory containing layouts. One layout must be named `default.html`. To use a layout other than the default on a specific page, override it in the Front Matter of the page.

```html
---
layout: post
---

<!-- Uses layouts/post.html as the template -->
```

All layouts have a special Handlebars partial called `body` which contains the contents of the page.

```html
<!-- Header up here -->
{{> body}}
<!-- Footer down here -->
```

### `partials`

A string containing a [glob](https://github.com/isaacs/node-glob) of files to use as partials. Each will be registered as a Handlebars partial which can be accessed using the name of the file. (The path to the file doesn't matter.)

```html
<!-- Renders partials/header.html -->
{{> header}}
```

### `data`

A string containing a glob of files to be used as data, which is passed in to every page. Data can be formatted as JSON or YAML. Within a template, the data is stored within a variable with the same name as the file it came from.

Data can also be inserted into the page itself with a Front Matter template at the top of the file.

Lastly, the reserved `page` variable is added to every page template as it renders. It contains the name of the page being rendered, without the extension.

### `helpers`

A string containing a glob of files that point to Handlebars helpers. The name used to register the helper is the same as the name of the file.

For example, a file named `markdown.md` that exports this function would add a Handlebars helper called `{{md}}`.

```js
var marked = require('marked');

handlebars.registerHelper('md', function(text) {
  return marked(text);
});
```
