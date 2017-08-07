const t = require('tap');
const posts = require('../lib/posts');
const options = require('./fixtures/opts.json');

t.test('preparePost', function (t) {
  t.test('if post has no title will throw an exception', function (t) {
    const post = {};

    t.throws(function () { posts.preparePost(post, null, null, 'my-file'); });
    t.end();
  });

  t.test('a basic post will only have the original_contents created', function (t) {
    const post = {
      title: 'The title of the post',
      contents: 'post content',
      permalink: '/permalink/the-title-of-the-post'
    };

    posts.preparePost(post, options.base_group);

    t.notEqual(typeof post.original_contents, 'undefined');
    t.equal(post.contents, post.original_contents);

    t.end();
  });

  t.test('if current group.add_props is set, these will be added to the post', function (t) {
    const post = {
      title: 'The title of the post',
      contents: 'post content'
    };
    const currentGroup = {
      group_name: 'pages',
      type: 'page',
      path: '{title}',
      add_prop: [
        { search: true }
      ]
    };
    const opts = {
      permalink_group: 'pages',
      groups: []
    };
    opts.groups.push(currentGroup);

    t.notOk(post.search);
    posts.preparePost(post, currentGroup, opts);
    t.ok(post.search);

    t.end();
  });

  t.test('permalink rules', function (t) {
    t.test('will use the main group path instead the one defined in the current group', function (t) {
      const post = {
        title: 'The title of the post',
        contents: 'post content',
        slug: 'the-title-of-the-post'
      };
      const currentGroup = {
        group_name: 'pages',
        type: 'page',
        path: 'something/{title}'
      };
      const opts = {
        permalink_group: 'posts',
        groups: [
          {
            group_name: 'posts',
            type: 'post',
            path: '{title}'
          }
        ]
      };

      posts.preparePost(post, currentGroup, opts);
      t.notOk(post.permalink.match(/^\/something/));
      t.equal(post.permalink, `/${post.slug}`);

      t.end();
    });

    t.test('if post.slug is not set it will use the post.title to create the permalink', function (t) {
      const post = {
        title: 'The title of the post',
        contents: 'post content'
      };
      const currentGroup = {
        group_name: 'pages',
        type: 'page',
        path: '{title}'
      };
      const opts = {
        permalink_group: 'pages',
        groups: []
      };
      opts.groups.push(currentGroup);

      posts.preparePost(post, currentGroup, opts);
      t.equal(post.permalink, `/${post.title}`);

      t.end();
    });

    t.test('I can specify a custom function to reformat the title if the slug is not present', function (t) {
      const post = {
        title: 'The title of the post',
        contents: 'post content'
      };
      const currentGroup = {
        group_name: 'pages',
        type: 'page',
        path: '{title}'
      };
      const opts = {
        permalink_group: 'pages',
        groups: []
      };
      opts.groups.push(currentGroup);

      let called = 0;
      const normalise = (string) => {
        called++;
        return string.replace(/ /g, ''); // remove all spaces
      };

      posts.preparePost(post, currentGroup, opts, 'filename', normalise);

      t.notEqual(called, 0);
      t.equal(post.permalink, `/${normalise(post.title)}`);

      t.end();
    });

    t.test('the custom function will not be used if the slug is present', function (t) {
      const post = {
        title: 'The title of the post',
        contents: 'post content',
        slug: 'my-own-slug'
      };
      const currentGroup = {
        group_name: 'pages',
        type: 'page',
        path: '{title}'
      };
      const opts = {
        permalink_group: 'pages',
        groups: []
      };
      opts.groups.push(currentGroup);

      let called = 0;
      const normalise = (string) => {
        called++;
        return string;
      };

      posts.preparePost(post, currentGroup, opts, 'filename', normalise);

      t.equal(called, 0);
      t.equal(post.permalink, `/${post.slug}`);

      t.end();
    });

    t.test('if the slug is set it will be used for the {title} in the permalink', function (t) {
      const post = {
        title: 'The title of the post',
        contents: 'post content',
        slug: 'my-defined-slug'
      };
      const currentGroup = {
        group_name: 'pages',
        type: 'page',
        path: '{title}'
      };
      const opts = {
        permalink_group: 'pages',
        groups: []
      };
      opts.groups.push(currentGroup);

      posts.preparePost(post, currentGroup, opts);
      t.equal(post.permalink, `/${post.slug}`);

      t.end();
    });

    t.test('if "/{num}" is specified in the path, it will be stripped out', function (t) {
      const post = {
        title: 'The title of the post',
        contents: 'post content',
        slug: 'the-title-of-the-post'
      };
      const currentGroup = {
        group_name: 'pages',
        type: 'page',
        path: '{title}/{num}'
      };
      const opts = {
        permalink_group: 'pages',
        groups: []
      };
      opts.groups.push(currentGroup);

      posts.preparePost(post, currentGroup, opts);
      t.equal(post.permalink, `/${post.slug}`);

      t.end();
    });

    t.test('if {date} is specified in the path, group.date_format will be used to fill in the permalink', function (t) {
      const post = {
        title: 'The title of the post',
        contents: 'post content',
        slug: 'the-title-of-the-post',
        date: '2015-03-02'
      };
      const currentGroup = {
        group_name: 'pages',
        type: 'page',
        path: '{date}/{title}',
        date_format: 'YYYY/MM/DD'
      };
      const opts = {
        permalink_group: 'pages',
        groups: []
      };
      opts.groups.push(currentGroup);

      posts.preparePost(post, currentGroup, opts);
      t.ok(post.permalink.match(new RegExp(`/(\\d){4}(/(\\d){2}){2}/${post.slug}`)));

      t.end();
    });

    t.test('if {group} is specified in the path, group.group_name will be used to fill in the permalink', function (t) {
      const post = {
        title: 'The title of the post',
        contents: 'post content',
        slug: 'the-title-of-the-post'
      };
      const currentGroup = {
        group_name: 'pages',
        type: 'page',
        path: '{group}/{title}'
      };
      const opts = {
        permalink_group: 'pages',
        groups: []
      };
      opts.groups.push(currentGroup);

      posts.preparePost(post, currentGroup, opts);
      t.ok(post.permalink, `${currentGroup.group_name}/${post.slug}`);

      t.end();
    });

    t.test('if override_permalink_group is set it will use the current group.path instead of the main', function (t) {
      const post = {
        title: 'The title of the post',
        contents: 'post content',
        slug: 'the-title-of-the-post'
      };
      const currentGroup = {
        group_name: 'pages',
        type: 'page',
        path: '{title}',
        override_permalink_group: true
      };
      const opts = {
        permalink_group: 'posts',
        groups: [
          {
            group_name: 'posts',
            type: 'post',
            path: '{date}/{title}',
            date_format: 'YYYY/MM/DD'
          }
        ]
      };
      opts.groups.push(currentGroup);

      posts.preparePost(post, currentGroup, opts);
      t.ok(post.permalink, `${post.slug}`);

      t.end();
    });

    t.test('with override_permalink_group, if current group.path is not set, it will default to {group}/{title}', function (t) {
      const post = {
        title: 'The title of the post',
        contents: 'post content',
        slug: 'the-title-of-the-post'
      };
      const currentGroup = {
        group_name: 'pages',
        type: 'page',
        override_permalink_group: true
      };
      const opts = {
        permalink_group: 'posts',
        groups: [
          {
            group_name: 'posts',
            path: '{date}/{title}'
          }
        ]
      };
      opts.groups.push(currentGroup);

      posts.preparePost(post, currentGroup, opts);
      t.ok(post.permalink, `${currentGroup.group_name}/${post.slug}`);

      t.end();
    });

    t.test('with override_permalink_group, if current group.date_format and group.path is set, it will be used as format for the {date}', function (t) {
      const post = {
        title: 'The title of the post',
        contents: 'post content',
        slug: 'the-title-of-the-post',
        date: '2017-03-01'
      };
      const currentGroup = {
        group_name: 'pages',
        type: 'page',
        date_format: 'YYYY/MM',
        override_permalink_group: true,
        path: '{date}/{title}'
      };
      const opts = {
        permalink_group: 'posts',
        groups: [
          {
            group_name: 'posts',
            path: '{date}/{title}'
          }
        ]
      };
      opts.groups.push(currentGroup);

      posts.preparePost(post, currentGroup, opts);
      t.ok(post.permalink.match(new RegExp(`/(\\d){4}/(\\d){2}/${post.slug}`)));

      t.end();
    });

    t.end();
  });

  t.end();
});

