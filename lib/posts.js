/* global opts */
const moment = require('moment');

(function () {
  /**
   * Returns the groups index based on group_name
   *
   * @param {String} groupName the name of the group
   * @returns {Number|false}
   */
  function _getGroupIndex (groupName) {
    for (let groupIndex = 0; groupIndex < opts.groups.length; groupIndex++) {
      if (opts.groups[groupIndex].group_name === groupName) {
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
  function preparePost (post, optsGroup, fileName, makeSafeCb) {
    if (typeof post.title === 'undefined') {
      throw new Error('File ' + fileName + ' missing title. If the file has a title, make sure the frontmatter is formatted correctly.');
    }
    if (typeof makeSafeCb === 'undefined' || typeof makeSafeCb !== 'function') {
      // by default it won't do anything
      makeSafeCb = val => val;
    }

    const groupName = optsGroup.group_name;
    post.original_contents = new Buffer(post.contents.toString());
    // sort out the path for the post
    let pathReplace = {};
    if (typeof post.slug !== 'undefined') {
      pathReplace.title = post.slug; // do not makeSafe the slug on purpose
    } else {
      pathReplace.title = makeSafeCb(post.title);
    }
    // normal groups
    // because the object is just being referenced, it might have already been set
    if (typeof post.permalink === 'undefined') {
      const permalinkGroupIndex = _getGroupIndex(opts.permalink_group);
      pathReplace.group = groupName;
      if (typeof opts.groups[ permalinkGroupIndex ].date_format !== 'undefined') {
        pathReplace.date = moment(post.date).format(opts.groups[ permalinkGroupIndex ].date_format);
      }
      post.permalink = '/' + opts.groups[permalinkGroupIndex].path
        .replace(/\/{num}/g, '')
        .replace(/{(.*?)}/g, function (matchPost, matchedGroup) {
          return pathReplace[matchedGroup];
        });
    }
    // groups that override the permalink
    if (typeof optsGroup.override_permalink_group !== 'undefined') {
      let path;
      pathReplace.group = groupName;
      if (typeof optsGroup.override_permalink_group.date_format !== 'undefined') {
        pathReplace.date = moment(post.date).format(optsGroup.override_permalink_group.date_format);
      }
      if (typeof optsGroup.path === 'undefined') {
        path = '{group}/{title}';
      } else {
        path = optsGroup.path;
      }
      post.permalink = '/' + path.replace(/\/{num}/g, '').replace(/{(.*?)}/g, function (matchPost, matchedGroup) {
        return pathReplace[matchedGroup];
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

  module.exports = {
    preparePost: preparePost
  };
})();
