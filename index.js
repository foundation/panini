var fs = require('fs');
var Handlebars = require('handlebars');
var glob = require('glob');
var path = require('path');
var through = require('through2');
var fm = require('front-matter');

module.exports = function(settings) {
  var partials = glob.sync(settings.partials || '');
  var layouts = path.join(process.cwd(), settings.layouts);
  
  // Find partials and register with Handlebars
  for (var i in partials) {
    var file = fs.readFileSync(partials[i]);
    var name = path.basename(partials[i], '.html');
    Handlebars.registerPartial(name, file.toString() + '\n');
  }

  // Compile pages with the above helpers
  return through.obj(render);

  function render(file, enc, cb) {
    var page = fm(file.contents.toString());
    var layout = page.attributes.layout || 'default';
    layout = fs.readFileSync(path.join(layouts, layout + '.html'));

    var pageTemplate = Handlebars.compile(page.body + '\n');
    var layoutTemplate = Handlebars.compile(layout.toString());

    Handlebars.registerPartial('body', pageTemplate);
    file.contents = new Buffer(layoutTemplate(page.attributes));

    cb(null, file);
  }
}

