'use strict';

const replaceExt = require('replace-ext');
const getTransforms = require('./get-transforms');
const transformFile = require('./transform-file');

/**
 * Build all pages that have been parsed and write them to disk. This is a stream flush function.
 * @param {Object[]} pages - Pages to build.
 * @param {PaniniEngine} engine - Engine to render with.
 * @param {Object} transform - Transform settings.
 * @param {function} cb - Callback to run when all files have been written to disk.
 */
module.exports = function (pages, engine, transform, cb) {
  let errorCount = 0;

  const tasks = pages.map(page => {
    // Pull file info out of temporary storage
    const file = page[0];
    const pageBody = page[1];
    const pageData = Object.assign({}, page[2], {pages}); // Insert complete list of pages into each data context
    const renderer = pageData._paniniError ?
      engine.error(pageData._paniniError.error, file.path) :
      engine.render(pageBody, pageData, file);

    return Promise.resolve(renderer).then(contents => {
      const newFile = file.clone();
      const transforms = getTransforms(file.path, transform, 'after');
      newFile.path = replaceExt(file.path, '.html');

      if (transforms) {
        return transformFile(newFile, transforms).then(res => {
          newFile.contents = Buffer.from(res);
          return newFile;
        });
      }

      newFile.contents = Buffer.from(contents);
      return newFile;
    }).then(newFile => {
      cb(newFile);

      if (newFile.contents.toString().indexOf('<!-- __PANINI_ERROR__ -->') > -1) {
        errorCount += 1;
      }
    });
  });

  return Promise.all(tasks)
    .then(() => ({
      pageCount: pages.length,
      errorCount
    }));
};
