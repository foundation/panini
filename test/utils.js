import { expect } from 'chai';
import path from 'path';
import processRoot from '../lib/processRoot';
import { loadFiles } from '../lib/utils';

describe('processRoot()', () => {
  it('returns an empty string if both paths are on the same level', () => {
    const pagePath = path.join(process.cwd(), 'src/pages/index.html');
    expect(processRoot(pagePath, 'src/pages')).to.equal('');
  });

  it('returns a path prefix if paths are on different levels', () => {
    const pagePath = path.join(process.cwd(), 'src/pages/about/index.html');
    expect(processRoot(pagePath, 'src/pages')).to.equal('../');
  });
});

describe('loadFiles()', () => {
  it('processes a single path', () => {
    const globs = loadFiles('test/fixtures/basic/pages', '**/*.html');
    expect(globs).to.have.a.lengthOf(1);
    expect(globs[0]).to.contain('test/fixtures/basic/pages/index.html');
  });

  it('processes a series of paths', () => {
    const globs = loadFiles(['test/fixtures/basic/pages', 'test/fixtures/basic/layouts'], '**/*.html');
    expect(globs).to.have.a.lengthOf(2);
  });
});
