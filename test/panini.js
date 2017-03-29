'use strict';

const chai = require('chai');
const chaiStream = require('chai-stream-es6').default;
const Panini = require('..').Panini;
const PugEngine = require('../engines/pug');

const expect = chai.expect;
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

    it('allows the engine to be changed', () => {
      const p = new Panini({
        input: 'src',
        engine: 'pug'
      });
      expect(p.engine).to.be.an.instanceOf(PugEngine);
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
