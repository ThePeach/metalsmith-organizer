const moment = require('moment');
const utils = require('./utils');

(function () {
  /**
   * Returns the groups index based on group_name
   *
   * @param {String} groupName the name of the group
   * @returns {Number|false}
   */
  function _getGroupIndex (groupName, groups) {
    for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
      if (groups[groupIndex].group_name === groupName) {
        return groupIndex;
      }
    }
    return false;
  }

  /**
   * Prepare the post with all the additional stuff we need
   *
   * @param {Object} post
   * @param {Object} optsGroup
   * @param [{function}] makeSafeCb callback function for cleaning values before comparing
   * @param {String} fileName
   */
  function preparePost (post, optsGroup, opts, fileName, makeSafeCb) {
    if (typeof post.title === 'undefined') {
      throw new Error('File ' + fileName + ' missing title. If the file has a title, make sure the frontmatter is formatted correctly.');
    }
    if (typeof makeSafeCb === 'undefined' || typeof makeSafeCb !== 'function') {
      // by default it won't do anything
      makeSafeCb = val => val;
    }

    const groupName = optsGroup.group_name;
    post.original_contents = post.contents.toString();
    // sort out the path for the post
    let pathReplace = {};
    if (typeof post.slug !== 'undefined') {
      pathReplace.title = post.slug; // do not makeSafe the slug on purpose
    } else {
      pathReplace.title = makeSafeCb(post.title);
    }
    // normal groups
    if (typeof post.permalink === 'undefined') {
      // because the object is just being referenced, it might have already been set
      const permalinkGroupIndex = _getGroupIndex(opts.permalink_group, opts.groups);
      pathReplace.group = groupName;
      if (typeof opts.groups[ permalinkGroupIndex ].date_format !== 'undefined') {
        pathReplace.date = moment(post.date).format(opts.groups[ permalinkGroupIndex ].date_format);
      }

      post.permalink = '/' + opts.groups[permalinkGroupIndex].path
        .replace(/\/{num}/g, '') // strip out `/{num}` (the page number) for the permalink
        .replace(/{(.*?)}/g, function (match, matchedReplacement) { // match anything else that is surrounded with {}
          // FIXME DEBUG if (typeof pathReplace[matchedReplacement] === 'undefined')
          return pathReplace[matchedReplacement];
        });
    }
    // groups that override the permalink
    if (typeof optsGroup.override_permalink_group !== 'undefined') {
      let path = optsGroup.path || '{group}/{title}';
      pathReplace.group = groupName;
      if (typeof optsGroup.date_format !== 'undefined') {
        pathReplace.date = moment(post.date).format(optsGroup.date_format);
      }
      post.permalink = '/' + path
        .replace(/\/{num}/g, '') // strip out "/{num}" (the page number) for the permalink
        .replace(/{(.*?)}/g, function (match, matchedReplacement) { // match anything else that is surrounded with {}
          // FIXME DEBUG if (typeof pathReplace[matchedReplacement] === 'undefined')
          return pathReplace[matchedReplacement];
        });
    }
    // add any properties specified
    if (typeof optsGroup.add_prop !== 'undefined') {
      for (let set in optsGroup.add_prop) {
        const prop = Object.keys(optsGroup.add_prop[set])[0];
        post[prop] = optsGroup.add_prop[set][prop];
      }
    }
  }

  /**
   * returns whether a post matches our criteria or not
   *
   * @param {Object} postData the data associated to a parsed file
   * @param {String} searchType can either be `all` or `any`
   * @param {Array} searchParams the specified params used for matching
   * @param [{function}] callback function for cleaning values before comparing
   * @returns {Boolean}
   */
  function matchPost (postData, searchType, searchParams, callback) {
    let match = false;
    // we include all posts by default if no search has been defined in the options
    if (typeof searchParams === 'undefined') {
      return true;
    }

    for (let propName in searchParams) {
      if (searchParams.hasOwnProperty(propName)) {
        let propValue = searchParams[propName];

        // first one wrong will return false
        if (searchType === 'all') {
          match = true;
          if (!utils.contains(postData[propName], propValue, callback)) {
            match = false;
            break;
          }
        // first one correct will return true
        } else if (searchType === 'any') {
          if (utils.contains(postData[propName], propValue, callback)) {
            match = true;
            break;
          }
        }
      }
    }

    return match;
  }

  module.exports = {
    preparePost: preparePost,
    matchPost: matchPost
  };
})();
