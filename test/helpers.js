'use strict';

const assert = require('assert');
const handlebars = require('handlebars');
const repeat = require('../lib/repeat');
const currentPage = require('../lib/current-page');

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

  describe('currentPage', () => {
    it('returns true if the page is within the given list', () => {
      const h = handlebars.create();
      const t = h.compile(`
        {{#if (currentPage 'index' 'about')}}true{{/if}}
      `);
      assert.ok(t({currentPage: currentPage('index')}).indexOf('true'));
    });

    it('returns false if the page is not within the given list', () => {
      const h = handlebars.create();
      const t = h.compile(`
        {{#if (currentPage 'index' 'about')}}true{{/if}}
      `);
      assert.ok(t({currentPage: currentPage('contact')}).indexOf('true') === -1);
    });
  });
});
