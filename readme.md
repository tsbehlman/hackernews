# Hacker News

[Live demo](http://tbehlman.com/hackernews/)

A Node.js app that listens to the [Hacker News Firebase API](https://github.com/HackerNews/API) and records stories in chronological order of entering the [Hacker News front page](https://news.ycombinator.com), similar to [hckrnews.com](http://hckrnews.com).

In addition to tracking this specific ordering of stories, articles linked by recent stories are cached using [a fork of Mozilla's readability scripts](https://github.com/tsbehlman/shrinkability) for quick loading and easy reading (most of the time).

Finally, a website is hosted (port 8080 by default) providing a way to browse these stories and view articles.

See also: [A rudamentary iOS client for this app](https://github.com/tsbehlman/hackernews-ios)

## API

### `/page/<pageIndex>`

Produces a JSON array of 30 stories in chronological order of entering the front page.  Page `1` is the first, most recent page.

Example output: 

```javascript
[
    {
        "id": 21772223,
        "title": "Vim 8.2",
        "url": "https://www.vim.org/vim-8.2-released.php",
        "descendants": 73,
        "domain": "vim.org"
    },
    // ...
]
```

### `/view/<storyID>`

Produces an HTML page containing the title of the article, a link to the original, and a (potentially) cached copy of the article after having potentially unrelated content scraped out by [a fork of Mozilla's readability scripts](https://github.com/tsbehlman/shrinkability).