"use strict";

const {CompositeDisposable} = require("atom");
let disposables = null;


module.exports = {
	
	/**
	 * Initialise the package and register event handlers.
	 * @param {Object} [state={}]
	 * @public
	 */
	activate(state = {}){
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
			"form-feeds:go-to-next-feed": () => this.goTo(this.getNearestFeed()),
			"form-feeds:go-to-prev-feed": () => this.goTo(this.getNearestFeed(true)),
			"form-feeds:insert-feed":     () => this.filter(text => text + "\f"),
			"form-feeds:strip-feeds":     () => this.filter(text => text.replace(/\f/g, "")),
		}));
	},
	
	
	/**
	 * Move the current editor's cursor to the next form-feed.
	 * @internal
	 */
	async goTo(point){
		const editor = atom.workspace.getActiveTextEditor();
		if(point && editor){
			editor.setCursorBufferPosition(point);
			editor.scrollToBufferPosition(point, {center: true});
		}
	},
	
	
	async getNearestFeed(backwards = false){
		const editor = atom.workspace.getActiveTextEditor();
		if(editor){
			const cursor = editor.getLastCursor();
			const curPos = cursor.getBufferPosition();
			const endPos = editor.buffer.getEndPosition();
			const [start, end] = backwards
				? [curPos, [0, 0]]
				: [curPos, endPos];
			return editor.buffer.findInRange(/\f/, {start, end});
		}
		return null;
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
	 * Transform the current editor's text using a filter.
	 * @param {Function} fn
	 * @internal
	 */
	mutate(fn){
		const editor = atom.workspace.getActiveTextEditor();
		editor && editor.transact(100, () => hasSelectedText(editor)
			? editor.mutateSelectedText(selection => {
				const output = fn(selection.getText(), selection, editor);
				selection.insertText(output, {select: true})})
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
};
