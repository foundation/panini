var fs = require('fs');
var Handlebars = require('handlebars');
var glob = require('glob');
var path = require('path');
var through = require('through2');
var fm = require('front-matter');
var extend = require('util')._extend;
var yaml = require('js-yaml');

module.exports = function(settings) {
  // Default options
  settings = extend({
    layouts: '',
    partials: '!*',
    data: '!*',
    helpers: '!*'
  }, settings);

  var partials = glob.sync(settings.partials);
  var layoutPath = path.join(process.cwd(), path.dirname(settings.layouts));
  var dataFiles = glob.sync(settings.data);
  var helpers = glob.sync(settings.helpers);
  var pageData = {};

  // supported file extensions
  var extensions = ['.html', 'hb', '.hbs', '.handlebars'];
  // get extensions used in settings
  var layoutExt = path.extname(settings.layouts);
  var partialExt = path.extname(settings.partials);

  // Helper return false if used extension is not one of supported
  var isSupportedExt = function (ext) {
    return extensions.indexOf(ext) !== -1;
  };

  // Helper to check array of used extension, throw error if not supported
  var checkExt = function (extArr) {
    // if the given extension is not one of the supported
    for (var ext in extArr) {
      if (! isSupportedExt(extArr[ext])) {
        // throw it back!
        throw new Error(
          'File extension '+ extArr[ext] +' is not supported in panini'
        );
      }
    }
  };

  // Check extensions from settings
  checkExt([layoutExt, partialExt]);
  
  // Find partials and register with Handlebars
  for (var i in partials) {
    var file = fs.readFileSync(partials[i]);
    var name = path.basename(partials[i], settings.templateExt);
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

  // Find Handlebars helpers
  for (var i in helpers) {
    var helper;
    var name = path.basename(helpers[i], '.js');

    try {
      helper = require(path.join(process.cwd(), helpers[i]));
      Handlebars.registerHelper(name, helper);
    }
    catch (e) {
      console.warn('Error when loading ' + name + '.js as a Handlebars helper.');
    }
  }

  // Compile pages with the above helpers
  return through.obj(render);

  function render(file, enc, cb) {
    var fileDir = path.dirname(file.path);
    var fileExt = path.extname(file.path);
    var fileName = path.basename(file.path, fileExt);

    // check file extension from src stream
    checkExt([fileExt]);
    
    // Get the HTML for the current page and layout
    var page = fm(file.contents.toString());
    var layout = page.attributes.layout || 'default';

    layout = fs.readFileSync(path.join(layoutPath, layout + layoutExt));

    // Now create Handlebars templates out of them
    var pageTemplate = Handlebars.compile(page.body + '\n');
    var layoutTemplate = Handlebars.compile(layout.toString());

    // Next, extend the existing data object to include this page's metadata
    pageData = extend(pageData, page.attributes);
    pageData = extend(pageData, {
      page: fileName
    });

    // Finally, add the page as a partial called "body", and render the layout template
    Handlebars.registerPartial('body', pageTemplate);
    file.contents = new Buffer(layoutTemplate(pageData));

    // change path to always end with .html
    file.path = path.join(fileDir, fileName + '.html');

    // This sends the modified file back into the stream
    cb(null, file);
  }
};
