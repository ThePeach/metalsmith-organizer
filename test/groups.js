const t = require('tap');
const groups = require('../lib/groups');

t.test('fetch()', function (t) {
  const groupName = 'something';
  let group = null;

  t.test('if a group does not exist it will be created', function (t) {
    group = groups.fetch(groupName);

    t.notEquals(typeof group, undefined);
    t.equals(group.name, groupName);

    t.end();
  });

  t.test('if a group exists it will be returned', function (t) {
    const expectedValue = 'test';

    group.variable = expectedValue;
    // re-fetch the group
    group = groups.fetch(groupName);

    t.equals(group.name, groupName);
    t.equals(group.variable, expectedValue);

    t.end();
  });

  t.end();
});

t.test('push()', function (t) {
  const post = {
    title: 'My Post Title'
  };
  const groupName = 'else';
  const group = groups.fetch(groupName);

  t.test('the post data will be added to the list of files of the group', function (t) {
    groups.push(post, group);

    t.notEquals(typeof group.files, undefined);
    t.equals(group.files.length, 1);
    t.equals(group.files[0].title, post.title);

    t.end();
  });

  t.test('the post data will be added to an exposed variable if passed', function (t) {
    const varName = 'tags';
    groups.push(post, group, varName);

    t.notEquals(typeof group[varName], undefined);
    t.equals(group[varName].files.length, 1);
    t.equals(group[varName].files[0].title, post.title);

    t.end();
  });

  t.end();
});

t.test('reset()', function (t) {
  const groupName = 'test';
  const post = {
    title: 'something'
  };
  groups.reset();
  let group = groups.fetch(groupName);
  t.equals(group.name, groupName);

  groups.push(post, group);
  t.equals(group.files.length, 1);

  groups.reset();
  group = groups.fetch(groupName);
  t.equals(typeof group.files, 'undefined');

  t.end();
});

t.test('sortAll()', function (t) {
  const post1 = {
    title: 'My Post Title',
    date: '2017-03-02',
    tags: [ 't1', 't2' ]
  };
  const post2 = {
    title: 'Another Later Post',
    date: '2017-09-11',
    tags: [ 't1', 't2' ]
  };
  const groupName = 'posts';
  const opts = {
    groups: [
      {
        group_name: groupName
      }
    ]
  };

  t.test('posts without exposed variables will be sorted by date', function (t) {
    groups.reset();
    const group = groups.fetch(groupName);

    groups.push(post2, group);
    groups.push(post1, group);
    groups.sortAll(opts);

    const date1 = new Date(group.files[0].date);
    const date2 = new Date(group.files[1].date);
    t.ok(date1.getTime() > date2.getTime());

    t.end();
  });

  t.test('if reverse is specified, posts without exposed variables will be sorted by date descending', function (t) {
    groups.reset();
    // add reverse option
    opts.groups[0].reverse = true;

    const group = groups.fetch(groupName);

    groups.push(post2, group);
    groups.push(post1, group);
    groups.sortAll(opts);

    const date1 = new Date(group.files[0].date);
    const date2 = new Date(group.files[1].date);
    t.ok(date1.getTime() < date2.getTime());

    t.end();
  });

  t.test('if post exposes a variable, files in that subgroup should be sorted accordingly', function (t) {
    groups.reset();
    // add exposes option
    const exposedVar = 'var';
    opts.groups[0].expose = exposedVar;
    opts.groups[0].reverse = false;

    const group = groups.fetch(groupName);

    groups.push(post2, group, exposedVar);
    groups.push(post1, group, exposedVar);
    groups.sortAll(opts);

    let date1 = new Date(group[exposedVar].files[0].date);
    let date2 = new Date(group[exposedVar].files[1].date);

    t.ok(date1.getTime() > date2.getTime());

    opts.groups[0].reverse = true;
    groups.sortAll(opts);

    date1 = new Date(group[exposedVar].files[0].date);
    date2 = new Date(group[exposedVar].files[1].date);
    t.ok(date1.getTime() < date2.getTime());

    t.end();
  });

  t.test('if post exposes variables, files in those subgroups should be sorted accordingly', function (t) {
    groups.reset();
    // add exposes option
    const exposedVar = 'tags';
    opts.groups[0].expose = exposedVar;
    opts.groups[0].reverse = false;

    const group = groups.fetch(groupName);

    post1.tags.forEach(function (variable) {
      groups.push(post2, group, variable);
      groups.push(post1, group, variable);
    });
    groups.sortAll(opts);

    post1.tags.forEach(function (variable) {
      let date1 = new Date(group[variable].files[0].date);
      let date2 = new Date(group[variable].files[1].date);

      t.ok(date1.getTime() > date2.getTime());
    });

    t.end();
  });

  t.end();
});
