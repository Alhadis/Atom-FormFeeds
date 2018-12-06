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
			"form-feeds:go-to-prev-feed": async () => this.goTo((await this.getClosestFeeds())[0]),
			"form-feeds:go-to-next-feed": async () => this.goTo((await this.getClosestFeeds())[1]),
			"form-feeds:insert-feed":     () => this.filter(text => text + "\f"),
			"form-feeds:strip-feeds":     () => this.filter(text => text.replace(/\f/g, "")),
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
		let rows = await this.getFeedRows();
		if(rows && rows.length){
			const cursor = editor.getLastCursor();
			const row    = cursor.getBufferRow();
			return [
				rows.filter(n => n < row).sort().pop(),
				rows.filter(n => n > row).sort().shift(),
			];
		}
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