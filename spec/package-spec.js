"use strict";

const path = require("path");
const root = path.resolve(__dirname, "..");
const {Point} = require("atom");

describe("Form-feeds", () => {
	let editor = null;
	
	before(async () => {
		await atom.packages.loadPackage(root);
		await atom.packages.activatePackage("form-feeds");
		await atom.packages.activatePackage("language-text");
		
		const pane = atom.workspace.getActivePane();
		pane.addItem(editor = atom.workspace.buildTextEditor({softTabs: false}));
		pane.setActiveItem(editor);
		editor.setGrammar(atom.grammars.grammarForScopeName("text.plain"));
		attachToDOM(atom.workspace.getElement());
	});
	
	describe("Scopes", () => {
		const scopesAt = (row, col) => editor.scopeDescriptorForBufferPosition([row, col]).scopes;
		it("tokenises inline feeds", () => {
			editor.setText("A\fZ\n");
			scopesAt(0, 1).should.include("punctuation.whitespace.inline.form-feed");
		});
		
		it("tokenises feeds occupying their own lines", () => {
			editor.setText("\f\n");
			scopesAt(0, 0).should.include("punctuation.whitespace.isolated.unpadded.form-feed");
			editor.setText(" \f\n");
			scopesAt(0, 1).should.include("punctuation.whitespace.isolated.padded.left.form-feed");
			editor.setText("\f \n");
			scopesAt(0, 0).should.include("punctuation.whitespace.isolated.padded.right.form-feed");
			editor.setText(" \f \n");
			scopesAt(0, 1).should.include("punctuation.whitespace.isolated.padded.both.form-feed");
		});
		
		it("tokenises feeds preceding visible characters", () => {
			editor.setText("\fA\n");
			scopesAt(0, 0).should.include("punctuation.whitespace.leading.unpadded.form-feed");
			editor.setText("\f A\n");
			scopesAt(0, 0).should.include("punctuation.whitespace.leading.unpadded.form-feed");
			editor.setText(" \f A\n");
			scopesAt(0, 0).should.include("punctuation.whitespace.leading.padded.left.form-feed");
		});

		it("tokenises feeds following visible characters", () => {
			editor.setText("A\f\n");
			scopesAt(0, 1).should.include("punctuation.whitespace.trailing.unpadded.form-feed");
			editor.setText("A \f\n");
			scopesAt(0, 2).should.include("punctuation.whitespace.trailing.unpadded.form-feed");
			editor.setText("A \f \n");
			scopesAt(0, 2).should.include("punctuation.whitespace.trailing.padded.right.form-feed");
		});
	});
	
	describe("Placeholders", () => {
		it("displays window-fitting dividers by default", () => {
			editor.setText("1\n\n2");
			const width = editor.editorWidthInChars;
			editor.setText("1\n\f\n2");
			editor.getWidth().should.be.above(width);
		});
		
		it("updates <body> classes to match indicator styles", () => {
			atom.config.get("form-feeds.placeholderStyle").should.equal("border");
			document.body.should.have.class("ff-style-border");
			
			atom.config.set("form-feeds.placeholderStyle", "caret");
			document.body.should.not.have.class("ff-style-border");
			document.body.should.have.class("ff-style-caret");
			
			atom.config.set("form-feeds.placeholderStyle", "none");
			document.body.should.not.have.classes("ff-style-border", "ff-style-caret");
			document.body.should.have.class("ff-style-none");
		});
	});
	
	describe("Commands", () => {
		let cursor = null;
		const next = async () => atom.commands.dispatch(editor.element, "form-feeds:go-to-next-feed");
		const prev = async () => atom.commands.dispatch(editor.element, "form-feeds:go-to-prev-feed");
		
		before(() => {
			cursor = editor.getLastCursor();
			cursor.setBufferPosition(0, 0);
			editor.setText([..."ABCDEF"].join("\n\f\n"));
		});
		
		it("advances to the next form-feed when running `go-to-next-feed`", async () => {
			await next();
			cursor.getBufferPosition().should.eql(new Point(1, 0));
			await next();
			await next();
			cursor.getBufferPosition().should.eql(new Point(5, 0));
		});
		
		it("recedes to the previous form-feed when running `go-to-prev-feed`", async () => {
			await prev(); cursor.getBufferPosition().should.eql(new Point(3, 0));
			await prev(); cursor.getBufferPosition().should.eql(new Point(1, 0));
		});
		
		it("wraps across the buffer if cursor is already at the start or end", async () => {
			await prev(); cursor.getBufferPosition().should.eql(new Point(9, 0));
			await prev(); cursor.getBufferPosition().should.eql(new Point(7, 0));
			await next(); cursor.getBufferPosition().should.eql(new Point(9, 0));
			await next(); cursor.getBufferPosition().should.eql(new Point(10, 0));
			await next(); cursor.getBufferPosition().should.eql(new Point(1, 0));
		});
	});
});
