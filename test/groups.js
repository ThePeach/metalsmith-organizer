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
