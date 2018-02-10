'use strict';

const path = require('path');
const chai = require('chai');
const chaiStream = require('chai-stream-es6').default;
const sinon = require('sinon');
const File = require('vinyl');
const tempy = require('tempy');
const PaniniWrapper = require('..');
const PugEngine = require('../engines/pug');

const Panini = PaniniWrapper.Panini;
const expect = chai.expect;

chai.use(chaiStream);

describe('Panini class', () => {
  describe('constructor()', () => {
    let panini;

    before(() => {
      panini = new Panini('src');
    });

    it('creates a new instance of Panini', () => {
      expect(panini).to.be.an.instanceOf(Panini);
    });

    it('assigns options', () => {
      expect(panini.options).to.have.property('input', 'src');
    });

    it('allows the engine to be changed', () => {
      const p = new Panini('src', {
        engine: 'pug'
      });
      expect(p.engine).to.be.an.instanceOf(PugEngine);
    });
  });

  describe('Config errors', () => {
    before(() => sinon.stub(console, 'log'));

    after(() => console.log.restore());

    it('throws an error if no input directory is set', () => {
      expect(() => new PaniniWrapper()).to.throw(Error);
    });

    it(`throws an error if an incorrect engine is set`, () => {
      expect(() => new PaniniWrapper('src', 'dest', {
        engine: 'nope'
      })).to.throw(Error);
    });
  });

  describe('setup()', () => {
    it('loads data', () => {
      const p = new Panini('test/fixtures/data');
      return p.setup().then(() => expect(p.engine.data).to.have.keys(['breakfast']));
    });

    it('stores list of locales', () => {
      const p = new Panini('test/fixtures/locales');
      return p.setup().then(() => expect(p.engine.locales).to.have.eql(['en', 'jp']));
    });

    it('loads locale data', () => {
      const p = new Panini('test/fixtures/locales');
      return p.setup().then(() => expect(p.engine.localeData).to.have.keys(['en', 'jp']));
    });

    it('loads collection configs', () => {
      const p = new Panini('test/fixtures/collections');
      return p.setup().then(() =>
        expect(p.engine.collections).to.have.property('blog-posts').with.keys(['input', 'output', 'transform', 'template'])
      );
    });
  });

  describe('getPageData()', () => {
    const p = new Panini('src');
    const file = new File({
      base: path.join(process.cwd(), 'src/pages'),
      path: path.join(process.cwd(), 'src/pages/index.hbs')
    });

    it('returns an object', () => {
      expect(p.getPageData(file, {})).to.be.an('object');
    });

    it('includes global data', () => {
      const p = new Panini('src');
      p.engine.data = {kittens: true};
      expect(p.getPageData(file, {})).to.have.property('kittens', true);
    });

    it('includes page Front Matter', () => {
      expect(p.getPageData(file, {kittens: true})).to.have.property('kittens', true);
    });

    it('deeply merges Front Matter with global data', () => {
      const p = new Panini('src');
      p.engine.data = {
        kittens: {
          one: 'one'
        }
      };
      const fileData = {
        kittens: {
          two: 'two'
        }
      };
      expect(p.getPageData(file, fileData)).to.have.property('kittens').that.eql({
        one: 'one',
        two: 'two'
      });
    });

    it('includes the page name', () => {
      expect(p.getPageData(file, {})).to.have.property('page', 'index');
    });

    it('assigns the default layout if the page does not define one', () => {
      expect(p.getPageData(file, {})).to.have.property('layout', 'default');
    });

    it('assigns a layout based on folder', () => {
      const p = new Panini('src', {
        pageLayouts: {about: 'about'}
      });
      const file = new File({
        base: path.join(process.cwd(), 'src/pages'),
        path: path.join(process.cwd(), 'src/pages/about/index.hbs')
      });
      expect(p.getPageData(file, {})).to.have.property('layout', 'about');
    });

    it('assigns an empty root prefix for pages at the root', () => {
      expect(p.getPageData(file, {})).to.have.property('root', '');
    });

    it('assigns a relative root prefix for pages in subdirectories', () => {
      const file = new File({
        base: path.join(process.cwd(), 'src/pages'),
        path: path.join(process.cwd(), 'src/pages/about/index.hbs')
      });
      expect(p.getPageData(file, {})).to.have.property('root', '../');
    });

    it('includes template helpers', () => {
      expect(p.getPageData(file, {})).to.have.property('currentPage').that.is.a('function');
    });

    it('can omit template helpers', () => {
      const p = new Panini('src', {
        builtins: false
      });
      expect(p.getPageData(file, {})).to.not.have.property('currentPage');
    });

    it('inserts a parsing error for later use', () => {
      expect(p.getPageData(file, {}, 'error')).to.have.property('_paniniError', 'error');
    });
  });

  describe('compile()', () => {
    let tempDir;

    before(() => {
      tempDir = tempy.directory();
    });

    it('returns a stream', () => {
      const panini = new Panini('src');
      const stream = panini.compile(tempDir);
      expect(stream).to.be.a.ReadableStream;
      expect(stream).to.be.a.WritableStream;
    });
  });
});
