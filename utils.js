const findElementInArray = (arr, prop, value) => {
  return arr.find(el => el[prop] == value);
};

const getIdFromUrl = (url) => {
  const splitUrl = url.split('/');
  return parseInt(splitUrl[splitUrl.length - 2]);
};

const ensureObjEntry = (obj, key, defaultValue) => {
  if (!obj[key]) {
    obj[key] = defaultValue;
  }
};

const sortByKey = (array, keys) => {
  const sortCompare = (a, b, key, reverse) => {
    if (a[key] > b[key]) {
      return reverse ? 1 : -1;
    } else if (a[key] < b[key]) {
      return reverse ? -1 : 1;
    } else {
      return 0;
    }
  }

  return array.sort((a, b) => {
    for (let i = 0; i < keys.length; i++) {
      const reverse = typeof keys[i] === 'string' ? false : keys[i].reverse;
      const compared = sortCompare(a, b, keys[i].key || keys[i], reverse);
      if (compared !== 0) {
        return compared;
      }
    }

    return 0;
  });
}

module.exports = {
  ensureObjEntry,
  findElementInArray,
  getIdFromUrl,
  sortByKey,
};
