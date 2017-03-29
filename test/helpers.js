'use strict';

const assert = require('assert');
const handlebars = require('handlebars');
const code = require('../helpers/code');
const ifEqual = require('../helpers/if-equal');
const ifPage = require('../helpers/if-page');
const markdown = require('../helpers/markdown');
const repeat = require('../helpers/repeat');
const unlessPage = require('../helpers/unless-page');

describe('Helpers', () => {
  describe('code', () => {
    it('renders code blocks', () => {
      const h = handlebars.create();
      h.registerHelper('code', code);
      const t = h.compile(`
        {{#code 'css'}}
        p {}
        {{/code}}
      `);
      assert.ok(t().indexOf('hljs-'));
    });
  });

  describe('ifEqual', () => {
    it('renders a block if condition is true', () => {
      const h = handlebars.create();
      h.registerHelper('ifEqual', ifEqual);
      const t = h.compile(`
        {{#ifEqual cond true }}
          True
        {{/ifEqual}}
      `);
      assert.ok(t().indexOf('True'));
    });

    it('renders an inverse block if condition is false', () => {
      const h = handlebars.create();
      h.registerHelper('ifEqual', ifEqual);
      const t = h.compile(`
        {{#ifEqual cond true }}
          True
        {{else}}
          False
        {{/ifEqual}}
      `);
      assert.ok(t().indexOf('False'));
    });
  });

  describe('ifPage', () => {
    it('renders a block if on a specific page', () => {
      const h = handlebars.create();
      h.registerHelper('ifPage', ifPage('index'));
      const t = h.compile(`
        {{#ifPage 'index'}}
          On Index
        {{/ifPage}}
      `);
      assert.ok(t().indexOf('On Index'));
    });

    it('renders a block if on one of several pages', () => {
      const h = handlebars.create();
      h.registerHelper('ifPage', ifPage('index'));
      const t = h.compile(`
        {{#ifPage 'index' 'about'}}
          On Index or About
        {{/ifPage}}
      `);
      assert.ok(t().indexOf('On Index or About'));
    });

    it('renders the inverse block if not on a page', () => {
      const h = handlebars.create();
      h.registerHelper('ifPage', ifPage('index'));
      const t = h.compile(`
        {{#ifPage 'index'}}
          On Index
        {{else}}
          Not on Index
        {{/ifPage}}
      `);
      assert.ok(t().indexOf('Not on Index'));
    });
  });

  describe('markdown', () => {
    it('converts Markdown to HTML', () => {
      const h = handlebars.create();
      h.registerHelper('markdown', markdown);
      const t = h.compile(`
        {{#markdown}}# Title{{/markdown}}
      `);
      assert.ok(t().indexOf('<h1>Title</h1>'));
    });
  });

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

  describe('unlessPage', () => {
    it('renders a block if not on a specific page', () => {
      const h = handlebars.create();
      h.registerHelper('unlessPage', unlessPage('index'));
      const t = h.compile(`
        {{#unlessPage 'about'}}
          Not on About
        {{/unlessPage}}
      `);
      assert.ok(t().indexOf('Not on About'));
    });

    it('renders a block if not on one of several pages', () => {
      const h = handlebars.create();
      h.registerHelper('unlessPage', unlessPage('index'));
      const t = h.compile(`
        {{#unlessPage 'about' 'contact'}}
          Not on About or Contact
        {{/unlessPage}}
      `);
      assert.ok(t().indexOf('Not on About or Contact'));
    });

    it('renders the inverse block if not on a page', () => {
      const h = handlebars.create();
      h.registerHelper('unlessPage', unlessPage('index'));
      const t = h.compile(`
        {{#unlessPage 'index'}}
          Not on Index
        {{else}}
          On Index
        {{/unlessPage}}
      `);
      assert.ok(t().indexOf('On Index'));
    });
  });
});
