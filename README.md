Form-feed support for Atom
==========================
Display form-feed characters (`U+000C`) as horizontal dividers in source code.

![Placeholder preview](preview.png)

Inspired by the [MELPA package](https://github.com/wasamasa/form-feed) of the same name.


Background
----------
Form-feeds are invisible control-characters which force a printer to eject the current page, and resume printing at the top of the next. Form-feeds are legal whitespace in many programming languages (including JavaScript), and they're often used as logical section separators within lengthy code (especially Lisp and C/C++). Emacs renders these characters using its traditional `^L` notation.


Features:
---------
*	Switch between three rendering styles
*	Snippets for inserting form-feeds: `\f`, `^L`
	(they both do the same thing).
	
*	Editor commands for navigating between “feed-stops”:

		*	`form-feeds:go-to-prev-feed`
		*	`form-feeds:go-to-next-feed`
		*	`form-feeds:strip-feeds`  
	
	These have no default keybindings; you'll need to assign them yourself.