t.test('matchPost', function (t) {
  const post = {
    type: 'post',
    collection: 'something',
    title: 'My Post',
    date: '2017-05-11',
    draft: false,
    tags: [ 'one', 'two', 'three' ]
  };

  t.test('returns true if no searchParams are passed', function (t) {
    const post = {};

    t.ok(posts.matchPost(post, null));
    t.end();
  });

  t.test('searchParams is boolean', function (t) {
    t.test('returns true if the searchParam is true and exists, regardless of its value', function (t) {
      const searchParams = { draft: true };

      t.ok(posts.matchPost(post, 'any', searchParams));
      t.end();
    });

    t.test('returns false if the searchParam is false and exists, regardless of its value', function (t) {
      const searchParams = { draft: false };

      t.notOk(posts.matchPost(post, 'any', searchParams));
      t.end();
    });

    t.test('returns false if the searchParam is boolean and does not exist', function (t) {
      const searchParams = { something: true };

      t.notOk(posts.matchPost(post, 'any', searchParams));
      t.end();
    });

    t.end();
  });

  t.test('searchParams references to a parameter array', function (t) {
    t.test('returns true if the value is contained in the array', function (t) {
      const searchParams = { tags: 'two' };

      t.ok(posts.matchPost(post, 'all', searchParams));
      t.end();
    });

    t.test('returns false if the value is not in the array', function (t) {
      const searchParams = { tags: 'four' };

      t.notOk(posts.matchPost(post, 'all', searchParams));
      t.end();
    });

    t.end();
  });

  t.test('all searchType', function (t) {
    const allSearchType = 'all';

    t.test('returns true if all search params match', function (t) {
      const searchParams = { type: 'post', collection: 'something' };

      t.ok(posts.matchPost(post, allSearchType, searchParams));
      t.end();
    });

    t.test('returns false if one search params does not match', function (t) {
      const searchParams = { type: 'post', collection: 'else' };

      t.notOk(posts.matchPost(post, allSearchType, searchParams));
      t.end();
    });

    t.end();
  });

  t.test('any searchType', function (t) {
    const anySearchType = 'any';

    t.test('returns true if any search params match', function (t) {
      const searchParams = { type: 'article', collection: 'something' };

      t.ok(posts.matchPost(post, anySearchType, searchParams));
      t.end();
    });

    t.test('returns false if no search params match', function (t) {
      const searchParams = { type: 'article', collection: 'else' };

      t.notOk(posts.matchPost(post, anySearchType, searchParams));
      t.end();
    });

    t.end();
  });

  t.end();
});
