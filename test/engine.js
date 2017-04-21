'use strict';

const path = require('path');
const expect = require('chai').expect;
const File = require('vinyl');
const PaniniEngine = require('../lib/engine');
const HandlebarsEngine = require('../engines/handlebars');
const PugEngine = require('../engines/pug');

describe('PaniniEngine', () => {
  describe('constructor()', () => {
    class Engine extends PaniniEngine {}

    it('throws a TypeError if called directly', () => {
      expect(() => new PaniniEngine()).to.throw(TypeError);
    });

    it('creates a new instance of the engine', () => {
      expect(new Engine({})).to.be.an.instanceOf(Engine);
    });

    it('stores options', () => {
      const opts = {input: 'src'};
      const e = new Engine(opts);
      expect(e.options).to.have.property('input', opts.input);
    });

    it('creates an object for layouts if the engine supports it', () => {
      class LayoutEngine extends PaniniEngine {}
      LayoutEngine.features = ['layouts'];
      const e = new LayoutEngine();
      expect(e.layouts).to.eql({});
    });
  });

  describe('setup()', () => {
    class Engine extends PaniniEngine {}

    it('loads data', () => {
      const e = new Engine({input: 'test/fixtures/data'});
      return e.setup().then(() => expect(e.data).to.have.keys(['breakfast']));
    });

    it('stores list of locales', () => {
      const e = new Engine({input: 'test/fixtures/locales'});
      return e.setup().then(() => expect(e.locales).to.have.eql(['en', 'jp']));
    });

    it('loads locale data', () => {
      const e = new Engine({input: 'test/fixtures/locales'});
      return e.setup().then(() => expect(e.localeData).to.have.keys(['en', 'jp']));
    });
  });

  describe('supports()', () => {
    it('returns true for a supported feature', () => {
      class Engine extends PaniniEngine {}
      Engine.features = ['layouts'];
      const e = new Engine();
      expect(e.supports('layouts')).to.be.true;
    });

    it('returns true for an unsupported feature', () => {
      class Engine extends PaniniEngine {}
      Engine.features = ['layouts'];
      const e = new Engine();
      expect(e.supports('data')).to.be.false;
    });

    it('works if an engine does not define features', () => {
      class Engine extends PaniniEngine {}
      const e = new Engine();
      expect(e.supports('layouts')).to.be.false;
    });
  });

  describe('mapFiles()', () => {
    it('runs a callback on a set of files', () => {
      const map = PaniniEngine.mapFiles;
      return map('test/fixtures/basic', 'layouts', '*.html', (path, file) => {
        expect(path).to.contain('test/fixtures/basic/layouts/default.html');
        expect(file).to.contain('<html>');
      });
    });
  });

  describe('mapPaths()', () => {
    it('runs a callback on a set of files', () => {
      const map = PaniniEngine.mapPaths;
      return map('test/fixtures/basic', 'layouts', '*.html', path => {
        expect(path).to.contain('test/fixtures/basic/layouts/default.html');
      });
    });
  });
});

describe('HandlebarsEngine', () => {
  const options = input => ({
    input,
    layouts: 'layouts',
    partials: 'partials',
    data: 'data',
    helpers: 'helpers'
  });

  describe('constructor()', () => {
    it('creates a new instance of HandlebarsEngine', () => {
      expect(new HandlebarsEngine()).to.be.an.instanceOf(HandlebarsEngine);
    });
  });

  describe('setup()', () => {
    it('loads partials', () => {
      const e = new HandlebarsEngine(options('test/fixtures/basic'));
      return e.setup().then(() => expect(e.layouts).to.have.keys(['default']));
    });

    it('loads partials', () => {
      const e = new HandlebarsEngine(options('test/fixtures/partials'));
      return e.setup().then(() => expect(e.engine.partials).to.contain.keys(['partial']));
    });

    it('loads partials in a subfolder', () => {
      const e = new HandlebarsEngine(options('test/fixtures/partials'));
      return e.setup().then(() => expect(e.engine.partials).to.contain.keys(['subfolder/partial']));
    });

    it('loads helpers', () => {
      const e = new HandlebarsEngine(options('test/fixtures/helpers'));
      return e.setup().then(() => expect(e.engine.helpers).to.contain.keys(['helper']));
    });

    it('loads data', () => {
      const e = new HandlebarsEngine(options('test/fixtures/data'));
      return e.setup().then(() => expect(e.data).to.have.keys(['breakfast']));
    });
  });

  describe('render()', () => {
    const e = new HandlebarsEngine(options('test/fixtures/basic'));
    const data = {
      layout: 'default',
      page: 'index'
    };
    const file = {
      path: 'test/fixtures/basic/pages/index.hbs'
    };

    before(() => e.setup());

    it('renders a page', () => {
      const output = e.render('<h1>Page</h1>', data, file);
      expect(output).to.contain('<h1>Page</h1>');
    });

    it('renders the layout of the page', () => {
      const output = e.render('<h1>Page</h1>', data, file);
      expect(output).to.contain('<html>');
    });

    it('inserts the data of the page into the template', () => {
      const output = e.render('<h1>{{ layout }}</h1>', data, file);
      expect(output).to.contain('<h1>default</h1>');
    });

    it('captures error when template is not found', () => {
      const output = e.render('', Object.assign({}, data, {layout: 'nope'}), file);
      expect(output).to.contain('<!-- __PANINI_ERROR__ -->');
    });

    it('captures Handlebars errors', () => {
      const output = e.render('{{ foo | bar }}', data, file);
      expect(output).to.contain('<!-- __PANINI_ERROR__ -->');
    });
  });
});

describe('PugEngine', () => {
  const options = input => ({
    input,
    filters: 'filters',
    data: 'data'
  });

  describe('constructor()', () => {
    it('creates a new instance of PugEngine', () => {
      expect(new PugEngine()).to.be.an.instanceOf(PugEngine);
    });
  });

  describe('setup()', () => {
    it('loads data', () => {
      const e = new PugEngine(options('test/fixtures/pug'));
      return e.setup().then(() => expect(e.data).to.have.keys(['data']));
    });

    it('loads filters', () => {
      const e = new PugEngine(options('test/fixtures/pug'));
      return e.setup().then(() => expect(e.filters).to.have.keys(['filter']));
    });
  });

  describe('render()', () => {
    const file = new File({
      base: path.join(process.cwd(), 'test/fixtures/pug/pages'),
      path: path.join(process.cwd(), 'test/fixtures/pug/pages/index.pug')
    });
    const e = new PugEngine(options('test/fixtures/pug'));
    const data = {
      page: 'index'
    };
    before(() => e.setup());

    it('renders a template', () => {
      expect(e.render('p= page', data, file)).to.contain('<p>index</p>');
    });

    it('allows for relative includes', () => {
      const page = 'include ../layouts/default.pug\n\nblock content\n\n  p Hello';
      expect(e.render(page, data, file)).to.contain('Hello');
    });

    it('allows for absolute includes', () => {
      const page = 'include /layouts/default.pug\n\nblock content\n\n  p Hello';
      expect(e.render(page, data, file)).to.contain('Hello');
    });

    it('renders filters', () => {
      const page = ':filter\n  hello';
      expect(e.render(page, data, file)).to.contain('HELLO');
    });
  });
});
