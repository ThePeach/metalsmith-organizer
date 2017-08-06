const t = require('tap');
const posts = require('../lib/posts');
const options = require('./fixtures/opts.json');

t.test('preparePost', function (t) {
  t.test('if post has no title will throw an exception', function (t) {
    const post = {};

    t.throws(posts.preparePost, Error, post);
    t.end();
  });

  t.test('a basic post will only have the original_contents created', function (t) {
    const post = {
      title: 'The title of the post',
      contents: 'post content',
      permalink: '/permalink/the-title-of-the-post'
    };

    posts.preparePost(post, options.base_group);

    t.ok(typeof post.original_contents !== 'undefined');
    t.ok(post.contents === post.original_contents);

    t.end();
  });

  t.test('if a post has a slug defined it will not change anything', function (t) {
    const post = {
      title: 'The title of the post',
      contents: 'post content',
      permalink: '/posts/the-title-of-the-post',
      slug: 'the-title-of-the-post'
    };

    posts.preparePost(post, options.base_group);

    t.ok(typeof post.original_contents !== 'undefined');

    t.end();
  });

  t.test('if a post does not have permalink it will be set', function (t) {

    for (let i = 0; i < options.posts_pages.groups.length; i++) {
      const post = {
        title: 'The title of the post',
        contents: 'post content',
        slug: 'the-title-of-the-post'
      };
      posts.preparePost(post, options.posts_pages.groups[i], options.posts_pages);
      t.ok(typeof post.original_contents !== 'undefined');
      t.ok(typeof post.permalink !== 'undefined');
    }

    t.end();
  });

  t.end();
});
