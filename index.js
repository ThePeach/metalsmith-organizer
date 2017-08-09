const moment = require('moment');
const utils = require('lib/utils');
const posts = require('lib/posts');
const groups = require('lib/groups');
const optsUtils = require('lib/options');

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

    (function init () {
      // parse all files passed to the plugin, filter and sort them
      for (let fileIndex in files) {
        let post = files[fileIndex];
        for (let groupIndex in opts.groups) {
          // if draft check
          if (opts.drafts === false &&
            (post.draft === true || post.draft === 'true' || post.published === false || post.published === 'false' || post.status === 'draft')) {
            continue;
          }
          // see if post specifies search_type
          let searchType = typeof opts.groups[groupIndex].search_type !== 'undefined' ? opts.groups[groupIndex].search_type : opts.search_type;
          // check if post matches criteria then send the post to sort if it does
          if (posts.matchPost(post, searchType, opts.groups[groupIndex].search)) {
            let group = groups.fetchGroup(opts.groups[groupIndex].group_name);
            prepareAndPushPost(post, fileIndex, group, opts.groups[groupIndex]);
          }
        }
      }

      // once we have out new `groups` object sort it by date if necessary
      groups.sortAll(opts);

      // delete original file list
      for (let file in files) {
        delete files[file];
      }

      // with our new groups array go through them and push our final files to our files list
      opts.groups.array.forEach(function (group) {
        pageParser(files, group.name);
        postParser(files, group.name);
      }, this);
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
        // e.g. expose:tags but no specific tag defined, it'll expose all
        if (typeof exposeValue === 'undefined') {
          // no need to get list of tags, for each tag in post it's "pushed" to its tags
          for (let property in post[expose]) {
            groups.pushGroup(post, group, post[expose][property]);
          }
        } else {
          // e.g. expose: tags, tags: post
          groups.pushGroup(post, group, exposeValue);
        }
      } else {
        // don't expose anything
        groups.pushGroup(post, group);
      }
    }

    /**
     * for pages
     *
     * @param {any} files
     * @param {any} groupName
     * @returns
     */
    function pageParser (files, groupName) {
      const optsGroup = optsUtils.fetchOptsGroup(groupName, opts);

      const expose = optsGroup.expose;
      const exposeValue = optsGroup[expose];
      const pathReplace = {group: optsGroup.group_name};
      const extension = typeof optsGroup.change_extension !== 'undefined' ? optsGroup.change_extension : '.html';
      let layout = optsGroup.page_layout || 'index';

      // return when path does not allow page to be made or when we're in the permalink group
      if (optsGroup.path === '{title}' ||
        (groupName === opts.permalink_group && optsGroup.override_permalink_group === false)) {
        return;
      }

      // set group to more clearly understand what's being iterated over
      let group = groups.fetchGroup(groupName);
      if (typeof group.dates !== 'undefined') {
        group = group.dates;
      }
      // FIXME this should be refactored in smaller chunks, hard to digest all at once
      for (let minigroup in group) {
        let groupFiles;
        // determines where exactly the files are
        if (typeof group[exposeValue] !== 'undefined') { // exposed value
          groupFiles = group[exposeValue].files;
        } else if (typeof group[minigroup] !== 'undefined' && minigroup !== 'files') { // dates
          groupFiles = group[minigroup].files;
        } else { // normal pages
          groupFiles = group.files;
        }
        // push any exposed information to metalsmith._metadata and handle path for dates layout
        if (typeof expose !== 'undefined' && typeof exposeValue === 'undefined') { // exposed values
          metalsmith._metadata.site[expose] = metalsmith._metadata.site[expose] || {};
          let nicename = makeSafe(minigroup);
          let count = groupFiles.length;
          metalsmith._metadata.site[expose][minigroup] = {nicename: nicename, count: count};
        } else if (typeof expose === 'undefined' && minigroup !== 'files') { // dates
          // metadata
          if (moment(minigroup, optsGroup.date_format, true).isValid()) {
            metalsmith._metadata.site.dates = metalsmith._metadata.site.dates || {};
            let dateItems = minigroup;
            let count = groupFiles.length;
            dateItems = dateItems.split('/');
            utils.assignPath(metalsmith._metadata.site.dates, dateItems, {date: minigroup, count: count, files: groupFiles});
          }
          // layout
          const dateLayout = optsGroup.date_page_layout.split('/');
          const currentLayout = minigroup.split('/').length - 1;
          layout = dateLayout[currentLayout];
        }
        // PAGINATION
        // now that we have our files and variables split files into pages
        let pages = [];
        let perPage = optsGroup.per_page || groupFiles.length; // don't use infinity
        let totalPages = Math.ceil(groupFiles.length / perPage);
        if (totalPages === 0) {
          totalPages = 1;
        }
        // FIXME body should be split, hoping for better readability
        for (let i = 0; i < totalPages; i++) {
          let thisPageFiles = groupFiles.slice(i * perPage, (i + 1) * perPage);
          // get variables for path
          if (i !== 0) {
            pathReplace.num = i + 1;
          } else {
            delete pathReplace.num;
          }
          if (typeof optsGroup.date_format !== 'undefined') {
            pathReplace.date = minigroup;
          }
          if (expose || exposeValue) {
            pathReplace.expose = exposeValue || minigroup;
            pathReplace.expose = makeSafe(pathReplace.expose);
          }
          // create path by replacing variables
          let path = optsGroup.path
            .replace(/{title}/g, '')
            .replace(/{(.*?)}/g, function (matchPost, matchedGroup) {
              if (typeof pathReplace[matchedGroup] === 'undefined') {
                return '';
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
            .replace(/(\/)+/g, '/')
            .replace(/.$/m, match => {
              if (match !== '/') {
                return match + '/';
              } else {
                return match;
              }
            });
          // allows user to change filename
          let filename;
          if (typeof optsGroup.page_only !== 'undefined' &&
            optsGroup.page_only === true &&
            typeof optsGroup.no_folder !== 'undefined' &&
            optsGroup.no_folder === true
          ) {
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
          if (typeof optsGroup.page_description !== 'undefined') {
            page.page_description = optsGroup.page_description;
          }
          // append previous page to pagination
          if (totalPages !== 1 && i !== 0) {
            page.pagination.prev = pages[i - 1];
            pages[i - 1].pagination.next = page;
          }
          // add total number of pages when on last page
          if (page.pagination.num === page.pagination.total) {
            // don't get last page by starting at 2, but get page 0 by adding 1
            for (let x = 2; x < page.pagination.total + 1; x++) {
              let thispage = page.pagination.total - x;
              pages[thispage].pagination.total_pages_permalink = page.permalink;
            }
            page.pagination.total_pages_permalink = page.permalink;
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
    function postParser (files, groupName) {
      const optsGroup = optsUtils.fetchOptsGroup(groupName, opts);
      const group = groups.fetchGroup(groupName);

      const extension = typeof optsGroup.change_extension !== 'undefined' ? optsGroup.change_extension : '.html';

      // ignore page_only group
      if (typeof optsGroup.page_only !== 'undefined' && optsGroup.page_only === true) {
        return;
      }
      // make sure we're in a permalink group or the group allows overriding
      if (groupName === opts.permalink_group || optsGroup.override_permalink_group === true) {
        for (let post in group.files) {
          let postpage = Object.assign({}, group.files[post]); // reference to groupName was being overwritten
          // change path if we want no fodler
          if (typeof optsGroup.no_folder !== 'undefined' && optsGroup.no_folder === true) {
            postpage.path = postpage.permalink.replace(/\/||\\/, '') + extension;
          } else {
            postpage.path = postpage.permalink.replace(/\/||\\/, '') + '/index' + extension;
          }
          // handle pagination of posts
          let next = parseInt(post, 10) + 1;
          if (typeof group.files[next] !== 'undefined') {
            postpage.pagination = postpage.pagination || {};
            postpage.pagination.next = group.files[next];
          }
          let prev = parseInt(post, 10) - 1;
          if (prev >= 0 && typeof group.files[prev] !== 'undefined') {
            postpage.pagination = postpage.pagination || {};
            postpage.pagination.prev = group.files[prev];
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
