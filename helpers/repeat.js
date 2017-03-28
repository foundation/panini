const Handlebars = require('handlebars');

/**
 * Handlebars block helper that repeats the content inside of it n number of times.
 * @param {integer} count - Number of times to repeat.
 * @param {object} options - Handlebars object.
 * @example
 * {{#repeat 5}}<li>List item!</li>{{/repeat}}
 * @returns The content inside of the helper, repeated n times.
 */
module.exports = function (count, options) {
  let str = '';
  let data;

  if (options.data) {
    data = Handlebars.createFrame(options.data);
  }

  for (let i = 0; i < count; i++) {
    if (data) {
      data.index = i;
    }

    str += options.fn(this, {data});
  }

  return str;
};
