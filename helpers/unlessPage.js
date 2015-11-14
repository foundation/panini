module.exports = function(pageName) {
  return function() {
    var params = Array.prototype.slice.call(arguments);
    var pages = params.slice(0, -1);
    var options = params[params.length - 1];

    for (var i in pages) {
      if (pages[i] === pageName) {
        return '';
      }
    }

    return options.fn(this);
  }
}