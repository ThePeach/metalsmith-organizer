const t = require('tap');
const options = require('../lib/options');
const optFixture = require('./fixtures/opts.json');

t.test('fetchOptsGroup()', function (t) {
  t.test('will return undefined if the group name is not found in the options groups', function (t) {
    t.equals(typeof options.fetchOptsGroup('nothing', optFixture.complex), 'undefined');

    t.end();
  });

  t.test('will return the found group given the group name', function (t) {
    const groupName = 'posts';
    let optGroup = options.fetchOptsGroup(groupName, optFixture.complex);

    t.notEquals(typeof optGroup, 'undefined');
    t.equals(optGroup.group_name, groupName);

    t.end();
  });

  t.end();
});
