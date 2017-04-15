'use strict';

const assert = require('assert');
const handlebars = require('handlebars');
const repeat = require('../lib/repeat');

describe('Helpers', () => {
  describe('repeat', () => {
    it('repeats a block n times', () => {
      const h = handlebars.create();
      h.registerHelper('repeat', repeat);
      const t = h.compile(`
        {{#repeat 3}}n{{/repeat}}
      `);
      assert.ok(t().indexOf('nnn'));
    });

    it('includes an index variable', () => {
      const h = handlebars.create();
      h.registerHelper('repeat', repeat);
      const t = h.compile(`
        {{#repeat 3}}{{ @index }}{{/repeat}}
      `);
      assert.ok(t().indexOf('012'));
    });
  });
});
