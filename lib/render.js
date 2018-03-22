'use strict';

const path = require('path');
const fm = require('front-matter');
const through = require('through2');
const assign = require('lodash.assign');
const replaceExt = require('replace-ext');
const pathInsert = require('path-insert');
const stripBom = require('strip-bom');
const getTransforms = require('./get-transforms');
const transformFile = require('./transform-file');
const folders = require('./folders');

/**
 * Create a transform stream to render a set of pages to HTML.
 *
 * Rendering is a two-step process. First, every page is parsed and stored in a temporary array. Then, once every page has been parsed, they're all converted to HTML in parallel.
 *
 * @returns {function} Stream transform function.
 */
module.exports = function () {
  const inst = this;
  const pages = [];

  return through.obj((file, enc, cb) => {
    // Wait until the `setup()` function of the rendering engine is done
    inst.onReady().then(() => {
      inst.emit('parsing');

      if (this.engine.i18n) {
        // For sites using i18n, the file is duplicated, once for each locale
        Promise.all(makeLocaleFiles.call(inst, file).map(f => {
          return parse.call(inst, f).then(res => {
            pages.push(res);
          });
        }))
          .then(() => cb())
          .catch(err => cb(err));
      } else {
        parse.call(inst, file).then(res => {
          pages.push(res);
          cb();
        }).catch(err => cb(err));
      }
    });
  }, function (cb) {
    inst.emit('building');
    build.call(inst, pages, this, cb);
  });
};

/**
 * Duplicate the file for a single page so there's one for each locale. The base path of the file is modified to insert the locale as a folder. So, `index.html` becomes `en/index.html`, `es/index.html`, `jp/index.html`, and so on.
 * @param {Object} file - Vinyl file.
 * @returns {Object[]} Locale-specific versions of file.
 */
function makeLocaleFiles(file) {
  const base = path.join(process.cwd(), this.options.input, folders.pages);
  const locale = getFileLocale(base, file.path, this.engine.locales);

  // If a page is inside a locale folder, it won't be translated into the other languages
  if (locale) {
    return [makeFile(locale)];
  }

  // Pages not inside locale folders are translated once for each locale
  return this.engine.locales.map(locale => {
    const isRoot = locale === this.options.defaultLocale;
    const newPath = isRoot ?
      file.path :
      pathInsert.start(file.path, base, locale);
    return makeFile(locale, newPath);
  });

  /**
   * Clone a Vinyl file, setting locale data and optionally replacing the file path.
   * @param {String} locale - Locale to assign to file.
   * @param {String} [path] - Path to change file to.
   * @returns {Object} Modified Vinyl file.
   */
  function makeFile(locale, path) {
    const newFile = file.clone();

    if (path) {
      // Insert the language code at the base of the path
      newFile.path = path;
    }

    // The `paniniLocale` key is used to correctly render translation strings
    if (newFile.data) {
      newFile.data.paniniLocale = locale;
    } else {
      newFile.data = {paniniLocale: locale};
    }

    return newFile;
  }
}

/**
 * Figure out if a page is specific to one locale based on its path. Pages that are locale-specific will not be rendered in every locale, just the one they're inside.
 * Let's say we have two locales, `en` and `jp`. A file under `src/pages/index.hbs` will be rendered in both locales. However, a file under `src/pages/en/index.hbs` will only be rendered once, for English. Likewise, a file under `src/pages/jp/index.hbs` will also only be rendered once, for Japanese.
 * For a file to be locale-specific, the first part of its path *after* the pages folder must be a locale in use. So, using the above examples, anything inside a top-level folder `en` or `jp` will be locale-specific. This also applies to any pages in subdirectories of these locale folders.
 *
 * @param {String} base - Base page path. This is the CWD + `options.input` + `options.pages`.
 * @param {String} filePath - Full path to source file being examined.
 * @param {String} locales - Locales in use. This is provided by the engine in use.
 * @returns {(String|Boolean)} Locale found, or `false` if page is generic.
 */
function getFileLocale(base, filePath, locales) {
  const pagePath = path.relative(base, filePath);

  for (const i in locales) {
    if (pagePath.indexOf(`${locales[i]}/`) === 0) {
      return locales[i];
    }
  }

  return false;
}

/**
 * Get the body and data of a page and store it for later rendering to HTML. This is a stream transform function.
 * @param {object} file - Vinyl file being parsed.
 */
function parse(file) {
  let page;
  let error;

  // Get the HTML for the current page and layout
  try {
    page = fm(file.contents.toString());
  } catch (err) {
    if (err.name === 'YAMLException') {
      error = {
        type: 'yaml',
        error: err
      };
    }

    page = {
      attributes: {},
      body: ''
    };
  }

  // Assemble data for template
  const pageData = this.getPageData(file, page.attributes, error);

  // Apply transforms if needed
  const transform = getTransforms(file.path, this.options.transform);
  if (transform) {
    return transformFile(file, transform).then(pageBody => [file, stripBom(pageBody), pageData]);
  }

  // Return page so it can be added to the stack
  return Promise.resolve([file, stripBom(page.body), pageData]);
}

/**
 * Build all pages that have been parsed and write them to disk. This is a stream flush function.
 * @param {object[]} pages - Pages to build.
 * @param {object} stream - Object stream.
 * @param {function} cb - Callback to run when all files have been written to disk.
 */
function build(pages, stream, cb) {
  let errorCount = 0;

  const tasks = pages.map(page => {
    // Pull file info out of temporary storage
    const file = page[0];
    const pageBody = page[1];
    const pageData = assign({}, page[2], {pages}); // Insert complete list of pages into each data context
    const renderer = pageData._paniniError ?
      this.engine.error(pageData._paniniError.error, file.path) :
      this.engine.render(pageBody, pageData, file);

    return Promise.resolve(renderer).then(contents => {
      const newFile = file.clone();
      const transform = getTransforms(file.path, this.options.transform, 'after');
      newFile.path = replaceExt(file.path, '.html');
      newFile.contents = Buffer.from(contents);

      if (transform) {
        return transformFile(newFile, transform).then(res => {
          newFile.contents = Buffer.from(res);
          return newFile;
        });
      }

      return newFile;
    }).then(newFile => {
      stream.push(newFile);

      if (newFile.contents.toString().indexOf('<!-- __PANINI_ERROR__ -->') > -1) {
        errorCount += 1;
      }
    });
  });

  Promise.all(tasks)
    .then(() => {
      this.emit('built', pages.length, errorCount);
      cb();
    })
    .catch(cb);
}
