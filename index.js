const moment = require('moment');
const utils = require('lib/utils');
const posts = require('lib/posts');

module.exports = plugin;

function plugin (opts) {
  // SORT OPTIONS

  // all our exempted properties
  const exceptions = ['groupName', 'path', 'override_permalinkGroup', 'page_layout', 'date_page_layout', 'expose', 'date_format', 'perPage', 'page_description', 'num_format', 'reverse', 'no_folder', 'searchType', 'add_prop', 'change_extension', 'page_only'];

  // default option values
  if (typeof opts.drafts === 'undefined') {
    opts.drafts = false;
  }
  opts.search_type = opts.search_type || 'all';

  // set search criteria for each group
  for (let groupIndex in opts.groups) {
    opts.groups[groupIndex].search = Object.keys(opts.groups[groupIndex]).map(criteria => {
      if (!exceptions.includes(criteria)) { // add new non-search options here
        const obj = {};
        obj[criteria] = opts.groups[groupIndex][criteria];
        return obj;
      }
    }).filter(property => { return typeof property !== 'undefined'; });
  }

  /**
   * the default make_safe function for titles, does not apply to slugs (on purpose)
   *
   * @param {String} string
   * @returns {String}
   */
  function _defaultMakeSafe (string) {
    return string.replace(/(-|\/)/g, '').replace(/('|"|\(|\)|\[|\]|\?|\+)/g, '').replace(/(\s)+/g, '-').toLowerCase();
  }
  // let user override
  const makeSafe = (typeof opts.make_safe === 'function') ? opts.make_safe : _defaultMakeSafe;

  // PLUGIN
  return function (files, metalsmith, done) {
    // empty group array to push results to
    const groups = [];

    (function init () {
      // groupIndex being currently parsed, so functions can actually have some context
      let groupIndex = null;

      // parse all files passed to the plugin, filter and sort them
      for (let fileIndex in files) {
        let post = files[fileIndex];
        for (groupIndex in opts.groups) {
          // if draft check
          if (opts.drafts === false &&
            (post.draft === true || post.draft === 'true' || post.published === false || post.published === 'false' || post.status === 'draft')) {
            continue;
          }
          // see if post specifies search_type
          let searchType = typeof opts.groups[groupIndex].search_type !== 'undefined' ? opts.groups[groupIndex].search_type : opts.search_type;
          // check if post matches criteria then send the post to sort if it does
          if (posts.matchPost(post, searchType, opts.groups[groupIndex].search)) {
            prepareAndPushPost(post, fileIndex, groups[groupIndex], opts.groups[groupIndex]);
          }
        }
      }

      // once we have out new `groups` object sort it by date if necessary
      for (groupIndex in groups) {
        let expose = opts.groups[groupIndex].expose;
        let reverse = typeof opts.groups[groupIndex].reverse !== 'undefined' && opts.groups[groupIndex].reverse === false;
        if (expose) {
          for (let exposeVarName in groups[groupIndex]) {
            groups[groupIndex][exposeVarName].files = reverse ? groups[groupIndex][exposeVarName].files.sort(utils.orderByDateReverse) : groups[groupIndex][exposeVarName].files.sort(utils.orderByDate);
          }
        } else {
          if (typeof groups[groupIndex].files !== 'undefined') { // don't overwrite exposed groups
            groups[groupIndex].files = reverse ? groups[groupIndex].files.sort(utils.orderByDateReverse) : groups[groupIndex].files.sort(utils.orderByDate);
          }
        }
      }

      // delete original file list
      for (let file in files) {
        delete files[file];
      }

      // with our new groups array go through them and push our final files to our files list
      for (let groupIndex in groups) {
        let expose = opts.groups[groupIndex].expose;
        let exposeValue = opts.groups[groupIndex][expose];
        let pathReplace = {group: opts.groups[groupIndex].group_name};
        let groupName = opts.groups[groupIndex].groupName;
        let layout = opts.groups[groupIndex].page_layout || 'index';
        let extension = typeof opts.groups[groupIndex].change_extension !== 'undefined' ? opts.groups[groupIndex].change_extension : '.html';
        pageParser(files, groupIndex, groupName, exposeValue, expose, pathReplace, layout, extension);
        postParser(files, groupIndex, groupName, exposeValue, expose, pathReplace, layout, extension);
      }
    })();

    /**
     * Prepares the post and pushes it into the right group.
     * `expose` will influence the sorting and shoud be used in a group like:
     * ```
     * {
     *    expose: 'tags'
     * }
     * ```
     * or
     * ```
     * {
     *    expose: 'tags',
     *    tags: [ 'alpha', 'beta', 'gamma' ]
     * }
     * ```
     *
     * @param {Object} post the actual object containing all properties of the post
     * @param {Number|String} fileName the current file being parsed
     * @param {Object} group the current group being filled
     * @param {Object} optsGroup the current groups in the options passed to Metalsmith
     * @return {Array}
     */
    function prepareAndPushPost (post, fileName, group, optsGroup) {
      const expose = optsGroup.expose;
      const exposeValue = optsGroup[expose];

      posts.preparePost(post, optsGroup, opts, fileName, makeSafe);

      if (expose) {
        if (typeof exposeValue === 'undefined') { // e.g. expose:tags but no specific tag defined, it'll expose all
          for (let property in post[expose]) { // no need to get list of tags, for each tag in post it's "pushed" to its tags
            pushToGroup(post, group, optsGroup, post[expose][property]);
          }
        } else {
          pushToGroup(post, group, optsGroup, exposeValue); // e.g. expose: tags, tags: post
        }
      } else {
        pushToGroup(post, group, optsGroup); // don't expose anything
      }
    }

    /**
     * slots the post into the current group, with exposed values, dates, or as is
     *
     * @param {any} post the ready-available data related to the post
     * @param {Object} group the current group
     * @param {Object} optsGroup current group being acted upon
     * @param {String|Array|Boolean} expose the exposed variable for the post
     * @return {Array}
     */
    function pushToGroup (post, group, optsGroup, expose) {
      group = group || {};
      if (expose) {
        group[expose] = group[expose] || {};
        group[expose].files = group[expose].files || [];
        group[expose].files.push(post);
      } else {
        if (typeof opts.groups.date_format !== 'undefined') {
          let dateItems = opts.groups.date_format;
          dateItems = dateItems.split('/');
          for (let i = 1; i <= dateItems.length; i++) {
            let format = dateItems.slice(0, i).join('/');
            let dategroup = moment(post.date).format(format);
            group.dates = group.dates || {};
            group.dates[dategroup] = group.dates[dategroup] || {};
            group.dates[dategroup].files = group.dates[dategroup].files || [];
            group.dates[dategroup].files.push(post);
          }
        }
        group.files = group.files || [];
        group.files.push(post);
      }
    }

    /**
     * for pages
     *
     * @param {any} files
     * @param {any} groupIndex
     * @param {any} groupName
     * @param {any} exposeValue
     * @param {any} expose
     * @param {any} pathReplace
     * @param {any} layout
     * @param {any} extension
     * @returns
     */
    function pageParser (files, groupIndex, groupName, exposeValue, expose, pathReplace, layout, extension) {
      // return when path does not allow page to be made or when we're in the permalink group
      if (opts.groups[groupIndex].path === '{title}' ||
        (groupName === opts.permalink_group && opts.groups[groupIndex].override_permalink_group === false)) {
        return;
      }
      // set largegroup to more clearly understand what's being iterated over
      let largegroup = groups[groupIndex];
      if (typeof largegroup.dates !== 'undefined') {
        largegroup = largegroup.dates;
      }
      // FIXME this should be refactored in smaller chunks, hard to digest all at once
      for (let minigroup in largegroup) {
        let pageFiles;
        // determines where exactly the files are
        if (typeof largegroup[exposeValue] !== 'undefined') { // exposed value
          pageFiles = largegroup[exposeValue].files;
        } else if (typeof largegroup[minigroup] !== 'undefined' && minigroup !== 'files') { // dates
          pageFiles = largegroup[minigroup].files;
        } else { // normal pages
          pageFiles = largegroup.files;
        }
        // push any exposed information to metalsmith._metadata and handle path for dates layout
        if (typeof expose !== 'undefined' && typeof exposeValue === 'undefined') { // exposed values
          metalsmith._metadata.site[expose] = metalsmith._metadata.site[expose] || {};
          let nicename = makeSafe(minigroup);
          let count = pageFiles.length;
          metalsmith._metadata.site[expose][minigroup] = {nicename: nicename, count: count};
        } else if (typeof expose === 'undefined' && minigroup !== 'files') { // dates
          // metadata
          if (moment(minigroup, opts.groups[groupIndex].date_format, true).isValid()) {
            metalsmith._metadata.site.dates = metalsmith._metadata.site.dates || {};
            let dateItems = minigroup;
            let count = pageFiles.length;
            dateItems = dateItems.split('/');
            utils.assignPath(metalsmith._metadata.site.dates, dateItems, {date: minigroup, count: count, files: pageFiles});
          }
          // layout
          const dateLayout = opts.groups[groupIndex].date_page_layout.split('/');
          const currentLayout = minigroup.split('/').length - 1;
          layout = dateLayout[currentLayout];
        }
        // now that we have our files and variables split files into pages
        let pages = [];
        let perPage = opts.groups[groupIndex].per_page || pageFiles.length; // don't use infinity
        let totalPages = Math.ceil(pageFiles.length / perPage);
        if (totalPages === 0) {
          totalPages = 1;
        }
        for (let i = 0; i < totalPages; i++) {
          // FIXME body should be split, hoping for better readability
          let thisPageFiles = pageFiles.slice(i * perPage, (i + 1) * perPage);
          // get variables for path
          if (i !== 0) {
            pathReplace.num = i + 1;
          } else {
            delete pathReplace.num;
          }
          if (typeof opts.groups[groupIndex].date_format !== 'undefined') {
            pathReplace.date = minigroup;
          }
          if (expose || exposeValue) {
            pathReplace.expose = exposeValue || minigroup;
            pathReplace.expose = makeSafe(pathReplace.expose);
          }
          // create path by replacing variables
          let path = opts.groups[groupIndex].path.replace(/{title}/g, '').replace(/{(.*?)}/g, function (matchPost, matchedGroup) {
            if (typeof pathReplace[matchedGroup] !== 'undefined') {
              if (matchedGroup === 'num' && typeof opts.groups[groupIndex].num_format !== 'undefined') {
                return opts.groups[groupIndex].num_format.replace(/{(.*?)}/g, function (matchPost, matchedGroup) { return pathReplace[matchedGroup]; });
              }
              return pathReplace[matchedGroup];
            } else {
              return '';
            }
          }).replace(/(\/)+/g, '/').replace(/.$/m, match => {
            if (match !== '/') {
              return match + '/';
            } else {
              return match;
            }
          });
          // allows user to change filename
          let filename;
          if (typeof opts.groups[groupIndex].page_only !== 'undefined' &&
            opts.groups[groupIndex].page_only === true &&
            typeof opts.groups[groupIndex].no_folder !== 'undefined' &&
            opts.groups[groupIndex].no_folder === true) {
            filename = '';
            path = path.slice(0, path.length - 1);
          } else {
            filename = 'index';
          }
          // create our page object
          let page = {
            layout: layout,
            group: groupName,
            contents: new Buffer(''),
            pagination: {
              index: pages.length,
              num: pages.length + 1,
              pages: pages,
              files: thisPageFiles,
              total: totalPages
            },
            path: path + filename + extension,
            permalink: '/' + path
          };
          // add exposed and exposed_value to pages that have it
          if (typeof exposeValue !== 'undefined') { // special pages //e.g. expose: tags, tags: post
            page.exposed = expose;
            page.exposed_value = exposeValue;
          } else if (typeof expose !== 'undefined') { // pages which expose all
            page.exposed = expose;
            page.exposed_value = minigroup;
          } else if (minigroup !== 'files') { // dates
            page.exposed = 'dates';
            page.exposed_value = minigroup;
          }
          // adds a page description if it exists
          if (typeof opts.groups[groupIndex].page_description !== 'undefined') {
            page.page_description = opts.groups[groupIndex].page_description;
          }
          // append previous page to pagination
          if (totalPages !== 1 && i !== 0) {
            page.pagination.prev = pages[i - 1];
            pages[i - 1].pagination.next = page;
          }
          // add total number of pages when on last page
          if (page.pagination.num === page.pagination.total) {
            for (let x = 2; x < page.pagination.total + 1; x++) { // don't get last page by starting at 2, but get page 0 by adding 1
              let thispage = page.pagination.total - x;
              pages[thispage].pagination.totalPages_permalink = page.permalink;
            }
            page.pagination.totalPages_permalink = page.permalink;
          }
          returnPage(page, files, pages);
        }
      }
    }

    /**
     * post files
     *
     * @param {any} files
     * @param {any} groupIndex
     * @param {any} groupName
     * @param {any} exposeValue
     * @param {any} expose
     * @param {any} pathReplace
     * @param {any} layout
     * @param {any} extension
     * @returns
     */
    function postParser (files, groupIndex, groupName, exposeValue, expose, pathReplace, layout, extension) {
      // ignore page_only group
      if (typeof opts.groups[groupIndex].page_only !== 'undefined' && opts.groups[groupIndex].page_only === true) {
        return;
      }
      // make sure we're in a permalink group or the group allows overriding
      if (groupName === opts.permalink_group || opts.groups[groupIndex].override_permalink_group === true) {
        for (let post in groups[groupIndex].files) {
          let postpage = Object.assign({}, groups[groupIndex].files[post]); // reference to groupName was being overwritten
          // change path if we want no fodler
          if (typeof opts.groups[groupIndex].no_folder !== 'undefined' && opts.groups[groupIndex].no_folder === true) {
            postpage.path = postpage.permalink.replace(/\/||\\/, '') + extension;
          } else {
            postpage.path = postpage.permalink.replace(/\/||\\/, '') + '/index' + extension;
          }
          // handle pagination of posts
          let next = parseInt(post, 10) + 1;
          if (typeof groups[groupIndex].files[next] !== 'undefined') {
            postpage.pagination = postpage.pagination || {};
            postpage.pagination.next = groups[groupIndex].files[next];
          }
          let prev = parseInt(post, 10) - 1;
          if (prev >= 0 && typeof groups[groupIndex].files[prev] !== 'undefined') {
            postpage.pagination = postpage.pagination || {};
            postpage.pagination.prev = groups[groupIndex].files[prev];
          }
          postpage.group = groupName;
          returnPage(postpage, files);
        }
      }
    }

    /**
     * final function to push to files list
     *
     * @param {any} page
     * @param {any} files
     * @param {any} pages
     */
    function returnPage (page, files, pages) {
      files[page.path] = page;
      if (typeof pages !== 'undefined') {
        pages.push(page);
      }
    }

    return done();
  };
}
