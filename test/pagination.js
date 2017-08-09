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
  t.skip();
  let page = new pagination.Page(layout, groupName, pag, path, filename, extension, description);
  t.end();
});

t.test('createPath()', function (t) {
  t.skip();
  t.end();
});
