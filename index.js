var fs = require('fs');
var glob = require('glob');
var path = require('path');
var through = require('through2');
var fm = require('front-matter');
var extend = require('util')._extend;
var yaml = require('js-yaml');

function Panini(options) {
  this.options = options;
  this.Handlebars = require('handlebars');
  this.layouts = {};
  this.data = {};

  if (!options.layouts) {
    throw new Error('Panini error: you must specify a directory for layouts.');
  }

  if (!options.root) {
    throw new Error('Panini error: you must specify the root folder that pages live in.')
  }
}

Panini.prototype.init = function() {
  this.loadLayouts(this.options.layouts);

  if (this.options.partials) {
    this.loadPartials(path.join(process.cwd(), this.options.partials));
  }

  if (this.options.helpers) {
    this.loadHelpers(path.join(process.cwd(), this.options.helpers));
  }

  if (this.options.data) {
    this.loadData(path.join(process.cwd(), this.options.data));
  }
}

Panini.prototype.loadLayouts = function(dir) {
  var layouts = glob.sync(path.join(dir, '**/*.html'));

  for (var i in layouts) {
    var name = path.basename(layouts[i], '.html');
    var file = fs.readFileSync(layouts[i]);
    this.layouts[name] = this.Handlebars.compile(file.toString());
  }
}

Panini.prototype.loadPartials = function(dir) {
  var partials = glob.sync(path.join(dir, '**/*.{html,hbs,handlebars}'));

  for (var i in partials) {
    var file = fs.readFileSync(partials[i]);
    var name = path.basename(partials[i], '.html');
    this.Handlebars.registerPartial(name, file.toString() + '\n');
  }
}

Panini.prototype.loadHelpers = function(dir) {
  var helpers = glob.sync(path.join(dir, '**/*.js'));

  for (var i in helpers) {
    var helper;
    var name = path.basename(helpers[i], '.js');

    try {
      helper = require(path.join(helpers[i]));
      this.Handlebars.registerHelper(name, helper);
    }
    catch (e) {
      console.log(e);
      console.warn('Error when loading ' + name + '.js as a Handlebars helper.');
    }
  }
}

Panini.prototype.loadData = function(dir) {
  var dataFiles = glob.sync(path.join(dir, '*.{json,yml}'));

  for (var i in dataFiles) {
    var file = fs.readFileSync(dataFiles[i]);
    var ext = path.extname(dataFiles[i]);
    var name = path.basename(dataFiles[i], ext);
    var data;

    if (ext === '.json') {
      data = require(dataFiles[i])
    }
    else if (ext === '.yml') {
      data = yaml.safeLoad(fs.readFileSync(dataFiles[i]));
    }

    this.data = data;
  }
}

Panini.prototype.render = function(file, enc, cb) {
  // Get the HTML for the current page and layout
  var page = fm(file.contents.toString());
  var layout = page.attributes.layout || 'default';

  // Now create Handlebars templates out of them
  var pageTemplate = this.Handlebars.compile(page.body + '\n');
  var layoutTemplate = this.layouts[layout];

  // Next, extend the existing data object to include this page's metadata
  pageData = page.attributes;
  pageData = extend(pageData, {
    page: path.basename(file.path, '.html')
  });

  // Finally, add the page as a partial called "body", and render the layout template
  this.Handlebars.registerPartial('body', pageTemplate);
  file.contents = new Buffer(layoutTemplate(pageData));

  // This sends the modified file back into the stream
  cb(null, file);
}

var panini;

module.exports = function(settings) {
  if (!panini) {
    panini = new Panini(settings);
    panini.init();
  }

  // Compile pages with the above helpers
  return through.obj(panini.render.bind(panini));
}
