/**
 * options.js
 *
 * utility methods to deal with the options indirectly and _possibly_ in a more speedy way.
 */

(function () {
  /**
   * Returns the matching group in the options given its group_name.
   * Expect opts.groups to exist and be an array
   *
   * @param {String} groupName the name of the group being searched
   * @param {Object} opts the options, expectes opts.groups to exist and be an array
   * @returns {Object|undefined} the group in the options or undefined
   */
  function fetchOptsGroup (groupName, opts) {
    return opts.groups.find(function (group) {
      return group.group_name === groupName;
    });
  }

  module.exports = {
    fetchOptsGroup: fetchOptsGroup
  };
})();
