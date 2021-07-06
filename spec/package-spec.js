"use strict";

const path = require("path");
const root = path.resolve(__dirname, "..");
const wait = n => new Promise(f => setTimeout(f, n));
const {Point, Range} = require("atom");

describe("Form-feeds", function(){
	this.timeout(6000);
	let editor = null;
	
	before("Setting up", async () => {
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
		describe("Selection", () => {
			it("displays window-fitting dividers by default", () => {
				editor.setText("1\n\n2");
				const width = editor.editorWidthInChars;
				editor.setText("1\n\f\n2");
				editor.getWidth().should.be.above(width);
			});
			
			it("updates <body> classes to match indicator styles", () => {
				atom.config.get("form-feeds.placeholderStyle").should.equal("border");
				document.body.should.have.class("ff-style-border");
				
				atom.config.set("form-feeds.placeholderStyle", "escape");
				document.body.should.not.have.class("ff-style-border");
				document.body.should.have.class("ff-style-escape");
				
				atom.config.set("form-feeds.placeholderStyle", "caret");
				document.body.should.not.have.class("ff-style-escape");
				document.body.should.have.class("ff-style-caret");
				
				atom.config.set("form-feeds.placeholderStyle", "none");
				document.body.should.not.have.classes("ff-style-border", "ff-style-caret");
				document.body.should.have.class("ff-style-none");
				
				atom.config.set("form-feeds.placeholderStyle", "border");
				document.body.should.not.have.classes("ff-style-none", "ff-style-caret");
				document.body.should.have.class("ff-style-border");
			});
		});
		
		describe("Display", () => {
			const getFeeds = () => editor.getElement().querySelectorAll(".syntax--form-feed");
			const hairline = {borderWidth: "1px 0px 0px", borderStyle: "solid none none", height: "1px"};
			const lineLength = el => el.closest(".line").getBoundingClientRect().width;
			
			it("centres isolated dividers vertically", () =>
				assertCentred("10.8px"));
			
			it("avoids superimposing dividers over text", () =>
				assertBorders("19.6px"));
			
			it("renders dividers surrounded by text as `\\f`", async () => {
				editor.setText("\n\\f\fXYZ\n");
				await wait(150);
				const feeds = getFeeds();
				feeds.should.have.lengthOf(1);
				window.getComputedStyle(feeds[0], "before").should.include({
					content: String.raw `"\\f"`,
					borderWidth: "0px",
					borderStyle: "none",
					display: "inline",
					position: "static",
					width: atom.config.get("editor.fontSize") + "px",
					height: "auto",
				});
			});
			
			it("keeps dividers aligned when `editor.fontSize` changes", async () => {
				atom.config.set("editor.fontSize", 24);
				await wait(250);
				await assertCentred("17.8px");
				await assertBorders("33.6px");
				
				atom.config.set("editor.fontSize", 10);
				await wait(250);
				await assertCentred("8px");
				await assertBorders("14px");
				
				atom.config.set("editor.fontSize", 14);
				await wait(250);
				await assertCentred("10.8px");
				await assertBorders("19.6px");
			});
			
			it("keeps dividers aligned when `editor.lineHeight` changes", async () => {
				atom.config.set("editor.lineHeight", 3);
				await wait(250);
				await assertCentred("20.6px");
				await assertBorders("39.2px");
				
				atom.config.set("editor.fontSize", 24);
				await wait(250);
				await assertCentred("34.6px");
				await assertBorders("67.2px");
				
				atom.config.set("editor.lineHeight", 1);
				await wait(250);
				await assertCentred("12.2px");
				await assertBorders("22.4px");
			});
			
			async function assertCentred(midpoint){
				editor.setText("\n\f\n");
				await wait(250);
				const feeds = getFeeds();
				feeds.should.have.lengthOf(1);
				
				const style = window.getComputedStyle(feeds[0], "before");
				style.should.include({...hairline, margin: `${midpoint} 0px 0px`});
				parseFloat(style.width).should.be.at.least(lineLength(feeds[0]));
			}
			
			async function assertBorders(bottomEdge){
				let feeds, style;
				
				// Above
				editor.setText("\n\fABC\n");
				await wait(250);
				feeds = getFeeds();
				feeds.should.have.lengthOf(1);
				style = window.getComputedStyle(feeds[0], "before");
				style.should.include({...hairline, margin: "0px"});
				parseFloat(style.width).should.be.at.least(lineLength(feeds[0]));
				
				// Below
				editor.setText("\nABC\f\n");
				await wait(250);
				feeds = getFeeds();
				feeds.should.have.lengthOf(1);
				style = window.getComputedStyle(feeds[0], "before");
				style.should.include({...hairline, margin: `${bottomEdge} 0px 0px`});
				parseFloat(style.width).should.be.at.least(lineLength(feeds[0]));
				
				// Both at once
				editor.setText("\n\fABC\f\n");
				await wait(250);
				feeds = getFeeds();
				feeds.should.have.lengthOf(2);
				
				style = window.getComputedStyle(feeds[0], "before");
				style.should.include({...hairline, margin: "0px"});
				parseFloat(style.width).should.be.at.least(lineLength(feeds[0]));
				
				style = window.getComputedStyle(feeds[1], "before");
				style.should.include({...hairline, margin: `${bottomEdge} 0px 0px`});
				parseFloat(style.width).should.be.at.least(lineLength(feeds[1]));
			}
		});
		
		after("Restoring defaults", () =>
			atom.config.set("editor", atom.config.defaultSettings.editor));
	});
	
	describe("Commands", () => {
		describe("Navigation", () => {
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
		
		describe("Deletion", () => {
			let range = null;
			
			beforeEach(() => {
				range = new Range(new Point(2, 1), new Point(6, 1));
				editor.setText("A\n\f\nB\n\f\nC\n\f\nD\n\f");
				editor.getLastSelection().setBufferRange(range);
			});
			
			when("text is selected when running `form-feeds:strip-feeds`", () => {
				it("deletes only strips within a selected range`", async () => {
					await atom.commands.dispatch(editor.element, "form-feeds:strip-feeds");
					editor.getText().should.equal("A\n\f\nB\n\nC\n\nD\n\f");
					editor.getLastSelection().getBufferRange().should.eql(range);
				});
			});
			
			when("nothing is selected", () => {
				it("deletes every form-feed in the entire buffer", async () => {
					range = new Range(new Point(0, 0), new Point(0, 0));
					editor.getLastSelection().setBufferRange(range);
					await atom.commands.dispatch(editor.element, "form-feeds:strip-feeds");
					editor.getText().should.equal("A\n\nB\n\nC\n\nD\n");
					editor.getLastSelection().getBufferRange().should.eql(range);
				});
			});
		});
	});
});
