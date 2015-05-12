var fs = require('fs');
var Handlebars = require('handlebars');
var glob = require('glob');
var path = require('path');
var through = require('through2');
var fm = require('front-matter');
var extend = require('util')._extend;
var yaml = require('js-yaml');

module.exports = function(settings) {
  var partials = glob.sync(settings.partials || '!*');
  var layouts = path.join(process.cwd(), settings.layouts);
  var dataFiles = glob.sync(settings.data || '!*');
  var pageData = {};
  
  // Find partials and register with Handlebars
  for (var i in partials) {
    var file = fs.readFileSync(partials[i]);
    var name = path.basename(partials[i], '.html');
    Handlebars.registerPartial(name, file.toString() + '\n');
  }

  // Find data to be used as Handlebars variables
  for (var i in dataFiles) {
    var file = fs.readFileSync(dataFiles[i]);
    var ext = path.extname(dataFiles[i]);
    var name = path.basename(dataFiles[i], ext);
    var newData = {};

    if (ext === '.json') {
      newData[name] = require(dataFiles[i])
    }
    else if (ext === '.yml') {
      newData[name] = yaml.safeLoad(fs.readFileSync(dataFiles[i]));
    }

    pageData = extend(pageData, newData);
  }

  // Compile pages with the above helpers
  return through.obj(render);

  function render(file, enc, cb) {
    var page = fm(file.contents.toString());
    var layout = page.attributes.layout || 'default';
    layout = fs.readFileSync(path.join(layouts, layout + '.html'));

    var pageTemplate = Handlebars.compile(page.body + '\n');
    var layoutTemplate = Handlebars.compile(layout.toString());

    pageData = extend(pageData, page.attributes);

    pageData = extend(pageData, {
      page: path.basename(file.path, '.html')
    });

    Handlebars.registerPartial('body', pageTemplate);
    file.contents = new Buffer(layoutTemplate(pageData));

    cb(null, file);
  }
}

