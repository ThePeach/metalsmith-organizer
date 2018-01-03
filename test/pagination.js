const t = require('tap');
const pagination = require('../lib/pagination');
const optsUtils = require('../lib/options');

t.test('Pagination object', function (t) {
  const pages = [ 'page1', 'page2', 'page3' ]; // it's actually a list of Page objects
  const files = [ {title: 'something'}, {title: 'else'} ];
  const totalPages = 2;
  let pag = new pagination.Pagination(pages, files, totalPages);

  t.equals(pag.index, pages.length, 'index');
  t.equals(pag.num, pages.length + 1, 'num');
  t.equals(pag.pages, pages, 'pages');
  t.equals(pag.files, files, 'files');
  t.equals(pag.total, totalPages, 'total');
  t.end();
});

t.test('Page object', function (t) {
  const layout = 'layout';
  const groupName = 'group';
  const path = 'path/to/file/';
  const filename = 'filename';
  const extension = '.html';
  const description = 'a nice description';
  const pages = [ 'page1', 'page2', 'page3' ];
  const files = [ {title: 'something'}, {title: 'else'} ];
  const totalPages = 2;
  const pag = new pagination.Pagination(pages, files, totalPages);

  let page = new pagination.Page(layout, groupName, pag, path, filename, extension, description);

  t.equals(page.layout, layout, 'layout');
  t.equals(page.group, groupName, 'group');
  t.equals(page.pagination, pag, 'pagination');
  t.equals(page.path, `${path}${filename}${extension}`, 'layout');
  t.equals(page.permalink, `/${path}`, 'permalink');
  t.equals(page.page_description, description, 'description');

  t.end();
});

// t.test('createPath()', function (t) {
//   t.skip();
//   t.end();
// });
