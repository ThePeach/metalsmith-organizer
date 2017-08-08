/**
 * groups.js
 *
 * manages groups providing a set of quick access methods
 */
const optsUtils = require('./options');
const utils = require('./utils');

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
  // variables we should not iterate through, e.g when sorting things
  const _protectedVarsNames = [
    'name', 'files'
  ];

  /**
   * Returns a reference to a group in the groups array that has the right groupName
   *
   * @param {String} groupName the name of the group
   * @returns {Object} a new group or the found group
   */
  function fetchGroup (groupName) {
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
  function pushGroup (postData, group, exposedVar, optsGroup) {
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

  /**
   * Sorts files in all groups
   *
   * @param {Object} opts the options object
   */
  function sortAll (opts) {
    _groups.map(function (group) {
      const optsGroup = optsUtils.fetchOptsGroup(group.name, opts);
      const exposedVariable = (typeof optsGroup.expose !== 'undefined') ? optsGroup.expose : null;
      const reverse = (typeof optsGroup.reverse !== 'undefined') ? optsGroup.reverse : false;

      if (exposedVariable) {
        for (let prop in group) {
          if (!_protectedVarsNames.includes(prop)) {
            group[prop].files = reverse
              ? group[prop].files.sort(utils.orderByDateReverse)
              : group[prop].files.sort(utils.orderByDate);
          }
        }
      } else {
        if (typeof group.files !== 'undefined') {
          group.files = reverse
            ? group.files.sort(utils.orderByDateReverse)
            : group.files.sort(utils.orderByDate);
        }
      }
      return group;
    });
  }

  /**
   * Resets the internal array, any reference will be left dangling!!!
   */
  function reset () {
    while (_groups.length > 0) {
      _groups.pop();
    }
  }

  module.exports = {
    pushGroup: pushGroup,
    fetchGroup: fetchGroup,
    sortAll: sortAll,
    reset: reset
  };
})();
