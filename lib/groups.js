/**
 * groups.js
 *
 * manages groups providing a set of quick access methods
 */
(function () {
  /**
   * groups have the following structure:
   * ```
   * groups: [
   *    {
   *      name: 'group name 1',
   *      files: [ { fileData1 }, { fileData2 } ],
   *      tags: // the exposed variable
   *      {
   *        files: [ { fileData1 }, { fileData2 } ]
   *      },
   *      dates: // this is annoyingly hard to cope with
   *      {
   *        '2017': {
   *          files: [ { fileData1 }, { fileData2 } ]
   *        },
   *        '03': {
   *          files: [ { fileData1 }, { fileData2 } ]
   *        },
   *      }
   *    },
   *    {
   *      name: 'group name 2',
   *      ...
   *    }
   * ]
   * ```
   */
  const _groups = [];

  /**
   * Returns a reference to a group in the groups array that has the right groupName
   *
   * @param {String} groupName the name of the group
   * @returns {Object} a new group or the found group
   */
  function fetch (groupName) {
    let index = _groups.findIndex(function (group) {
      return group.name === groupName;
    });
    if (index === -1) {
      let group = {
        name: groupName
      };
      _groups.push(group);
      return group;
    } else {
      return _groups[index];
    }
  }

  /**
   * pushes the post into the passed group, with exposed variables, or as is
   *
   * @param {any} postData the ready-available data related to the post
   * @param {Object} group the current group
   * @param [{String}] exposedVar the exposed variable for the post
   * @param [{Object}] optsGroup current group being acted upon
   * @return {Array}
   */
  function push (postData, group, exposedVar, optsGroup) {
    if (exposedVar) {
      group[exposedVar] = group[exposedVar] || {};
      group[exposedVar].files = group[exposedVar].files || [];
      group[exposedVar].files.push(postData);
    } else {
      // TODO remove: too much complexity added, hard to control
      // if (typeof optsGroup.date_format !== 'undefined') {
      //   let dateItems = optsGroup.date_format;
      //   dateItems = dateItems.split('/');
      //   for (let i = 1; i <= dateItems.length; i++) {
      //     let format = dateItems.slice(0, i).join('/');
      //     let dategroup = moment(postData.date).format(format);
      //     group.dates = group.dates || {};
      //     group.dates[dategroup] = group.dates[dategroup] || {};
      //     group.dates[dategroup].files = group.dates[dategroup].files || [];
      //     group.dates[dategroup].files.push(postData);
      //   }
      // }
      group.files = group.files || [];
      group.files.push(postData);
    }
  }

  module.exports = {
    push: push,
    fetch: fetch
  };
})();
