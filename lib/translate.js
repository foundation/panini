const dotProp = require('dot-prop');

module.exports = (translations, locale) => {
  return key => {
    const string = dotProp.get(translations[locale], key);

    if (typeof string === 'undefined') {
      return key;
    }

    return string;
  };
};
