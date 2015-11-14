module.exports = function() {
  this.Handlebars.registerHelper('markdown', require('../helpers/markdown'));
}
