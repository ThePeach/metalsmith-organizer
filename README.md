# metalsmith-organizer

A Metalsmith plugin for organizing posts into groups (pages, posts, archives, etc), including their pagination, permalinks, etc.

It's meant as an all-in-one replacement for plugins such as metalsmith-tags, metalsmith-collections, and metalsmith-pagination. Because of this it should not be used with those plugins or any plugins that group posts like that.

The plugin has been tested with options similar to those shown in the [example](#example) section. If you have a specific use case in mind that isn't covered and isn't outputting what you expect, open an issue and I'll see what I can do.


## Install

```
npm install metalsmith-organizer
```

## Usage

```javascript
const metalsmith = require("metalsmith");
const organizer = require("metalsmith-organizer")
metalsmith
    //should be used after any post processing (markdown, shorcodes, etc), but before metalsmith-layouts
    .use(organizer({
        //global options
        groups: [
            group: {
                //group options
            }
        ]
    }))
```

## Global Options

### `permalink_group`

The group that will contain the path to the actual posts. Other groups will only create pages and won't be given the proper post data for templates unless that group's `override_permalink_group` is set to `true`.

### `drafts`
(default false)

True will include posts marked as drafts (by either a `draft`, `published` or `status` property).

### `make_safe`
(function)

If slug is defined, this plugin will use that as the title, otherwise it uses a built in function below to make the title url safe. You can override this by specifying your own function.

```javascript
//This function is similar to how wordpress makes titles safe.
make_safe: function (string) {
    return string.replace(/(-|\/)/g, "").replace(/(\'|\"|\(|\)|\[|\]|\?|\+)/g, "").replace(/(\s)+/g, "-").toLowerCase()
}
```

### `groups`
(array of objects)

An array containing all the groups with each group being it's own object. If a later group conflicts with an earlier group, it will overwrite it, so order matters.

## Group Options

### Search Criteria

Any property that is not an option (`add_prop`, `change_extension`, `date_format`, `date_page_layout`, `expose`, `group_name`, `no_folder`, `num_format`, `override_permalink_group`, `page_description`, `page_layout`, `page_only`, `path`, `per_page`, `reverse`, `search_type`) can be used as the search criteria to match posts to the group. There can be as many properties as you like but it cannot match multiple of the same property (e.g `tags: "tag1, tag2"` or by repeating them `tags: "tag1", tags: "tag2`).

Both the search criteria and the properties being searched are made safe with the `make_safe` function.

You can also now check whether a property exists with a boolean (e.g `thumbnail: true`). This will exclude any posts without that property. Or inversely you can set it to false, and any posts that have that property are excluded.

If you don't specify any search criteria, all posts will be included in the group.

### `search_type`
("any" or "all")

Posts by default must match `all` search criteria. Setting this to `any` means a post must only match one to be included in that group.

Can also be set globally, with groups overriding it if set.

### `path`

The path to the page or post. The following variables are allowed: `{group}, {title}, {num}, {expose}`.

The path should not start or end with forward slashes, it is assumed all paths are relative to root. No extensions should be appended at the end.

In permalink groups `{num}` is ignored when creating the actual post, but not for it's pages, allowing you to set the path for say, the archive and posts all in one go (e.g `2017/page/1` and `2017/post`).

If `{date}` is used, `date_format` should be defined.

If you'd like to use a different layout for date pages, see the `date_page_layout` option.

### `per_page`

Maximum number of posts per page on pages. Path must include `{num}`.

### `num_format`

If you'd like the url to look something like `page/2` when numbering pages, this can be done by setting this option to `page/{num}`.

### `date_format`

If you're using `{date}` in your path you must specify this option. This plugin uses the [moment](https://momentjs.com/) library to convert dates, so see their documentation for further details on what formats you can use.

The date parts must be seperated by forward slashes though to actually create pages and give the proper files to each page. Setting it to formats such as `date_format: "YYYY-MM",` have not been tested.

Using `{date}` also adds a dates property to the site metadata which gives you an object that looks like this:

```javascript
//date_format: "YYYY/MM
//site.dates
{
    '2014': {
        '01': {
            date: '2014/01'
            count: 1,
            files: [Object]
        },
        '02': {
            date: '2014/02'
            count: 1,
            files: [Object]
        }
    },
    '2015': {
        //and so on
    },
}
```
It can nest itself as deeply as needed.

### `reverse`
(default false)

Reverse sorting order of groups with a date_format.

Default is newest posts first.

### `date_page_layout`

Since the page_layout applies to all pages created in a group and you might want to have archive pages look different, you can set this property to override that. It should be split by the same amount of forward slashes that `date_format` is. For example:

```javascript
date_format: "YYYY/MM",
date_page_layout: "template-year.ext/template-month.ext",
```


### `page_layout`
(default "index")

The layout to use for pages. Even if this is a permalink group, this only applies to it's pages. For example:

```javascript
page_layout: "index.ext",
path: "{group}/{title}",
```
Here the layout would only apply to the group page. The actual post is left alone to be handled by the options set in metalsmith-layouts.

### `expose`

Expose well, "exposes" the given property to use as a dynamic variable. The specified property should not be used to filter posts by (you can still filter by other properties).

That might not make much sense but this is the most powerful part of the plugin. To better explain, suppose you wanted to create a page for each tag, using `expose` you can do:

```javascript
//don't set tags:
expose: "tags"
path: "tags/{expose}"
```

This causes the tags to be "exposed" as a variable for `path` which will then output pages like so `tags/tag`, `tags/tag-2`, and so on.

Expose also adds the property specified (e.g. `"tags"`) as a property of the site metadata, which gives you an object that looks like this:

```javascript
//site.tags
{
    'tag': { nicename: 'tag', count: 4},
    'tag 2': { nicename: 'tag-2', count: 4}
}
```

In pages you can also access an `exposed` property, which will tell you what was exposed (e.g. `"tags"`) and an `exposed_value` (e.g. `"tag"`).

### `override_permalink_group`
(default false)

Allows the group to **also** be a permalink group, otherwise only the "page" data is exposed to the template.

This is useful for pages. E.g. the `permalink_group` could be `posts` and the pages group can set this to true.

Same path rules apply.

### `no_folder`
(default false)

`path: {title}` would normally produce `title/index.html`. If this is set to true, it will produce `title.html` directly without the folder.

Useful for creating a 404 page, otherwise you would always get `404/index.html`.

### `add_prop`
(array of objects [{property: value}])

Adds the property to any file/post that passed through the group, for use internally with other metalsmith plugins. For example, I want a group to determine which posts will be found by a search plugin so I can do `add_prop: [{search: true}]`. Note the property is not exclusive to the group as it is a property of the post itself.

### `change_extension`
(default ".html")

For if you need to generate other filetypes such as xml for feeds and sitemaps.

### `page_only`
(default false)

For when you want just the final page/pages. For example, for generating feeds, you'd want just a list of all the posts available.

Careful not to set `override_permalink_group` to true with this. We don't want the individual files actually created.

### `page_description`
(string)

If you want to add a description to the pages created from that group. Format is up to you as this will be handled by your layouts.

## Example

```javascript
.use(organizer({
    permalink_group: "posts",
    drafts: false,
    groups: [
        {   group_name: "posts",
            type: "post", //get all posts, exclude pages
            path: "{date}/{num}/{title}", //creates paginated archives and permalinks
            date_format: "YYYY/MM", //posts look like: /2017/01/post/index.html
            date_page_layout: "index-year.ext/index-month.ext", //use one template for the year and another for the months,
            num_format: "page/{num}", //archives look like /2017/01/page/2/index.html
            per_page: 10,
            add_prop: [{search: true}] //for use with a plugin later
        },
        {   group_name: "index",//for the home page
            type: "post",//get all posts, exclude pages
            page_layout: "index.ext",//use index template
            path: "{num}",
            num_format: "page/{num}", //home pages will look like: /page/2/index.html,  /page/3/index.html, and so on.
            per_page:10,
        },
        {   group_name: "tag"
            type: "post",//get all posts, exclude pages
            expose: "tags", //expose the tags property
            path: "tags/{expose}/{num}", //this will create tag pages that look like so: tags/tag/index.html, tags/tag2index.html, and so on
            num_format: "page/{num}", //this will paginate each tag page like so: tags/tag/page/2/index.html, tags/tag2/page/2/index.html, and so on.
            per_page:10,
        },
        {   group_name: "pages",
            type: "page", //get pages, exclude posts
            path: "{title}", //this will create "post" pages that look like: about/index.html, contact/index.html, etc.
            override_permalink_group: true, //so that we actually get the page data in our template
        },
        {   group_name: "error",
            title: "404", //get 404 "post"
            path: "{title}",
            override_permalink_group: true, //again we need to pass the right data to the template
            no_folder: true //path would normally create a file at 404/index.html but the no folder forces it to output 404.html
        },
        {   group_name: "portfolio",
            type: "post", //get all posts...
            tags: "thumb",//...that also have a thumb
            thumb_url: true, //check that a thumb url property exists
            path: "{group}", //make the path the group name so we get portfolio/index.html
            //no per_page means it we don't need to specify anything about page numbers, it's just a single page
            page_layout: "index-masonry-thumb.ext", //use a different template
        },
        {   group_name: "rss",
            type: "post", //get all posts like the post group
            path: "{group}", //url will be at rss/index.xml
            change_extension: ".xml", //change our extension
            page_layout: "rss", //use our rss template
            page_only: true // only the "pages" so that we get a list of all our post files
        },
        {   group_name: "tag_rss",//then say we wanted an rss feed for every tag
            type: "post", //we use the same search criteria as the tags group
            expose: "tags", //also the same expose so that it's broken into the correct groups of pages
            path: "tag/{expose}/rss",
            //the path is a little different because we can't just use {group} and also I want it to be in an rss subfolder to link to so we manually specify it so we'll get files output at tags/tag/rss/index.xml, tags/tag2/rss/index.xml
            page_only: true, // we don't want all the individual files created
            change_extension: ".xml" //change our extension
            page_layout: "rss.ext", //change our template to the rss template
        },
        {   group_name: "sitemap", //similarly to how we made an rss feed we can make a sitemap
            //the cool thing about making it this way is you have access to the post so you can do stuff in your templates (if the logic of the language allows it, I use ejs which is just javascript really and lets me do anything I want) like check if the content has videos, etc, then output that information to the sitemap for better SEO
            page_layout: "sitemap.ext", //change to my sitemap template
            path: "{group}",
            no_folder: true, //so we get sitemap.xml at the root
            change_extension: ".xml", //change out extension
            page_only: true, //because again we don't actually need to create any individual files
        },
    ]
```

I hope that clarifies how you use all the options.

## Templates

The following variables will be available if they exist.

### Single Templates

- all post properties.
- `original_contents` (explained in the note below)
- `path` (e.g `post/index.html`)
- `permalink` (e.g `/post`)
- `group`
- `pagination` (different than the pages pagination)
    - `next` (object with single post)
    - `prev` (object with single post)

### Index Templates

- `layout`
- `path` (e.g `archive/index.html`)
- `permalink` (e.g `/archive`)
- `group`
- `group_description` (if specified)
- `exposed`
- `exposed_value`
- `contents` (empty)
- `pagination` (different than the posts pagination)
    - `index` (zero based)
    - `num` (index + 1)
    - `total` (num based)
    - `total_pages_permalink` (num based e.g. `archive/5`)
    - `pages` (object containing other pages)
    - `files` (object containing all files for page)
    - `next` (next page object)
    - `prev` (prev page object)

### Global

- `site[exposed]`
- `site.dates`

### Note

I tested this with metalsmith-layouts using ejs as my template engine. Now I'm not sure if it's ejs, metalsmith-layouts, or maybe I'm just doing something wrong, but I could not get my index template to output correctly, that is, when I tried to call the contents variable inside an index template, the post contents were already processed by the single template. So as a quick fix I forced this plugin to copy the contents into an original_contents property.
