import { expect } from 'chai';
import { create } from 'handlebars';
import loadLayouts from '../lib/loadLayouts';
import loadData from '../lib/loadData';
import loadHelpers from '../lib/loadHelpers';
import loadPartials from '../lib/loadPartials';

describe('loadLayouts', () => {
  it('creates an object of Handlebars templates', () => {
    return loadLayouts('test/fixtures/basic/layouts', create()).then(res => {
      expect(res).to.have.property('default').that.is.a('function');
    });
  });
});

describe('loadData', () => {
  it('fetches data files', () => {
    return loadData('test/fixtures/data-yaml/data').then(res => {
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

describe('loadHelpers', () => {
  it('adds helpers to a Handlebars instance', () => {
    const handlebars = create();
    return loadHelpers('test/fixtures/helpers/helpers', handlebars).then(() => {
      expect(handlebars.helpers).to.have.property('helper').that.is.a('function');
    });
  });
});

describe('loadPartials', () => {
  it('adds partials to a Handlebars instance', () => {
    const handlebars = create();
    return loadPartials('test/fixtures/partials/partials', handlebars).then(() => {
      expect(handlebars.partials).to.have.property('partial').that.is.a('string');
    });
  });
});
