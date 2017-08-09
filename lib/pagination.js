const optsUtils = require('./options');

(function () {
  const _pages = [];

  /**
   * @constructor
   *
   * @param {String} layout
   * @param {String} groupName
   * @param {Object} pagination
   * @param {String} path
   * @param {String} filename
   * @param {String} extension
   * @param {String} description
   */
  function Page (layout, groupName, pagination, path, filename, extension, description) {
    this.layout = layout;
    this.group = groupName;
    this.contents = new Buffer('');
    this.pagination = pagination;
    this.path = path + filename + extension;
    this.permalink = `/${path}`;
    if (typeof description !== 'undefined') {
      this.page_description = description;
    }

    function setExposed (exposedName, exposedValue) { // eslint-disable-line no-unused-vars
      this.exposed = exposedName;
      this.exposed_value = exposedValue;
    }
  }

  /**
   * @constructor
   *
   * @param {Array} pages
   * @param {Array} thisPageFiles
   * @param {Number} totalPages
   */
  function Pagination (pages, thisPageFiles, totalPages) {
    this.index = pages.length;
    this.num = pages.length + 1;
    this.pages = pages;
    this.files = thisPageFiles;
    this.total = totalPages;
  }

  /**
   * computes the path for the page
   *
   * @param {String} groupName the name of the current group being parsed
   * @param {Object} opts the options object
   * @param {Number} pageNumber the current number of the page we are getting the path for
   * @param {String} groupVarName the current variable being handled in the current group
   * @param {Function} makeSafeCb the callback for making safe strings
   * @returns {String} the computed path
   */
  function createPath (groupName, opts, pageNumber, groupVarName, makeSafeCb) {
    if (typeof makeSafeCb !== 'function') {
      makeSafeCb = value => value; // doesn't do anything by default
    }
    const optsGroup = optsUtils.fetchOptsGroup(groupName, opts);
    const expose = optsGroup.expose;
    const exposeValue = optsGroup[expose];
    // build up replacement variables for the path
    const pathReplace = {
      group: groupName
    };

    // page number
    if (pageNumber !== 0) {
      pathReplace.num = pageNumber + 1;
    } else {
      delete pathReplace.num;
    }

    // FIXME this is too much of a guess, rework it, should imply it's the dates field?
    if (typeof optsGroup.date_format !== 'undefined') {
      pathReplace.date = groupVarName;
    }

    // exposed variable/value
    if (expose || exposeValue) {
      pathReplace.expose = exposeValue || groupVarName;
      pathReplace.expose = makeSafeCb(pathReplace.expose);
    }

    // create path by replacing variables
    let path = optsGroup.path
      .replace(/{title}/g, '') // remove {title} from path
      .replace(/{(.*?)}/g, function (matchPost, matchedGroup) { // match anything else that is wrapped around {}
        if (typeof pathReplace[matchedGroup] === 'undefined') {
          return ''; // strips it out
        } else {
          if (matchedGroup === 'num' && typeof optsGroup.num_format !== 'undefined') {
            return optsGroup.num_format
              .replace(/{(.*?)}/g, function (matchPost, matchedGroup) {
                return pathReplace[matchedGroup];
              });
          }
          return pathReplace[matchedGroup];
        }
      })
      .replace(/(\/)+/g, '/') // siplify double multiple slashed into single ones
      .replace(/.$/m, match => { // remaining bits
        if (match !== '/') {
          return match + '/';
        } else {
          return match;
        }
      });

    return path;
  }

  /**
   * Reset the list of pages.
   * Use with caution, all dangling refs won't be cleared out
   */
  function reset () {
    while (_pages.length > 0) {
      _pages.pop();
    }
  }

  module.exports = {
    Page: Page,
    Pagination: Pagination,
    createPath: createPath,
    reset: reset
  };
})();
