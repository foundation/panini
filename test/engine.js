import {expect} from 'chai';
import PaniniEngine from '../engines/base';
import HandlebarsEngine from '../engines/handlebars';

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
      expect(e.options).to.eql(opts);
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
      const e = new Engine({input: 'test/fixtures/data-js', data: 'data'});
      return e.setup().then(() => expect(e.data).to.have.keys(['breakfast']));
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

    it('loads built-in helpers if configured to do so', () => {
      const e = new HandlebarsEngine({builtins: true});
      expect(e.engine.helpers).to.contain.keys(['code', 'ifequal', 'markdown', 'repeat']);
    });
  });

  describe('setup()', () => {
    it('loads partials', () => {
      const e = new HandlebarsEngine(options('test/fixtures/basic'));
      return e.setup().then(() => expect(e.layouts).to.have.keys(['default']));
    });

    it('loads partials', () => {
      const e = new HandlebarsEngine(options('test/fixtures/partials'));
      return e.setup().then(() => expect(e.engine.partials).to.have.keys(['partial']));
    });

    it('loads helpers', () => {
      const e = new HandlebarsEngine(options('test/fixtures/helpers'));
      return e.setup().then(() => expect(e.engine.helpers).to.contain.keys(['helper']));
    });

    it('loads data', () => {
      const e = new HandlebarsEngine(options('test/fixtures/data-js'));
      return e.setup().then(() => expect(e.data).to.have.keys(['breakfast']));
    });
  });

  describe('render()', () => {
    const e = new HandlebarsEngine(options('test/fixtures/basic'));
    const data = {
      layout: 'default',
      page: 'index'
    };

    before(() => e.setup());

    it('renders a page', () => {
      const output = e.render('<h1>Page</h1>', data);
      expect(output).to.contain('<h1>Page</h1>');
    });

    it('renders the layout of the page', () => {
      const output = e.render('<h1>Page</h1>', data);
      expect(output).to.contain('<html>');
    });

    it('inserts the data of the page into the template', () => {
      const output = e.render('<h1>{{ layout }}</h1>', data);
      expect(output).to.contain('<h1>default</h1>');
    });

    it('registers #ifpage helper', () => {
      const output = e.render('<h1>{{#ifpage "index"}}index{{/ifpage}}</h1>', data);
      expect(output).to.contain('<h1>index</h1>');
    });

    it('registers #unlesspage helper', () => {
      const output = e.render('<h1>{{#unlesspage "about"}}index{{/unlesspage}}</h1>', data);
      expect(output).to.contain('<h1>index</h1>');
    });

    it('captures error when template is not found', () => {
      const output = e.render('', Object.assign({}, data, {layout: 'nope'}));
      expect(output).to.contain('<title>Panini error</title>');
    });

    it('captures Handlebars errors', () => {
      const output = e.render('{{ foo | bar }}', data);
      expect(output).to.contain('template could not be parsed');
    });
  });
});
