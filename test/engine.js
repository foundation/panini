'use strict';

const path = require('path');
const chai = require('chai');
const sinonChai = require('sinon-chai');
const sinon = require('sinon');
const File = require('vinyl');
const marked = require('marked');
const PaniniEngine = require('../lib/engine');
const HandlebarsEngine = require('../engines/handlebars');
const PugEngine = require('../engines/pug');
const EjsEngine = require('../engines/ejs');

chai.use(sinonChai);
const expect = chai.expect;

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

    it('loads collection configs', () => {
      const e = new Engine({input: 'test/fixtures/collections'});
      return e.setup().then(() =>
        expect(e.collections).to.have.property('blog-posts').with.keys(['input', 'output', 'transform', 'template'])
      );
    });
  });

  describe('buildCollections()', () => {
    class Engine extends PaniniEngine {}
    const e = new Engine({input: 'test/fixtures/collections'});
    e.collections = {
      posts: {}
    };

    before(() => {
      sinon.stub(e, 'buildCollection');
    });

    after(() => {
      e.buildCollection.restore();
    });

    it('calls buildCollection() once for each collection config stored', () => {
      return e.buildCollections().then(() => {
        expect(e.buildCollection).to.have.been.calledOnce;
      });
    });
  });

  describe('buildCollection()', () => {
    class Engine extends PaniniEngine {}
    const e = new Engine({input: 'test/fixtures/collections'});
    let file;
    e.collections = {
      'blog-posts': {
        input: 'blog-posts/*.md',
        output: 'posts',
        transform: (filePath, contents) => {
          return {
            name: path.basename(filePath),
            data: {
              body: marked(contents)
            }
          };
        },
        template: Buffer.from('{{body}}')
      }
    };

    before(() => {
      return e.buildCollection('blog-posts').then(() => {
        file = e.collectionPages['blog-posts'][0];
      });
    });

    it('stores a series of pages in an array', () => {
      expect(e.collectionPages).to.have.property('blog-posts').that.is.an('array');
    });

    it('stores pages as Vinyl files', () => {
      expect(file).to.be.an.instanceOf(File);
    });

    it('inserts collection template as the contents of the file', () => {
      expect(file.contents.toString()).to.contain('{{body}}');
    });

    it('attaches data from transform function onto file', () => {
      expect(file.data).to.be.an('object').with.keys(['body']);
    });

    it('sets filename of file based on return value of transform function', () => {
      expect(file.path).to.equal(
        path.join(process.cwd(), 'test/fixtures/collections/pages/posts/one.html')
      );
    });

    it('works with directories', () => {
      const e = new Engine({input: 'test/fixtures/collections'});
      e.collections = {
        'blog-posts': {
          input: 'blog-posts/',
          output: 'posts',
          transform: filePath => {
            return {
              name: path.basename(filePath),
              data: {}
            };
          },
          template: Buffer.from('{{body}}')
        }
      };

      return e.buildCollection('blog-posts').then(() => {
        const file = e.collectionPages['blog-posts'][0];
        expect(file.path).to.equal(path.join(process.cwd(), 'test/fixtures/collections/pages/posts/blog-posts.html'));
      });
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
    helpers: 'helpers',
    collections: 'collections'
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
    data: 'data',
    collections: 'collections'
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

describe('EjsEngine', () => {
  describe('constructor()', () => {
    it('creates a new instance of PugEngine', () => {
      expect(new EjsEngine()).to.be.an.instanceOf(EjsEngine);
    });
  });

  describe('render', () => {
    const file = new File({
      base: path.join(process.cwd(), 'test/fixtures/ejs/pages'),
      path: path.join(process.cwd(), 'test/fixtures/ejs/pages/index.ejs')
    });
    const e = new EjsEngine({input: 'test/fixtures/ejs'});
    const data = {
      page: 'index'
    };

    it('renders an EJS template', () => {
      expect(e.render('<%= page %>', data, file)).to.contain('index');
    });

    it('correctly sets up relative includes', () => {
      expect(e.render('<%- include("../includes/include") %>', data, file)).to.contain('Hello world.');
    });

    it('correctly sets up absolute includes', () => {
      expect(e.render('<%- include("/includes/include") %>', data, file)).to.contain('Hello world.');
    });
  });
});
