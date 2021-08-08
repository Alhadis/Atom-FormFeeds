Form-feed support for Atom
==========================

[![Build status: GitHub Actions][Actions-badge]][Actions-link]
[![Build status: AppVeyor][AppVeyor-badge]][AppVeyor-link]
[![Latest package version][APM-badge]][APM-link]


Display form-feed characters (`U+000C`) as horizontal dividers in source code.

![Placeholder preview](preview.png)

Inspired by the [MELPA package](https://github.com/wasamasa/form-feed) of the same name.


Features:
---------
* Render form-feeds as horizontal dividers, as `\f`, or as `^L` ([caret notation][])
* Snippets for inserting form-feeds: `\f`, `^L`
* Editor commands (without default keybindings)
	*	`form-feeds:go-to-prev-feed`
	*	`form-feeds:go-to-next-feed`
	*	`form-feeds:strip-feeds`


Customisation
-------------
You can tweak the rendering of form-feed indicators using your stylesheet:

~~~less
@import "packages/form-feeds/styles/variables.less";

// Thicker border
@{ff-border} @{ff-selector}::before{
	border-top-width: 2px;
}

// Replace `^L` with a green `FF` when `placeholderStyle` is set to "caret"
@{ff-caret} @{ff-selector}::before{
	content: "FF";
	color: #0f0;
}
~~~


More info
---------
* [Caret notation][]
* [Form-feed characters](https://en.wikipedia.org/wiki/Page_break#Form_feed)
* [_“What are carriage return, linefeed, and form feed?”_](https://stackoverflow.com/a/3098328)

[Caret notation]: https://en.wikipedia.org/wiki/Caret_notation
[Actions-badge]:  https://img.shields.io/github/workflow/status/Alhadis/Atom-FormFeeds/Atom%20CI?label=GitHub%20Actions&logo=github
[Actions-link]:   https://github.com/Alhadis/Atom-FormFeeds/actions
[AppVeyor-badge]: https://img.shields.io/appveyor/build/Alhadis/atom-formfeeds?label=AppVeyor&logo=appveyor&logoColor=white
[AppVeyor-link]:  https://ci.appveyor.com/project/Alhadis/atom-formfeeds
[APM-badge]:      https://img.shields.io/apm/v/form-feeds.svg?colorB=brightgreen
[APM-link]:       https://atom.io/packages/form-feeds
