'use strict';

const path = require('path');
const marked = require('marked');

module.exports = {
  input: 'blog-posts/*.md',
  output: 'posts',
  transform: (filePath, contents) => {
    return {
      name: path.basename(filePath),
      data: {
        body: marked(contents)
      }
    };
  }
};
