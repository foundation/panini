import { expect } from 'chai';
import { create } from 'handlebars';
import loadLayouts from '../lib/loadLayouts';
import loadData from '../lib/loadData';

describe('loadLayouts', () => {
  it('creates an object of Handlebars templates', () => {
    return loadLayouts('test/fixtures/basic/layouts', create()).then(res => {
      expect(res).to.have.property('default').that.is.a('function');
    });
  });
});

describe('loadData', () => {
  it('creates an object of Handlebars templates', () => {
    return loadData('test/fixtures/data-yaml/data', create()).then(res => {
      expect(res).to.eql({
        breakfast: [
          'eggs',
          'bacon',
          'toast'
        ]
      });
    });
  });
});
