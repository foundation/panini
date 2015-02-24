var fs = require('fs');
var Handlebars = require('handlebars');
var glob = require('glob');
var path = require('path');
var map = require('vinyl-map');
var fm = require('front-matter');

module.exports = function(settings) {
  var partials = glob.sync(settings.partials);
  var layout   = fs.readFileSync(settings.layout);
  
  // Find partials and register with Handlebars
  for (var i in partials) {
    var file = fs.readFileSync(partials[i]);
    var name = path.basename(partials[i], '.html');
    Handlebars.registerPartial(name, file.toString() + '\n');
  }

  // Compile pages with the above helpers
  return map(function(code, filename) {
    var page = fm(code.toString());
    var pageTemplate = Handlebars.compile(page.body + '\n');
    var layoutTemplate = Handlebars.compile(layout.toString());

    Handlebars.registerPartial('body', pageTemplate);
    return layoutTemplate(page.attributes);
  });
}
