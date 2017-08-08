// utils.js contains generic utilities

(function () {
  /**
   * Assign date data to metalsmith_.metadata
   *
   * @param {Object} obj
   * @param {String} path
   * @param {any} value
   */
  function assignPath (obj, path, value) {
    const last = path.length - 1;
    for (let i = 0; i < last; i++) {
      const key = path[i];
      if (typeof obj[key] === 'undefined') {
        obj[key] = {};
      }
      obj = obj[key];
    }
    obj[path[last]] = value;
  }

  /**
   * sort function for group dates
   *
   * @param {any} a
   * @param {any} b
   * @returns
   */
  function orderByDate (a, b) {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB.getTime() - dateA.getTime();
  }

  /**
   * sort function for group dates, inverted
   *
   * @param {any} a
   * @param {any} b
   * @returns
   */
  function orderByDateReverse (a, b) {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  }

  /**
   * checks individual values of post and returns whether there's a match to the match function
   *
   * @param {any} data
   * @param {any} propertyValue
   * @param [{function}] makeSafeCb callback function for cleaning values before comparing
   * @returns {boolean}
   */
  function contains (data, propertyValue, makeSafeCb) {
    if (typeof makeSafeCb === 'undefined' || typeof makeSafeCb !== 'function') {
      // by default it won't do anything
      makeSafeCb = val => val;
    }

    // for when we just want to check if a property exists
    if (typeof propertyValue === 'boolean') {
      if (propertyValue === true && typeof data !== 'undefined') {
        return true;
      } else if (propertyValue === true && typeof data === 'undefined') {
        return false;
      } else if (propertyValue === false && typeof data === 'undefined') {
        return true;
      } else if (propertyValue === false && typeof data !== 'undefined') {
        return false;
      }
    }

    // for checking strings and arrays against our search criteria values
    if (typeof data !== 'undefined') {
      if (typeof data === 'string' && makeSafeCb(data) === makeSafeCb(propertyValue)) {
        return true;
      }
      if (Array.isArray(data)) {
        data = data.map(tag => {
          tag = makeSafeCb(String(tag).trim());
          return tag;
        });
        return data.includes(makeSafeCb(propertyValue));
      }
    }
  }

  module.exports = {
    assignPath: assignPath,
    contains: contains,
    orderByDate: orderByDate,
    orderByDateReverse: orderByDateReverse
  };
})();
