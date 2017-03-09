import chai, { expect } from 'chai';
import chaiStream from 'chai-stream-es6';
import { Panini } from '..';

chai.use(chaiStream);

describe('Panini class', () => {
  describe('constructor()', () => {
    let panini;

    before(() => {
      panini = new Panini({
        input: 'src',
      });
    });

    it('creates a new instance of Panini', () => {
      expect(panini).to.be.an.instanceOf(Panini);
    });

    it('assigns options', () => {
      expect(panini.options).to.have.property('input', 'src');
    });

    it('loads built-in helpers', () => {
      expect(panini.Handlebars.helpers).to.contain.keys(['code', 'ifequal', 'markdown', 'repeat']);
    });

    it('throws an error if no input option is set', () => {
      expect(() => new Panini()).to.throw(Error);
    });

    it('can disable loading of built-in helpers', () => {
      const panini = new Panini({
        input: 'src',
        builtins: false,
      });
      expect(panini.Handlebars.helpers).to.not.contain.keys(['code', 'ifequal', 'markdown', 'repeat']);
    });
  });

  describe('getSourceStream()', () => {
    it('returns a stream', () => {
      const panini = new Panini({ input: 'src' });
      expect(panini.getSourceStream()).to.be.a.ReadableStream;
      expect(panini.getSourceStream()).to.be.a.WritableStream;
    });
  });
});
