const t = require('tap');
const utils = require('../lib/utils');

t.test('sorting by date', function (t) {
  let unorderedPosts = [
    { date: new Date('2017-04-03') },
    { date: new Date('2017-04-04') },
    { date: new Date('2017-04-01') },
    { date: new Date('2017-04-02') }
  ];

  t.test('orderByDate', function (t) {
    let expectedOrderedPosts = [
      { date: new Date('2017-04-04') },
      { date: new Date('2017-04-03') },
      { date: new Date('2017-04-02') },
      { date: new Date('2017-04-01') }
    ];

    let orderedPosts = unorderedPosts.sort(utils.orderByDate);
    for (let post in orderedPosts) {
      t.equal(orderedPosts[post].date.getTime(), expectedOrderedPosts[post].date.getTime());
    }

    t.end();
  });

  t.test('orderByDateReverse', function (t) {
    let expectedOrderedPosts = [
      { date: new Date('2017-04-01') },
      { date: new Date('2017-04-02') },
      { date: new Date('2017-04-03') },
      { date: new Date('2017-04-04') }
    ];

    let orderedPosts = unorderedPosts.sort(utils.orderByDateReverse);
    for (let post in orderedPosts) {
      t.equal(orderedPosts[post].date.getTime(), expectedOrderedPosts[post].date.getTime());
    }

    t.end();
  });

  t.end();
});

t.test('contains', function (t) {
  t.test('if data is undefined and propertyValue is not, nothing works', function (t) {
    t.notOk(utils.contains(undefined, 'string'));
    t.end();
  });

  t.test('a boolean propertyValue will return a boolean', function (t) {
    let initalisedData = '';
    t.ok(utils.contains(initalisedData, true));
    t.notOk(utils.contains(initalisedData, false));

    t.ok(utils.contains(undefined, false));
    t.notOk(utils.contains(undefined, true));
    t.end();
  });

  t.test('both data and propertyValue are strings, they are checked against each other', function (t) {
    let stringValue = 'Something very interesting - / asda  asd asd';

    t.ok(utils.contains(stringValue, stringValue));
    t.notOk(utils.contains(stringValue, 'a different string'));

    t.end();
  });

  t.test('if data is an array we will check if propertyValue is contained', function (t) {
    const dataArr = [
      'one', ' two', 'three '
    ];

    t.ok(utils.contains(dataArr, 'two'));
    t.notOk(utils.contains(dataArr, 'not in the dataset'));
    t.end();
  });

  t.test('if callback is not a function nothing will happen', function (t) {
    const callback = undefined;
    const dataArr = [
      'one', ' two', 'three '
    ];

    t.ok(utils.contains(dataArr, 'two', callback));
    t.end();
  });

  t.test('if callback is passed it will be called', function (t) {
    let called = 0;
    const callback = (param) => { called++; return param; };
    const dataArr = [
      'one', ' two', 'three '
    ];

    t.ok(utils.contains(dataArr, 'two', callback));
    t.ok(called);
    t.end();
  });

  t.end();
});
