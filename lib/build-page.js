'use strict';

const replaceExt = require('replace-ext');
const getTransforms = require('./get-transforms');
const transformFile = require('./transform-file');

/**
 * Build all pages that have been parsed and write them to disk. This is a stream flush function.
 * @param {object[]} pages - Pages to build.
 * @param {object} stream - Object stream.
 * @param {function} cb - Callback to run when all files have been written to disk.
 */
module.exports = function (pages, stream, cb) {
  let errorCount = 0;

  const tasks = pages.map(page => {
    // Pull file info out of temporary storage
    const file = page[0];
    const pageBody = page[1];
    const pageData = Object.assign({}, page[2], {pages}); // Insert complete list of pages into each data context
    const renderer = pageData._paniniError ?
      this.engine.error(pageData._paniniError.error, file.path) :
      this.engine.render(pageBody, pageData, file);

    return Promise.resolve(renderer).then(contents => {
      const newFile = file.clone();
      const transform = getTransforms(file.path, this.options.transform, 'after');
      newFile.path = replaceExt(file.path, '.html');

      if (transform) {
        return transformFile(newFile, transform).then(res => {
          newFile.contents = Buffer.from(res);
          return newFile;
        });
      }

      newFile.contents = Buffer.from(contents);
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
};
