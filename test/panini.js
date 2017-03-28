import chai, {expect} from 'chai';
import chaiStream from 'chai-stream-es6';
import {Panini} from '..';

chai.use(chaiStream);

describe('Panini class', () => {
  describe('constructor()', () => {
    let panini;

    before(() => {
      panini = new Panini({
        input: 'src'
      });
    });

    it('creates a new instance of Panini', () => {
      expect(panini).to.be.an.instanceOf(Panini);
    });

    it('assigns options', () => {
      expect(panini.options).to.have.property('input', 'src');
    });

    it('throws an error if no input option is set', () => {
      expect(() => new Panini()).to.throw(Error);
    });
  });

  describe('getSourceStream()', () => {
    it('returns a stream', () => {
      const panini = new Panini({input: 'src'});
      expect(panini.getSourceStream()).to.be.a.ReadableStream;
      expect(panini.getSourceStream()).to.be.a.WritableStream;
    });
  });
});
