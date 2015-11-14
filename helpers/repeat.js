module.exports = function(count, options) {
  var str = '';

  for (var i = 0; i < count; i++) {
    str += options.fn(this);
  }

  return str;
}
