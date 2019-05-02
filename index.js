"use strict";

const {CompositeDisposable} = require("atom");
let disposables = null;


module.exports = {
	
	/**
	 * Initialise the package and register event handlers.
	 * @public
	 */
	activate(){
		if(null !== disposables)
			disposables.dispose();
			
		// Update CSS classes on <body> when these settings change
		disposables = new CompositeDisposable();
		disposables.add(atom.config.observe("form-feeds.placeholderStyle", type => {
			const classes = document.body.classList;
			classes.toggle("ff-style-border", "border" === type);
			classes.toggle("ff-style-caret",  "caret"  === type);
			classes.toggle("ff-style-none",   "none"   === type);
		}));
		
		// Commands to jump between form-feeds in a document
		disposables.add(atom.commands.add("atom-text-editor", {
			"form-feeds:go-to-prev-feed": async () => this.goTo((await this.getClosestFeeds())[0]),
			"form-feeds:go-to-next-feed": async () => this.goTo((await this.getClosestFeeds())[1]),
			"form-feeds:strip-feeds":     () => this.mutate.bind(this)(text => text.replace(/\f/g, "")),
		}));
		
		// Setup dynamic CSS variables
		disposables.add(atom.config.observe("editor.lineHeight", value => {
			const rule = this.findCSSRule(":root", "--form-feed-offset");
			rule && rule.style.setProperty("--form-feed-offset", `${0.7 * value / 1.5}em`);
		}));
	},
	
	
	/**
	 * Free-up memory when deactivating package.
	 * @public
	 */
	deactivate(){
		if(null !== disposables){
			disposables.dispose();
			disposables = null;
		}
	},
	
	
	/**
	 * Return an {@link Array} of buffer-rows containing form-feeds.
	 * @return {Number[]}
	 * @internal
	 */
	async getFeedRows(){
		const editor = atom.workspace.getActiveTextEditor();
		if(!editor) return [];
		const points = await editor.buffer.findAll(/\f/);
		return points.map(point => point.start.row);
	},
	
	
	/**
	 * Return an array containing the index of the previous and next feed rows.
	 * @return {Number[]}
	 * @internal
	 */
	async getClosestFeeds(){
		const editor = atom.workspace.getActiveTextEditor();
		if(!editor) return [];
		const rows = await this.getFeedRows();
		if(rows && rows.length){
			const cursor = editor.getLastCursor();
			const row    = cursor.getBufferRow();
			const end    = editor.getLastBufferRow();
			const wrap   = atom.config.get("form-feeds.wrappedCycling");
			const first  = Math.min(...rows);
			const last   = Math.max(...rows);
			return [
				rows.filter(n => n < row).sort().pop()   || (wrap && row <= 1   ? last : 0),
				rows.filter(n => n > row).sort().shift() || (wrap && row >= end ? first : end),
			];
		}
		else return [];
	},
	
	
	/**
	 * Move the current editor's cursor to the designed row.
	 * @param {Number} [row=-1]
	 * @internal
	 */
	async goTo(row = -1){
		if(row < 0) return;
		const editor = atom.workspace.getActiveTextEditor();
		if(editor){
			const cursor = editor.getLastCursor();
			const column = cursor.getBufferColumn();
			editor.setCursorBufferPosition([row, column]);
			editor.moveToFirstCharacterOfLine();
		}
	},
	
	
	/**
	 * Transform the current editor's text using a filter.
	 * @param {Function} fn
	 * @internal
	 */
	mutate(fn){
		const editor = atom.workspace.getActiveTextEditor();
		editor && editor.transact(100, () => this.hasSelectedText(editor)
			? editor.mutateSelectedText(selection => {
				const output = fn(selection.getText(), selection, editor);
				selection.insertText(output, {select: true});
			})
			: editor.setText(fn(editor.getText(), null, editor)));
	},
	
	
	/**
	 * Report whether a {@link TextEditor} contains selected text.
	 * @internal
	 * @version Alhadis/.atom@1002617f8
	 * @param {TextEditor} editor
	 * @return {Boolean}
	 */
	hasSelectedText(editor){
		return !!(editor && editor.getSelections().map(s => s.getText()).join("").length);
	},
	
	
	/**
	 * Locate the first CSS rule matching the specified selector/property.
	 * @internal
	 * @todo Replace this with CSSQuery/CSSq when/if I resurrect it…
	 * @param {String|RegExp} selector - All or part of expected `selectorText`
	 * @param {String|RegExp} property - Name of queried CSS property
	 * @param {String|RegExp} [value]  - Expected property value
	 * @return {CSSStyleRule}
	 */
	findCSSRule(selector, property, value = /(?:)/){
		const match = (pattern, input) => "string" === typeof pattern
			? pattern === String(input)
			: pattern.test(input);
		for(const sheet of document.styleSheets)
		for(const rule of sheet.rules)
			if(match(selector, rule.selectorText)
			&& match(value, rule.style[property])
			&& [...rule.style].includes(property))
				return rule;
		return null;
	},
};
