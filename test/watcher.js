'use strict';

const fs = require('fs');
const path = require('path');
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const tempy = require('tempy');
const del = require('del');
const watcher = require('../lib/watcher');

chai.use(sinonChai);
const expect = chai.expect;

describe('watcher()', () => {
  let tempDir;
  let w;

  before(() => {
    tempDir = tempy.directory();
  });

  afterEach(() => {
    w.close();
    return del(path.join(tempDir, '**/*'), {force: true});
  });

  it('calls the update function immediately', done => {
    fs.writeFileSync(path.join(tempDir, 'index.html'), 'test');
    const update = sinon.spy();
    const rule = {
      pattern: '*.*',
      update,
      remove: () => {}
    };
    w = watcher(rule, tempDir);
    w.on('ready', () => {
      expect(update).to.have.been.calledOnce;
      done();
    });
  });

  it('calls the update function with a name, file path and contents', done => {
    const filePath = path.join(tempDir, 'index.html');
    fs.writeFileSync(filePath, 'test');
    const update = sinon.spy();
    const rule = {
      pattern: '*.*',
      update,
      remove: () => {}
    };
    w = watcher(rule, tempDir);
    w.on('ready', () => {
      expect(update).to.have.been.calledWithExactly('index', filePath, 'test');
      done();
    });
  });

  it('calls the update function when a file changes', done => {
    const filePath = path.join(tempDir, 'index.html');
    fs.writeFileSync(filePath, 'test');
    const update = sinon.spy();
    const rule = {
      pattern: '*.*',
      update,
      remove: () => {}
    };
    w = watcher(rule, tempDir);
    w.on('ready', () => {
      fs.writeFileSync(filePath, 'tested');

      w.on('change', () => {
        expect(update).to.have.been.calledTwice;
        done();
      });
    });
  });

  it('calls the update function when a file is added', done => {
    const filePathA = path.join(tempDir, 'index.html');
    const filePathB = path.join(tempDir, 'index-2.html');
    fs.writeFileSync(filePathA, 'test');
    const update = sinon.spy();
    const rule = {
      pattern: '*.*',
      update,
      remove: () => {}
    };
    w = watcher(rule, tempDir);
    w.on('ready', () => {
      fs.writeFileSync(filePathB, 'test');

      w.on('add', () => {
        // Two calls for the original file, one call for the new file
        expect(update).to.have.been.calledThrice;
        done();
      });
    });
  });

  it('calls the remove function when a file is removed', done => {
    const filePath = path.join(tempDir, 'index.html');
    fs.writeFileSync(filePath, 'test');
    const remove = sinon.spy();
    const rule = {
      pattern: '*.*',
      update: () => {},
      remove
    };
    w = watcher(rule, tempDir);
    w.on('ready', () => {
      fs.unlinkSync(filePath);

      w.on('unlink', () => {
        expect(remove).to.have.been.calledWithExactly('index', filePath, undefined);
        done();
      });
    });
  });

  it('allows file reading to be disabled', done => {
    const filePath = path.join(tempDir, 'index.html');
    fs.writeFileSync(filePath, 'test');
    const update = sinon.spy();
    const rule = {
      pattern: '*.*',
      read: false,
      update,
      remove: () => {}
    };
    w = watcher(rule, tempDir);
    w.on('ready', () => {
      expect(update).to.have.been.calledWithExactly('index', filePath, undefined);
      done();
    });
  });

  it('allows a this argument to be passed', done => {
    const filePath = path.join(tempDir, 'index.html');
    fs.writeFileSync(filePath, 'test');
    const spy = sinon.spy();
    const rule = {
      pattern: '*.*',
      update() {
        spy(this);
      },
      remove: () => {}
    };
    w = watcher(rule, tempDir, 'this');
    w.on('ready', () => {
      expect(spy).to.have.been.calledWithExactly('this');
      done();
    });
  });
});
