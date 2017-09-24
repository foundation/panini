# Panini

[![Build Status](https://travis-ci.org/zurb/panini.svg?branch=master)](https://travis-ci.org/zurb/panini) [![npm version](https://badge.fury.io/js/panini.svg)](https://badge.fury.io/js/panini) [![Dependency Status](https://david-dm.org/zurb/panini.svg)](https://david-dm.org/zurb/panini)

Panini is a static site tool designed for simplicity. No configuration is needed&mdash;just install it, point it at a folder of pages, and you're good to go. As you're building your site, you can extend it with custom layouts, helpers, partials, and data. Panini also supports localization, multiple template engines, and the dynamic page generation.

**Note: Panini 2.0 is still in alpha and not yet feature-complete. However, it's pretty stable, and if you want to give it a try, we'd love some [feedback or bug reports](https://github.com/zurb/panini/issues) on anything you run into. :)**

## Contents

- [Basics](#basics)
  - [ZURB Template](#zurb-template)
  - [Installation](#installation)
  - [Setup](#setup)
  - [Pages](#pages)
  - [Layouts](#layouts)
  - [Partials](#partials)
- [Advanced](#advanced)
  - [Front Matter](#front-matter)
  - [Alternate Layouts](#alternate-layouts)
  - [External Data](#external-data)
  - [Transforms](#transforms)
  - [Localization](#localization)
- [Using Handlebars](#using-handlebars)
  - [Built-in Variables](#built-in-variables)
  - [Built-in Helpers](#built-in-helpers)
  - [Custom Helpers](#custom-helpers)
  - [Content Blocks](#content-blocks)
- [Other Template Languages](#other-template-languages)
  - [Pug](#pug)
  - [EJS](#ejs)
- [Other Usage Methods](#other-usage-methods)
  - [Use with Gulp](#use-with-gulp)
  - [Use Programmatically](#use-programmatically)
- [Customizing Panini](#customizing-panini)
- [FAQ](#faq)
- [License](#license)

## Basics

### ZURB Template

Panini is the delicious bedrock of the [ZURB Template](https://github.com/zurb/foundation-zurb-template), which also handles Sass and JavaScript compilation, image compression, asset management, and more. If you're looking for a fully-fledged website creation boilerplate, give the ZURB Template a try. Read on if you want to incorporate Panini into your own build process.

### Installation

Panini requires Node.js version 4.0 or greater.

```bash
npm install panini --save-dev
```

### Setup

Create a folder like this:

```
- src/
  - layouts/
    - default.hbs
  - pages/
    - index.hbs
```

Add Panini to your npm scripts, in `package.json`:

```json
{
  "scripts": {
    "start": "panini src build"
  }
}
```

Now run the script with `npm start`, and you'll get a compiled site in the `build/` folder. That's it!

If you want to re-build the site whenever files change, add `-w`. You'll probably want two scripts: one to watch and rebuild files, for when you're working on the site, and one to build files just once, for when you're deploying.

```json
{
  "start": "npm run build -- -w",
  "build": "panini src build"
}
```

In addition to running Panini as a CLI tool, you can use it as a [Gulp plugin](#use-with-gulp) or a [programmatic API](#use-programmatically).

### Pages

Pages in your site go in the `pages/` folder. They're compiled with [Handlebars](http://handlebarsjs.com/), so each file should end in `.html`, `.hbs`, or `.handlebars`. Every page will be converted into an HTML file and copied to the output folder.

### Layouts

Layouts are Handlebars files that wrap your pages. They can include all of the code that's the same between pages, like a header/footer, navigation, links to CSS and JavaScript, and more. A basic layout might look like this:

```handlebars
<!doctype html>
<html>
  <head>Rudy's Cafe</head>
  <link rel="stylesheet" href="css/style.css">
  <body>
    {{> body}}
  </body>
</html>
```

See that `{{> body}}`? That's a Handlebars partial which tells Panini where to insert the contents of a page. Make sure every layout you create has a body.

A site can have multiple layouts, and each page can specify which layout to use. However, you must have at least one layout named `default`.

### Partials

A partial is a chunk of Handlebars code that can be dropped in to another page. They're useful for when you need to reuse the same HTML in multiple places across your site. Add files to a `partials/` folder to create partials.

Let's say we have a navigation element we need to reuse across pages. We can create `src/partials/nav.html`:

```handlebars
<nav class="navigation">
  <a href="index.html" class="navigation__item">Home</a>
  <a href="about.html" class="navigation__item">About</a>
  <a href="contact.html" class="navigation__item">Contact</a>
</nav>
```

Now in any page or layout, or even another partial, we can reference this nav like so:

```handlebars
{{> nav}}
```

[Learn more about Handlebars partials](http://handlebarsjs.com/partials.html) on the Handlebars website.

## Advanced

### Front Matter

A page can specify metadata using a *Front Matter block*. It's a chunk of [YAML](http://www.yaml.org/start.html) surrounded by a set of three dashes.

```handlebars
---
title: Home
---

<p>This is the homepage.</p>
```

Anything in a page's Front Matter will be converted into Handlebars variables, which you can access in the page, or in any layout or partial used by the page.

Here's a useful example: set a `title` property on each page, and then you can insert it into the HTML `<title>`, which will be in your default layout.

```handlebars
<!doctype html>
<html>
  <head>
    <title>{{ title }} - Rudy's Cafe</title>
  </head>
  <!-- ... -->
</html>
```

### Alternate Layouts

Your site can make use of multiple layouts. Just add a new file to the `layouts/` folder, and then reference it in the Front Matter of any page.

So, if we have a project like this:

```
- src/
  - layouts/
    - about.hbs
    - default.hbs
  - pages/
    - about.hbs
    - index.hbs
```

Our `about.hbs` page can reference the About layout like this:

```handlebars
---
layout: about
---

<p>This page will use a layout other than the default one.</p>
```

### External Data

Your project can reference external data files in a variety of formats. Just create a `data/` folder and add files to it.

```
- src/
  - data/
    - breakfast.json
```

If we create a file called `breakfast.json` with these contents...

```json
[
  "eggs", "bacon", "toast"
]
```

...we can access these items with the `breakfast` Handlebars variable.

```handlebars
<p>We proudly serve:</p>

<ul>
  {{#each breakfast}}
    <li>{{this}}</li>
  {{/each}}
</ul>
```

Data files can be formatted as JSON, YAML, CSON, or a JavaScript file with `module.exports`.

### Transforms

Panini converts Handlebars (or Pug, or EJS) to HTML out of the box. However, you might want to transform your files further, perhaps converting Markdown to HTML before Panini sees it, or converting Inky HTML to email-ready HTML after Panini has parsed it. You can do both using Panini transforms and any Gulp plugin.

Transforms can be applied to pages *before* or *after* they go through the Panini renderer. The default behavior is *before*. To create a transform, you need two things: a file extension match against, and a set of Gulp plugins to apply.

The transform is an array of strings that reference Gulp plugins, or any module that transforms a stream of Vinyl files. Here's an example with Markdown:

```json
{
  "transform": {
    ".md": ["markdown"]
  }
}
```

Note that `markdown` is used as an alias for `gulp-markdown`. If the module's name starts with `gulp-`, you can omit it.

To pass options to a plugin, pass an array instead of a string. The first item in the array is the plugin name, and the second item is the plugin options.

```json
{
  "transform": {
    ".md": [
      ["markdown", {
        "gfm": false
      }]
    ]
  }
}
```

The default behavior is to apply stream plugins *before* a page is rendered by Panini, but plugins can also be applied after. To specify this, add a the key `after` to a transform rule.

```json
{
  "transform": {
    ".inky.html": {
      "after": [
        "inky",
        "inline-css",
        "minify-html"
      ]
    }
  }
}
```

Even though it's the default, you can explicitly define that a transform be applied before Panini renders.

```json
{
  "transform": {
    ".md": {
      "before": {}
    }
  }
}
```

Lastly, it's possible to define before *and* after transforms on the same set of files.

```json
{
  "transform": {
    ".md": {
      "before": {},
      "after": {}
    }
  }
}
```

### Localization

Panini can help you create a multi-language site with various localization tools.

To enable localization, add a `locales` folder to your project and add one data file for each locale. Like normal data files, locale files can be formatted as JSON, YAML, CSON, or JavaScript.

```
- src/
  - locales/
    - en.yml
    - jp.yml
```

With the above folder structure, we've created two locales for our site: English (`en`) and Japanese (`jp`). Now, when Panini compiles our site, it will build the entire site twice, once for each language, and place them in separate folders. The output would look something like this:

```
- dist/
  - en/
    - index.html
    - about.html
    - ...
  - jp/
    - index.html
    - about.html
    - ...
```

Within our locale files, we can add *translation strings* to be referenced in templates. You're free to structure these files however you like. Just make sure you use the same structure in each locale file, so that every translation of your site has access to the same content.

```
header:
  title: Panini
  nav:
    home: Home
    getting_started: Getting Started
    documentation: Documentation
```

In our templates, we can use the `translate` helper to access these strings.

```handlebars
<header>
  <h1>{{ translate 'header.title' }}</h1>
  <nav>
    <a href="index.html">{{ translate 'header.nav.home' }}</a>
    <a href="getting-started.html">{{ translate 'header.nav.getting_started' }}</a>
    <a href="documentation.html">{{ translate 'header.nav.documentation' }}</a>
  </nav>
</header>
```

To access strings within objects, we use dot notation. So `header.nav.home` looks for the `header` key at the top level of the locale file, and then `nav` inside that, and then `home` inside that. If a key doesn't exist for a locale, the object path will be returned instead of a string. This will help you identify areas missing translation strings while working on your site.

If you have too many translation strings to fit into one file, you can break them up into multiple files.

```
- src/
  - locales/
    - en/
      - global.yml
      - home.yml
      - documentation.yml
    - jp/
      - global.yml
      - home.yml
      - documentation.yml
```

Translation strings are still accessed using dot notation, but the first part of the path will be the name of the file. So to find a string inside `global.yml`, the path would start with `global.`, like so:

```handlebars
{{ translate 'global.site_title' }}
```

If a locale file is in a sub-folder, the object path will start with the enclosing folder name, *then* the name of the file, *then* the path to the string.

## Using Handlebars

### Built-in Variables

Every page has access to these variables.

#### `root`

A path prefix relative to the base directory. Use this to correctly link to assets like CSS files and images, no matter what the path of the page is.

```handlebars
<link rel="stylesheet" href="{{ root }}assets/css/style.css">
```

Note that there's *no slash after the variable*.

#### `page`

The name of the file for this page, without the file extension or leading path. So if the source file is `src/pages/index.hbs`, the value of `{{ page }}` will be `index`.

#### `layout`

The name of the layout this page uses, without the file extension. For most pages this will be `default`, unless the page is using a different layout.

### Built-in Helpers

Panini bundles the [handlebars-helpers](https://github.com/helpers/handlebars-helpers) library, which gives you access to around 150 Handlebars helpers. Panini itself also throws in a few extra:

#### `#repeat`

Repeat a chunk of text `n` times. Useful for prototyping.

```handlebars
{{#repeat 5}}
  <p>This is item {{ @index }}.</p>
{{/repeat}}
```

#### `#code`

Highlight an inline code sample.

```handlebars
{{#code 'css'}}
.good-design {
  font-weight: 100;
  text-transform: lowercase;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.5);
}
{{/code}}
```

### Custom Helpers

Helpers are JavaScript functions that you can reference in Handlebars. Add JavaScript files to a `helpers/` folder to create helpers.

This helper will make our text louder.

```js
module.exports = function(options) {
  return options.fn(this).toUpperCase();
}
```

If we name this file `shout.js`, we can make any text sing with this code:

```handlebars
{{#shout}}
i want to break free
{{/shout}}
```

### Content Blocks

The inline partial feature of Handlebars can be used to create *content block*. In the same way every layout defines a `{{> body}}`, which marks where page content is inserted, a layout can also define other blocks of content, like a header or footer. Pages can then tap into these blocks to change their contents, or add contents.

A great example involves the `<head>` of the document. You might want to allow pages to add content to the `<head>` of the layout. To do this, we reference a partial called `head` and give it an empty body:

```handlebars
<html>
  <head>
    {{#> head}}
    {{/head}}
  </head>
</html>
```

Now, in any page, we can define this partial inline using the `inline` decorator. The HTML you add here will be placed inside the `{{#> head}}` defined in the layout.

```handlebars
{{#* inline 'head'}}
  <link rel="stylesheet" href="styles/home.css" />
{{/inline}}
```

A content block can also define default content. This means, if a page doesn't override a content block, the default content will be used.

In the previous example, our `{{#> head}}` partial in the layout file was empty. To set up default content, we place it inside the partial.

```handlebars
<html>
  <head>
    {{#> head}}
      <link rel="stylesheet" href="styles/default.css" />
    {{/head}}
  </head>
</html>
```

## Other Template Languages

### Pug

To use [Pug](https://pugjs.org) instead of Handlebars, add the property `"engine": "pug"` to your [Panini configuration](#customizing-panini).

#### File Structure

Like with Handlebars, pages should still be placed in a `pages/` folder. However, each page should have the extension `.pug`. You can also still define custom data with files in a `data/` folder, and functions with files in a `helpers/` folder.

Because Pug uses an import system to handle layouts and partials, you don't need to name your folders for those files `layouts` or `partials`, if you don't want to.

#### Imports

When writing absolute imports, the root directory of the project is used. So given a file structure like this:

```
- src/
  - pages/
    - index.pug
  - layouts/
    - default.pug
```

You can write the `extends` like this:

```pug
extends /layouts/default
```

You can also use a relative import instead.

```pug
extends ../layouts/default
```

#### Filters

You can define custom filters by adding `.js` files to a `filters/` folder. Each file should export a function, which you can then reference in a Pug file with the name of the filter.

If we create a file `filters/uppercase.js`:

```js
module.exports = text => {
  return text.toUpperCase();
};
```

We can now make any text in our page more shouty:

```pug
:uppercase
  This text will look very important!
```

### EJS

To use [EJS](http://ejs.co) instead of Handlebars, add the property `"engine": "ejs"` to your [Panini configuration](#customizing-panini).

#### File Structure

Like with Handlebars, pages should still be placed in a `pages/` folder. However, each page should have the extension `.ejs`. You can also still define custom data with files in a `data/` folder, and functions with files in a `helpers/` folder.

Because EJS uses an import system to handle layouts and partials, you don't need to name your folders for those files `layouts` or `partials`, if you don't want to.

#### Imports

When writing absolute imports, the root directory of the project is used. So given a file structure like this:

```
- src/
  - pages/
    - index.ejs
  - includes/
    - nav.ejs
```

You can write an `include()` statement like this:

```ejs
<%- include("/includes/nav") %>
```

You can also use a relative import instead.

```ejs
<%- include("../includes/nav") %>
```

## Other Usage Methods

### Use with Gulp

Panini has built-in Gulp support.

Unlike most Gulp plugins, the Panini plugin is a *source adapter*, which means it's the first step in a Gulp stream&mdash;you don't pipe files to it. However, you're free to modify the finished files with other Gulp plugins before writing them to disk with `gulp.dest()`.

```js
const gulp = require('gulp');
const panini = require('panini/gulp');

gulp.task('default', () => {
  return panini('src')
    .pipe(gulp.dest('build'));
});
```

### Use Programmatically

Panini can be run from within a Node.js script.

```js
const Panini = require('panini');

const p = new Panini('src', 'build');

// Build site once
p.build().then(() => {
  console.log('Done building');
});

// Build site, and then re-build when files change
p.watch();
```

## Customizing Panini

Most of the time, you won't need to touch Panini's configuration options, as every feature is turned on by default.

To change Panini settings, add a `panini` key to the `package.json` of your project.

```json
{
  "dependencies": {
    "panini": "^2.0.0"
  },
  "panini": {
    "builtins": false
  }
}
```

If you're using Panini with Gulp, you can also opt to pass in the settings as an object when you call the `panini()` function.

```js
const gulp = require('gulp');
const panini = require('panini/gulp');

gulp.task('build', () => {
  return panini('src', {
    builtins: false,
  })
    .pipe(gulp.dest('build'));
});
```

If you're using Panini's programmatic API, you can pass in the settings as an object to the `Panini` constructor.

```js
const Panini = require('panini');

const p = new Panini('src', 'build', {
  builtins: false,
});
```

### `builtins`

**Default:** `true`

Enables Panini's built-in helpers and the handlebars-helpers library. This option only applies if Handlebars is being used.

### `defaultLocale`

**Default:** `null`

Default site language. When building a localized site, each translation of the site is placed in its own folder, such as `/en` or `/jp`. Setting a default locale will place the pages for that translation in the root directory of the site, instead of in a subfolder.

This means the default translation of your site can sit at a URL like `mysite.com`, while the other translations sit at `mysite.com/jp`, `mysite.com/is`, and so on.

### `engine`

**Default:** `handlebars`

Rendering engine to use. Options are `handlebars`, `pug`, and `ejs`.

### `pageLayouts`

**Default:** `{}`

Automatically assign layouts to pages based on what folder they're in.

For example, if you had a bunch of pages in an `about/` folder...

```
- src/
  - layouts/
    - about.html
    - default.html
  - pages/
    - about/
      - index.html
      - history.html
      - menu.html
    - index.html
```

You could automatically configure all of those pages to use the `about` layout like so:

```json
{
  "pageLayouts": {
    "about": "about"
  }
}
```

### `quiet`

**Default:** `false`

Prevents info and errors from being output to the console while Panini is working.

## FAQ

### Does Panini handle Sass, JavaScript, etc.?

No. Panini is focused on compiling templates into HTML. However, it's very easy to bake it into a build process that uses Grunt, Gulp, or npm scripts. A great example of a full template that uses Panini is ZURB's [official Foundation template](https://github.com/zurb/foundation-zurb-template).

### Will you add support for [rendering engine]?

We're open to it! Or better yet, you can write it yourself! Check out our documentation on writing rendering engines.

## Local Development

```bash
git clone https://github.com/zurb/panini
cd panini
npm install
```

To run the unit tests, use the command `npm test`.

## License

MIT &copy; [ZURB](http://zurb.com)
