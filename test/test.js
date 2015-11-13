var assert = require('assert');
var path = require('path');
var fs = require('fs');
var minify = require('html-minifier').minify;

describe('panini', function () {

	var config = {
		build    : './_build',
    expected : './_expected'
	};

  // get all files in _expected/
  var files = fs.readdirSync(config.expected);


  files.forEach(function (file) {
    it('should create '+ file +' and match it to expected output', function (done) {

      var output = minify(
        fs.readFileSync(path.join(config.build, file), 'utf-8'),
        { collapseWhitespace: true }
      );
      var expected = minify(
        fs.readFileSync(path.join(config.expected, file), 'utf-8'),
        { collapseWhitespace: true }
      );

      assert.equal(output, expected);
      done();

    });
  });

});
